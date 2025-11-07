# AI Document Assistant

## Overview

The AI Document Assistant is a new feature that enables users to generate documents from query results using Large Language Models (LLMs). Users can interact with a chat interface to describe what kind of document they want, and the AI will generate it based on the query results.

## Features

- **Floating Chat Bubble**: A beautiful, animated chat bubble appears on query results pages
- **Interactive Chat Interface**: Users can send prompts to describe what document they want
- **Quick Prompts**: Pre-defined prompts for common use cases:
  - Executive Summary
  - Key Insights
  - Detailed Report
  - Find Anomalies
  - Action Items
- **Document Editor**: Edit generated documents with markdown support
- **Multiple Export Formats**: Download as PDF, Markdown, or Text
- **Document Regeneration**: Regenerate documents with the same or different prompts

## Architecture

### Frontend Components

```
client/app/components/ai-document-assistant/
├── AIDocumentAssistant.jsx        # Main container component
├── FloatingChatBubble.jsx         # Floating chat icon
├── ChatPanel.jsx                  # Chat interface drawer
├── DocumentEditorModal.jsx        # Document editor and preview
└── AIDocumentAssistant.less       # Styling
```

### Backend Components

```
redash/
├── handlers/
│   └── ai_document.py             # API handlers
├── services/
│   └── llm_service.py             # LLM integration service
└── settings/
    └── __init__.py                # LLM configuration
```

### API Endpoints

- `POST /api/ai-document/generate` - Generate a new document
- `POST /api/ai-document/regenerate` - Regenerate a document with new prompt
- `GET /api/ai-document/history/<query_id>` - Get document generation history (coming soon)

## Setup & Configuration

### 1. Install Dependencies

#### Frontend Dependencies

```bash
cd /home/user/redash-ai
yarn install
```

This will install:
- `jspdf` - PDF generation
- `file-saver` - File download utility

#### Backend Dependencies

```bash
# Install AI dependencies (optional)
poetry install --with ai
```

Or install specific LLM provider:

```bash
# For OpenAI
pip install openai

# For Anthropic Claude
pip install anthropic

# For token counting (optional)
pip install tiktoken
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# LLM Provider Configuration
LLM_API_KEY=your-api-key-here                    # Required: Your OpenAI or Anthropic API key
LLM_PROVIDER=openai                              # Options: openai, anthropic, mock
LLM_MODEL=gpt-4-turbo-preview                    # Model to use (see below for options)
AI_DOCUMENT_MAX_ROWS=1000                        # Max rows to send to LLM (avoid token limits)
AI_DOCUMENT_ENABLED=true                         # Feature flag to enable/disable
```

#### Supported Models

**OpenAI:**
- `gpt-4-turbo-preview` (recommended)
- `gpt-4`
- `gpt-3.5-turbo`

**Anthropic:**
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

**Mock (for testing):**
- Set `LLM_PROVIDER=mock` to use a mock generator (no API key needed)

### 3. Build the Frontend

```bash
yarn build
```

Or for development:

```bash
yarn watch
```

### 4. Restart the Server

```bash
# Development
./manage.py dev_server

# Production (Docker)
docker compose restart server
```

## Usage

### For End Users

1. **Run a Query**: Execute any query in Redash
2. **Click the Chat Bubble**: Look for the floating chat icon in the bottom-right corner (blue with a sparkle ✨)
3. **Choose a Prompt**:
   - Click one of the quick prompts (e.g., "Executive Summary")
   - Or type your own custom prompt (e.g., "Create a report highlighting the top 5 findings")
4. **Review the Generated Document**: The AI will generate a document and open it in the editor
5. **Edit & Customize**: Make any changes you want in the editor
6. **Download**: Choose your format (PDF, Markdown, or Text) and download

### Example Prompts

- "Create an executive summary of these query results"
- "Write a business email summarizing the key findings"
- "Generate a markdown report with visualizations and insights"
- "Create a presentation outline based on this data"
- "Identify the top 10 trends and explain their significance"
- "Write action items based on these results"

## Technical Details

### How It Works

1. **User Interaction**: User clicks the chat bubble and sends a prompt
2. **Data Preparation**: Frontend formats query result data (columns, rows, query text)
3. **API Call**: POST request to `/api/ai-document/generate` with prompt + data
4. **LLM Processing**: Backend calls configured LLM provider with:
   - System prompt (instructions for document generation)
   - User prompt (what the user wants)
   - Query context (formatted data, limited to MAX_ROWS)
5. **Document Generation**: LLM generates markdown document
6. **Response**: Document sent back to frontend
7. **Editor**: User can edit, preview, and download

