import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

/**
 * Validation result for uploaded files
 */
interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileBuffer?: Buffer;
  checksum?: string;
}

/**
 * Validate uploaded file
 */
export async function validateUploadedFile(
  formData: FormData
): Promise<FileValidationResult> {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return {
      isValid: false,
      error: "No file provided.",
    };
  }

  if (!file.type || file.type !== "application/pdf") {
    return {
      isValid: false,
      error: "Only PDF files are supported.",
    };
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "File size exceeds 10MB limit.",
    };
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const checksum = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    return {
      isValid: true,
      fileBuffer,
      checksum,
    };
  } catch (_error) {
    return {
      isValid: false,
      error: "Failed to process file.",
    };
  }
}

/**
 * Upload file to Vercel Blob storage
 */
export async function uploadToBlob(file: File): Promise<{ url: string }> {
  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url };
}

/**
 * Create statement record in database
 */
export async function createStatementRecord(
  userId: string,
  checksum: string,
  blobUrl: string,
  fileName: string
): Promise<{ id: string }> {
  const supabase = await createClient();

  const { data: statement, error } = await supabase
    .from("statements")
    .insert({
      user_id: userId,
      checksum: checksum,
      blob_url: blobUrl,
      file_name: fileName,
      status: "processing",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create statement record: ${error.message}`);
  }

  return { id: statement.id };
}

/**
 * Check for duplicate statements
 */
export async function checkDuplicateStatement(
  userId: string,
  checksum: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: existingStatement } = await supabase
    .from("statements")
    .select("id")
    .eq("checksum", checksum)
    .eq("user_id", userId)
    .single();

  return !!existingStatement;
}
