"""
LLM Service for AI Document Generation

This service handles communication with various LLM providers (OpenAI, Anthropic, etc.)
to generate documents from query results.
"""

import json
import logging
from typing import Dict, List, Any, Optional

from redash import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with Large Language Models"""

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.max_rows = settings.AI_DOCUMENT_MAX_ROWS

    def generate_document(
        self,
        query_data: Dict[str, Any],
        prompt: str,
        output_format: str = "markdown"
    ) -> Dict[str, Any]:
        """
        Generate a document from query results using an LLM.

        Args:
            query_data: Dictionary containing query results with columns and rows
            prompt: User prompt describing what document to generate
            output_format: Output format (markdown, text, html)

        Returns:
            Dictionary with 'document' (generated content) and 'format' keys
        """
        if not self.api_key:
            raise ValueError(
                "LLM API key not configured. Please set LLM_API_KEY in environment variables."
            )

        # Format query data for LLM context
        context = self._format_query_data(query_data)

        # Build the prompt
        system_prompt = self._build_system_prompt(output_format)
        user_prompt = self._build_user_prompt(prompt, context)

        # Call the appropriate LLM provider
        try:
            if self.provider == "openai":
                document = self._call_openai(system_prompt, user_prompt)
            elif self.provider == "anthropic":
                document = self._call_anthropic(system_prompt, user_prompt)
            else:
                # Fallback to mock for development/testing
                document = self._generate_mock_document(query_data, prompt)

            return {
                "document": document,
                "format": output_format,
                "provider": self.provider,
            }
        except Exception as e:
            logger.error(f"Error generating document with LLM: {str(e)}")
            raise

    def _format_query_data(self, query_data: Dict[str, Any]) -> str:
        """Format query data into a readable string for LLM context"""
        columns = query_data.get("columns", [])
        rows = query_data.get("rows", [])
        query_text = query_data.get("query_text", "")

        # Limit rows to avoid token limits
        limited_rows = rows[: self.max_rows] if rows else []
        truncated = len(rows) > self.max_rows

        # Build context
        context_parts = []

        if query_text:
            context_parts.append(f"**Query:**\n```sql\n{query_text}\n```\n")

        context_parts.append(f"**Total Rows:** {len(rows)}")
        if truncated:
            context_parts.append(f"(Showing first {self.max_rows} rows)")

        # Format columns
        if columns:
            column_names = [col.get("name", col) if isinstance(col, dict) else col for col in columns]
            context_parts.append(f"\n**Columns:** {', '.join(column_names)}\n")

        # Format data as a table
        if limited_rows and columns:
            context_parts.append("**Data:**")
            context_parts.append(self._format_as_table(columns, limited_rows))

        return "\n".join(context_parts)

    def _format_as_table(self, columns: List[Any], rows: List[Any]) -> str:
        """Format data as a markdown table"""
        if not rows:
            return "No data available."

        # Extract column names
        column_names = [col.get("name", col) if isinstance(col, dict) else col for col in columns]

        # Build table
        lines = []

        # Header
        lines.append("| " + " | ".join(str(col) for col in column_names) + " |")
        lines.append("| " + " | ".join("---" for _ in column_names) + " |")

        # Rows
        for row in rows:
            if isinstance(row, dict):
                row_values = [str(row.get(col, "")) for col in column_names]
            elif isinstance(row, (list, tuple)):
                row_values = [str(val) for val in row]
            else:
                row_values = [str(row)]

            lines.append("| " + " | ".join(row_values) + " |")

        return "\n".join(lines)

    def _build_system_prompt(self, output_format: str) -> str:
        """Build the system prompt for the LLM"""
        return f"""You are an expert data analyst and technical writer. Your task is to analyze query results and generate clear, insightful documents based on the data.

Guidelines:
- Be concise and focus on key insights
- Use {output_format} formatting
- Include relevant statistics and patterns
- Structure the document logically with headers and sections
- Highlight important findings
- Make it actionable and easy to understand
- Do not include any preamble or meta-commentary, just provide the requested document content
"""

    def _build_user_prompt(self, user_prompt: str, context: str) -> str:
        """Build the user prompt with context"""
        return f"""Based on the following query results, {user_prompt}

{context}

Please generate the document now:"""

    def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenAI API"""
        try:
            import openai

            client = openai.OpenAI(api_key=self.api_key)

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            return response.choices[0].message.content
        except ImportError:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise

    def _call_anthropic(self, system_prompt: str, user_prompt: str) -> str:
        """Call Anthropic Claude API"""
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=self.api_key)

            response = client.messages.create(
                model=self.model,
                max_tokens=2000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
            )

            return response.content[0].text
        except ImportError:
            raise ImportError(
                "Anthropic package not installed. Install with: pip install anthropic"
            )
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise

    def _generate_mock_document(self, query_data: Dict[str, Any], prompt: str) -> str:
        """Generate a mock document for development/testing"""
        rows_count = len(query_data.get("rows", []))
        columns = query_data.get("columns", [])
        column_names = [col.get("name", col) if isinstance(col, dict) else col for col in columns]

        return f"""# Data Analysis Report

## Overview
This is a mock document generated for development purposes.

**User Request:** {prompt}

## Data Summary
- **Total Rows:** {rows_count}
- **Columns:** {len(columns)}
- **Column Names:** {', '.join(map(str, column_names))}

## Key Findings
1. The dataset contains {rows_count} records across {len(columns)} dimensions
2. Data includes the following attributes: {', '.join(map(str, column_names[:5]))}
3. Further analysis would provide deeper insights into trends and patterns

## Recommendations
- Review the data for completeness and accuracy
- Consider additional queries to explore specific segments
- Monitor key metrics over time for trend analysis

---

*Note: To generate AI-powered documents, configure LLM_API_KEY and LLM_PROVIDER in your environment.*
"""


# Singleton instance
_llm_service = None


def get_llm_service() -> LLMService:
    """Get or create the LLM service singleton"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
