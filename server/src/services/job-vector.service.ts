import { randomUUID } from "node:crypto";
import { qdrantClient } from "../config/qdrant.js";
import { generateEmbedding } from "./embedding.service.js";

const COLLECTION_NAME = "jobs";

interface Job {
  jobTitle: string;
  company: string;
  description: string;
  requiredSkills: string[];
  location: string;
}

export async function storeJob(job: Job) {
  const embedding = await generateEmbedding(
    `${job.jobTitle}. ${job.description}. Required skills: ${job.requiredSkills.join(", ")}`,
  );

  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: randomUUID(),
        vector: embedding,
        payload: {
          jobTitle: job.jobTitle,
          company: job.company,
          description: job.description,
          requiredSkills: job.requiredSkills,
          location: job.location,
        },
      },
    ],
  });

  return {
    success: true,
    message: "Job stored successfully",
  };
}
