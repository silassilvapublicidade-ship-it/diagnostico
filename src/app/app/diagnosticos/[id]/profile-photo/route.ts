import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/modules/auth/session";

const STORAGE_BUCKET = "analysis-assets";

// Serves the best-effort fetched Instagram profile photo to its owner only.
// Uses the admin client (not the RLS-scoped one) because this file was never
// inserted into analysis_assets -- there is no table row for the storage
// RLS policy to match against, so ownership is checked explicitly here
// instead, same trust boundary as the evidence asset route.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  const admin = createSupabaseAdminClient();

  const { data: request, error } = await admin
    .from("analysis_requests")
    .select("user_id, profile_photo_storage_path, profile_photo_mime_type")
    .eq("id", id)
    .single();

  if (
    error ||
    !request ||
    request.user_id !== user.id ||
    !request.profile_photo_storage_path
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(request.profile_photo_storage_path);

  if (downloadError || !blob) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": request.profile_photo_mime_type ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
