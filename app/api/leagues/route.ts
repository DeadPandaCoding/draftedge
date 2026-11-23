import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

async function authenticatedClient() {
  const supabase = await getSupabaseServer();
  if (!supabase) return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const auth = await authenticatedClient();
  if ("response" in auth) return auth.response;
  const { data, error } = await auth.supabase
    .from("user_leagues")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("last_synced_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leagues: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticatedClient();
  if ("response" in auth) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A league id is required." }, { status: 400 });
  const { error } = await auth.supabase.from("user_leagues").delete().eq("id", id).eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
