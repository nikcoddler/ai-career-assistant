import { useState } from "react";
import JobAnalyzer from "./components/JobAnalyzer";
import "./App.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null>(null);

  const sendMessage = async () => {
    const userMessage = input.trim();

    if (!userMessage || loading) return;

    setInput("");
    setError("");
    setUsage(null);
    setLoading(true);

    // Add user message and an empty assistant message.
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to start the AI response stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let streamFinished = false;

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events.
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";

        for (const eventBlock of events) {
          const dataLine = eventBlock
            .split(/\r?\n/)
            .find((line) => line.startsWith("data:"));

          if (!dataLine) continue;

          const rawData = dataLine.slice(5).trim();

          const event = JSON.parse(rawData);

          if (event.type === "delta") {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;

              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + event.text,
              };

              return updated;
            });
          }

          if (event.type === "done") {
            streamFinished = true;
            setUsage(event.usage ?? null);
          }

          if (event.type === "error") {
            throw new Error(event.error || "AI streaming failed.");
          }
        }
      }

      // Process any final buffered event.
      const finalDataLine = buffer
        .split(/\r?\n/)
        .find((line) => line.startsWith("data:"));

      if (finalDataLine) {
        const event = JSON.parse(finalDataLine.slice(5).trim());

        if (event.type === "done") {
          streamFinished = true;
          setUsage(event.usage ?? null);
        }

        if (event.type === "error") {
          throw new Error(event.error || "AI streaming failed.");
        }

        if (event.type === "delta") {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + event.text,
            };

            return updated;
          });
        }
      }

      if (!streamFinished) {
        throw new Error("The AI stream ended unexpectedly.");
      }
    } catch (err) {
      console.error("Chat error:", err);

      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>AI Career Assistant</h1>
      <p>Ask me about your career and job search.</p>
      <JobAnalyzer />

      <div className="chat-window">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
            <p>{message.content}</p>
          </div>
        ))}

        {loading && <p>Assistant is thinking...</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void sendMessage();
            }
          }}
          placeholder="Ask something..."
        />

        <button onClick={() => void sendMessage()} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
