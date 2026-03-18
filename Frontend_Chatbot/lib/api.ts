import { ChatRequest, ChatResponse } from '@/types/chat';
import { config } from './config';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = config.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's an abort
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', undefined, true);
      }

      // Network errors are retryable
      if (attempt < retries) {
        const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Request failed, retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        continue;
      }
    }
  }

  throw new ApiError(
    lastError?.message || 'Network request failed',
    undefined,
    true
  );
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const url = `${config.apiBaseUrl}${config.apiEndpoint}`;
  
  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // If we can't parse JSON, use the status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status, false);
    }

    const data: ChatResponse = await response.json();
    
    // Validate response structure
    if (!data.user_uuid) {
      throw new ApiError('Invalid response format from server', 500, false);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle unexpected errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      undefined,
      true
    );
  }
}

export { ApiError };
