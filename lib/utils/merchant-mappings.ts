import { createClient } from "@/lib/supabase/server";
import type {
  MerchantMapping,
  MerchantMappingInsert,
} from "@/lib/types/expense";

/**
 * Get merchant mapping for a user (case-insensitive)
 */
export async function getMerchantMapping(
  userId: string,
  merchantName: string
): Promise<MerchantMapping | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("user_id", userId)
    .eq("merchant_name", merchantName.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create a new merchant mapping
 * Returns false if mapping already exists (ignore duplicate)
 */
export async function createMerchantMapping(
  userId: string,
  merchantName: string,
  category: string
): Promise<boolean> {
  const supabase = await createClient();

  const mappingData: MerchantMappingInsert = {
    user_id: userId,
    merchant_name: merchantName.toUpperCase(),
    category,
  };

  const { error } = await supabase
    .from("merchant_mappings")
    .insert([mappingData]);

  // If it's a duplicate key error, return false (ignore)
  if (error?.code === "23505") {
    return false;
  }

  if (error) {
    console.error("Error creating merchant mapping:", error);
    return false;
  }

  return true;
}

/**
 * Update all expenses for a merchant to a new category
 */
export async function updateAllExpensesByMerchant(
  userId: string,
  merchantName: string,
  newCategory: string
): Promise<{ success: boolean; updatedCount: number }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .update({ category: newCategory })
    .eq("user_id", userId)
    .ilike("merchant", merchantName) // Case-insensitive match
    .select("id");

  if (error) {
    console.error("Error updating expenses by merchant:", error);
    return { success: false, updatedCount: 0 };
  }

  return { success: true, updatedCount: data?.length || 0 };
}

/**
 * Get all merchant mappings for a user
 */
export async function listUserMerchantMappings(
  userId: string
): Promise<MerchantMapping[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("user_id", userId)
    .order("merchant_name", { ascending: true });

  if (error) {
    console.error("Error fetching merchant mappings:", error);
    return [];
  }

  return data || [];
}

/**
 * Delete a merchant mapping
 */
export async function deleteMerchantMapping(
  userId: string,
  merchantName: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("merchant_mappings")
    .delete()
    .eq("user_id", userId)
    .eq("merchant_name", merchantName.toUpperCase());

  if (error) {
    console.error("Error deleting merchant mapping:", error);
    return false;
  }

  return true;
}

/**
 * Update a merchant mapping category
 */
export async function updateMerchantMapping(
  userId: string,
  merchantName: string,
  newCategory: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("merchant_mappings")
    .update({ category: newCategory })
    .eq("user_id", userId)
    .eq("merchant_name", merchantName.toUpperCase());

  if (error) {
    console.error("Error updating merchant mapping:", error);
    return false;
  }

  return true;
}
