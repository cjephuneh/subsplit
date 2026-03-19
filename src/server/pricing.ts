export function costCentsForTokens(input: {
  promptTokens: number;
  completionTokens: number;
  inputCentsPer1k: number;
  outputCentsPer1k: number;
}) {
  const inputCost = Math.ceil((input.promptTokens / 1000) * input.inputCentsPer1k);
  const outputCost = Math.ceil((input.completionTokens / 1000) * input.outputCentsPer1k);
  return inputCost + outputCost;
}

