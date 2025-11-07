import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Modal, Tabs, Button, Input, Space, message, Dropdown } from "antd";
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

const { TextArea } = Input;
const { TabPane } = Tabs;

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
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
      const lineHeight = 7;
      let y = margin;

      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("AI Generated Document", margin, y);
      y += lineHeight * 2;

      // Content
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");

      // Split content into lines that fit the page width
      const lines = doc.splitTextToSize(editedContent, maxLineWidth);

      lines.forEach((line) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save(`redash-document-${Date.now()}.pdf`);
      message.success("Document downloaded as PDF");
    } catch (error) {
      message.error("Failed to generate PDF: " + error.message);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([editedContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `redash-document-${Date.now()}.txt`);
    message.success("Document downloaded as Text");
  };

  const downloadMenuItems = [
    {
      key: "markdown",
      icon: <FileMarkdownOutlined />,
      label: "Download as Markdown",
      onClick: downloadAsMarkdown,
    },
    {
      key: "pdf",
      icon: <FilePdfOutlined />,
      label: "Download as PDF",
      onClick: downloadAsPDF,
    },
    {
      key: "text",
      icon: <FileWordOutlined />,
      label: "Download as Text",
      onClick: downloadAsText,
    },
  ];

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Convert markdown to basic HTML for preview
  const renderPreview = (content) => {
    // Basic markdown to HTML conversion
    let html = content;

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

    // Lists
    html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // Line breaks
    html = html.replace(/\n/gim, "<br/>");

    return html;
  };

  return (
    <Modal
      title="AI Generated Document"
      open={visible}
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
          <Dropdown
            menu={{ items: downloadMenuItems }}
            trigger={["click"]}
          >
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
