import { pipeline, env } from "@huggingface/transformers";

const extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

// Keep downloaded models in the local cache.
env.allowRemoteModels = true;

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline("feature-extraction", MODEL_NAME);
  }

  return embeddingPipeline;
}

export async function generateEmbedding(text: string) {
  if (!text.trim()) {
    throw new Error("Text cannot be empty.");
  }

  const extractor = await getEmbeddingPipeline();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data) as number[];
}
