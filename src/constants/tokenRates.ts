/**
 * Google Gemini Token Rates (pricing per 1 million tokens in USD)
 * Reference: Gemini 3.5 / Flash Pricing
 */
export const TOKEN_RATES = {
  inputPricePerMillion: 1.50,   // $1.50 per 1M prompt tokens
  outputPricePerMillion: 9.00,  // $9.00 per 1M candidate tokens
};

/**
 * Utility to calculate the estimated cost of a generation in USD
 */
export function calculateTokenCost(promptTokens: number, candidatesTokens: number): number {
  const inputCost = (promptTokens / 1000000) * TOKEN_RATES.inputPricePerMillion;
  const outputCost = (candidatesTokens / 1000000) * TOKEN_RATES.outputPricePerMillion;
  return parseFloat((inputCost + outputCost).toFixed(6));
}
