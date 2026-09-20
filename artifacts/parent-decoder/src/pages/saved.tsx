import { Bookmark, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { LocalNote, PageKicker } from '@/components/app-shell';
import { queuePromptForDecoder, useSavedPrompts } from '@/saved-prompts';

export default function Saved() {
  const [, setLocation] = useLocation();
  const { prompts, removePrompt, clearPrompts } = useSavedPrompts();

  const reuse = (text: string) => {
    queuePromptForDecoder(text);
    setLocation('/decoder');
  };

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8 md:py-20">
      <PageKicker>Your local shelf</PageKicker>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-6xl font-semibold leading-[.9] tracking-[-.06em]">Saved<br /><span className="text-primary">prompts.</span></h1>
          <p className="mt-5 max-w-xl text-[17px] leading-7 text-muted-foreground">Only prompts you deliberately save appear here. They stay in this browser and are never sent to an account, cloud archive, analytics service, or Parent Decoder server.</p>
        </div>
        {prompts.length > 0 && <button type="button" onClick={clearPrompts} className="focus-ring inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid="button-clear-saved"><Trash2 size={14} /> Clear all</button>}
      </div>
      <div className="mt-10 rounded-2xl border border-primary/15 bg-primary/[.05] p-5">
        <div className="flex items-start gap-3"><Bookmark className="mt-0.5 shrink-0 text-primary" size={18} /><div><h2 className="text-sm font-semibold">Explicitly saved, browser-local only</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Decoder text is temporary unless you choose Save prompt. Saved prompts can be removed individually or cleared all at once.</p></div></div>
      </div>
      {prompts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-secondary/35 px-6 py-14 text-center">
          <h2 className="font-display text-3xl font-semibold">Nothing saved yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Use the decoder, then choose Save prompt when you want to keep a local copy for reuse.</p>
          <Link href="/decoder" className="focus-ring mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Open decoder</Link>
        </div>
      ) : (
        <section className="mt-8 space-y-3" aria-labelledby="saved-prompts-heading">
          <h2 id="saved-prompts-heading" className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-muted-foreground">{prompts.length} saved {prompts.length === 1 ? 'prompt' : 'prompts'}</h2>
          {prompts.map((prompt) => (
            <article key={prompt.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{prompt.text}</p>
              <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
                <button type="button" onClick={() => reuse(prompt.text)} className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground" data-testid={`button-reuse-${prompt.id}`}><RotateCcw size={13} /> Reuse in decoder</button>
                <button type="button" onClick={() => removePrompt(prompt.id)} className="focus-ring inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid={`button-remove-${prompt.id}`}><Trash2 size={13} /> Remove</button>
              </div>
            </article>
          ))}
        </section>
      )}
      <div className="mt-8"><LocalNote>Saved prompts are stored only in this browser’s local storage. This page does not create an account or transmit text.</LocalNote></div>
    </div>
  );
}