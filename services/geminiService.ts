import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LLMClient, SynthesizerResponse, LLM } from '../types';

export class GeminiClient implements LLMClient {
  private readonly ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      // Log error but don't throw here, to allow mock services to run
      console.error("API_KEY environment variable not set for Gemini.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  async generateResponse(prompt: string, systemInstruction?: string): Promise<string> {
    if (!process.env.API_KEY) {
      return Promise.reject(new Error("Gemini API Key is not configured."));
    }
    try {
      const config = systemInstruction ? { systemInstruction } : undefined;
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config,
      });
      return response.text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      if (error instanceof Error) {
        return Promise.reject(new Error(`Gemini API Error: ${error.message}`));
      }
      return Promise.reject(new Error("An unknown error occurred with the Gemini API."));
    }
  }

  async generateSummary(originalPrompt: string, responses: { model: LLM, content: string }[]): Promise<SynthesizerResponse> {
     if (!process.env.API_KEY) {
      return Promise.reject(new Error("Gemini API Key is not configured for summary."));
    }

    const assembledPrompt = `The user's original prompt was: "${originalPrompt}"\n\nHere are the responses from various AI models:\n\n${responses.map(r => `--- Response from ${r.model} ---\n${r.content}`).join('\n\n')}\n\nPlease synthesize these into a single, comprehensive, and factually accurate response.`;

    try {
      const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: assembledPrompt,
          config: {
              systemInstruction: 'You are a master synthesizer AI. Your task is to analyze the user\'s prompt and the provided responses from different AI models. Synthesize these into a single, comprehensive, and factually accurate response. Use the provided search tool to verify facts and provide the most up-to-date information. If the models disagree, highlight the discrepancies. The final output should be a consolidated, easy-to-read summary.',
              tools: [{googleSearch: {}}],
          }
      });
      const summaryText = response.text;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      return { summaryText, sources };
    } catch (error) {
      console.error("Error generating summary with Gemini:", error);
      if (error instanceof Error) {
        return Promise.reject(new Error(`Gemini Summary Error: ${error.message}`));
      }
      return Promise.reject(new Error("An unknown error occurred while generating the summary."));
    }
  }
}