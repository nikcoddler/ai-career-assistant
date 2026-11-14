import { useState } from "react";
import type { JobAnalysis, JobAnalysisResponse } from "../types/jobAnalysis";

import "./JobAnalyzer.css";

function JobAnalyzer() {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeJob = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("http://localhost:3000/api/analyze-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      const result: JobAnalysisResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Failed to analyze job description.");
      }

      setAnalysis(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-analyzer">
      <h2>Job Description Analyzer</h2>

      <p>Paste a job description to extract its requirements using AI.</p>

      <textarea
        value={jobDescription}
        onChange={(event) => setJobDescription(event.target.value)}
        placeholder="Paste the job description here..."
        rows={8}
      />

      <button onClick={analyzeJob} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Job"}
      </button>

      {error && <p className="error-message">{error}</p>}

      {analysis && (
        <div className="analysis-result">
          <h3>Analysis Results</h3>

          <p>
            <strong>Job Title:</strong> {analysis.jobTitle}
          </p>

          <p>
            <strong>Experience:</strong>{" "}
            {analysis.experienceYears === null
              ? "Not specified"
              : `${analysis.experienceYears}+ years`}
          </p>

          <p>
            <strong>Seniority:</strong> {analysis.seniority}
          </p>

          <div>
            <strong>Required Skills:</strong>
            {analysis.requiredSkills.length > 0 ? (
              <ul>
                {analysis.requiredSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>None specified</p>
            )}
          </div>

          <div>
            <strong>Preferred Skills:</strong>
            {analysis.preferredSkills.length > 0 ? (
              <ul>
                {analysis.preferredSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>None specified</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JobAnalyzer;
