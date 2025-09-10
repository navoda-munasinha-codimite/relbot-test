import { PRContext } from '../context_collector/context.interface';
import { GoogleDocsPromptBuilder } from './google_doc_prompt_builder';
import { LLMService } from '../llm/llm.interface';
import * as core from '@actions/core';

export interface GoogleDocsData {
  overview: string;
  release_description: string;
  impacted_areas_components: string;
  impacted_areas_main: string;
  summary_of_changes: string;
}

export class GoogleDocsDataBuilder {
  private currentDoc: string = '';
  private promptBuilder: GoogleDocsPromptBuilder;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
    this.promptBuilder = new GoogleDocsPromptBuilder();
  }

  /**
   * Generate Google Docs data from PR context
   */
  async generateReleaseData(prContext: PRContext): Promise<GoogleDocsData> {
    try {
      // Step 1: Generate initial document from template
      await this.generateInitialDocument(prContext);
      
      // Step 2: Process each commit and update document
      for (const commit of prContext.commits) {
        await this.processCommitChanges(commit, prContext);
      }
      
      // Step 3: Final optimization and cleanup
      await this.finalizeDocument();
      
      // Parse and return the JSON object
      return this.parseCurrentDocument();
    } catch (error) {
      throw new Error(`Failed to generate release data: ${error}`);
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
   * Parse the current document JSON string into GoogleDocsData object
   */
  private parseCurrentDocument(): GoogleDocsData {
    try {
      core.info('Parsing current document JSON...  jsonString: ' + this.currentDoc);
      // Extract JSON content between { and }
      const startIndex = this.currentDoc.indexOf('{');
      const endIndex = this.currentDoc.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No valid JSON object found in response');
      }
      
      const filteredJsonString = this.currentDoc.substring(startIndex, endIndex + 1);
      const parsedData = JSON.parse(filteredJsonString);
      
      // Validate that all required fields are present
      const requiredFields = ['overview', 'release_description', 'impacted_areas_components', 'impacted_areas_main', 'summary_of_changes'];
      for (const field of requiredFields) {
        if (!(field in parsedData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return {
        overview: parsedData.overview || '',
        release_description: parsedData.release_description || '',
        impacted_areas_components: parsedData.impacted_areas_components || '',
        impacted_areas_main: parsedData.impacted_areas_main || '',
        summary_of_changes: parsedData.summary_of_changes || ''
      };
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}. Response was: ${this.currentDoc}`);
    }
  }

  /**
   * Get current document state (raw JSON string)
   */
  getCurrentDocument(): string {
    return this.currentDoc;
  }

  /**
   * Get current document as parsed object
   */
  getCurrentDocumentAsObject(): GoogleDocsData | null {
    try {
      return this.parseCurrentDocument();
    } catch (error) {
      return null;
    }
  }

  /**
   * Reset document state
   */
  resetDocument(): void {
    this.currentDoc = '';
  }
}