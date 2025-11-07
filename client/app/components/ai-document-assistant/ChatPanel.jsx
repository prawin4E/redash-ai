import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Drawer, Input, Button, Space, Tag, Spin, Avatar } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined, CloseOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const QUICK_PROMPTS = [
  { key: "summary", label: "📊 Executive Summary", prompt: "Create an executive summary of these query results." },
  { key: "insights", label: "💡 Key Insights", prompt: "Identify the key trends and insights from this data." },
  { key: "report", label: "📋 Detailed Report", prompt: "Generate a detailed report based on these results." },
  { key: "anomalies", label: "🔍 Find Anomalies", prompt: "Highlight any anomalies or outliers in this data." },
  { key: "actions", label: "✅ Action Items", prompt: "Suggest action items based on these findings." },
];

export default function ChatPanel({ visible, onClose, onSendMessage, messages, isGenerating }) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleQuickPrompt = (prompt) => {
    if (!isGenerating) {
      onSendMessage(prompt);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      title={
        <div className="ai-chat-panel-header">
          <RobotOutlined style={{ marginRight: 8 }} />
          AI Document Assistant
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={450}
      className="ai-chat-panel"
      closeIcon={<CloseOutlined />}
    >
      <div className="ai-chat-panel-content">
        {/* Messages Area */}
        <div className="ai-chat-messages">
          {messages.length === 0 ? (
            <div className="ai-chat-welcome">
              <RobotOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }} />
              <h3>Welcome to AI Document Assistant!</h3>
              <p>I can help you create documents from your query results.</p>
              <p>Try one of the quick prompts below or write your own.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`ai-chat-message ${message.role === "user" ? "user" : "assistant"}`}
              >
                <Avatar
                  icon={message.role === "user" ? <UserOutlined /> : <RobotOutlined />}
                  className="ai-chat-avatar"
                  style={{
                    backgroundColor: message.role === "user" ? "#1890ff" : "#52c41a",
                  }}
                />
                <div className="ai-chat-message-content">
                  {message.role === "assistant" && message.isError ? (
                    <div className="ai-chat-error">
                      <strong>Error:</strong> {message.content}
                    </div>
                  ) : (
                    <div className="ai-chat-text">{message.content}</div>
                  )}
                  {message.timestamp && (
                    <div className="ai-chat-timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isGenerating && (
            <div className="ai-chat-message assistant">
              <Avatar icon={<RobotOutlined />} className="ai-chat-avatar" style={{ backgroundColor: "#52c41a" }} />
              <div className="ai-chat-message-content">
                <Spin size="small" /> Generating document...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="ai-chat-quick-prompts">
            <div className="ai-chat-quick-prompts-label">Quick Prompts:</div>
            <Space direction="vertical" style={{ width: "100%" }}>
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.key}
                  block
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  disabled={isGenerating}
                  className="ai-chat-quick-prompt-button"
                >
                  {prompt.label}
                </Button>
              ))}
            </Space>
          </div>
        )}

        {/* Input Area */}
        <div className="ai-chat-input-area">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what document you want to generate..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={isGenerating}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            className="ai-chat-send-button"
          >
            Generate
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

ChatPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.oneOf(["user", "assistant"]).isRequired,
      content: PropTypes.string.isRequired,
      timestamp: PropTypes.number,
      isError: PropTypes.bool,
    })
  ),
  isGenerating: PropTypes.bool,
};

ChatPanel.defaultProps = {
  messages: [],
  isGenerating: false,
};
