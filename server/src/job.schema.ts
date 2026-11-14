import { z } from "zod";

export const jobAnalysisSchema = z.object({
  jobTitle: z.string(),

  requiredSkills: z.array(z.string()),

  experienceYears: z.number(),

  seniority: z.enum(["junior", "mid", "senior"]),
});
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;