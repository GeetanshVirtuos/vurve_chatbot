export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/v1/talk',
  maxRetries: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.NEXT_PUBLIC_RETRY_DELAY || '1000', 10),
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'GiftCart Chatbot',
} as const;
