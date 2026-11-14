import { storeJob } from "./services/job-vector.service.js";

async function main() {
  try {
    const result = await storeJob({
      jobTitle: "Frontend Developer",
      company: "ABC Technologies",
      description:
        "We are looking for a React developer with strong JavaScript, TypeScript, Redux, and frontend development experience. Knowledge of REST APIs is preferred.",
      requiredSkills: ["React", "JavaScript", "TypeScript", "Redux"],
      location: "Bengaluru",
    });

    console.log(result);
  } catch (error) {
    console.error("Failed to store job:", error);
  }
}

main();
