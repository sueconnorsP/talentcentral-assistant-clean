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

// ✅ POST route for assistant chat (for fetch + stream)
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const pingInterval = setInterval(() => {
      res.write(":\n\n");
      res.flush();
    }, 15000);

    for await (const chunk of stream) {
      const content = chunk.data?.delta?.text;
      if (content) {
        res.write(`${content}`);
        res.flush();
      }
    }

    clearInterval(pingInterval);
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
