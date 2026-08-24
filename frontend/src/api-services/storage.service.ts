import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

/**
 * Service to handle media and asset storage operations via Supabase Storage.
 * UI components must consume this service rather than importing the Supabase client directly.
 */

/**
 * Uploads an image for forum threads, replies, or rich text content to the 'forum-media' bucket.
 * 
 * @param file The image File to upload
 * @param userId The ID of the authenticated user or author (defaults to 'anonymous')
 * @returns The public CDN URL of the uploaded image
 */
export async function uploadForumImage(file: File, userId: string = "anonymous"): Promise<string> {
  const sanitizedUserId = userId?.trim() || "anonymous";
  
  // Extract and sanitize extension
  const parts = file.name.split(".");
  const rawExt = parts.length > 1 ? parts.pop()?.toLowerCase() || "png" : "png";
  const sanitizedExt = rawExt.replace(/[^a-z0-9]/g, "") || "png";
  
  // Generate random unique identifier
  const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const filePath = `${sanitizedUserId}/${uniqueId}.${sanitizedExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("forum-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error("Failed to upload forum image to Supabase storage:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("forum-media")
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to generate public URL for uploaded forum image");
    }

    return publicUrlData.publicUrl;
  } catch (err) {
    logger.error("Error in uploadForumImage:", err);
    throw err;
  }
}

export const storageService = {
  uploadForumImage,
};

export default storageService;
