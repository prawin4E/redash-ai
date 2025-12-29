"""
API handlers for AI Document Generation
"""

import logging
from flask import request
from flask_restful import Resource

from redash.services.llm_service import get_llm_service
from redash.permissions import require_permission
from redash.handlers.base import BaseResource

logger = logging.getLogger(__name__)


class AIDocumentGenerateResource(BaseResource):
    """
    Generate a document from query results using AI

    POST /api/ai-document/generate
    {
        "prompt": "Create an executive summary",
        "query_data": {
            "query_id": 123,
            "query_text": "SELECT ...",
            "columns": [...],
            "rows": [...],
            "row_count": 100
        },
        "format": "markdown"
    }
    """

    def post(self):
        """Generate a new document from query results"""
        try:
            logger.info('================================================================')
            data = request.get_json(force=True)
            logger.info(f'data==={data}')
            # Extract parameters
            prompt = data.get("prompt")
            query_data = data.get("query_data", {})
            output_format = data.get("format", "markdown")

            # Validate input
            if not prompt:
                return {"error": "Prompt is required"}, 400

            if not query_data or not query_data.get("rows"):
                return {"error": "Query data with rows is required"}, 400

            # Get LLM service
            llm_service = get_llm_service()
            logger.info(f'llm_service==={llm_service}')
            # Generate document
            result = llm_service.generate_document(
                query_data=query_data,
                prompt=prompt,
                output_format=output_format
            )
            logger.info(f'result==={result}')
            return {
                "document": result["document"],
                "format": result["format"],
                "provider": result.get("provider", "unknown"),
            }, 200

        except ValueError as e:
            logger.warning(f"Validation error in AI document generation: {str(e)}")
            return {"error": str(e)}, 400
        except Exception as e:
            logger.error(f"Error generating AI document: {str(e)}", exc_info=True)
            return {
                "error": "Failed to generate document. Please try again or contact support."
            }, 500


class AIDocumentRegenerateResource(BaseResource):
    """
    Regenerate a document with a new prompt

    POST /api/ai-document/regenerate
    {
        "document_id": 456,
        "prompt": "Create a different summary",
        "query_data": {...}
    }
    """

    def post(self):
        """Regenerate a document with new parameters"""
        try:
            data = request.get_json(force=True)
            logger.info(f'data==={data}')
            # Extract parameters
            prompt = data.get("prompt")
            query_data = data.get("query_data", {})
            output_format = data.get("format", "markdown")

            # Validate input
            if not prompt:
                return {"error": "Prompt is required"}, 400

            if not query_data or not query_data.get("rows"):
                return {"error": "Query data with rows is required"}, 400

            # Get LLM service
            llm_service = get_llm_service()
            logger.info(f'llm_service==={llm_service}')
            # Generate new document
            result = llm_service.generate_document(
                query_data=query_data,
                prompt=prompt,
                output_format=output_format
            )
            logger.info(f'result==={result}')
            return {
                "document": result["document"],
                "format": result["format"],
                "provider": result.get("provider", "unknown"),
            }, 200

        except ValueError as e:
            logger.warning(f"Validation error in AI document regeneration: {str(e)}")
            return {"error": str(e)}, 400
        except Exception as e:
            logger.error(f"Error regenerating AI document: {str(e)}", exc_info=True)
            return {
                "error": "Failed to regenerate document. Please try again or contact support."
            }, 500


class AIDocumentHistoryResource(BaseResource):
    """
    Get history of generated documents for a query

    GET /api/ai-document/history/<query_id
    """

    def get(self, query_id):
        """Get document generation history for a query"""
        # For now, return empty history
        # This can be enhanced to store and retrieve document history from database
        return {
            "query_id": query_id,
            "documents": [],
            "message": "Document history feature coming soon"
        }, 200

