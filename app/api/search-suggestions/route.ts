import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
        return NextResponse.json([]);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: categories } = await supabase
        .from("categories")
        .select("name")
        .ilike("name", `%${q}%`)
        .limit(5);

    const { data: artists } = await supabase
        .from("artists")
        .select("name")
        .eq("status", "approved")
        .ilike("name", `%${q}%`)
        .limit(5);

    const suggestions = [
        ...(categories?.map((c: { name: string }) => c.name) || []),
        ...(artists?.map((a: { name: string }) => a.name) || []),
    ];

    return NextResponse.json(suggestions);
}