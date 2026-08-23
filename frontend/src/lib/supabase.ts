import { createClient } from "@supabase/supabase-js";
import type { Database } from "@alanya-holidays/shared";
import { logger } from "@/lib/logger";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined) ||
  "";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn(
    "Supabase credentials are missing. Please configure VITE_SUPABASE_URL (or VITE_PUBLIC_SUPABASE_URL) and VITE_SUPABASE_ANON_KEY (or VITE_PUBLIC_SUPABASE_ANON_KEY) in your environment variables."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);