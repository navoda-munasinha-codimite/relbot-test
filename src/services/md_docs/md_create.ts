import { PRContext } from '../context_collector/context.interface';
import { PromptBuilder } from '../prompt_builder/prompt_builder';
import { LLMService } from '../llm/llm.interface';

export class MarkdownDocumentCreator {
  private currentDoc: string = '';
  private promptBuilder: PromptBuilder;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Generate development release note from PR context
   */
  async generateReleaseNote(prContext: PRContext): Promise<string> {
    try {
      // Step 1: Generate initial document from template
      await this.generateInitialDocument(prContext);
      
      // Step 2: Process each commit and update document
      for (const commit of prContext.commits) {
        await this.processCommitChanges(commit, prContext);
      }
      
      // Step 3: Final optimization and cleanup
      await this.finalizeDocument();
      
      return this.currentDoc;
    } catch (error) {
      throw new Error(`Failed to generate release note: ${error}`);
    }
  }

  /**
   * Generate initial document from template with PR info
   */
  private async generateInitialDocument(prContext: PRContext): Promise<void> {
    const initialPrompt = this.promptBuilder.buildInitialPrompt(prContext);
    
    const response = await this.llmService.generate(initialPrompt);
    this.currentDoc = response.trim();
  }

  /**
   * Process individual commit changes and update document
   */
  private async processCommitChanges(commit: any, prContext: PRContext): Promise<void> {
    const commitPrompt = this.promptBuilder.buildCommitPrompt(this.currentDoc, commit);
    
    const response = await this.llmService.generate(commitPrompt);
    this.currentDoc = response.trim();
  }

  /**
   * Final review and optimization of the document
   */
  private async finalizeDocument(): Promise<void> {
    const finalPrompt = this.promptBuilder.buildFinalOptimizationPrompt(this.currentDoc);
    
    const response = await this.llmService.generate(finalPrompt);
    this.currentDoc = response.trim();
  }

  /**
   * Get current document state
   */
  getCurrentDocument(): string {
    return this.currentDoc;
  }

  /**
   * Reset document state
   */
  resetDocument(): void {
    this.currentDoc = '';
  }
}
