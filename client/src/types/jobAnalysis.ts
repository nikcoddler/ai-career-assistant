export interface JobAnalysis {
  jobTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYears: number | null;
  seniority: "intern" | "junior" | "mid" | "senior" | "lead" | "unspecified";
}

export interface JobAnalysisResponse {
  success: boolean;
  data?: JobAnalysis;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: string;
}