### Data Privacy & Security

- **API Keys**: Stored as environment variables, never exposed to frontend
- **Data Transmission**: Query results sent to external LLM provider (OpenAI/Anthropic)
- **Row Limit**: Configurable limit (`AI_DOCUMENT_MAX_ROWS`) to control data sent
- **Feature Toggle**: Can be disabled per organization via `AI_DOCUMENT_ENABLED`

**Important**: If working with sensitive data, consider:
- Using a self-hosted LLM solution
- Reviewing your LLM provider's data privacy policies
- Setting a lower `AI_DOCUMENT_MAX_ROWS` limit
- Disabling the feature for sensitive queries/dashboards

### Error Handling

The feature includes comprehensive error handling:

- **No API Key**: Shows error message to configure API key
- **No Query Results**: Only shows chat bubble when results exist
- **API Failures**: Displays user-friendly error messages
- **Rate Limits**: Returns appropriate error messages
- **Network Issues**: Graceful degradation with retry suggestions

### Performance Considerations

- **Token Limits**: Row limit prevents exceeding LLM token limits
- **Caching**: Consider implementing caching for repeated prompts (future enhancement)
- **Async Processing**: API calls are async, don't block UI
- **Loading States**: Clear visual feedback during generation

## Development

### Adding New Quick Prompts

Edit `client/app/components/ai-document-assistant/ChatPanel.jsx`:

```javascript
const QUICK_PROMPTS = [
  { key: "summary", label: "📊 Executive Summary", prompt: "Create an executive summary..." },
  { key: "your_new_prompt", label: "🎯 Your Label", prompt: "Your prompt here..." },
  // Add more prompts...
];
```

### Customizing the System Prompt

Edit `redash/services/llm_service.py`:

```python
def _build_system_prompt(self, output_format: str) -> str:
    return """You are an expert data analyst...

    Your custom instructions here...
    """
```

### Adding New LLM Providers

1. Add provider to `LLMService` in `redash/services/llm_service.py`:

```python
def _call_your_provider(self, system_prompt: str, user_prompt: str) -> str:
    # Implement your provider logic
    pass
```

2. Update `generate_document()` to support new provider:

```python
if self.provider == "your_provider":
    document = self._call_your_provider(system_prompt, user_prompt)
```

3. Update settings documentation

### Testing

#### Frontend Testing

```bash
# Run Jest tests
yarn test

# Watch mode
yarn test:watch

# Type checking
yarn type-check
```

#### Backend Testing

```bash
# Run pytest
pytest tests/

# Test specific module
pytest tests/handlers/test_ai_document.py
```

#### Manual Testing

1. Set `LLM_PROVIDER=mock` to test without API costs
2. Use small datasets first
3. Test error scenarios (no API key, network failures, etc.)

## Troubleshooting

### Chat Bubble Not Appearing

- Check if query results exist
- Ensure `AI_DOCUMENT_ENABLED=true`
- Check browser console for errors
- Verify frontend build completed successfully

### API Errors

```
Error: LLM API key not configured
```
**Solution**: Set `LLM_API_KEY` environment variable and restart server

```
Error: Failed to generate document
```
**Solution**: Check backend logs for detailed error. Common issues:
- Invalid API key
- Rate limiting
- Network connectivity
- Model availability

### Document Not Generating

- Check backend logs: `docker compose logs server`
- Verify API key is valid
- Check LLM provider status
- Ensure row count is within limits

### PDF Export Issues

- Ensure browser allows file downloads
- Check console for JavaScript errors
- Try exporting as Markdown instead

## Future Enhancements

Potential features for future development:

- [ ] **Document History**: Store and retrieve previous generations
- [ ] **Templates**: Pre-defined document templates
- [ ] **Custom Branding**: Add company logos/headers to exports
- [ ] **Collaboration**: Share generated documents with team
- [ ] **Advanced Exports**: DOCX, HTML, PowerPoint formats
- [ ] **Visualization Inclusion**: Embed charts in documents
- [ ] **Streaming Responses**: Real-time document generation feedback
- [ ] **Multi-language Support**: Generate documents in different languages
- [ ] **Local LLM Support**: Integration with Ollama or other local models
- [ ] **Cost Tracking**: Monitor LLM API usage and costs

## Support

For issues or questions:

1. Check this documentation
2. Review backend logs
3. Check browser console for frontend errors
4. Verify configuration settings
5. Test with `LLM_PROVIDER=mock` to isolate issues

## License

This feature is part of Redash and follows the same BSD-2-Clause license.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
**Redash Version**: 25.11.0-dev
