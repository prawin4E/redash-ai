import { axios } from "@/services/axios";

const AIDocumentService = {
  /**
   * Generate a document from query results using AI
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - User prompt describing the document
   * @param {Object} params.queryData - Query result data
   * @param {string} params.format - Output format (markdown, text, html)
   * @returns {Promise<Object>} Generated document
   */
  generate({ prompt, queryData, format = "markdown" }) {
    return axios.post("/api/ai-document/generate", {
      prompt,
      query_data: queryData,
      format,
    });
  },

  /**
   * Regenerate a document with a new prompt
   * @param {Object} params - Regeneration parameters
   * @param {number} params.documentId - Previous document ID
   * @param {string} params.prompt - New prompt
   * @param {Object} params.queryData - Query result data
   * @returns {Promise<Object>} Regenerated document
   */
  regenerate({ documentId, prompt, queryData }) {
    return axios.post("/api/ai-document/regenerate", {
      document_id: documentId,
      prompt,
      query_data: queryData,
    });
  },

  /**
   * Get history of generated documents for a query
   * @param {number} queryId - Query ID
   * @returns {Promise<Array>} List of previous documents
   */
  getHistory(queryId) {
    return axios.get(`/api/ai-document/history/${queryId}`);
  },
};

export { AIDocumentService };
