import { JobAnalysisSchema } from "./schemas/jobAnalysis.schema.js";

const validJob = {
  jobTitle: "Frontend Developer",
  requiredSkills: ["React", "TypeScript", "JavaScript"],
  preferredSkills: ["REST APIs"],
  experienceYears: 3,
  seniority: "mid",
};

const invalidJob = {
  jobTitle: "",
  requiredSkills: ["React", 123],
  experienceYears: -2,
  seniority: "experienced",
};

console.log("Valid job:", JobAnalysisSchema.safeParse(validJob));

console.log("Invalid job:", JobAnalysisSchema.safeParse(invalidJob));
