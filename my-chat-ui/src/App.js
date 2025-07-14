import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);

  const prompts = [
    "How do I get started in a career in construction?",
    "Where can I find support for getting my Red Seal Certification?",
    "Where can I find training for construction jobs?",
    "Is there funding available for upgrading my skills?",
    "Are there mentors available to help me?",
  ];

  // Load threadId from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("thread_id");
    if (saved) setThreadId(saved);
  }, []);

  // Save threadId to localStorage when it changes
  useEffect(() => {
    if (threadId) {
      localStorage.setItem("thread_id", threadId);
    }
  }, [threadId]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage = { sender: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/ask-talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          thread_id: threadId,
        }),
      });

      const data = await res.json();

      if (data.thread_id && !threadId) {
        setThreadId(data.thread_id);
      }

      const assistantMessage = {
        sender: "assistant",
        text: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>TalentCentral Assistant</h1>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "assistant"}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        ))}
        {loading && <div className="message assistant">Typing...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={() => sendMessage()}>Send</button>
      </div>

      <div className="prompt-buttons">
        {prompts.map((prompt, i) => (
          <button key={i} onClick={() => sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;

    try {
      const response = await fetch("/ask-talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "❌ Sorry, something went wrong while connecting to the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="chat-container">
      <h1>Welcome to the Builders Life TalentCentral Assistant</h1>
      <p className="intro">
        Your one-stop destination for construction jobs and career support in BC.
      </p>

      <div className="prompt-buttons">
        {prompts.map((prompt, index) => (
          <button key={index} onClick={() => sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <em>Thinking...</em>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={() => sendMessage()}>Send</button>
        <button onClick={clearChat} className="clear-btn">
          Clear
        </button>
      </div>
    </div>
  );
}

export default App;
