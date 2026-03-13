import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getServiceClient } from "@/lib/serviceClient";
import { generateUniqueSlug } from "@/lib/slugGenerator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Artist self-registration endpoint.
 * Creates: auth user → profile → artist record
 *
 * Uses service role client for profile/artist inserts to bypass RLS.
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, email, password, city, category_id, whatsapp } = body;

  // Validate required fields
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nombre, email y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "El formato del email no es válido." },
      { status: 400 }
    );
  }

  // Validate password length
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  // Build response for cookie attachment
  const response = NextResponse.json({});

  // Create Supabase client with cookie handling for auth
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set(name, "", options);
      },
    },
  });

  // Step 1: Create auth user
  console.log("[Register] Creating auth user for:", email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/artist`,
    },
  });

  if (authError) {
    console.error("[Register] Auth signup error:", authError);
    return NextResponse.json(
      { error: authError.message || "Error al crear la cuenta." },
      { status: 400 }
    );
  }

  if (!authData.user) {
    console.error("[Register] No user returned from signUp");
    return NextResponse.json(
      { error: "Error al crear la cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  }

  const userId = authData.user.id;
  console.log("[Register] Auth user created:", userId);

  // Get service client for operations that bypass RLS
  const serviceClient = getServiceClient();

  // Verify service client is working
  if (!serviceClient) {
    console.error("[Register] Service client is null");
    return NextResponse.json(
      { error: "Error de configuración del servidor." },
      { status: 500 }
    );
  }

  // Step 2: Create profile with artist role
  console.log("[Register] Creating profile for user:", userId);
  const { data: profileData, error: profileError } = await serviceClient
    .from("profiles")
    .insert({
      id: userId,
      role: "artist",
    })
    .select()
    .single();

  if (profileError) {
    console.error("[Register] Profile creation error:", profileError);
    console.error("[Register] Profile error details:", JSON.stringify(profileError, null, 2));
    // Attempt to clean up auth user (best effort)
    try {
      await serviceClient.auth.admin.deleteUser(userId);
    } catch (cleanupError) {
      console.error("[Register] Failed to cleanup auth user:", cleanupError);
    }
    return NextResponse.json(
      { error: `Error al crear el perfil: ${profileError.message || "Error desconocido"}` },
      { status: 500 }
    );
  }

  console.log("[Register] Profile created:", profileData);

  // Step 3: Generate unique slug from name
  let slug: string;
  try {
    console.log("[Register] Generating slug for name:", name);
    slug = await generateUniqueSlug(name);
    console.log("[Register] Generated slug:", slug);
  } catch (slugError) {
    console.error("[Register] Slug generation error:", slugError);
    // Clean up profile and auth user
    try {
      await serviceClient.from("profiles").delete().eq("id", userId);
      await serviceClient.auth.admin.deleteUser(userId);
    } catch (cleanupError) {
      console.error("[Register] Failed to cleanup:", cleanupError);
    }
    return NextResponse.json(
      { error: "Error al generar el identificador único." },
      { status: 500 }
    );
  }

  // Step 4: Create artist record
  console.log("[Register] Creating artist record with slug:", slug);
  const artistInsertData = {
    name,
    slug,
    city: city || null,
    category_id: category_id || null,
    whatsapp: whatsapp || null,
    status: "pending_review",
    profile_id: userId,
    created_by_admin: false,
  };
  console.log("[Register] Artist insert data:", JSON.stringify(artistInsertData, null, 2));

  const { data: artistData, error: artistError } = await serviceClient
    .from("artists")
    .insert(artistInsertData)
    .select()
    .single();

  if (artistError) {
    console.error("[Register] Artist creation error:", artistError);
    console.error("[Register] Artist error details:", JSON.stringify(artistError, null, 2));
    // Clean up profile and auth user
    try {
      await serviceClient.from("profiles").delete().eq("id", userId);
      await serviceClient.auth.admin.deleteUser(userId);
    } catch (cleanupError) {
      console.error("[Register] Failed to cleanup:", cleanupError);
    }
    return NextResponse.json(
      { error: `Error al crear el perfil de artista: ${artistError.message || "Error desconocido"}` },
      { status: 500 }
    );
  }

  console.log("[Register] Artist created successfully:", artistData);

  // Build final response with session cookies and redirect
  const finalResponse = NextResponse.json(
    {
      success: true,
      redirectTo: "/dashboard/artist",
      artist: {
        id: artistData.id,
        name: artistData.name,
        slug: artistData.slug,
        status: artistData.status,
      },
    },
    { status: 201 }
  );

  // Copy all cookies from interim response
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}
