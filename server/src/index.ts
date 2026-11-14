import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { JobAnalysisSchema } from "./schemas/jobAnalysis.schema.js";
import { generateEmbedding } from "./services/embedding.service.js";

dotenv.config();
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

const jobAnalysisJsonSchema = {
  type: "object",
  properties: {
    jobTitle: {
      type: "string",
    },
    requiredSkills: {
      type: "array",
      items: { type: "string" },
    },
    preferredSkills: {
      type: "array",
      items: { type: "string" },
    },
    experienceYears: {
      type: ["number", "null"],
    },
    seniority: {
      type: "string",
      enum: ["intern", "junior", "mid", "senior", "lead", "unspecified"],
    },
  },
  required: [
    "jobTitle",
    "requiredSkills",
    "preferredSkills",
    "experienceYears",
    "seniority",
  ],
  additionalProperties: false,
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

// Health-check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Career Assistant backend is running!",
  });
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "A valid message is required.",
    });
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send the request to our local Ollama server.
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI career and job search assistant.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        stream: true,
      }),
    });

    if (!ollamaResponse.ok || !ollamaResponse.body) {
      throw new Error(`Ollama request failed: ${ollamaResponse.status}`);
    }

    // Read Ollama's streamed JSON responses.
    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const event = JSON.parse(line);

        const token = event.message?.content;

        if (token) {
          res.write(
            `data: ${JSON.stringify({
              type: "delta",
              text: token,
            })}\n\n`,
          );
        }

        if (event.done) {
          res.write(
            `data: ${JSON.stringify({
              type: "done",
              usage: {
                input_tokens: event.prompt_eval_count,
                output_tokens: event.eval_count,
              },
            })}\n\n`,
          );
        }
      }
    }

    // Process any remaining buffered content.
    buffer += decoder.decode();

    if (buffer.trim()) {
      const event = JSON.parse(buffer);

      if (event.message?.content) {
        res.write(
          `data: ${JSON.stringify({
            type: "delta",
            text: event.message.content,
          })}\n\n`,
        );
      }
    }

    res.end();
  } catch (error) {
    console.error("Ollama streaming error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate AI response.",
      });
    }

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: "Something went wrong while generating the response.",
      })}\n\n`,
    );

    res.end();
  }
});

app.post("/api/analyze-job", async (req, res) => {
  const { jobDescription } = req.body;

  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return res.status(400).json({
      success: false,
      error: "A valid job description is required.",
    });
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: jobAnalysisJsonSchema,
        messages: [
          {
            role: "system",
            content: `
                You are an expert job description analyzer.

                Extract information accurately.

                Rules:
                1. Extract the explicitly mentioned job title.
                If missing, return "Not specified".

                2. Include only explicitly required, mandatory,
                or essential skills in requiredSkills.

                3. Include preferred, optional, or nice-to-have
                skills in preferredSkills.

                4. Extract minimum required experience.
                "3+ years" means 3.
                "3-5 years" means 3.
                If missing, return null.

                5. SENIORITY
                - Return "intern" only when the role explicitly indicates an internship.
                - Return "junior" only when the description explicitly identifies
                the role as junior or entry-level.
                - Return "mid" only when explicitly identified as mid-level.
                - Return "senior" only when explicitly identified as senior
                or equivalent.
                - Return "lead" only when explicitly identified as lead,
                principal, or equivalent.
                - Do not infer seniority from years of experience alone.
                - If there is insufficient evidence, return "unspecified".

                6. Never invent skills or experience.

                Return only JSON matching the provided schema.
              `,
          },
          {
            role: "user",
            content: jobDescription,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const result = await response.json();

    const parsedJson = JSON.parse(result.message.content);

    // Validate the model's output using our existing Zod schema.
    const validation = JobAnalysisSchema.safeParse(parsedJson);

    if (!validation.success) {
      return res.status(502).json({
        success: false,
        error: "AI returned invalid job analysis data.",
        details: validation.error.issues,
      });
    }

    return res.json({
      success: true,
      data: validation.data,
      usage: {
        input_tokens: result.prompt_eval_count,
        output_tokens: result.eval_count,
        total_tokens: result.prompt_eval_count + result.eval_count,
      },
    });
  } catch (error) {
    console.error("Job analysis error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze job description.",
    });
  }
});

app.post("/api/embeddings", async (req, res) => {
  const { text } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({
      success: false,
      error: "Valid text is required.",
    });
  }

  try {
    const embedding = await generateEmbedding(text);

    return res.json({
      success: true,
      dimensions: embedding.length,
      embedding,
    });
  } catch (error) {
    console.error("Embedding generation error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to generate embedding.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
