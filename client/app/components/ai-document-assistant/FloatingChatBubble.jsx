import React from "react";
import PropTypes from "prop-types";
import Tooltip from "antd/lib/tooltip";
import { MessageOutlined, RobotOutlined } from "@ant-design/icons";

export default function FloatingChatBubble({ onClick, isOpen, isGenerating }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("AI Document Assistant: Chat bubble clicked");
    if (onClick) {
      onClick();
    } else {
      console.warn("AI Document Assistant: onClick handler is missing");
    }
  };

  return (
    <Tooltip title="AI Document Assistant" placement="left">
      <div
        className={`ai-chat-bubble ${isOpen ? "open" : ""} ${isGenerating ? "generating" : ""}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
      >
        <div className="ai-chat-bubble-icon">
          {isGenerating ? (
            <div className="ai-chat-bubble-spinner">
              <RobotOutlined spin />
            </div>
          ) : (
            <MessageOutlined />
          )}
        </div>
        {!isOpen && (
          <div className="ai-chat-bubble-badge">
            <span className="ai-sparkle" role="img" aria-label="sparkle">✨</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
}

FloatingChatBubble.propTypes = {
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  isGenerating: PropTypes.bool,
};

FloatingChatBubble.defaultProps = {
  isOpen: false,
  isGenerating: false,
};
