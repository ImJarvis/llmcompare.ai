import { LLM, LLMClient, SynthesizerResponse } from '../types';
import { GeminiClient } from './geminiService';
import { PerplexityClient } from './perplexityService';
import { createDynamicMockClient } from './mockLlmService';

class LLMManager {
  private clients: Map<LLM, LLMClient>;
  private geminiClient: GeminiClient;

  constructor() {
    this.clients = new Map();
    this.geminiClient = new GeminiClient();
    this.registerClients();
  }

  private registerClients(): void {
    // Real Gemini Client
    this.clients.set(LLM.Gemini, this.geminiClient);

    // Dynamic, Gemini-powered simulators for other models
    this.clients.set(LLM.ChatGPT, createDynamicMockClient(
        this.geminiClient,
        "You are acting as a helpful assistant named ChatGPT. Provide a detailed, conversational answer. Excel at creative writing, complex problem-solving, and generating human-like text across a wide variety of topics. Your strength lies in understanding context and nuance."
    ));
    this.clients.set(LLM.Copilot, createDynamicMockClient(
        this.geminiClient,
        "You are acting as a helpful assistant named Copilot. You specialize in code generation, completion, and explanation. If the prompt is about code, provide code examples. Otherwise, answer concisely and efficiently, focusing on technical accuracy."
    ));
    
    // Perplexity Client: Use real API if key is provided, otherwise fallback to mock
    if (process.env.PERPLEXITY_API_KEY) {
        try {
            this.clients.set(LLM.Perplexity, new PerplexityClient());
            console.log("Initialized real Perplexity client.");
        } catch (error) {
            console.error("Failed to initialize PerplexityClient, falling back to mock:", error);
            this.registerMockPerplexity();
        }
    } else {
        console.log("PERPLEXITY_API_KEY not found, using mock Perplexity client.");
        this.registerMockPerplexity();
    }
  }

  private registerMockPerplexity(): void {
    this.clients.set(LLM.Perplexity, createDynamicMockClient(
        this.geminiClient,
        "You are acting as a conversational search engine named Perplexity. Provide direct, accurate, and factual answers. Keep responses concise and to the point. Mimic providing citations, but do not make up URLs unless you can verify them."
    ));
  }

  public getClient(model: LLM): LLMClient | undefined {
    return this.clients.get(model);
  }

  public generateAllResponses(prompt: string): Promise<string>[] {
    // The order must match MODEL_CONFIGS in constants.tsx
    const orderedModels = [LLM.Gemini, LLM.ChatGPT, LLM.Copilot, LLM.Perplexity];
    
    return orderedModels.map(model => {
        const client = this.getClient(model);
        if (client) {
            return client.generateResponse(prompt);
        }
        // Return a rejected promise if a client isn't found, so Promise.allSettled works correctly.
        return Promise.reject(new Error(`Client for ${model} not found.`));
    });
  }

  public generateSummary(originalPrompt: string, responses: { model: LLM, content: string }[]): Promise<SynthesizerResponse> {
    return this.geminiClient.generateSummary(originalPrompt, responses);
  }
}

export const llmManager = new LLMManager();
