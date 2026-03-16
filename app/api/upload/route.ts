import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseClient";
import { getServiceClient } from "@/lib/serviceClient";

// Security constraints
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

/**
 * Validates file security constraints.
 * Returns an error message if validation fails, null if valid.
 */
function validateFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`;
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(", ")}.`;
  }

  // Check file extension
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
    return `Extensión de archivo no permitida. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }

  // Verify extension matches MIME type (basic sanity check)
  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/jpg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
  };

  const expectedExts = mimeToExt[file.type];
  if (expectedExts && !expectedExts.includes(fileExt)) {
    return "La extensión del archivo no coincide con su tipo de contenido.";
  }

  return null;
}

/**
 * POST /api/upload
 *
 * Securely uploads a file to Supabase Storage after verifying:
 * 1. User is authenticated
 * 2. User has an allowed role (artist, manager, admin)
 * 3. File passes validation (size, type, extension)
 *
 * Authorization flow:
 * - Get session from cookies (SSR)
 * - Fetch user profile to check role
 * - Validate file constraints
 * - Only then perform upload
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Get authenticated session
    const supabaseAuth = await createSupabaseRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado. Inicia sesión para continuar." },
        { status: 401 }
      );
    }

    // Step 2: Get user profile and role
    const serviceClient = getServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Upload POST] Profile lookup error:", profileError);
      return NextResponse.json(
        { error: "Error al verificar el perfil del usuario." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil de usuario no encontrado." },
        { status: 403 }
      );
    }

    // Step 3: Check if user has allowed role
    const allowedRoles = ["artist", "manager", "admin"];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "No tienes permiso para subir archivos." },
        { status: 403 }
      );
    }

    // Step 4: Parse and validate request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const artistId = formData.get("artistId") as string | null;
    const tempId = formData.get("tempId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo." },
        { status: 400 }
      );
    }

    // Require either artistId or tempId
    if (!artistId && !tempId) {
      return NextResponse.json(
        { error: "artistId o tempId es requerido." },
        { status: 400 }
      );
    }

    // Step 5: Validate file security constraints
    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Step 6: Additional authorization for artistId uploads
    // Artists can only upload to their own folder (or pending folder for registration)
    if (artistId && profile.role === "artist") {
      const { data: artistProfile, error: artistError } = await serviceClient
        .from("artists")
        .select("id")
        .eq("id", artistId)
        .eq("profile_id", user.id) // Ensure ownership
        .maybeSingle();

      if (artistError) {
        console.error("[Upload POST] Artist verification error:", artistError);
        return NextResponse.json(
          { error: "Error al verificar el perfil de artista." },
          { status: 500 }
        );
      }

      if (!artistProfile) {
        return NextResponse.json(
          { error: "No tienes permiso para subir archivos a este artista." },
          { status: 403 }
        );
      }
    }

    // Step 7: Validate artistId exists (for managers/admins)
    if (artistId && (profile.role === "manager" || profile.role === "admin")) {
      const { data: artistExists, error: artistCheckError } = await serviceClient
        .from("artists")
        .select("id")
        .eq("id", artistId)
        .maybeSingle();

      if (artistCheckError) {
        console.error("[Upload POST] Artist existence check error:", artistCheckError);
        return NextResponse.json(
          { error: "Error al verificar el artista." },
          { status: 500 }
        );
      }

      if (!artistExists) {
        return NextResponse.json(
          { error: "Artista no encontrado." },
          { status: 404 }
        );
      }
    }

    // Step 8: Prepare and perform upload
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}.${fileExt}`;

    // Use "pending" folder for pre-registration uploads, otherwise artist folder
    const folderId = artistId || tempId;
    const folderPrefix = artistId ? "" : "pending/";
    const filePath = `${folderPrefix}${folderId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from("artists")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload POST] Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // Step 9: Return public URL
    const { data: publicUrlData } = serviceClient.storage
      .from("artists")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 200 });

  } catch (error) {
    console.error("[Upload POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
