import { ArrowRight, Bookmark, BookmarkCheck, Check, Flag, Info, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { LocalNote, PageKicker } from '@/components/app-shell';
import { AssistantPanel } from '@/components/assistant-panel';
import { LexicalClassPill, RiskPill } from '@/components/term-card';
import { UnifiedInput, type UnifiedInputSubmit } from '@/components/unified-input';
import {
  analyzeMessage,
  terms,
  type DecoderAnalysis,
  type RecognizedPhrase,
} from '@/data';
import { consumeQueuedPrompt, useSavedPrompts } from '@/saved-prompts';
import { feedbackHref } from '@/feedback-links';

const sampleMessage = 'No cap, she ate that presentation. IYKYK.';

export default function Decoder() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<DecoderAnalysis | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const { prompts, savePrompt } = useSavedPrompts();

  useEffect(() => {
    const queued = consumeQueuedPrompt();
    const incomingQuery = new URLSearchParams(searchString).get('q');
    if (queued) setMessage(queued.slice(0, 600));
    else if (incomingQuery !== null) setMessage(incomingQuery.slice(0, 600));
  }, [searchString]);

  const decode = (nextMessage = message) => {
    if (!nextMessage.trim()) return;
    setMessage(nextMessage);
    setResult(null);
    setIsAnalysing(true);
    window.setTimeout(() => { setResult(analyzeMessage(nextMessage)); setIsAnalysing(false); }, 420);
  };
  const useSample = () => { setMessage(sampleMessage); setResult(null); };
  const handleUnifiedSubmit = ({ value, mode }: UnifiedInputSubmit) => {
    if (mode === 'lookup') {
      setLocation(`/dictionary?q=${encodeURIComponent(value)}`);
      return;
    }
    decode(value);
  };
  const clear = () => { setMessage(''); setResult(null); };
  const assistantContext = result
    ? `Local dictionary read for "${result.input}": ${result.matches.map((term) => `${term.term}: ${term.definition}`).join(' | ') || 'No close local match found.'}`
    : undefined;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div className="rise-in"><PageKicker>Local contextual matching</PageKicker><h1 className="font-display text-6xl font-semibold leading-[.88] tracking-[-.06em] sm:text-7xl">Bring the<br /><span className="text-primary">message.</span><br />Keep the calm.</h1></div>
        <div className="rise-in delay-1 max-w-xl lg:ml-auto"><p className="text-[17px] leading-7 text-muted-foreground">Start with the local dictionary for a private, transparent read. When you want another perspective, ask the optional AI guide to explain a phrase or talk through a broader slang question.</p><div className="mt-5 flex items-start gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" /><LocalNote>Local decoding stays in your browser · the optional assistant only receives the text you choose to submit</LocalNote></div><p className="mt-5 rounded-xl border border-primary/15 bg-primary/[.05] px-4 py-3 text-sm font-semibold leading-6 text-foreground">Parent Decoder helps you understand what you see. It does not watch your child.</p></div>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_.74fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
           <div className="flex justify-end"><button type="button" onClick={useSample} className="focus-ring text-xs font-semibold text-primary hover:underline" data-testid="button-use-sample">Use an example</button></div>
           <UnifiedInput
             value={message}
             onChange={(value) => { setMessage(value.slice(0, 600)); setResult(null); }}
             onSubmit={handleUnifiedSubmit}
             defaultMode="decode"
             isBusy={isAnalysing}
             inputId="decoder-message"
             inputTestId="textarea-decoder-message"
             submitTestId="button-decode-message"
             embedded
             className="mt-2"
           />
           <div className="mt-3 flex justify-end"><div className="flex items-center gap-3">{message && <button type="button" onClick={() => savePrompt(message)} className="focus-ring inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary hover:underline" data-testid="button-save-prompt">{prompts.some((prompt) => prompt.text === message.trim()) ? <BookmarkCheck aria-hidden="true" size={13} /> : <Bookmark aria-hidden="true" size={13} />}{prompts.some((prompt) => prompt.text === message.trim()) ? 'Saved locally' : 'Save prompt'}</button>}{message && <button type="button" onClick={clear} className="focus-ring inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" data-testid="button-clear-decoder"><RotateCcw aria-hidden="true" size={13} /> Clear</button>}</div></div>
          <div className="mt-3 flex justify-end"><Link href="/saved" className="focus-ring text-xs font-semibold text-muted-foreground hover:text-foreground">View saved prompts</Link></div>
        </section>
        <aside className="rounded-2xl border border-[#c7d5cd] bg-[#e8eee8] p-6 sm:p-7">
          <div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-primary"><Info size={15} /> Before you read</div>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight">A phrase is a clue, not a conclusion.</h2>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-[#52636a]"><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-card font-mono-custom text-[10px] text-primary">01</span>Matching looks for known terms and emoji tokens, not hidden meaning.</li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-card font-mono-custom text-[10px] text-primary">02</span>Friends, age groups, and communities use words differently.</li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-card font-mono-custom text-[10px] text-primary">03</span>Look for patterns rather than one word; if something feels urgent, talk directly and seek trusted support.</li></ul>
        </aside>
      </div>
      <AssistantPanel context={assistantContext} />
      {isAnalysing && <div className="mt-8 animate-pulse rounded-2xl border border-border bg-card p-7"><div className="h-4 w-32 rounded bg-secondary" /><div className="mt-5 h-8 w-3/4 rounded bg-secondary" /><div className="mt-4 h-4 w-full rounded bg-secondary" /></div>}
      {result && !isAnalysing && <DecodeResult analysis={result} />}
    </div>
  );
}

