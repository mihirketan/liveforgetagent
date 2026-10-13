import { describe, expect, it } from 'vitest';
import { ConversationEngine } from '../context/engine';
import { containsResetPhrase } from '../privacy/resetDetector';

describe('reset phrase detection', () => {
  it('matches phrases regardless of case and punctuation', () => {
    expect(containsResetPhrase('Please, FORGET everything I said!')).toBe(true);
    expect(containsResetPhrase('We can start over now.')).toBe(true);
  });

  it('does not match a phrase embedded in another word', () => {
    expect(containsResetPhrase('I forgot everything I said')).toBe(false);
    expect(containsResetPhrase('a restart is not a reset request')).toBe(false);
  });
});

describe('conversation privacy gate', () => {
  it('clears prior context and never stores a reset utterance', () => {
    const engine = new ConversationEngine();
    engine.ingest('My name is Alex');
    const result = engine.ingest('Forget everything I said, my name is Sam');

    expect(result.reset).toBe(true);
    expect(engine.getMessages()).toEqual([]);
  });

  it('rejects assistant responses from an earlier context epoch', () => {
    const engine = new ConversationEngine();
    const { epoch } = engine.startRequest();
    engine.resetContext();

    expect(engine.addAssistantMessage('stale response', epoch)).toBe(false);
    expect(engine.getMessages()).toEqual([]);
  });

  it('aborts an in-flight request when context is reset', () => {
    const engine = new ConversationEngine();
    const { signal } = engine.startRequest();
    engine.resetContext();

    expect(signal.aborted).toBe(true);
  });
});
