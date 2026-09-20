import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Info, MessageCircle, Quote, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { LocalNote, PageKicker, SectionRule } from '@/components/app-shell';
import { readPreviousInternalRoute } from '@/components/route-quality';
import { ReportErrorForm } from '@/components/report-form';
import { LexicalClassPill, RiskPill } from '@/components/term-card';
import { TrustNote } from '@/components/trust-note';
import { WhatShouldISay } from '@/components/what-should-i-say';
import { getTerm, terms } from '@/data';

export default function TermDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [location, setLocation] = useLocation();
  const term = getTerm(slug);
  const [copied, setCopied] = useState(false);

  if (!term) {
    return <div className="mx-auto max-w-2xl px-5 py-24 text-center"><PageKicker>Not in this edition</PageKicker><h1 className="font-display text-5xl font-semibold">We don’t have that phrase yet.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Try browsing the dictionary or paste the surrounding message into the decoder.</p><div className="mt-7 flex justify-center gap-3"><Link href="/dictionary" className="focus-ring rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-missing-dictionary">Browse dictionary</Link><Link href="/decoder" className="focus-ring rounded-full border border-border px-5 py-3 text-sm font-semibold" data-testid="link-missing-decoder">Open decoder</Link></div></div>;
  }

  const relatedEntries = term.relatedTerms
    .map((related) => terms.find((candidate) => candidate.slug === related || candidate.term.toLowerCase() === related.toLowerCase()))
    .filter((related): related is (typeof terms)[number] => Boolean(related));

  const copyConversation = async () => {
    try { await navigator.clipboard.writeText(term.parentConversationStarters.Curious); } catch { /* clipboard may be unavailable in local preview */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const closeDetail = () => {
    const previous = readPreviousInternalRoute(location);
    if (previous) window.history.back();
    else setLocation('/dictionary');
  };

  return (
    <div className="mx-auto max-w-[1160px] px-5 py-10 sm:px-8 md:py-16">
      <button type="button" onClick={closeDetail} className="focus-ring inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="button-close-term"><ArrowLeft size={15} /> Back to previous view</button>
      <div className="mt-10 grid gap-12 lg:grid-cols-[.84fr_1.16fr]">
        <div className="rise-in">
          <PageKicker>{term.categories[0]} / field note</PageKicker>
           <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-7xl font-semibold leading-none tracking-[-.065em] sm:text-8xl">{term.term}</h1>{term.pronunciation && <span className="mb-1 rounded-full border border-border bg-secondary px-3 py-1.5 font-mono-custom text-[10px] text-muted-foreground">/{term.pronunciation}/</span>}</div>
          <p className="mt-6 text-xl leading-8 text-muted-foreground">{term.definition}</p>
           <div className="mt-7 flex flex-wrap items-center gap-3"><LexicalClassPill lexicalClass={term.lexicalClass} /><RiskPill risk={term.riskLevel} /><span className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-muted-foreground">{term.partOfSpeech} · {term.currentness}</span></div>
           <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{term.lexicalDisposition}. This label describes how the record is used in Parent Decoder; it is not a claim that the term is universally current or understood.</p>
          <div className="mt-10 rounded-2xl border border-primary/15 bg-primary/[.06] p-5"><div className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck size={17} /> A useful first read</div><p className="mt-3 text-sm leading-6 text-foreground/80">{term.parentExplanation}</p></div>
        </div>
        <div className="rise-in delay-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-muted-foreground"><BookOpen size={15} className="text-primary" /> Meanings by context</div><div className="mt-5 space-y-5">{term.meaningsByContext.map((item) => <div key={item.context}><div className="text-xs font-semibold text-foreground">{item.context}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.meaning}</p></div>)}</div><SectionRule /><div className="flex items-center gap-2 text-xs font-semibold"><Info size={14} className="text-primary" /> Example usage</div><ul className="mt-4 space-y-3">{term.exampleUsage.map((example) => <li key={example} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />“{example}”</li>)}</ul></div>
        </div>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-[#c7d5cd] bg-[#e8eee8] p-6 sm:p-8"><div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-primary"><MessageCircle size={15} /> Read the room</div><h2 className="mt-4 font-display text-3xl font-semibold">The context matters.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{term.culturalCommunityContext}</p><p className="mt-4 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Origin:</span> {term.origin}</p></section>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-primary"><Quote size={15} /> A calm opener</div><button type="button" onClick={copyConversation} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid="button-copy-conversation">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button></div><p className="mt-5 font-display text-2xl leading-[1.22]">“{term.parentConversationStarters.Curious}”</p></section>
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <PageKicker>Where this shows up</PageKicker>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetaBlock label="Categories" values={term.categories} />
          <MetaBlock label="Common platforms" values={term.commonPlatforms} />
          <MetaBlock label="Age groups" values={term.ageGroups} />
          <MetaBlock label="Tone" values={term.tone} />
          <MetaBlock label="Register" values={[term.register]} />
          <MetaBlock label="Region" values={[term.region]} />
          <MetaBlock label="Generation relevance" values={[term.generationRelevance]} />
          <MetaBlock label="Lifecycle" values={[term.lifecycleStatus, term.currentness]} />
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#d7cfc2] bg-[#f4efe4] p-6 sm:p-8">
          <PageKicker>Context guidance</PageKicker>
          <h2 className="font-display text-3xl font-semibold">What to hold lightly.</h2>
          <div className="mt-6 space-y-5 text-sm leading-6">
            <div><h3 className="font-semibold text-foreground">Common harmless usage</h3><p className="mt-1 text-muted-foreground">{term.commonHarmlessUsage}</p></div>
            <div><h3 className="font-semibold text-foreground">Potentially concerning usage</h3><p className="mt-1 text-muted-foreground">{term.potentiallyConcerningUsage}</p></div>
            <div><h3 className="font-semibold text-foreground">Risk level: {term.riskLevel}</h3><p className="mt-1 text-muted-foreground">{term.riskExplanation}</p></div>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <PageKicker>Do not assume</PageKicker>
          <h2 className="font-display text-3xl font-semibold">A word is not a verdict.</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">{term.doNotAssume.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{item}</li>)}</ul>
          <div className="mt-6 border-t border-border pt-5"><h3 className="text-xs font-semibold text-foreground">Important context notes</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{term.importantContextNotes.map((item) => <li key={item}>— {item}</li>)}</ul></div>
        </section>
      </section>

      <div className="mt-10"><WhatShouldISay term={term} /></div>

      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/[.06] p-6 sm:p-8"><div className="flex items-start gap-4"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={21} /><div><h2 className="font-display text-2xl font-semibold">Every level is context guidance.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">GREEN through RED describe how carefully to read the surrounding situation. They are never a diagnosis or accusation. The presence of a term alone never proves drug use, sexual activity, grooming, self-harm, bullying, or any other behavior.</p></div></div></div>

      <div className="mt-10 grid gap-5 md:grid-cols-[1fr_.8fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><PageKicker>Editorial record</PageKicker><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-display text-2xl font-semibold">What we know about this entry.</h2><span className="rounded-full bg-secondary px-3 py-1.5 font-mono-custom text-[9px] uppercase tracking-[.12em] text-primary">{term.editorialStatus} · {term.confidenceLevel} confidence</span></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><MetaValue label="Definition source" value={term.definitionSource} /><MetaValue label="Context source" value={term.contextSource} /><MetaValue label="Source type" value={term.sourceType} /><MetaValue label="Editorial status" value={term.editorialStatus} /><MetaValue label="Review status" value={term.reviewStatus} /><MetaValue label="Reviewer" value={term.reviewer ?? 'No qualified reviewer recorded'} /><MetaValue label="Reviewer qualification" value={term.reviewerRole ?? 'Not independently reviewed'} /><MetaValue label="Confidence" value={term.confidenceLevel} /><MetaValue label="Last verified" value={term.lastVerifiedDate ?? 'No independent verification date'} /><MetaValue label="Alternate spellings" value={term.alternateSpellings.length ? term.alternateSpellings.join(', ') : 'None listed'} /><MetaValue label="Related terms" value={term.relatedTerms.join(', ')} /><MetaValue label="Synonyms" value={term.synonyms.length ? term.synonyms.join(', ') : 'None listed'} /><MetaValue label="Antonyms" value={term.antonyms.length ? term.antonyms.join(', ') : 'None listed'} /><MetaValue label="Source references" value={term.sourceReferences.length ? term.sourceReferences.map((source) => source.title).join(', ') : 'None listed'} /></dl><div className="mt-6 border-t border-border pt-5"><LocalNote>{term.prototypeVerificationStatus}</LocalNote><p className="mt-2 text-xs leading-5 text-muted-foreground">Moderate confidence means the wording is useful for a prototype conversation aid, not independently established fact. A documented source, qualified reviewer, and real review date will be named here only after independent confirmation.</p></div></section>
        <div className="flex min-w-0 flex-col gap-5"><div className="rounded-2xl border border-border bg-secondary/45 p-6"><h3 className="font-display text-2xl font-semibold">Need more context?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Paste the surrounding message into the local decoder to look for more than one phrase at a time.</p><Link href="/decoder" className="focus-ring mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid="link-term-decoder">Try this in the decoder <ArrowRight size={15} /></Link></div><ReportErrorForm recordIdentity={term.term} recordType={term.recordType} /></div>
      </div>

      <div className="mt-10"><TrustNote compact /></div>

      {relatedEntries.length > 0 && <div className="mt-14 border-t border-border pt-10"><div className="flex items-end justify-between"><div><PageKicker>Keep exploring</PageKicker><h2 className="font-display text-3xl font-semibold">Related threads</h2></div><Link href="/dictionary" className="focus-ring hidden text-xs font-semibold text-primary hover:underline sm:block" data-testid="link-related-all">All entries</Link></div><div className="mt-5 flex flex-wrap gap-3">{relatedEntries.map((related) => <Link key={related.slug} href={`/term/${related.slug}`} className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary/40 hover:bg-secondary" data-testid={`link-related-${related.slug}`}>{related.term}<ArrowRight size={14} className="text-primary" /></Link>)}</div></div>}
    </div>
  );
}

function MetaBlock({ label, values }: { label: string; values: string[] }) {
  return <div><div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">{label}</div><div className="mt-2 flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground">{value}</span>)}</div></div>;
}

function MetaValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</dt><dd className="mt-1 leading-5 text-foreground">{value}</dd></div>;
}