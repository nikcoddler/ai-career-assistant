import { searchJobs } from "./services/job-search.service.js";

async function main() {
  try {
    const results = await searchJobs(
      `I am a frontend developer with 3 years of experience.
       I have strong skills in React, TypeScript, JavaScript,
       Redux and REST APIs.`,
    );

    console.log("Matching jobs:");

    console.dir(results, { depth: null });
  } catch (error) {
    console.error("Job search failed:", error);
  }
}

main();
