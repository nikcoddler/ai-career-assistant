import { qdrantClient } from "../config/qdrant.js";

const COLLECTION_NAME = "jobs";
const VECTOR_SIZE = 384;

export async function createJobsCollection() {
  const collections = await qdrantClient.getCollections();

  const collectionExists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME,
  );

  if (collectionExists) {
    console.log(`Collection "${COLLECTION_NAME}" already exists.`);
    return;
  }

  await qdrantClient.createCollection(COLLECTION_NAME, {
    vectors: {
      size: VECTOR_SIZE,
      distance: "Cosine",
    },
  });

  console.log(`Collection "${COLLECTION_NAME}" created successfully.`);
}
