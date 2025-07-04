import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { readFileSync } from "fs";
import { z } from "zod";

const expenseSchema = z.object({
  date: z.string().describe("Transaction date in YYYY-MM-DD format"),
  description: z.string().describe("Transaction description"),
  amount: z.number().describe("Transaction amount as positive number"),
  merchant: z.string().describe("Merchant name"),
  category: z
    .string()
    .describe(
      "Category: groceries, dining, transport, shopping, travel, entertainment, bills, health, or other"
    ),
});

type ExpenseSchema = z.infer<typeof expenseSchema>;

async function testPDFExtraction(): Promise<void> {
  console.log("Testing PDF transaction extraction...");

  const pdfBuffer = readFileSync("./march.pdf");
  const base64Data = pdfBuffer.toString("base64");
  console.log("PDF loaded, size:", base64Data.length, "characters");

  try {
    // Second test: array mode with PDF
    const { elementStream: pdfElementStream } = streamObject({
      model: google("gemini-2.5-flash"),
      output: "array",
      schema: expenseSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract EXPENSE transactions (purchases, not credits) from this credit card statement. For each expense transaction, provide:\n- date: transaction date in YYYY-MM-DD format\n- description: full transaction description\n- amount: transaction amount as positive number\n- merchant: merchant name\n- category: one of (groceries, dining, transport, shopping, travel, entertainment, bills, health, other)\n\nOnly extract actual purchases/expenses, skip credits and balance transfers.",
            },
            {
              type: "file",
              data: base64Data,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
    });

    console.log("Processing PDF array stream...");
    let pdfCount = 0;

    for await (const element of pdfElementStream) {
      pdfCount++;
      console.log(
        `PDF Transaction ${pdfCount}:`,
        JSON.stringify(element, null, 2)
      );
    }

    console.log(`PDF extracted: ${pdfCount} transactions`);
  } catch (error) {
    console.error("Array streaming failed:", error);
    if (error instanceof Error && error.cause) {
      console.error("Error cause:", error.cause);
    }
  }
}

testPDFExtraction();
