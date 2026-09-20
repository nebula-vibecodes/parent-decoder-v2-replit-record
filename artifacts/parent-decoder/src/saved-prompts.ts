import { useCallback, useState } from 'react';

export type SavedPrompt = {
  id: string;
  text: string;
};

const SAVED_PROMPTS_KEY = 'parent-decoder:saved-prompts';
const PENDING_PROMPT_KEY = 'parent-decoder:pending-prompt';

export type PromptStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function createSavedPromptStore(storage: PromptStorage) {
  const read = (): SavedPrompt[] => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(SAVED_PROMPTS_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is SavedPrompt =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof (item as SavedPrompt).id === 'string' &&
              typeof (item as SavedPrompt).text === 'string' &&
              (item as SavedPrompt).text.trim(),
          ),
      );
    } catch {
      return [];
    }
  };
  const write = (prompts: SavedPrompt[]) => {
    try {
      storage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(prompts));
    } catch {
      // A private browsing context may deny storage. The decoder remains usable.
    }
  };
  return {
    read,
    add(text: string) {
      const trimmed = text.trim();
      if (!trimmed) return read();
      const current = read();
      if (current.some((prompt) => prompt.text === trimmed)) return current;
      let hash = 0;
      for (const character of trimmed) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
      const next = [{ id: `prompt-${hash.toString(36)}-${trimmed.length}`, text: trimmed }, ...current];
      write(next);
      return next;
    },
    remove(id: string) {
      const next = read().filter((prompt) => prompt.id !== id);
      write(next);
      return next;
    },
    clear() {
      write([]);
      return [];
    },
    queue(text: string) {
      storage.setItem(PENDING_PROMPT_KEY, text);
    },
    consume() {
      const prompt = storage.getItem(PENDING_PROMPT_KEY) ?? '';
      storage.removeItem(PENDING_PROMPT_KEY);
      return prompt;
    },
  };
}

export function readSavedPrompts(): SavedPrompt[] {
  if (!canUseStorage()) return [];
  return createSavedPromptStore(window.localStorage).read();
}

export function queuePromptForDecoder(text: string) {
  if (!canUseStorage()) return;
  try {
    createSavedPromptStore(window.localStorage).queue(text);
  } catch {
    // Reuse is optional when storage is unavailable.
  }
}

export function consumeQueuedPrompt() {
  if (!canUseStorage()) return '';
  try {
    return createSavedPromptStore(window.localStorage).consume();
  } catch {
    return '';
  }
}

export function useSavedPrompts() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>(readSavedPrompts);

  const savePrompt = useCallback((text: string) => {
    setPrompts((current) => {
      if (!canUseStorage()) return current;
      return createSavedPromptStore(window.localStorage).add(text);
    });
  }, []);

  const removePrompt = useCallback((id: string) => {
    setPrompts((current) => {
      if (!canUseStorage()) return current;
      return createSavedPromptStore(window.localStorage).remove(id);
    });
  }, []);

  const clearPrompts = useCallback(() => {
    setPrompts(() => {
      if (!canUseStorage()) return [];
      return createSavedPromptStore(window.localStorage).clear();
    });
  }, []);

  return { prompts, savePrompt, removePrompt, clearPrompts };
}