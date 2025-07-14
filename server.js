// API route to handle assistant conversation
app.post("/ask-talent", async (req, res) => {
  const { message, thread_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    // Use existing thread if provided, otherwise create one
    let threadId = thread_id;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // Run the assistant with the thread
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: process.env.ASSISTANT_ID,
    });

    // Retrieve the assistant's latest reply
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantReply = messages.data.find((msg) => msg.role === "assistant");

    res.json({
      response: assistantReply?.content[0]?.text?.value || "Hmm, I couldn’t find a good answer for that.",
      thread_id: threadId, // Send this back to be reused by the client
    });
  } catch (err) {
    console.error("❌ Error during OpenAI call:", err);
    res.status(500).json({ error: "Server error." });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`✅ TalentCentral Assistant server running on port ${port}`);
});
