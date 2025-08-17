export interface MarkdownDocumentCreatorInterface {
  generateReleaseNote(prContext: any): Promise<string>;
  getCurrentDocument(): string;
  resetDocument(): void;
}
