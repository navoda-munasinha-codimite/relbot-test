export interface LLMService {
  generate(prompt: string): Promise<string>;
}

export interface LLMConfig {
  apiKey: string;
  model: string;
}