import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();
    const { memo } = body;

    if (typeof memo !== "string") {
      return new NextResponse("Invalid memo", { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the tutor for this session
    const { data: session } = await supabase
      .from("sessions")
      .select("tutor_id")
      .eq("id", id)
      .single();

    if (!session) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { data: tutor } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (tutor?.id !== session.tutor_id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { error } = await supabase
      .from("sessions")
      .update({ tutor_memo: memo })
      .eq("id", id);

    if (error) {
      console.error("Error updating memo:", error);
      return new NextResponse("Internal Error", { status: 500 });
    }

    return new NextResponse("OK");
  } catch (error) {
    console.error("Error in memo route:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
