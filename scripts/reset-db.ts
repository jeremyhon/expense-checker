import { createClient } from "@supabase/supabase-js";
import { del, list } from "@vercel/blob";

async function resetDatabase() {
  console.log("🗑️  Starting database reset...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Delete all expenses
    const { error: expensesError } = await supabase
      .from("expenses")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

    if (expensesError) {
      console.error("❌ Error deleting expenses:", expensesError);
      return;
    }

    console.log("✅ Deleted all expenses");

    // Delete all statements
    const { error: statementsError } = await supabase
      .from("statements")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

    if (statementsError) {
      console.error("❌ Error deleting statements:", statementsError);
      return;
    }

    console.log("✅ Deleted all statements");
  } catch (error) {
    console.error("❌ Database reset failed:", error);
  }
}

async function clearBlobStorage() {
  console.log("🗑️  Starting blob storage cleanup...");

  try {
    // List all blobs
    const { blobs } = await list();

    if (blobs.length === 0) {
      console.log("✅ No blobs to delete");
      return;
    }

    console.log(`📁 Found ${blobs.length} blobs to delete`);

    // Delete all blobs
    for (const blob of blobs) {
      await del(blob.url);
      console.log(`🗑️  Deleted: ${blob.pathname}`);
    }

    console.log("✅ Cleared all blob storage");
  } catch (error) {
    console.error("❌ Blob storage cleanup failed:", error);
  }
}

async function resetAll() {
  console.log("🚀 Starting complete reset...\n");

  await resetDatabase();
  await clearBlobStorage();

  console.log("\n🎉 Reset complete!");
}

resetAll();
