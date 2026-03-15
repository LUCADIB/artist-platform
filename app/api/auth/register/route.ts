import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getServiceClient } from "@/lib/serviceClient";
import { generateUniqueSlug } from "@/lib/slugGenerator";
import { sendNewArtistRegistrationEmail } from "@/lib/emails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Artist self registration
 * Flow:
 * 1 create auth user
 * 2 create profile
 * 3 create artist (pending_review)
 * 4 notify manager by email
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { name, email, password, city, category_id, whatsapp } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nombre, email y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({});

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

  // STEP 1 — AUTH USER
// STEP 1 — AUTH USER (auto login enabled, email confirmation OFF)
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
});

if (authError) {
  return NextResponse.json(
    { error: authError.message },
    { status: 400 }
  );
}

// 🔥 asegurar que exista usuario
const userId = authData.user?.id;

if (!userId) {
  return NextResponse.json(
    { error: "No se pudo crear el usuario." },
    { status: 500 }
  );
}

// 🔥 asegurar sesión automática (UX marketplace)
if (!authData.session) {
  return NextResponse.json(
    { error: "No se pudo iniciar sesión automáticamente." },
    { status: 500 }
  );
}

const serviceClient = getServiceClient();

  // STEP 2 — PROFILE
  await serviceClient.from("profiles").insert({
    id: userId,
    role: "artist",
  });

  // STEP 3 — SLUG
  const slug = await generateUniqueSlug(name);

  // STEP 4 — ARTIST
  const { data: artistData, error: artistError } = await serviceClient
    .from("artists")
    .insert({
      name,
      slug,
      city: city || null,
      category_id: category_id || null,
      whatsapp: whatsapp || null,
      status: "pending_review",
      profile_id: userId,
      created_by_admin: false,
    })
    .select()
    .single();

  if (artistError) {
    return NextResponse.json(
      { error: artistError.message },
      { status: 500 }
    );
  }

  // STEP 5 — EMAIL MANAGER (NO BLOQUEANTE)
  try {
    await sendNewArtistRegistrationEmail({
      artistName: name,
    });
  } catch (e) {
    console.log("Manager email failed but registration ok");
  }

  const finalResponse = NextResponse.json(
    {
      success: true,
      redirectTo: "/dashboard/artist",
      artistId: artistData.id,
    },
    { status: 201 }
  );

  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}