import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/ask-talent", async (req, res) => {
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

    for await (const chunk of stream) {
      const text = chunk.data?.delta?.text;
      if (text) {
        res.write(`data: ${text}\n\n`);
        res.flush();
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Error in stream:", err);
    res.status(500).json({ error: "Streaming failed" });
  }
});

const clientPath = path.join(__dirname, "client", "build");
app.use(express.static(clientPath));
app.get("*", (req, res) => res.sendFile(path.join(clientPath, "index.html")));

app.listen(port, () => console.log(`Listening on port ${port}`));
