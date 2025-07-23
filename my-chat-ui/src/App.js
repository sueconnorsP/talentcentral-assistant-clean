import React, { useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage = { sender: "user", text: messageText };
    const assistantMessage = { sender: "assistant", text: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/ask-talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (let line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.replace("data: ", "").trim();
            if (content === "[DONE]") {
              setLoading(false);
              return;
            }

            fullText += content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                sender: "assistant",
                text: fullText,
              };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      console.error("Streaming failed:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "assistant", text: "Sorry, something went wrong." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>TalentCentral Assistant</h1>
      <div style={{ border: "1px solid #ccc", padding: "1rem", minHeight: "300px" }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              backgroundColor: msg.sender === "user" ? "#e8f0fe" : "#f1f3f4",
              padding: "0.5rem",
              marginBottom: "0.5rem",
              borderRadius: "4px",
            }}
          >
            <strong>{msg.sender === "user" ? "You" : "Assistant"}:</strong> {msg.text}
          </div>
        ))}
        {loading && <div><em>Typing...</em></div>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        style={{ marginTop: "1rem", display: "flex" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button type="submit" disabled={loading} style={{ marginLeft: "0.5rem" }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
