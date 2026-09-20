import { ArrowRight, ClipboardPaste, Search } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';

export type InputMode = 'auto' | 'lookup' | 'decode';
export type ResolvedInputMode = Exclude<InputMode, 'auto'>;

export type UnifiedInputSubmit = {
  value: string;
  mode: ResolvedInputMode;
};

type UnifiedInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (submission: UnifiedInputSubmit) => void;
  defaultMode?: InputMode;
  isBusy?: boolean;
  maxLength?: number;
  inputId?: string;
  inputTestId?: string;
  submitTestId?: string;
  className?: string;
  embedded?: boolean;
};

const modeLabels: Record<InputMode, string> = {
  auto: 'Auto-detect',
  lookup: 'Look up term',
  decode: 'Decode message',
};

function classifyInput(value: string): ResolvedInputMode {
  const trimmed = value.trim();
  if (!trimmed) return 'lookup';

  const wordCount = trimmed.split(/\s+/).length;
  const hasSentencePunctuation = /[.!?]/u.test(trimmed);
  const looksLikeMessage =
    trimmed.length > 80 ||
    wordCount > 8 ||
    (hasSentencePunctuation && wordCount >= 5);

  return looksLikeMessage ? 'decode' : 'lookup';
}

export function classifyUnifiedInput(value: string): ResolvedInputMode {
  return classifyInput(value);
}

function detectionMessage(value: string, mode: InputMode, resolvedMode: ResolvedInputMode) {
  if (!value.trim()) return 'Auto-detect is ready. You can choose an action before submitting.';
  if (mode === 'lookup') return 'Lookup mode will search the local dictionary for this term or phrase.';
  if (mode === 'decode') return 'Decode mode will read the whole message against the local dictionary.';
  return resolvedMode === 'lookup'
    ? 'This looks like a term or short phrase, so Auto-detect will search the dictionary. Choose Decode message to read it as a full message.'
    : 'This looks like a longer message, so Auto-detect will decode it locally. Choose Look up term if you want a dictionary search instead.';
}

export function UnifiedInput({
  value,
  onChange,
  onSubmit,
  defaultMode = 'auto',
  isBusy = false,
  maxLength = 600,
  inputId = 'unified-input',
  inputTestId = 'input-unified',
  submitTestId = 'button-unified-submit',
  className = '',
  embedded = false,
}: UnifiedInputProps) {
  const [mode, setMode] = useState<InputMode>(defaultMode);
  const resolvedMode = useMemo(
    () => (mode === 'auto' ? classifyInput(value) : mode),
    [mode, value],
  );
  const helperId = `${inputId}-helper`;
  const statusId = `${inputId}-status`;
  const countId = `${inputId}-count`;
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isBusy) return;
    onSubmit({ value: trimmed, mode: resolvedMode });
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className={`${embedded ? 'rounded-none border-0 bg-transparent p-0 shadow-none' : 'rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5'} ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-semibold">
            <Search aria-hidden="true" size={16} className="text-primary" />
            Search or decode
          </label>
          <p id={helperId} className="mt-1 text-xs leading-5 text-muted-foreground">
            Search a term or paste a message to decode.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/45 p-1" role="group" aria-label="Choose an input action">
          {(Object.keys(modeLabels) as InputMode[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`focus-ring min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors ${mode === option ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}
              data-testid={`button-input-mode-${option}`}
            >
              {modeLabels[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex min-h-[58px] flex-1 items-stretch rounded-xl border border-input bg-background transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <textarea
            id={inputId}
            value={value}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try a term, emoji, or longer message..."
            rows={1}
            className="focus-ring min-h-[58px] min-w-0 flex-1 resize-none bg-transparent px-4 py-4 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
            aria-label="Search a term or paste a message to decode"
            aria-describedby={`${helperId} ${statusId} ${countId}`}
            data-testid={inputTestId}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || isBusy}
          className="focus-ring inline-flex min-h-[58px] shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:min-w-[170px]"
          data-testid={submitTestId}
        >
          {isBusy ? (
            <>
              <span className="h-4 w-4 animate-pulse rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Reading locally...
            </>
          ) : (
            <>
              {resolvedMode === 'lookup' ? <Search aria-hidden="true" size={16} /> : <ClipboardPaste aria-hidden="true" size={16} />}
              {modeLabels[resolvedMode]}
              <ArrowRight aria-hidden="true" size={16} />
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p id={statusId} data-testid="text-input-detection" className="leading-5 text-muted-foreground" aria-live="polite">
          {detectionMessage(value, mode, resolvedMode)}
        </p>
        <span id={countId} data-testid={`text-${inputId}-count`} className="shrink-0 font-mono-custom text-[10px] uppercase tracking-wider text-muted-foreground">
          {value.length} / {maxLength} characters · Enter to submit · Shift+Enter for a line break
        </span>
      </div>
    </div>
  );
}