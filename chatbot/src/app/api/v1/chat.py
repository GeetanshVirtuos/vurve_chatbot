"""
FastAPI Chat Endpoint - Hands control to LangGraph
"""
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from typing import Optional

# Import your bot and related modules
from src.orchestrator import bot
from src.logger import LOG_TYPES, logger

app = FastAPI(
    title="Chatbot API", 
    description="AI Chatbot with LangGraph Control",
    version="1.0.0"
)

class ChatRequest(BaseModel):
    user_uuid: str
    msg: str

@app.post("/talk")
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
        
        # If we reach here, the graph completed successfully
        # The actual response was already sent by the graph nodes
        logger(f"Chat workflow completed for user: {request.user_uuid}", LOG_TYPES.SUCCESS)
        
    except Exception as e:
        # Last resort error handling - shouldn't normally reach here
        logger(f"Critical error in chat workflow: {e}", LOG_TYPES.ERROR)
        
        # Set proper error response with status code AND body
        response.status_code = 500
        response.headers["content-type"] = "application/json"
        
        import json
        error_body = json.dumps({
            "status": "critical_error",
            "message": "Internal server error - graph workflow failed", 
            "user_uuid": request.user_uuid,
            "error": str(e)
        })
        
        # Set the response body 
        response.body = error_body.encode()
        
        logger("Emergency error response sent", LOG_TYPES.ERROR)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "chatbot-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
