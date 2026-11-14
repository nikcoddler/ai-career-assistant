import { qdrantClient } from "./config/qdrant.js";

async function testConnection() {
  try {
    const collections = await qdrantClient.getCollections();

    console.log("Connected to Qdrant successfully!");
    console.log("Collections:", collections);
  } catch (error) {
    console.error("Qdrant connection failed:", error);
  }
}

testConnection();
