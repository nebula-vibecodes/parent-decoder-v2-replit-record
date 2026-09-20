import { MessageCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { LocalNote, PageKicker } from '@/components/app-shell';
import type { ConversationStarters } from '@/data';

const modes: Array<{
  key: keyof ConversationStarters;
  summary: string;
  prompt: string;
}> = [
  {
    key: 'Curious',
    summary: 'When you want to understand the phrase without assuming intent.',
    prompt: 'What does that phrase mean in your group?',
  },
  {
    key: 'Casual',
    summary: 'When a low-pressure question will keep the moment ordinary.',
    prompt: 'I may be missing the context — can you walk me through it?',
  },
  {
    key: 'Concerned',
    summary: 'When you noticed something that deserves a gentle check-in.',
    prompt: 'How did that message make you feel?',
  },
  {
    key: 'Serious',
    summary: 'When safety or support needs to be named clearly.',
    prompt: 'Is there anything you want help with right now?',
  },
];

export default function ConversationStarters() {
  const [selected, setSelected] = useState<keyof ConversationStarters>('Curious');
  const mode = modes.find((item) => item.key === selected) ?? modes[0];
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 md:py-20">
      <PageKicker>Communication, not interrogation</PageKicker>
      <div className="grid gap-8 md:grid-cols-[1fr_.85fr] md:items-end">
        <div>
          <h1 className="font-display text-6xl font-semibold leading-[.9] tracking-[-.06em] sm:text-7xl">
            Start with<br /><span className="text-primary">room to answer.</span>
          </h1>
        </div>
        <p className="text-[17px] leading-7 text-muted-foreground">
          Four conversation modes for asking about language without turning a phrase into a verdict.
        </p>
      </div>
      <section className="mt-12 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8" aria-labelledby="conversation-modes-heading">
        <div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-primary">
          <MessageCircle size={15} /> Choose a mode
        </div>
        <h2 id="conversation-modes-heading" className="mt-4 font-display text-3xl font-semibold">What fits this moment?</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {modes.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelected(item.key)}
              aria-pressed={selected === item.key}
              className={`focus-ring rounded-xl border p-4 text-left transition ${selected === item.key ? 'border-primary bg-secondary' : 'border-border bg-background hover:border-primary/40'}`}
              data-testid={`button-conversation-${item.key.toLowerCase()}`}
            >
              <span className="text-sm font-semibold">{item.key}</span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.summary}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-primary/15 bg-primary/[.05] p-5" aria-live="polite">
          <div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-primary">{mode.key} opener</div>
          <p className="mt-3 font-display text-2xl leading-tight">“{mode.prompt}”</p>
        </div>
      </section>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6">
          <PageKicker>Keep the context</PageKicker>
          <h2 className="font-display text-3xl font-semibold">Ask, then listen.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The same phrase can be playful, awkward, or hurtful depending on the relationship and moment. Ask what the person meant before deciding how it lands.</p>
        </section>
        <section className="rounded-2xl border border-[#c7d5cd] bg-[#e8eee8] p-6">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={18} /><p className="text-sm leading-6 text-muted-foreground">Avoid searching private messages, public accusations, or demanding a perfect explanation. If someone may be unsafe, put the dictionary down and contact trusted local support.</p></div>
        </section>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/decoder" className="focus-ring rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Open the local decoder</Link>
        <Link href="/approach" className="focus-ring rounded-full border border-border px-5 py-3 text-sm font-semibold">Read the responsible-use approach</Link>
      </div>
      <div className="mt-8"><LocalNote>These are conversation aids, not scripts for surveillance or conclusions.</LocalNote></div>
    </div>
  );
}