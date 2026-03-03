# Imports
import os
import httpx
import asyncio # Will be needed outside ipynb
import copy
import uuid
from typing import TypedDict
from dotenv import load_dotenv  
from langgraph.graph import StateGraph, END, START
from src.logger import LOG_TYPES, logger
from src.redis_utils import test_redis_connection, get_redis_client, store_user_message_to_redis, get_user_chat_context
load_dotenv()

if "TEST_VARIABLE" in os.environ:
    logger(".env is working", LOG_TYPES.SUCCESS)
else:    
    logger(".env is not working", LOG_TYPES.ERROR)

test_redis_connection()
redis_client = get_redis_client()

class AgentState(TypedDict):
    """State of the agent."""
    user_uuid: str
    last_user_message: str
    data: dict
    response_object: dict

async def classify_message_intent(state: AgentState) -> AgentState:
    """Classify the intent of the message."""

    new_state: AgentState = copy.deepcopy(state)
    
    try:
        store_user_message_to_redis(
            redis_client,
            state["user_uuid"], 
            state["last_user_message"], 
            "user_message"
        )

        url = os.getenv("INTENT_CLASSIFIER_API_URL")
        if not url:
            logger("Error: INTENT_CLASSIFIER_API_URL not set", LOG_TYPES.ERROR)
            new_state['data']['classification_error'] = "INTENT_CLASSIFIER_API_URL not set"
            return new_state
        
        # Prepare the payload
        logger(state["last_user_message"], LOG_TYPES.INFORMATION)
        payload = {"sentence": state["last_user_message"]}
        
        # Make the POST request
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        description = data.get("description")
        if not description:
            logger("Error: Invalid response format (missing 'description')", LOG_TYPES.ERROR)
            new_state['data']['classification_error'] = "Invalid response format"
            return new_state

        logger(f"Message: '{state['last_user_message']}' classified as: {description}", LOG_TYPES.SUCCESS)

        new_state['data']['classified_intent'] = description
        return new_state
        
    except httpx.RequestError as e:
        logger(f"API request failed: {e}", LOG_TYPES.ERROR)
        new_state['data']['classification_error'] = "API request failed"
        return new_state
    except httpx.HTTPStatusError as e:
        logger(f"API returned error status: {e.response.status_code}", LOG_TYPES.ERROR)
        new_state['data']['classification_error'] = "API request failed"
        return new_state
    except ValueError:
        logger("Response was not valid JSON", LOG_TYPES.ERROR)
        new_state['data']['classification_error'] = "Invalid JSON response"
        return new_state
    except Exception as e:
        logger(f"Unexpected error during intent classification: {e}", LOG_TYPES.ERROR)
        new_state['data']['classification_error'] = "Unexpected error during intent classification"
        return new_state

def route_after_classification(state: AgentState) -> str:
    """Route based on classification result."""
    if 'classification_error' in state['data']:
        return "error"
    
    classified_intent = state['data'].get('classified_intent')
    return classified_intent
    
async def recommend_product(state: AgentState) -> AgentState:
    """Recommend a product based on the message."""

    # Placeholder implementation
    logger(f"Recommending product for message: '{state['last_user_message']}'", LOG_TYPES.INFORMATION)
    
    try:
        # Store the bot response to Redis as well
        store_user_message_to_redis(
            redis_client,
            state["user_uuid"], 
            'Recommended Product XYZ', 
            "bot_response"
        )

        logger(f"Recommended product XYZ sent to user: '{state['user_uuid']}'", LOG_TYPES.SUCCESS)
    except Exception as e:
        logger(f"Failed to store bot response to Redis: {e}", LOG_TYPES.ERROR)
    
    return state

def send_response_to_user(state: AgentState) -> AgentState:
    """Send a response back to the user."""
    # Placeholder implementation
    logger(f"Response sent to user, ending the conversation.", LOG_TYPES.INFORMATION)
    return copy.deepcopy(state)

graph = StateGraph(AgentState)
graph.add_node("intent_classifier", classify_message_intent)
graph.add_node("product_recommender", recommend_product)
graph.add_node("send_response_to_user", send_response_to_user)

graph.add_edge(START, "intent_classifier")
graph.add_conditional_edges(
    "intent_classifier",
    route_after_classification,
    {
        "Product recommendation": "product_recommender",
        "error": "send_response_to_user"
    }
)
graph.add_edge("product_recommender", "send_response_to_user")
graph.add_edge("send_response_to_user", END)

bot = graph.compile()

if __name__ == "__main__":
    # Test the chatbot with proper user session
    # test_user_uuid = str(uuid.uuid4())
    test_user_uuid = "e2ae5050-44b7-4e44-badc-7c48c799ac96" # Using a fixed UUID for testing
    logger(f"Testing with user UUID: {test_user_uuid}", LOG_TYPES.INFORMATION)

    input = {
        "user_uuid": test_user_uuid,
        "last_user_message": "I want a ring for my girlfriend",
        "data": {}
    }

    result = asyncio.run(bot.ainvoke(input))
    logger(f"Bot result: {result}", LOG_TYPES.INFORMATION)

    # Get chat context after interaction
    context = get_user_chat_context(redis_client, test_user_uuid)
    logger(f"Chat context after interaction:", LOG_TYPES.INFORMATION)
    for message in context:
        logger(f"  {message}", LOG_TYPES.INFORMATION)