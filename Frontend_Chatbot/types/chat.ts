export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

export interface ChatRequest {
  user_uuid: string;
  msg: string;
}

export interface ChatSuccessResponse {
  user_uuid: string;
  bot_message: string;
}

export interface ChatErrorResponse {
  user_uuid: string;
  error: string;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;

export interface ApiConfig {
  baseUrl: string;
  endpoint: string;
  maxRetries: number;
  retryDelay: number;
}
