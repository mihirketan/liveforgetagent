import { containsResetPhrase } from '../privacy/resetDetector';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class ConversationEngine {
  private epoch = 0;
  private conversation: ChatMessage[] = [];
  private activeRequest?: AbortController;

  ingest(text: string): { reset: boolean; epoch: number } {
    if (containsResetPhrase(text)) {
      return { reset: true, epoch: this.resetContext() };
    }

    const content = text.trim();
    if (content) this.conversation.push({ role: 'user', content });
    return { reset: false, epoch: this.epoch };
  }

  getMessages(): ChatMessage[] {
    return this.conversation.map((message) => ({ ...message }));
  }

  startRequest(): { epoch: number; signal: AbortSignal } {
    this.activeRequest?.abort();
    this.activeRequest = new AbortController();
    return { epoch: this.epoch, signal: this.activeRequest.signal };
  }

  addAssistantMessage(content: string, epoch: number): boolean {
    if (epoch !== this.epoch || !content.trim()) return false;
    this.conversation.push({ role: 'assistant', content: content.trim() });
    return true;
  }

  resetContext(): number {
    this.epoch += 1;
    this.activeRequest?.abort();
    this.activeRequest = undefined;
    this.conversation = [];
    return this.epoch;
  }
}
