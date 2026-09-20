import { ArrowRight, BookMarked, Check, ChevronRight, ClipboardPaste, History, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { LocalNote, PageKicker, SectionRule } from '@/components/app-shell';
import { TermCard } from '@/components/term-card';
import { UnifiedInput, type UnifiedInputSubmit } from '@/components/unified-input';
import { findExactTermMatch, terms } from '@/data';

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const featured = terms.filter((term) => ['rizz', 'delulu', 'npc', 'lore'].includes(term.slug));
  const handleSubmit = ({ value, mode }: UnifiedInputSubmit) => {
    if (mode === 'decode') {
      setLocation(`/decoder?q=${encodeURIComponent(value)}`);
      return;
    }
    const found = findExactTermMatch(value);
    setLocation(found ? `/term/${found.slug}` : `/dictionary?q=${encodeURIComponent(value)}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-[#e8eee8]">
        <div className="pointer-events-none absolute -right-24 top-[-150px] h-[430px] w-[430px] rounded-full border-[70px] border-primary/10" />
        <div className="pointer-events-none absolute bottom-[-100px] left-[7%] h-[220px] w-[220px] rounded-full bg-accent/10 blur-3xl" />
        <div className="mx-auto grid max-w-[1320px] gap-14 px-5 pb-20 pt-16 sm:px-8 md:grid-cols-[1.06fr_.94fr] md:items-center md:gap-16 md:pb-28 md:pt-24">
          <div className="rise-in">
            <PageKicker>A field guide for the internet age</PageKicker>
            <h1 className="max-w-[680px] font-display text-[clamp(3.5rem,8vw,7.3rem)] font-semibold leading-[.88] tracking-[-0.065em] text-[#20313a]">
              Understand<br /><span className="text-primary">before</span> you react.
            </h1>
             <p className="mt-7 max-w-[540px] text-[17px] leading-7 text-[#40515a]">Plain-English context for the words, shorthand, and references young people use online. A small pause can make room for a better conversation.</p>
            <UnifiedInput
              value={query}
              onChange={setQuery}
              onSubmit={handleSubmit}
              inputId="home-search"
              inputTestId="input-home-search"
              submitTestId="button-home-search"
              className="mt-9 max-w-[680px]"
            />
            <div className="mt-5 flex items-center gap-2"><ShieldCheck size={15} className="text-primary" /><LocalNote>Local reference prototype · no message history by default</LocalNote></div>
          </div>
          <div className="rise-in delay-2 relative mx-auto w-full max-w-[460px]">
            <div className="rounded-[28px] border border-[#c5d5cd] bg-[#f5f5eb] p-3 shadow-[0_22px_60px_rgba(32,49,58,0.12)]">
              <div className="rounded-[20px] border border-border bg-card p-6">
                <div className="flex items-center justify-between border-b border-border pb-5">
                  <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Search size={15} /></span><span className="font-display text-lg font-semibold">Parent Decoder</span></div>
                  <span className="font-mono-custom text-[9px] uppercase tracking-[.16em] text-primary">local mode</span>
                </div>
                <div className="pt-7">
                  <div className="font-mono-custom text-[10px] uppercase tracking-[.16em] text-muted-foreground">Term found</div>
                  <div className="mt-2 flex items-end justify-between"><h2 className="font-display text-5xl font-semibold tracking-[-.05em]">delulu</h2><span className="mb-1 rounded-full bg-primary/10 px-2.5 py-1 font-mono-custom text-[9px] uppercase tracking-wider text-primary">usually playful</span></div>
                  <p className="mt-5 text-sm leading-6 text-muted-foreground">Playfully unrealistic or overly hopeful. Often used about yourself, not as a serious diagnosis.</p>
                  <div className="mt-6 rounded-xl bg-secondary/70 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Check size={14} className="text-primary" /> Context changes the tone</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Ask what they meant before deciding how it lands.</p></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-[#d7cfc2] bg-[#faf6ea] px-4 py-3 shadow-md sm:block"><div className="font-mono-custom text-[9px] uppercase tracking-wider text-muted-foreground">A calmer next step</div><div className="mt-1 font-display text-lg text-foreground">“Tell me more.”</div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 md:py-24">
        <div className="grid gap-8 md:grid-cols-[.75fr_1.25fr]">
          <div>
            <PageKicker>Start here</PageKicker>
            <h2 className="max-w-sm font-display text-4xl font-semibold leading-[.98] tracking-[-.045em]">Three ways to find your footing.</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">No account, no inbox access, and no lookup history built into this prototype. Just a reference when you need one.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Search, number: '01', title: 'Look up a term', copy: 'Search a phrase and get the plain-English version.', href: '/dictionary' },
              { icon: ClipboardPaste, number: '02', title: 'Decode a message', copy: 'Paste a short message for local matching and context.', href: '/decoder' },
              { icon: BookMarked, number: '03', title: 'Browse by feeling', copy: 'Explore categories without treating labels as proof.', href: '/dictionary' },
            ].map(({ icon: Icon, number, title, copy, href }) => (
              <Link href={href} key={number} className="focus-ring group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md" data-testid={`link-start-${number}`}>
                <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><Icon size={18} /></span><span className="font-mono-custom text-[10px] text-muted-foreground">{number}</span></div>
                <h3 className="mt-7 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{copy}</p><ArrowRight size={16} className="mt-5 text-primary transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#f4efe4]">
        <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><PageKicker>Curated collection</PageKicker><h2 className="font-display text-4xl font-semibold tracking-[-.045em]">Words with a little more to them.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">These terms are highlighted by our editorial team because their meanings shift often, not because of live popularity data or surveillance.</p></div><Link href="/dictionary" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid="link-see-all-terms">See the full dictionary <ChevronRight size={16} /></Link></div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((term, index) => <TermCard key={term.slug} term={term} index={index} />)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.25fr] md:items-start">
          <div><PageKicker>What’s new</PageKicker><h2 className="font-display text-5xl font-semibold leading-[.94] tracking-[-.05em]">Language moves.<br />The care stays.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">Our small local reference set is refreshed with the most useful context, not every passing trend.</p></div>
          <div className="divide-y divide-border border-y border-border">
            {[
              { date: 'MAY 2025', title: 'Added context for “lore” and “touch grass”', copy: 'A note on inside jokes, tone, and when a break can help.' },
              { date: 'APR 2025', title: 'Expanded “delulu” with conversation starters', copy: 'Because playful language can still deserve a curious question.' },
              { date: 'MAR 2025', title: 'Decoder now names uncertainty clearly', copy: 'A match is a starting point, not a conclusion about a person.' },
            ].map((item, index) => <div key={item.date} className={`rise-in delay-${index + 1} grid gap-3 py-5 sm:grid-cols-[110px_1fr]`}><div className="font-mono-custom text-[10px] tracking-[.13em] text-muted-foreground">{item.date}</div><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p></div></div>)}
          </div>
        </div>
        <SectionRule />
         <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:flex-row sm:items-center sm:px-8"><div><div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-primary-foreground/85"><History size={14} /> Keep the pause</div><p className="mt-2 max-w-xl font-display text-2xl leading-tight">“I want to understand what that means to you.” is a useful place to begin.</p></div><Link href="/privacy" className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-primary-foreground px-4 py-2.5 text-xs font-semibold text-primary transition hover:-translate-y-0.5" data-testid="link-home-responsible-use">Read responsible use <ArrowRight size={14} /></Link></div>
      </section>
    </div>
  );
}