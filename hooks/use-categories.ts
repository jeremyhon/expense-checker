"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/app/actions/categories";
import type { Category } from "@/lib/types/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch categories"
        );
        console.error("Error fetching categories:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { categories, isLoading, error, refresh };
}
