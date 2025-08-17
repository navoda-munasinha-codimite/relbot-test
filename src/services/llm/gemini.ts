import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMService, LLMConfig } from './llm.interface';

export class GeminiService implements LLMService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      throw new Error('Failed to generate text');
    }
  }
}