import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import message from "antd/lib/message";
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
    console.log("AI Document Assistant: toggleChat called, current state:", isChatOpen);
    setIsChatOpen((prev) => {
      const newState = !prev;
      console.log("AI Document Assistant: Setting chat open to:", newState);
      return newState;
    });
  }, [isChatOpen]);

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

        console.log("AI Document Assistant: API response:", response);
        console.log("AI Document Assistant: Response type:", typeof response);
        console.log("AI Document Assistant: Response keys:", response ? Object.keys(response) : "response is null/undefined");

        // Validate response
        if (!response) {
          throw new Error("Empty response from server");
        }

        if (response.error) {
          throw new Error(response.error);
        }

        // Handle different possible response structures
        let documentContent = null;
        let documentFormat = "markdown";

        if (response.document) {
          // Standard response structure
          documentContent = response.document;
          documentFormat = response.format || "markdown";
        } else if (typeof response === "string") {
          // Response might be the document string directly
          documentContent = response;
        } else if (response.data && response.data.document) {
          // Response might be wrapped in a data property
          documentContent = response.data.document;
          documentFormat = response.data.format || "markdown";
        } else {
          // Unknown structure - log it and throw error
          console.error("AI Document Assistant: Unexpected response structure:", JSON.stringify(response, null, 2));
          throw new Error(`Invalid response format from server. Response structure: ${JSON.stringify(response)}`);
        }

        if (!documentContent) {
          throw new Error("Document content is missing from server response");
        }

        // Add assistant message
        const assistantMessage = {
          role: "assistant",
          content: "Document generated successfully! Click below to view and edit.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Set document and open editor
        setCurrentDocument({
          content: documentContent,
          format: documentFormat,
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
