import { ArrowRight, BookOpen, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { LocalNote, PageKicker } from '@/components/app-shell';
import { TermCard } from '@/components/term-card';
import { TrustNote } from '@/components/trust-note';
import { UnifiedInput, type UnifiedInputSubmit } from '@/components/unified-input';
import { categories, contextLevels, lexicalClassDetails, risks, searchTermResults, terms, termsForScope, type Category, type ContextLevel, type TermSearchResult, type TermSearchScope } from '@/data';

const editorialShelves = [
  {
    title: 'Short forms and shorthand',
    description: 'Useful starting points when a message is mostly initials.',
    slugs: ['brb', 'idk', 'tbh', 'wyd'],
  },
  {
    title: 'Meaning changes by setting',
    description: 'The same letters can mean something different in another community.',
    slugs: ['dm', 'op', 'rn', 'otp'],
  },
  {
    title: 'Trend-shaped language',
    description: 'A curated shelf in this edition, not a live popularity ranking.',
    slugs: ['delulu', 'brainrot', 'sigma', 'aura'],
  },
];

function discoveryNote(result: TermSearchResult, query: string) {
  if (result.matchKind === 'alias') return `Also written “${result.matchedText}”`;
  if (result.matchKind === 'typo') return `Close spelling match for “${query}”`;
  if (result.matchKind === 'related') return `Related term: ${result.matchedText}`;
  if (result.matchKind === 'meaning') return 'Found in the plain-English meaning';
  if (result.matchKind === 'example') return 'Found in an example';
  return undefined;
}

export default function Dictionary() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [risk, setRisk] = useState<ContextLevel | 'All'>('All');
  const [lexicalScope, setLexicalScope] = useState<Extract<TermSearchScope, 'primary' | 'supporting' | 'guides' | 'held'>>('primary');
  const categoryFromPath = location.startsWith('/library/')
    ? categories.find((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decodeURIComponent(location.slice('/library/'.length)))
    : undefined;
  const filtered = useMemo(() => searchTermResults(query, lexicalScope).filter(({ term }) => (
    (category === 'All' || term.categories.includes(category)) && (risk === 'All' || term.riskLevel === risk)
  )), [query, lexicalScope, category, risk]);
  const browseSuggestions = useMemo(() => termsForScope(lexicalScope).filter((term) => (
    (category === 'All' || term.categories.includes(category)) &&
    (risk === 'All' || term.riskLevel === risk)
  )).slice(0, 4), [lexicalScope, category, risk]);

  const clearFilters = () => { setQuery(''); setCategory('All'); setRisk('All'); setLexicalScope('primary'); };
  const isFiltered = query.length > 0 || category !== 'All' || risk !== 'All' || lexicalScope !== 'primary';
  const displayedLexicalClass = lexicalScope === 'primary'
    ? 'Slang or informal expression'
    : lexicalScope === 'supporting'
      ? 'Supporting safety/clinical terminology'
      : lexicalScope === 'guides'
        ? 'Parent guide'
        : 'Held for verification';
  const handleUnifiedSubmit = ({ value, mode }: UnifiedInputSubmit) => {
    if (mode === 'decode') {
      setLocation(`/decoder?q=${encodeURIComponent(value)}`);
      return;
    }
    setQuery(value);
  };
  useEffect(() => {
    const incomingQuery = new URLSearchParams(searchString).get('q');
    if (incomingQuery !== null) setQuery(incomingQuery);
  }, [searchString]);
  useEffect(() => {
    if (categoryFromPath) setCategory(categoryFromPath);
    else if (location === '/dictionary' || location === '/library') setCategory('All');
  }, [categoryFromPath, location]);
  return (
    <div className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 md:py-20">
      <div className="grid gap-10 md:grid-cols-[.7fr_1.3fr] md:items-end">
        <div className="rise-in"><PageKicker>The reference shelf</PageKicker><h1 className="font-display text-6xl font-semibold leading-[.9] tracking-[-.06em]">A dictionary<br />for the <span className="text-primary">in-between.</span></h1></div>
        <div className="rise-in delay-1 flex max-w-2xl flex-col gap-3 md:ml-auto"><p className="max-w-xl text-[17px] leading-7 text-muted-foreground">Search a word, browse a category, or follow a related thread. Every entry is a starting point for context — not a label to stick on someone.</p><LocalNote>Local reference set · illustrative examples · reviewed for plain language</LocalNote></div>
      </div>
       <div className="mt-12 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
         <UnifiedInput
           value={query}
           onChange={setQuery}
           onSubmit={handleUnifiedSubmit}
           inputId="dictionary-search"
           inputTestId="input-dictionary-search"
           submitTestId="button-dictionary-submit"
           embedded
         />
         {query && <button type="button" onClick={() => setQuery('')} className="focus-ring mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground" aria-label="Clear search" data-testid="button-clear-search"><X aria-hidden="true" size={14} /> Clear input</button>}
         <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row">
             <label className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${lexicalScope !== 'primary' ? 'border-primary bg-primary/5 text-primary' : 'border-input bg-background'}`}><BookOpen size={15} className={lexicalScope !== 'primary' ? 'text-primary' : 'text-muted-foreground'} /><span className="sr-only">Lexical collection</span><select value={lexicalScope} onChange={(event) => setLexicalScope(event.target.value as typeof lexicalScope)} className="bg-transparent pr-5 outline-none font-medium" data-testid="select-lexical-class"><option value="primary">Primary dictionary</option><option value="supporting">Supporting terminology</option><option value="guides">Parent guides</option><option value="held">Held for verification</option></select></label>
            <label className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${category !== 'All' ? 'border-primary bg-primary/5 text-primary' : 'border-input bg-background'}`}><SlidersHorizontal size={15} className={category !== 'All' ? 'text-primary' : 'text-muted-foreground'} /><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value as Category | 'All')} className="bg-transparent pr-5 outline-none font-medium" data-testid="select-category"><option value="All">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
             <label className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${risk !== 'All' ? 'border-primary bg-primary/5 text-primary' : 'border-input bg-background'}`}><Filter size={15} className={risk !== 'All' ? 'text-primary' : 'text-muted-foreground'} /><span className="sr-only">Context level</span><select value={risk} onChange={(event) => setRisk(event.target.value as ContextLevel | 'All')} className="bg-transparent pr-5 outline-none font-medium" data-testid="select-risk"><option value="All">All context levels</option>{risks.map((item) => <option key={item} value={item}>{item} · {contextLevels[item].label}</option>)}</select></label>
           </div>
         </div>
          <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[.04] px-4 py-3 text-sm leading-6 text-muted-foreground" aria-live="polite"><span className="font-semibold text-foreground">{lexicalClassDetails[displayedLexicalClass].label}:</span> {lexicalClassDetails[displayedLexicalClass].description}</div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><span className="mr-1 font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground" data-testid="text-result-count">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>{query && <button type="button" onClick={() => setQuery('')} className="focus-ring inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">Search: “{query}” <X size={12} /></button>}{category !== 'All' && <button type="button" onClick={() => setCategory('All')} className="focus-ring inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Category: {category} <X size={12} /></button>}{risk !== 'All' && <button type="button" onClick={() => setRisk('All')} className="focus-ring inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{risk} · {contextLevels[risk].label} <X size={12} /></button>}</div>{isFiltered && <button type="button" onClick={clearFilters} className="focus-ring shrink-0 text-left text-xs font-semibold text-primary hover:underline" data-testid="button-clear-filters">Clear all filters</button>}</div>
      </div>
       <section className="mt-5" aria-labelledby="browse-category-heading"><div className="flex items-baseline justify-between gap-4"><h2 id="browse-category-heading" className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">Browse by category</h2>{category !== 'All' && <Link href="/library" className="focus-ring text-xs font-semibold text-primary hover:underline">Show all</Link>}</div><div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap">{categories.map((item) => { const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-'); return <Link href={`/library/${slug}`} key={item} aria-current={category === item ? 'page' : undefined} className={`focus-ring flex min-h-11 shrink-0 items-center rounded-full border px-3 py-2 text-xs font-medium transition ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground'}`}>{item} <span className="ml-1">{terms.filter((term) => term.categories.includes(item)).length}</span></Link>; })}</div></section>
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Context level guidance">
        {risks.map((level) => <div key={level} className="rounded-xl border border-border bg-card px-3 py-3"><div className="font-mono-custom text-[10px] font-semibold tracking-[.12em] text-primary">{level} · {contextLevels[level].label}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{contextLevels[level].guidance}</p></div>)}
      </div>
      {!isFiltered && <section className="mt-8 rounded-2xl border border-border bg-secondary/35 p-5 sm:p-6" aria-labelledby="editorial-shelves-heading"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><PageKicker>Browse this edition</PageKicker><h2 id="editorial-shelves-heading" className="font-display text-3xl font-semibold">Curated starting points.</h2></div><LocalNote>Editorial shelves · no live tracking or popularity data</LocalNote></div><div className="mt-5 grid gap-3 lg:grid-cols-3">{editorialShelves.map((shelf) => <div key={shelf.title} className="rounded-xl border border-border bg-card p-4"><h3 className="text-sm font-semibold">{shelf.title}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{shelf.description}</p><div className="mt-4 flex flex-wrap gap-2">{shelf.slugs.map((slug) => { const term = terms.find((item) => item.slug === slug); return term ? <Link key={slug} href={`/term/${slug}`} className="focus-ring rounded-full bg-secondary px-2.5 py-1.5 text-xs font-semibold text-primary hover:underline">{term.term}</Link> : null; })}</div></div>)}</div></section>}
       {filtered.length > 0 ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((result, index) => <TermCard key={result.term.slug} term={result.term} index={index} discoveryNote={query ? discoveryNote(result, query) : undefined} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-secondary/40 px-6 py-12 text-center sm:px-10"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-card text-primary"><Search size={20} /></div><h2 className="mt-5 font-display text-3xl font-semibold">No matching entry in this edition.</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">We won’t guess at a meaning. Try a shorter spelling, remove a filter, or use the decoder to check the surrounding message against the local dictionary.</p>{browseSuggestions.length > 0 && <div className="mx-auto mt-6 max-w-xl"><div className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">Browse within the selected filters</div><div className="mt-3 flex flex-wrap justify-center gap-2">{browseSuggestions.map((term) => <Link key={term.slug} href={`/term/${term.slug}`} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40">{term.term}<ArrowRight size={12} className="text-primary" /></Link>)}</div></div>}<div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={clearFilters} className="focus-ring rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-background" data-testid="button-empty-clear">Reset search and filters</button><Link href="/decoder" className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground" data-testid="link-empty-decoder"><BookOpen size={14} /> Open decoder</Link></div></div>}
       <div className="mt-16"><TrustNote compact /></div>
       <div className="mt-8 border-t border-border pt-6"><LocalNote><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Meanings shift by community, age, platform, and tone. When in doubt, ask.</span></LocalNote></div>
    </div>
  );
}