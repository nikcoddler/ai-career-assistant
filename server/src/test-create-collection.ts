import { qdrantClient } from "./config/qdrant.js";

const COLLECTION_NAME = "jobs";

async function createJobsCollection() {
  try {
    // Check whether the collection already exists
    const collections = await qdrantClient.getCollections();

    const collectionExists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME,
    );

    if (collectionExists) {
      console.log(`Collection "${COLLECTION_NAME}" already exists.`);
      return;
    }

    // Create the collection
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });

    console.log(`Collection "${COLLECTION_NAME}" created successfully!`);

    // Verify the collection
    const details = await qdrantClient.getCollection(COLLECTION_NAME);

    console.log("Collection details:", details);
  } catch (error) {
    console.error("Failed to create collection:", error);
  }
}

createJobsCollection();
