import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import Modal from "antd/lib/modal";
import Tabs from "antd/lib/tabs";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Space from "antd/lib/space";
import message from "antd/lib/message";
import Dropdown from "antd/lib/dropdown";
import Menu from "antd/lib/menu";
import {
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { marked } from "marked";
import sanitize from "@/services/sanitize"; // Import the sanitize service

const { TextArea } = Input;
const { TabPane } = Tabs;

// Configure marked to handle tables and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

export default function DocumentEditorModal({
  visible,
  onClose,
  document,
  onRegenerate,
  isRegenerating,
}) {
  const [editedContent, setEditedContent] = useState(document?.content || "");
  const [activeTab, setActiveTab] = useState("edit");
  const editorRef = useRef(null);

  React.useEffect(() => {
    if (document?.content) {
      setEditedContent(document.content);
    }
  }, [document]);

  const downloadAsMarkdown = () => {
    const blob = new Blob([editedContent], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `redash-document-${Date.now()}.md`);
    message.success("Document downloaded as Markdown");
  };

  const downloadAsPDF = () => {
    try {
      const doc = new jsPDF();

      // CSS styles for the PDF content
      const styles = `
        body { font-family: Helvetica, sans-serif; font-size: 11px; line-height: 1.6; }
        h1 { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 9px; /* Smaller font for PDF */
        }
        th, td {
          border: 1px solid #d9d9d9;
          padding: 6px 8px; /* Smaller padding for PDF */
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
      `;

      // Convert markdown to HTML
      const htmlContent = marked.parse(editedContent);

      // Combine styles and content
      const finalHtml = `
        <html>
          <head>
            <style>${styles}</style>
          </head>
          <body>
            <h1>AI Generated Document</h1>
            ${htmlContent}
          </body>
        </html>
      `;

      doc.html(finalHtml, {
        callback: function (doc) {
          doc.save(`redash-document-${Date.now()}.pdf`);
          message.success("Document downloaded as PDF");
        },
        x: 10,
        y: 10,
        width: 190, // A4 width in mm is 210, leaving some margin
        windowWidth: 700, // virtual window width to layout the html
        html2canvas: {
          scale: 0.25, // Adjust scale to fit content
        }
      });
    } catch (error) {
      message.error("Failed to generate PDF: " + error.message);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([editedContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `redash-document-${Date.now()}.txt`);
    message.success("Document downloaded as Text");
  };

  const downloadMenu = (
    <Menu>
      <Menu.Item key="markdown" icon={<FileMarkdownOutlined />} onClick={downloadAsMarkdown}>
        Download as Markdown
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={downloadAsPDF}>
        Download as PDF
      </Menu.Item>
      <Menu.Item key="text" icon={<FileWordOutlined />} onClick={downloadAsText}>
        Download as Text
      </Menu.Item>
    </Menu>
  );

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Convert markdown to HTML for preview using 'marked' library and sanitize it
  const renderPreview = (content) => {
    return sanitize(marked.parse(content));
  };

  return (
    <Modal
      title="AI Generated Document"
      visible={visible}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Button onClick={onClose}>Close</Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRegenerate}
            loading={isRegenerating}
            disabled={isRegenerating}
          >
            Regenerate
          </Button>
          <Dropdown overlay={downloadMenu} trigger={["click"]}>
            <Button type="primary" icon={<DownloadOutlined />}>
              Download
            </Button>
          </Dropdown>
        </Space>
      }
      className="ai-document-editor-modal"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <EditOutlined /> Edit
            </span>
          }
          key="edit"
        >
          <div className="ai-document-editor">
            <TextArea
              ref={editorRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Your document content..."
              autoSize={{ minRows: 20, maxRows: 30 }}
              className="ai-document-textarea"
            />
            <div className="ai-document-editor-hint">
              This editor supports Markdown formatting. Use preview to see formatted output.
            </div>
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <EyeOutlined /> Preview
            </span>
          }
          key="preview"
        >
          <div
            className="ai-document-preview"
            dangerouslySetInnerHTML={{ __html: renderPreview(editedContent) }}
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
}

DocumentEditorModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  document: PropTypes.shape({
    content: PropTypes.string,
    format: PropTypes.string,
    prompt: PropTypes.string,
  }),
  onRegenerate: PropTypes.func,
  isRegenerating: PropTypes.bool,
};

DocumentEditorModal.defaultProps = {
  document: null,
  onRegenerate: null,
  isRegenerating: false,
};
