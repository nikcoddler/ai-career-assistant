import { z } from "zod";

export const JobAnalysisSchema = z.object({
  jobTitle: z.string(),

  requiredSkills: z.array(z.string()),

  preferredSkills: z.array(z.string()),

  experienceYears: z.number().nullable(),

  seniority: z.enum([
    "intern",
    "junior",
    "mid",
    "senior",
    "lead",
    "unspecified",
  ]),
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
