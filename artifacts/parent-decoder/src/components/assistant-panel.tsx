import { Bot, Check, ChevronRight, CircleAlert, LockKeyhole, MessageCircleQuestion, RotateCcw, Send, Sparkles, WandSparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useRespondWithAssistant } from '@workspace/api-client-react';
import { LocalNote, PageKicker } from '@/components/app-shell';

type AssistantMode = 'explain' | 'chat';

type AssistantPanelProps = {
  context?: string;
};

const explainPrompts = [
  'What does this mean in this message?',
  'Could this phrase have more than one meaning?',
];

const chatPrompts = [
  'How does slang change between age groups?',
  'How can I ask about slang without sounding suspicious?',
];

export function AssistantPanel({ context }: AssistantPanelProps) {
  const [mode, setMode] = useState<AssistantMode>('explain');
  const [message, setMessage] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');
  const assistant = useRespondWithAssistant();
  const prompts = mode === 'explain' ? explainPrompts : chatPrompts;

  const submit = (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || assistant.isPending) return;
    setSubmittedMessage(trimmed);
    assistant.mutate({
      data: {
        mode,
        message: trimmed,
        ...(mode === 'explain' && context ? { context: context.slice(0, 600) } : {}),
      },
    });
  };

  const usePrompt = (prompt: string) => {
    setMessage(prompt);
    setSubmittedMessage('');
  };

  const reset = () => {
    assistant.reset();
    setSubmittedMessage('');
  };

  return (
    <section className="assistant-shell mt-8 overflow-hidden rounded-[1.5rem] border border-[#b6c8c4] bg-[#edf4f0] shadow-[0_18px_50px_rgba(24,58,57,.10)]" aria-labelledby="assistant-heading" data-testid="assistant-panel">
      <div className="relative border-b border-[#c8d9d4] bg-[#174744] px-5 py-7 text-[#f5f2e9] sm:px-8 sm:py-8">
        <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full border-[22px] border-[#ed765d]/20" aria-hidden="true" />
        <div className="absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-[#ed765d]/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.19em] text-[#f3a18e]"><WandSparkles size={14} /> Optional AI guide</div>
            <h2 id="assistant-heading" className="font-display text-4xl font-semibold leading-[.95] tracking-[-.04em] sm:text-5xl">Ask for a little more context.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#d8e4de]">A stateless assistant can explain the phrase you just read or help you think through a broader question. It offers possibilities, not a verdict.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#f5f2e9]/20 bg-[#f5f2e9]/10 px-3 py-2 text-[11px] text-[#e4eee8]">
            <LockKeyhole size={13} className="text-[#f3a18e]" />
            No chat history
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Assistant mode">
          <button type="button" role="tab" aria-selected={mode === 'explain'} onClick={() => { setMode('explain'); reset(); }} className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all ${mode === 'explain' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid="button-assistant-explain">
            <Sparkles size={14} /> Explain a message
          </button>
          <button type="button" role="tab" aria-selected={mode === 'chat'} onClick={() => { setMode('chat'); reset(); }} className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all ${mode === 'chat' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid="button-assistant-chat">
            <MessageCircleQuestion size={14} /> Ask a broader question
          </button>
        </div>

        {mode === 'explain' && context && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d7c6a5] bg-[#fff7e7] px-4 py-3 text-xs leading-5 text-[#65553e]" data-testid="assistant-local-context">
            <Check size={15} className="mt-0.5 shrink-0 text-primary" />
            <span><strong className="font-semibold text-foreground">Local decoder context attached.</strong> The assistant will use the result above as a clue, not as a conclusion.</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="assistant-message" className="sr-only">{mode === 'explain' ? 'What would you like explained?' : 'What would you like to ask?'}</label>
          <textarea id="assistant-message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1200))} placeholder={mode === 'explain' ? 'Ask what the phrase might mean in context...' : 'Ask a question about slang, tone, or starting a calm conversation...'} rows={4} className="focus-ring w-full resize-none rounded-xl border border-[#bfd0cb] bg-[#f9fbf7] p-4 text-[15px] leading-7 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10" aria-describedby="assistant-character-count" data-testid="textarea-assistant-message" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span id="assistant-character-count" className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-muted-foreground">{message.length} / 1200 characters · one request at a time</span>
            <button type="submit" disabled={!message.trim() || assistant.isPending} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ed765d] px-5 text-sm font-semibold text-[#321f22] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#f1846d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0" data-testid="button-submit-assistant">
              {assistant.isPending ? <><span className="h-4 w-4 animate-pulse rounded-full border-2 border-[#321f22]/30 border-t-[#321f22]" /> Thinking carefully...</> : <><Send size={15} /> Ask the assistant</>}
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Suggested questions">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => usePrompt(prompt)} className="focus-ring group inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#c5d5d1] bg-card px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground" data-testid={`button-assistant-prompt-${prompt.slice(0, 12).replaceAll(' ', '-').toLowerCase()}`}>
              {prompt} <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>

        {assistant.isPending && (
          <div className="mt-7 rounded-xl border border-[#c5d5d1] bg-card p-5" aria-live="polite" data-testid="assistant-loading">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><Bot size={17} /></div><div className="h-3 w-40 animate-pulse rounded-full bg-secondary" /></div>
            <div className="mt-5 space-y-2"><div className="h-3 w-full animate-pulse rounded-full bg-secondary" /><div className="h-3 w-5/6 animate-pulse rounded-full bg-secondary" /><div className="h-3 w-2/3 animate-pulse rounded-full bg-secondary" /></div>
          </div>
        )}

        {assistant.isError && !assistant.isPending && (
          <div className="mt-7 flex flex-col gap-4 rounded-xl border border-[#e1b7aa] bg-[#fff1ec] p-5 sm:flex-row sm:items-center sm:justify-between" role="alert" data-testid="assistant-error">
            <div className="flex items-start gap-3"><CircleAlert size={18} className="mt-0.5 shrink-0 text-destructive" /><div><p className="text-sm font-semibold text-foreground">The assistant could not answer right now.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your local dictionary is still available above. You can try this request again without saving anything.</p></div></div>
            <button type="button" onClick={() => submit()} disabled={!submittedMessage} className="focus-ring inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d9a99b] px-3 text-xs font-semibold text-foreground transition-colors hover:bg-[#ffe5dc]" data-testid="button-retry-assistant"><RotateCcw size={14} /> Retry</button>
          </div>
        )}

        {assistant.data && !assistant.isPending && (
          <article className="mt-7 rounded-xl border border-primary/20 bg-card p-5 shadow-sm rise-in" aria-live="polite" data-testid="assistant-response">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.15em] text-primary"><Bot size={15} /> Assistant response</div>
              <span className="rounded-full bg-secondary px-2.5 py-1 font-mono-custom text-[9px] uppercase tracking-wider text-muted-foreground">{assistant.data.mode === 'explain' ? 'contextual explanation' : 'broader conversation'}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-foreground" data-testid="text-assistant-answer">{assistant.data.answer}</p>
            <div className="mt-5 flex items-start gap-2 border-t border-border pt-4"><ShieldNote>{assistant.data.privacyNote}</ShieldNote><button type="button" onClick={reset} className="focus-ring ml-auto shrink-0 text-xs font-semibold text-primary hover:underline" data-testid="button-clear-assistant">Clear response</button></div>
          </article>
        )}

        {!assistant.data && !assistant.isPending && !assistant.isError && (
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-dashed border-[#b8cbc5] bg-[#f5faf6] p-5" data-testid="assistant-empty-state">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5c8bb] text-[#713d37]"><Bot size={17} /></div>
            <div><p className="text-sm font-semibold text-foreground">A second perspective, when you want it.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Start with one phrase or one honest question. Nothing is saved as a conversation.</p></div>
          </div>
        )}

        <div className="mt-5 flex items-start gap-2"><ShieldNote>Optional external AI · only the text you submit is sent for this one request · no account, profile, or chat history</ShieldNote></div>
      </div>
    </section>
  );
}

function ShieldNote({ children }: { children: ReactNode }) {
  return <LocalNote><LockKeyhole aria-hidden="true" size={12} className="mr-1 inline text-primary" />{children}</LocalNote>;
}