// One-time move of inline cloth-sample photos (base64 data URLs in
// orders.cloth_sample_image_url) into the `cloth-samples` Storage bucket.
//
//   Dry run (default, read-only):  node --env-file=.env.local scripts/migrate-cloth-samples.mjs
//   Apply:                         node --env-file=.env.local scripts/migrate-cloth-samples.mjs --apply
//
// Before applying, run supabase/migrations/202610150001_cloth_sample_storage_bucket.sql.
// --apply writes a backup of every original value to .migration-backups/ first.
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "cloth-samples";
const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;
const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (use --env-file=.env.local).");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function extensionFor(contentType) {
  const subtype = contentType.split("/")[1]?.toLowerCase() ?? "jpg";
  return subtype === "jpeg" ? "jpg" : subtype.replace(/[^a-z0-9]/g, "") || "jpg";
}

const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
if (bucketError) throw bucketError;
const bucketExists = buckets.some((bucket) => bucket.id === BUCKET);

const { data: rows, error } = await admin
  .from("orders")
  .select("id, receipt_number, created_at, cloth_sample_image_url")
  .not("cloth_sample_image_url", "is", null)
  .order("created_at", { ascending: true });
if (error) throw error;

const inlineRows = rows.filter((row) => DATA_URL_PATTERN.test(row.cloth_sample_image_url));
const totalBytes = inlineRows.reduce((sum, row) => sum + row.cloth_sample_image_url.length, 0);

console.log(`Mode: ${apply ? "APPLY" : "dry run (no changes)"}`);
console.log(`Bucket "${BUCKET}": ${bucketExists ? "exists" : "MISSING"}`);
console.log(`Orders with a photo: ${rows.length}; inline photos to move: ${inlineRows.length} (${(totalBytes / 1024 / 1024).toFixed(2)} MB of text)`);

if (!apply) {
  for (const row of inlineRows) {
    console.log(`  would move ${row.receipt_number ?? row.id} (${Math.round(row.cloth_sample_image_url.length / 1024)} KB)`);
  }
  if (!bucketExists) console.log("Run the bucket SQL migration before using --apply.");
  process.exit(0);
}

if (!bucketExists) {
  console.error(`Bucket "${BUCKET}" does not exist. Run supabase/migrations/202610150001_cloth_sample_storage_bucket.sql first.`);
  process.exit(1);
}

mkdirSync(".migration-backups", { recursive: true });
const backupFile = `.migration-backups/cloth-samples-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(backupFile, JSON.stringify(inlineRows.map(({ id, cloth_sample_image_url }) => ({ id, cloth_sample_image_url }))));
console.log(`Backup of original values written to ${backupFile}`);

let moved = 0;
for (const row of inlineRows) {
  const [, contentType, base64] = DATA_URL_PATTERN.exec(row.cloth_sample_image_url);
  const year = new Date(row.created_at).getUTCFullYear();
  const path = `${year}/${randomUUID()}.${extensionFor(contentType)}`;
  const bucket = admin.storage.from(BUCKET);

  const { error: uploadError } = await bucket.upload(path, Buffer.from(base64, "base64"), {
    contentType,
    cacheControl: "31536000",
    upsert: false
  });
  if (uploadError) {
    console.error(`  upload failed for ${row.receipt_number ?? row.id}: ${uploadError.message}`);
    continue;
  }

  const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await admin.from("orders").update({ cloth_sample_image_url: publicUrl }).eq("id", row.id);
  if (updateError) {
    console.error(`  row update failed for ${row.receipt_number ?? row.id}: ${updateError.message}; removing uploaded copy`);
    await bucket.remove([path]);
    continue;
  }

  moved += 1;
  console.log(`  moved ${row.receipt_number ?? row.id}`);
}

console.log(`Done: ${moved}/${inlineRows.length} photos moved.`);
if (moved !== inlineRows.length) process.exitCode = 1;
