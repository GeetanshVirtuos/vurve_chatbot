"""
FastAPI Chat Endpoint - Hands control to LangGraph
"""
import uvicorn
from fastapi import FastAPI, Response
from src.types.api import ChatRequest, ChatResponse
from src.orchestrator import bot
from src.logger import LOG_TYPES, logger

app = FastAPI(
    title="Chatbot API", 
    description="AI Chatbot with LangGraph Control",
    version="1.0.0"
)

@app.post("/api/v1/talk")
async def talk(request: ChatRequest, response: Response):
    """
    Chat endpoint - hands full control to LangGraph workflow.
    
    The LangGraph nodes will handle:
    - Response content
    - HTTP status codes  
    - Error handling
    - Response format
    """
    
    logger(f"Received chat request from user: {request.user_uuid}", LOG_TYPES.INFORMATION)
    
    try:
        # Hand off complete control to LangGraph
        await bot.ainvoke({
            "user_uuid": request.user_uuid,
            "last_user_message": request.msg,
            "response_object": response,  # FastAPI Response object
            "data": {}
        })
        
        # If we reach here, the graph completed successfully and the actual response was already sent by the graph nodes
        logger(f"Chat workflow completed for user: {request.user_uuid}", LOG_TYPES.SUCCESS)
        
    except Exception as e:
        # Last resort error handling - shouldn't normally reach here
        logger(f"Critical error in chat workflow: {e}", LOG_TYPES.ERROR)
        
        # Use ChatResponse model for consistent error formatting
        error_response = ChatResponse(
            user_uuid=request.user_uuid,
            error=str(e)
        )
        
        # Set proper error response with status code AND body
        response.status_code = 500
        response.headers["content-type"] = "application/json"
        response.body = error_response.model_dump_json().encode()
        
        logger("Server error response sent from /talk", LOG_TYPES.ERROR)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
