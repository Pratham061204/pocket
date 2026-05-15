"use server";

import { createClient } from "@/lib/supabase/server";
import { getDbUser } from "@/lib/auth";

export async function uploadReceipt(formData: FormData): Promise<string> {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5 MB)");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) throw new Error("Upload failed: " + error.message);

  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(data.path);
  return urlData.publicUrl;
}
