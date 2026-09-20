import { ChevronDown, MessageCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { Term, ConversationStarters } from '@/data';

type Guidance = {
  why: string;
  avoid: string;
  followUp: string;
  serious: string;
};

const styleNotes: Record<keyof ConversationStarters, Omit<Guidance, 'followUp' | 'serious'>> = {
  Curious: {
    why: 'It asks for meaning without assuming intent, so the other person can add their own context.',
    avoid: 'Avoid leading with a label or asking them to prove a conclusion.',
  },
  Casual: {
    why: 'It keeps the conversation low-pressure and makes learning the phrase feel ordinary.',
    avoid: 'Avoid teasing them for using language you do not recognize.',
  },
  Concerned: {
    why: 'It names your concern while leaving room for the person to explain what happened.',
    avoid: 'Avoid turning a context question into a search of their private messages.',
  },
  Serious: {
    why: 'It makes support and safety clear without blaming the person for someone else’s behavior.',
    avoid: 'Avoid threats, public accusations, or demanding an immediate perfect explanation.',
  },
};

function guidanceFor(term: Term, style: keyof ConversationStarters): Guidance {
  const isHighConcern = term.riskLevel === 'ORANGE' || term.riskLevel === 'RED';
  return {
    ...styleNotes[style],
    followUp: term.parentConversationStarters[style],
    serious: isHighConcern
      ? `Take it more seriously if this is connected to ${term.potentiallyConcerningUsage.toLowerCase()}`
      : `Take it more seriously if you notice ${term.potentiallyConcerningUsage.toLowerCase()}`,
  };
}

export function WhatShouldISay({ term }: { term: Term }) {
  const [openStyle, setOpenStyle] = useState<keyof ConversationStarters>('Curious');
  const styles = Object.keys(term.parentConversationStarters) as (keyof ConversationStarters)[];
  const selected = guidanceFor(term, openStyle);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><div className="mb-4 flex items-center gap-2 font-mono-custom text-[10px] font-medium uppercase tracking-[0.19em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Communication, not interrogation</div><h2 className="font-display text-3xl font-semibold">What should I say?</h2></div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">Choose the temperature that fits your relationship and the moment.</p>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-4">
        {styles.map((style) => <button key={style} type="button" onClick={() => setOpenStyle(style)} className={`focus-ring flex items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${openStyle === style ? 'border-primary bg-secondary text-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`} aria-pressed={openStyle === style} data-testid={`button-say-${style.toLowerCase()}`}><span>{style}</span><ChevronDown size={14} className={`transition ${openStyle === style ? 'rotate-180 text-primary' : ''}`} /></button>)}
      </div>
      <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[.05] p-5" aria-live="polite">
        <div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.14em] text-primary"><MessageCircle size={14} /> {openStyle} opener</div>
        <p className="mt-3 font-display text-2xl leading-[1.2]">“{term.parentConversationStarters[openStyle]}”</p>
        <div className="mt-6 grid gap-5 border-t border-primary/10 pt-5 text-sm leading-6 sm:grid-cols-2">
          <div><h3 className="font-semibold text-foreground">Why it works</h3><p className="mt-1 text-muted-foreground">{selected.why}</p></div>
          <div><h3 className="font-semibold text-foreground">What to avoid</h3><p className="mt-1 text-muted-foreground">{selected.avoid}</p></div>
          <div><h3 className="font-semibold text-foreground">A follow-up question</h3><p className="mt-1 text-muted-foreground">“{selected.followUp}”</p></div>
          <div><h3 className="font-semibold text-foreground">When to take it more seriously</h3><p className="mt-1 text-muted-foreground">{selected.serious}.</p></div>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />Stay with the person’s own words. This term alone does not establish a problem.</div>
    </section>
  );
}