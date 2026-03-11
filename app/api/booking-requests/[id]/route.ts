import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseClient";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { status } = body;

  const allowedStatuses = ["pending", "contacted", "confirmed"];
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update booking request" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
