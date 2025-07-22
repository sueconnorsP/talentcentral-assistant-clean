import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ GET route with `message` as query param (for native EventSource)
app.get("/ask-talent", async (req, res) => {
  console.log("✅ /ask-talent hit");

  const message = req.query.message;
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

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      res.write(":\n\n");
      res.flush();
    }, 15000);

    for await (const chunk of stream) {
      const content = chunk.data?.delta?.text;
      if (content) {
        res.write(`data: ${content}\n\n`);
        res.flush();
      }
    }

    clearInterval(pingInterval);
    res.write(`event: done\ndata: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("❌ Streaming error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// Serve React app
app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 TalentCentral Assistant server running on port ${port}`);
});
