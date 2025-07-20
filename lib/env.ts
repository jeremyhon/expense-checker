import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ELECTRIC_SOURCE_ID: z.string().min(1),
    ELECTRIC_SOURCE_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    // Server-side ElectricSQL credentials
    ELECTRIC_SOURCE_ID: process.env.ELECTRIC_SOURCE_ID,
    ELECTRIC_SOURCE_SECRET: process.env.ELECTRIC_SOURCE_SECRET,
    // Client-side Supabase configuration
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
