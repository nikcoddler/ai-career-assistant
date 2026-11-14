import dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing from environment variables.");
}

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
