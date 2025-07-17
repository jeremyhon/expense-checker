import { redirect } from "next/navigation";
import { getCategories } from "@/app/actions/categories";
import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    redirect("/login");
  }

  const categories = await getCategories();

  return <CategoriesClient initialCategories={categories} />;
}
