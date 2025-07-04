/**
 * Currency conversion utilities
 */

export interface CurrencyConversionResult {
  convertedAmount: number;
  success: boolean;
  error?: string;
}

/**
 * Convert amount from one currency to SGD using exchangerate-api.com
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency code (e.g., "USD")
 * @param date - Transaction date (for logging purposes)
 * @returns Promise<CurrencyConversionResult>
 */
export async function convertToSGD(
  amount: number,
  fromCurrency: string,
  date: string
): Promise<CurrencyConversionResult> {
  if (fromCurrency === "SGD") {
    return {
      convertedAmount: amount,
      success: true,
    };
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/407edb4c8c755c3df20b18e6/latest/${fromCurrency}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (
      data.result === "success" &&
      data.conversion_rates &&
      data.conversion_rates.SGD
    ) {
      const convertedAmount =
        Math.round(amount * data.conversion_rates.SGD * 100) / 100;
      return {
        convertedAmount,
        success: true,
      };
    }

    throw new Error(
      `SGD rate not available for ${fromCurrency}: ${data.error_type || "Unknown error"}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Currency conversion failed for ${fromCurrency} to SGD on ${date}:`,
      errorMessage
    );

    return {
      convertedAmount: amount, // Fallback to original amount
      success: false,
      error: errorMessage,
    };
  }
}
