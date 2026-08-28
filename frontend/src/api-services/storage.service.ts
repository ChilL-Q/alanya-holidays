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
 * @param userId The ID of the authenticated owner
 * @returns The public CDN URL of the uploaded image
 */
export async function uploadForumImage(file: File, userId: string): Promise<string> {
  const sanitizedUserId = userId.trim();
  if (!sanitizedUserId) {
    throw new Error("A user ID is required to upload a forum image");
  }
  
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

export async function uploadBlogImage(file: File, userId: string): Promise<string> {
  const ownerId = userId.trim();
  if (!ownerId) throw new Error("A user ID is required to upload a blog image");

  const parts = file.name.split(".");
  const rawExt = parts.length > 1 ? parts.pop()?.toLowerCase() || "png" : "png";
  const sanitizedExt = rawExt.replace(/[^a-z0-9]/g, "") || "png";
  const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const filePath = `${ownerId}/${uniqueId}.${sanitizedExt}`;

  const { error: uploadError } = await supabase.storage
    .from("blog-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    logger.error("Failed to upload blog image to Supabase storage:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("blog-media").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error("Failed to generate public URL for uploaded blog image");
  }

  return data.publicUrl;
}

const FORUM_MEDIA_PUBLIC_PATH = "/storage/v1/object/public/forum-media/";
const BLOG_MEDIA_PUBLIC_PATH = "/storage/v1/object/public/blog-media/";

export async function deleteForumImage(publicUrl: string, userId: string): Promise<boolean> {
  const ownerId = userId.trim();
  if (!ownerId) return false;

  let filePath: string;
  try {
    const url = new URL(publicUrl);
    const markerIndex = url.pathname.indexOf(FORUM_MEDIA_PUBLIC_PATH);
    if (markerIndex < 0) return false;

    filePath = decodeURIComponent(
      url.pathname.slice(markerIndex + FORUM_MEDIA_PUBLIC_PATH.length),
    );
  } catch {
    return false;
  }

  const segments = filePath.split("/");
  if (
    segments.length < 2 ||
    segments[0] !== ownerId ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return false;
  }

  const { error } = await supabase.storage.from("forum-media").remove([filePath]);
  if (error) {
    logger.error("Failed to delete forum image from Supabase storage:", error);
    throw error;
  }

  return true;
}

export async function deleteBlogImage(publicUrl: string, userId: string): Promise<boolean> {
  const ownerId = userId.trim();
  if (!ownerId) return false;

  let filePath: string;
  try {
    const url = new URL(publicUrl);
    const markerIndex = url.pathname.indexOf(BLOG_MEDIA_PUBLIC_PATH);
    if (markerIndex < 0) return false;
    filePath = decodeURIComponent(
      url.pathname.slice(markerIndex + BLOG_MEDIA_PUBLIC_PATH.length),
    );
  } catch {
    return false;
  }

  const segments = filePath.split("/");
  if (
    segments.length < 2 ||
    segments[0] !== ownerId ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return false;
  }

  const { error } = await supabase.storage.from("blog-media").remove([filePath]);
  if (error) {
    logger.error("Failed to delete blog image from Supabase storage:", error);
    throw error;
  }

  return true;
}

export const storageService = {
  uploadForumImage,
  deleteForumImage,
  uploadBlogImage,
  deleteBlogImage,
};

export default storageService;
