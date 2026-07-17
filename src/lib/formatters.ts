// Model-agnostic formatter

import { getModel, type ModelParam } from "./models"

export interface FormattedResult {
  modelId: string
  prompt: string
  negativePrompt: string
  params: ModelParam[]
  fullOutput: string
}

export function formatResult(
  positivePrompt: string,
  negativePrompt: string,
  modelId: string
): FormattedResult {
  const model = getModel(modelId)
  const fullOutput = model.formatFull(positivePrompt, negativePrompt)

  return {
    modelId,
    prompt: positivePrompt,
    negativePrompt,
    params: model.params,
    fullOutput,
  }
}
