import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static React build
const clientBuildPath = path.join(__dirname, "client", "build");
app.use(express.static(clientBuildPath));

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// SSE endpoint
app.post("/ask-talent", async (req, res) => {
  console.log("✅ /ask-talent hit");

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const stream = await openai.beta.threads.runs.stream(thread.id, {
      assistant_id: process.env.ASSISTANT_ID,
    });

    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Keep-alive ping every 15s
    const ping = setInterval(() => {
      res.write(":\n\n");
      res.flush();
    }, 15000);

    // Stream response
    for await (const chunk of stream) {
      const content = chunk.data?.delta?.text;
      if (content) {
        res.write(`data: ${content}\n\n`);
        res.flush();
      }
    }

    clearInterval(ping);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("❌ Streaming error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// React app catch-all
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
