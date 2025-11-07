import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { message } from "antd";
import FloatingChatBubble from "./FloatingChatBubble";
import ChatPanel from "./ChatPanel";
import DocumentEditorModal from "./DocumentEditorModal";
import { AIDocumentService } from "@/services/ai-document";
import "./AIDocumentAssistant.less";

export default function AIDocumentAssistant({ queryResult, queryResultData, query }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const openEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  const formatQueryResultForAPI = useCallback(() => {
    if (!queryResultData || !queryResultData.rows) {
      return null;
    }

    return {
      query_id: query?.id,
      query_text: query?.query,
      columns: queryResultData.columns || [],
      rows: queryResultData.rows || [],
      row_count: queryResultData.rows?.length || 0,
      runtime: queryResultData.runtime,
    };
  }, [queryResultData, query]);

  const handleSendMessage = useCallback(
    async (prompt) => {
      // Add user message
      const userMessage = {
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLastPrompt(prompt);

      // Validate query result data
      const queryData = formatQueryResultForAPI();
      if (!queryData) {
        const errorMessage = {
          role: "assistant",
          content: "No query results available. Please run a query first.",
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      setIsGenerating(true);

      try {
        // Call API to generate document
        const response = await AIDocumentService.generate({
          prompt,
          queryData,
          format: "markdown",
        });

        // Add assistant message
        const assistantMessage = {
          role: "assistant",
          content: "Document generated successfully! Click below to view and edit.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Set document and open editor
        setCurrentDocument({
          content: response.document,
          format: response.format || "markdown",
          prompt,
        });

        // Auto-open editor
        setTimeout(() => {
          openEditor();
        }, 300);
      } catch (error) {
        console.error("Error generating document:", error);
        const errorMessage = {
          role: "assistant",
          content: error.message || "Failed to generate document. Please try again.",
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        message.error("Failed to generate document");
      } finally {
        setIsGenerating(false);
      }
    },
    [formatQueryResultForAPI, openEditor]
  );

  const handleRegenerate = useCallback(async () => {
    if (!lastPrompt) {
      message.warning("No previous prompt to regenerate from");
      return;
    }

    const queryData = formatQueryResultForAPI();
    if (!queryData) {
      message.error("No query results available");
      return;
    }

    setIsRegenerating(true);

    try {
      const response = await AIDocumentService.generate({
        prompt: lastPrompt,
        queryData,
        format: "markdown",
      });

      setCurrentDocument({
        content: response.document,
        format: response.format || "markdown",
        prompt: lastPrompt,
      });

      message.success("Document regenerated successfully");
    } catch (error) {
      console.error("Error regenerating document:", error);
      message.error("Failed to regenerate document");
    } finally {
      setIsRegenerating(false);
    }
  }, [lastPrompt, formatQueryResultForAPI]);

  // Don't render if no query result is available
  if (!queryResult || !queryResultData || !queryResultData.rows) {
    return null;
  }

  return (
    <>
      <FloatingChatBubble onClick={toggleChat} isOpen={isChatOpen} isGenerating={isGenerating} />

      <ChatPanel
        visible={isChatOpen}
        onClose={closeChat}
        onSendMessage={handleSendMessage}
        messages={messages}
        isGenerating={isGenerating}
      />

      <DocumentEditorModal
        visible={isEditorOpen}
        onClose={closeEditor}
        document={currentDocument}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    </>
  );
}

AIDocumentAssistant.propTypes = {
  queryResult: PropTypes.object,
  queryResultData: PropTypes.shape({
    columns: PropTypes.array,
    rows: PropTypes.array,
    runtime: PropTypes.number,
  }),
  query: PropTypes.shape({
    id: PropTypes.number,
    query: PropTypes.string,
  }),
};

AIDocumentAssistant.defaultProps = {
  queryResult: null,
  queryResultData: null,
  query: null,
};
