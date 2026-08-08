import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/session";

// Serves a private evidence file to its owner only. Never a signed Storage
// URL: the browser only ever talks to this authenticated route, which reads
// the bytes server-side (RLS-scoped client, same trust boundary already
// used when evidence is sent to the AI) and streams them back. This is the
// only path by which an evidence file becomes visible outside the server.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  const { id, assetId } = await params;
  await requireUser();

  const supabase = await createSupabaseServerClient();

  const { data: asset, error } = await supabase
    .from("analysis_assets")
    .select("storage_bucket, storage_path, mime_type")
    .eq("id", assetId)
    .eq("analysis_request_id", id)
    .single();

  if (error || !asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from(asset.storage_bucket)
    .download(asset.storage_path);

  if (downloadError || !blob) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": asset.mime_type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
