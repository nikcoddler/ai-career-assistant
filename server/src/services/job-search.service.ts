import { qdrantClient } from "../config/qdrant.js";
import { generateEmbedding } from "./embedding.service.js";

const COLLECTION_NAME = "jobs";

export async function searchJobs(candidateProfile: string) {
  if (!candidateProfile.trim()) {
    throw new Error("Candidate profile cannot be empty.");
  }

  const queryVector = await generateEmbedding(candidateProfile);

  const results = await qdrantClient.query(COLLECTION_NAME, {
    query: queryVector,
    limit: 5,
    with_payload: true,
  });

  return results.points.map((point) => ({
    id: point.id,
    score: point.score,
    job: point.payload,
  }));
}
