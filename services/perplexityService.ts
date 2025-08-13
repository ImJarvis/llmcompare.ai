import { LLMClient } from '../types';

// Based on Perplexity AI API documentation
interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityChatCompletionRequest {
  model: string;
  messages: PerplexityMessage[];
}

interface PerplexityChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: 'assistant';
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityClient implements LLMClient {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY environment variable not set.");
    }
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generateResponse(prompt: string): Promise<string> {
    const requestBody: PerplexityChatCompletionRequest = {
      model: 'sonar-pro', // A capable, online-enabled model from Perplexity
      messages: [
        { role: 'user', content: prompt },
      ],
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // Use a more specific error message if available from the API response
        const detail = errorData?.error?.message || errorData.message || response.statusText;
        throw new Error(`Perplexity API Error: ${response.status} ${detail}`);
      }

      const data: PerplexityChatCompletionResponse = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response structure from Perplexity API.');
      }
    } catch (error) {
      console.error("Error calling Perplexity API:", error);
      if (error instanceof Error) {
        return Promise.reject(new Error(error.message));
      }
      return Promise.reject(new Error("An unknown error occurred with the Perplexity API."));
    }
  }
}
