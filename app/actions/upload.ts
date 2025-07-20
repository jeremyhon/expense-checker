"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UploadResult } from "@/lib/types/expense";
import { processPdfExpenses } from "@/lib/utils/expense-processor";
import {
  checkDuplicateStatement,
  createStatementRecord,
  uploadToBlob,
  validateUploadedFile,
} from "@/lib/utils/file-handler";

/**
 * Main server action for uploading and processing bank statements
 */
export async function uploadStatement(
  formData: FormData
): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  // Validate uploaded file
  const validation = await validateUploadedFile(formData);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || "File validation failed",
    };
  }

  if (!validation.fileBuffer || !validation.checksum) {
    return { success: false, message: "Failed to process file" };
  }

  const file = formData.get("file") as File;
  const { fileBuffer } = validation;
  // Use environment variable to control duplicate detection
  const disableDuplicateDetection =
    process.env.DISABLE_DUPLICATE_DETECTION === "true";

  const checksum = disableDuplicateDetection
    ? Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    : validation.checksum;

  try {
    // Check for duplicate statements (controlled by environment variable)
    if (!disableDuplicateDetection) {
      const isDuplicate = await checkDuplicateStatement(user.id, checksum);
      if (isDuplicate) {
        return {
          success: false,
          message: `Duplicate: '${file.name}' has already been uploaded.`,
        };
      }
    }

    // Upload file to blob storage
    const { url: blobUrl } = await uploadToBlob(file);

    // Create statement record
    const { id: statementId } = await createStatementRecord(
      user.id,
      checksum,
      blobUrl,
      file.name
    );

    // Process PDF asynchronously
    processPdfExpenses(fileBuffer, statementId, user.id).catch((error) => {
      console.error(
        `Async processing failed for statement ${statementId}:`,
        error
      );
    });

    revalidatePath("/");
    return {
      success: true,
      message: `'${file.name}' is being processed.`,
      statementId,
    };
  } catch (error) {
    console.error("Upload failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Upload failed for '${file.name}': ${errorMessage}`,
    };
  }
}
