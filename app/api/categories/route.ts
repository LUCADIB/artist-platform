import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * GET /api/categories
 * Returns all categories ordered by name.
 */
export async function GET() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/categories
 * Creates a new category.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { error: "Category name is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
