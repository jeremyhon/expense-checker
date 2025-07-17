import { createClient } from "@/lib/supabase/server";

/**
 * Resolve category name to category ID for a user
 * If category doesn't exist, creates it and returns the ID
 */
export async function resolveCategoryNameToId(
  userId: string,
  categoryName: string
): Promise<string> {
  const supabase = await createClient();

  // First try to find existing category
  const { data: existingCategory, error: searchError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", categoryName)
    .single();

  if (searchError && searchError.code !== "PGRST116") {
    // Error other than "not found"
    throw new Error(`Failed to search category: ${searchError.message}`);
  }

  if (existingCategory) {
    return existingCategory.id;
  }

  // Category doesn't exist, create it
  const { data: newCategory, error: createError } = await supabase
    .from("categories")
    .insert([
      {
        user_id: userId,
        name: categoryName,
        is_default: false,
      },
    ])
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Failed to create category: ${createError.message}`);
  }

  return newCategory.id;
}

/**
 * Get category ID for a user by name (without creating if not found)
 */
export async function getCategoryIdByName(
  userId: string,
  categoryName: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", categoryName)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw new Error(`Failed to get category: ${error.message}`);
  }

  return category.id;
}
