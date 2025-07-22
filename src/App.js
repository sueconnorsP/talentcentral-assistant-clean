import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const prompts = [
    "How do I get started in a career in construction?",
    "Where can I find support for getting my Red Seal Certification?",
    "Where can I find training for construction jobs?",
    "Is there funding available for upgrading my skills?",
    "Are there mentors available to help me?",
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage = { sender: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    let assistantText = "";
    const assistantReply = { sender: "assistant", text: "" };
    setMessages((prev) => [...prev, assistantReply]);

    try {
      const response = await fetch("https://talentcentral-assistant-clean.onrender.com/ask-talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Server error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            sender: "assistant",
            text: assistantText,
          };
          return updated;
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
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
        Your one-stop destination for construction jobs and career support in
        BC. Whether you're just starting out, changing careers, or looking to
        grow in the construction industry, we connect you with job
        opportunities, training programs, and resources from the British
        Columbia Construction Association (BCCA) and its partners. Start here to
        explore the tools and support you need to build your future in
        construction.
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
            <em>Assistant is typing...</em>
          </div>
        )}
        <div ref={chatEndRef} />
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
