import { google, docs_v1 } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface GoogleDocsConfig {
  credentials: {
    client_email: string;
    private_key: string;
  };
}

export interface DocumentContent {
  title: string;
  content: string;
}

export class GoogleDocsService {
  private docs: docs_v1.Docs;
  private auth: JWT;

  constructor(config: GoogleDocsConfig) {
    this.auth = new JWT({
      email: config.credentials.client_email,
      key: config.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/documents']
    });

    this.docs = google.docs({ version: 'v1', auth: this.auth });
  }

  async createDocument(content: DocumentContent): Promise<string> {
    try {
      // Create a new document
      const createResponse = await this.docs.documents.create({
        requestBody: {
          title: content.title
        }
      });

      const documentId = createResponse.data.documentId;
      if (!documentId) {
        throw new Error('Failed to create document');
      }

      // Add content to the document
      await this.addContentToDocument(documentId, content.content);

      return documentId;
    } catch (error) {
      throw new Error(`Failed to create Google Doc: ${error}`);
    }
  }

  private async addContentToDocument(documentId: string, content: string): Promise<void> {
    const requests = [
      {
        insertText: {
          location: {
            index: 1
          },
          text: content
        }
      }
    ];

    await this.docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests
      }
    });
  }

  async shareDocument(documentId: string, email: string): Promise<void> {
    const drive = google.drive({ version: 'v3', auth: this.auth });
    
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: email
      }
    });
  }

  getDocumentUrl(documentId: string): string {
    return `https://docs.google.com/document/d/${documentId}/edit`;
  }
}