function DecodeResult({ analysis }: { analysis: DecoderAnalysis }) {
  const matchCount = analysis.recognizedPhrases.length;
  const highestLevelTerms = analysis.matches
    .filter((term) => term.riskLevel === analysis.riskLevel)
    .map((term) => term.term);
  const highestLevelPhrase = highestLevelTerms.length ? highestLevelTerms.join(' and ') : null;
  const sharedConversation = analysis.matches.length > 1
    ? 'Could you tell me what each phrase means in this context?'
    : analysis.probableMeaning?.parentConversationStarters.Curious ?? 'Can you tell me what you meant by that?';

  return (
    <section className="mt-8 rise-in rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-live="polite">
      <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div><PageKicker>Transparent local readout</PageKicker><h2 className="font-display text-4xl font-semibold tracking-[-.04em]">{matchCount ? `${matchCount} local match${matchCount === 1 ? '' : 'es'} to unpack` : 'No local match found'}</h2></div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1.5 font-mono-custom text-[10px] uppercase tracking-wider text-primary"><Check size={13} /> dictionary only</span>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background p-4">
        <div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">Recognized in your message</div>
        <HighlightedInput input={analysis.input} matches={analysis.recognizedPhrases} />
        {analysis.recognizedPhrases.length > 0 && <ul className="mt-3 space-y-1 text-xs leading-5 text-muted-foreground">{analysis.recognizedPhrases.map((match, index) => <li key={`${match.term.id}-${match.start}-${index}`}>{match.explanation}</li>)}</ul>}
      </div>

      {matchCount ? (
        <div className="mt-8 space-y-6">
          <div className="space-y-4" data-testid="decoder-match-cards">
            {analysis.recognizedPhrases.map((match, index) => <PhraseResultCard key={`${match.term.id}-${match.start}-${index}`} match={match} index={index} />)}
          </div>

          <section className="rounded-xl border border-primary/15 bg-primary/[.05] p-5" data-testid="decoder-shared-summary">
            <div className="flex flex-wrap items-center gap-3">
              <div><div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-primary">Overall context</div><p className="mt-2 text-sm font-semibold" data-testid="text-overall-confidence">{analysis.confidence} confidence · {analysis.riskLevel} context</p></div>
              <RiskPill risk={analysis.riskLevel} />
            </div>
            {highestLevelPhrase && <p className="mt-3 text-sm leading-6 text-muted-foreground" data-testid="text-context-driver">The overall level is driven by {highestLevelPhrase}.</p>}
          </section>

          <section className="rounded-xl border border-border bg-background p-5" data-testid="shared-conversation">
            <div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-primary">One calm next step</div>
            <h3 className="mt-2 font-display text-2xl font-semibold">What could you say?</h3>
            <p className="mt-3 text-lg leading-7 text-foreground">“{sharedConversation}”</p>
          </section>

           <p className="rounded-xl border border-primary/15 bg-primary/[.05] p-4 text-sm leading-6 text-foreground" data-testid="shared-caution"><ShieldCheck aria-hidden="true" size={15} className="mr-2 inline text-primary" />Ask about the surrounding situation before drawing conclusions. These language clues do not establish intent or safety.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-primary/30 bg-secondary/45 p-5">
          <p className="text-sm leading-6 text-muted-foreground">The local dictionary does not recognize this input confidently. That is not evidence of a problem; this prototype has no close enough local match.</p>
          {analysis.suggestions.length > 0 && <div className="mt-5"><div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">Closest local suggestions</div><div className="mt-2 flex flex-wrap gap-2">{analysis.suggestions.map((suggestion) => <Link key={suggestion.term.id} href={`/term/${suggestion.term.slug}`} className="focus-ring rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40">{suggestion.term.term}<span className="ml-1 font-normal text-muted-foreground">· {suggestion.matchKind}</span></Link>)}</div></div>}
          <Link href="/dictionary" className="focus-ring mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid="link-no-match-dictionary">Search or browse the dictionary <ArrowRight size={15} /></Link>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-secondary/35 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-primary">Something to tell us?</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Send product feedback or report a problem with a recognized entry. Your message stays out of the feedback draft.</p>
        </div>
        <Link href={feedbackHref({ sourcePath: '/decoder' })} className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90" data-testid="link-decoder-feedback"><Flag size={14} /> Send feedback</Link>
      </div>

      <details className="mt-8 border-t border-border pt-6" data-testid="details-analysis-method">
        <summary className="focus-ring cursor-pointer text-sm font-semibold"><Search aria-hidden="true" size={15} className="mr-2 inline text-primary" />How this local read works</summary>
        <ul className="mt-4 grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-3">{analysis.analysisMethod.map((item) => <li key={item} className="rounded-lg bg-secondary/50 p-3">{item}</li>)}</ul>
      </details>
      <div id="decoder-privacy-note" className="mt-5 flex items-start gap-2"><ShieldCheck aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-primary" /><LocalNote>Local read only · input is held in memory and intentionally discarded when you clear the page or leave · optional assistant requests are one-time and are not saved as chat history</LocalNote></div>
    </section>
  );
}

function PhraseResultCard({ match, index }: { match: RecognizedPhrase; index: number }) {
  const { term } = match;
  const relatedEntries = term.relatedTerms
    .map((related) => terms.find((candidate) => candidate.slug === related || candidate.term.toLowerCase() === related.toLowerCase()))
    .filter((related): related is (typeof terms)[number] => Boolean(related))
    .slice(0, 3);
  const contextClue = term.meaningsByContext[0];
  const canonicalDiffers = match.matchedText.toLowerCase() !== term.term.toLowerCase();

  return (
    <article className="rounded-xl border border-border bg-background p-5" data-testid={`card-decoder-match-${term.slug}-${index}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-primary">Recognized phrase</div>
          <p className="mt-2 font-display text-2xl font-semibold" data-testid={`text-decoder-match-${term.slug}-${index}`}>“{match.matchedText}”</p>
          <Link href={`/term/${term.slug}`} className="focus-ring mt-1 inline-block font-display text-xl font-semibold text-primary hover:underline" data-testid={`link-decoder-match-${term.slug}-${index}`}>{term.term}</Link>
          {canonicalDiffers && <p className="mt-1 text-xs text-muted-foreground">Canonical phrase: {term.term}</p>}
          {match.kind !== 'term' && <p className="mt-2 text-xs leading-5 text-muted-foreground">{match.explanation}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
           <LexicalClassPill lexicalClass={term.lexicalClass} /><RiskPill risk={term.riskLevel} />
          <Link href={feedbackHref({ recordIdentity: term.term, recordType: term.recordType, sourcePath: '/decoder' })} className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid={`link-feedback-${term.slug}-${index}`}>Report an issue</Link>
        </div>
      </div>
       <p className="mt-4 text-base leading-7 text-foreground">{term.definition}</p>
       {term.lexicalClass === 'Supporting safety/clinical terminology' && <p className="mt-3 rounded-lg border border-[#d7cfc2] bg-[#f4efe4] p-3 text-xs leading-5 text-muted-foreground">Supporting terminology only — this record is not presented as youth slang or proof of behavior.</p>}
      {contextClue && <div className="mt-4 rounded-lg bg-secondary/55 p-3 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Context clue · {contextClue.context}:</span> {contextClue.meaning}</div>}
      {term.meaningsByContext.length > 1 && <details className="mt-4 border-t border-border pt-4" data-testid={`details-secondary-${term.slug}-${index}`}><summary className="focus-ring cursor-pointer text-xs font-semibold text-primary">Show other meanings for {term.term}</summary><ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">{term.meaningsByContext.slice(1).map((meaning) => <li key={`${meaning.context}-${meaning.meaning}`}><span className="font-semibold text-foreground">{meaning.context}:</span> {meaning.meaning}</li>)}</ul></details>}
      {relatedEntries.length > 0 && <div className="mt-4 border-t border-border pt-4"><div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">Related entries</div><div className="mt-2 flex flex-wrap gap-2">{relatedEntries.map((related) => <Link key={related.id} href={`/term/${related.slug}`} className="focus-ring rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary hover:underline">{related.term}</Link>)}</div></div>}
    </article>
  );
}

function HighlightedInput({ input, matches }: { input: string; matches: RecognizedPhrase[] }) {
  if (!matches.length) return <p className="mt-2 text-sm leading-6 text-muted-foreground">{input}</p>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, index) => {
    if (match.start > cursor) parts.push(input.slice(cursor, match.start));
    parts.push(<mark key={`${match.term.id}-${match.start}-${index}`} className="rounded bg-accent/20 px-0.5 text-foreground">{input.slice(match.start, match.end)}</mark>);
    cursor = match.end;
  });
  if (cursor < input.length) parts.push(input.slice(cursor));
  return <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{parts}</p>;
}