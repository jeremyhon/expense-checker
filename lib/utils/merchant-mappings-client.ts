"use client";

import { createClient } from "@/lib/supabase/client";
import type { MerchantMapping } from "@/lib/types/expense";

/**
 * Client-side version: Get merchant mapping for a user (case-insensitive)
 */
export async function getMerchantMappingClient(
  merchantName: string
): Promise<MerchantMapping | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("merchant_name", merchantName.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Client-side version: Check if a specific merchant-category mapping exists
 */
export async function getMerchantCategoryMappingClient(
  merchantName: string,
  category: string
): Promise<MerchantMapping | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("merchant_name", merchantName.toUpperCase())
    .eq("category", category)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
