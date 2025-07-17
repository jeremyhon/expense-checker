"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  CategoryDeleteOptions,
  CategoryDeleteResult,
  CategoryInsert,
  CategoryUpdate,
} from "@/lib/types/category";
import {
  categoryInsertSchema,
  categoryUpdateSchema,
  MAX_CATEGORIES_PER_USER,
} from "@/lib/types/category";

/**
 * Get all categories for the current user
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.user.id)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new category
 */
export async function createCategory(input: CategoryInsert): Promise<Category> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  // Validate input
  const validatedInput = categoryInsertSchema.parse(input);

  // Check category limit
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.user.id);

  if (count && count >= MAX_CATEGORIES_PER_USER) {
    throw new Error(`Maximum ${MAX_CATEGORIES_PER_USER} categories allowed`);
  }

  // Create category
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.user.id,
      name: validatedInput.name,
      description: validatedInput.description || null,
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique violation
      throw new Error("Category with this name already exists");
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing category
 */
export async function updateCategory(
  categoryId: string,
  input: CategoryUpdate
): Promise<Category> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  // Validate input
  const validatedInput = categoryUpdateSchema.parse(input);

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: validatedInput.name,
      description: validatedInput.description || null,
    })
    .eq("id", categoryId)
    .eq("user_id", user.user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique violation
      throw new Error("Category with this name already exists");
    }
    throw new Error(`Failed to update category: ${error.message}`);
  }

  if (!data) {
    throw new Error("Category not found");
  }

  return data;
}

/**
 * Delete a category with optional expense reassignment
 */
export async function deleteCategory(
  categoryId: string,
  options?: CategoryDeleteOptions
): Promise<CategoryDeleteResult> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  // Call the database function
  const { data, error } = await supabase.rpc(
    "delete_category_with_reassignment",
    {
      p_category_id: categoryId,
      p_target_category_id: options?.targetCategoryId || null,
    }
  );

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  return data as CategoryDeleteResult;
}

/**
 * Get count of expenses in a category
 */
export async function getCategoryExpenseCount(
  categoryId: string
): Promise<number> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { count, error } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("user_id", user.user.id);

  if (error) {
    throw new Error(`Failed to count expenses: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get or create a category by name for the current user
 * This is used during expense processing to ensure categories exist
 */
export async function getOrCreateCategoryByName(
  categoryName: string,
  userId: string
): Promise<string> {
  const supabase = await createClient();

  // First, try to find existing category (case-insensitive)
  const { data: existingCategory } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", categoryName)
    .single();

  if (existingCategory) {
    return existingCategory.id;
  }

  // If not found, create new category
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryName,
      is_default: false,
    })
    .select("id")
    .single();

  if (error) {
    // Handle race condition - another process might have created it
    if (error.code === "23505") {
      const { data: retryCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", categoryName)
        .single();

      if (retryCategory) {
        return retryCategory.id;
      }
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return newCategory.id;
}
