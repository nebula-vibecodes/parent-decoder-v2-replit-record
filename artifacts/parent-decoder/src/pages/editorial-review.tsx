import { AlertTriangle, BookOpenCheck, CircleHelp, FileSearch, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { LocalNote, PageKicker } from '@/components/app-shell';
import { LexicalClassPill, RiskPill } from '@/components/term-card';
import { buildEditorialReview, getReleaseReadiness, type EditorialFlag } from '@/editorial-audit';
import { terms } from '@/data';

type ReviewFilter = 'all' | 'priority' | EditorialFlag;

const review = buildEditorialReview(terms);
const filters: Array<{ value: ReviewFilter; label: string }> = [
  { value: 'all', label: 'All entries' },
  { value: 'priority', label: 'Priority review' },
  { value: 'prototype', label: 'Prototype only' },
  { value: 'ambiguous', label: 'Ambiguous' },
  { value: 'high-concern', label: 'High concern' },
  { value: 'sensitive-review', label: 'Sensitive review' },
  { value: 'needs-verification', label: 'Needs verification' },
];

const flagLabels: Record<EditorialFlag, string> = {
  prototype: 'Prototype only',
  'needs-verification': 'Needs verification',
  'sensitive-review': 'Sensitive review',
  ambiguous: 'Ambiguous meaning',
  'high-concern': 'High-concern context',
};

export default function EditorialReview() {
  const [filter, setFilter] = useState<ReviewFilter>('priority');
  const filtered = useMemo(() => review.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'priority') {
      return entry.flags.includes('ambiguous') ||
        entry.flags.includes('high-concern') ||
        entry.issues.length > 0;
    }
    return entry.flags.includes(filter);
  }), [filter]);

  const ambiguousCount = review.filter((entry) => entry.flags.includes('ambiguous')).length;
  const highConcernCount = review.filter((entry) => entry.flags.includes('high-concern')).length;
  const prototypeCount = review.filter((entry) => entry.flags.includes('prototype')).length;
  const issueCount = review.reduce((total, entry) => total + entry.issues.length, 0);
  const releaseReadiness = getReleaseReadiness(terms);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end">
        <div>
          <PageKicker>Local editorial workspace</PageKicker>
          <h1 className="font-display text-5xl font-semibold leading-[.94] tracking-[-.05em] sm:text-6xl">Review what still needs a careful read.</h1>
        </div>
        <div className="rounded-2xl border border-[#d7cfc2] bg-[#f4efe4] p-5">
          <div className="flex items-start gap-3"><FileSearch size={19} className="mt-0.5 shrink-0 text-primary" /><div><h2 className="text-sm font-semibold">Dictionary metadata only</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This page reads the local term records. It cannot see decoder text or user-prepared email reports, and it does not send a review queue anywhere.</p></div></div>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary icon={BookOpenCheck} label="Prototype entries" value={prototypeCount} />
        <Summary icon={CircleHelp} label="Ambiguous entries" value={ambiguousCount} />
        <Summary icon={ShieldAlert} label="Orange or red" value={highConcernCount} />
        <Summary icon={AlertTriangle} label="Audit issues" value={issueCount} />
      </div>

      <section className="mt-8 rounded-2xl border border-accent/30 bg-accent/[.07] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert size={19} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <h2 className="font-display text-2xl font-semibold">Verified public launch: {releaseReadiness.ready ? 'ready' : 'blocked'}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {releaseReadiness.ready
                ? 'Every sensitive entry has a recorded qualified review, source, and date.'
                : `${releaseReadiness.pendingSensitiveTerms.length} sensitive entries still need qualified subject-matter or lived-experience review${releaseReadiness.unsupportedReviewedTerms.length ? `, and ${releaseReadiness.unsupportedReviewedTerms.length} reviewed entries have incomplete evidence` : ''}. They remain available only as clearly labelled prototype content.`}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2" aria-label="Editorial review filters">
          {filters.map((item) => <button type="button" key={item.value} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value} className={`focus-ring rounded-full border px-3 py-2 text-xs font-semibold transition ${filter === item.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>{item.label}</button>)}
        </div>
        <div className="mt-4 border-t border-border pt-4"><LocalNote>{filtered.length} entries shown · review order is editorial, not a live risk score</LocalNote></div>
      </section>

      <div className="mt-6 space-y-3">
        {filtered.map(({ term, flags, issues }) => (
          <article key={term.slug} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-2xl font-semibold">{term.term}</h2><LexicalClassPill lexicalClass={term.lexicalClass} /><RiskPill risk={term.riskLevel} /></div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{term.definition}</p>
              </div>
              <Link href={`/term/${term.slug}`} className="focus-ring shrink-0 text-xs font-semibold text-primary hover:underline">Open editorial record</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{flags.map((flag) => <span key={flag} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{flagLabels[flag]}</span>)}</div>
            <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-xs sm:grid-cols-3">
              <ReviewMeta label="Source type" value={term.sourceType} />
              <ReviewMeta label="Confidence" value={term.confidenceLevel} />
              <ReviewMeta label="Review status" value={term.reviewStatus} />
              <ReviewMeta label="Last verified" value={term.lastVerifiedDate ?? 'No independent date'} />
            </dl>
            {issues.length > 0 && <div className="mt-4 rounded-xl border border-accent/30 bg-accent/[.07] p-3"><div className="text-xs font-semibold">Audit attention</div>{issues.map((issue) => <p key={`${issue.code}-${issue.message}`} className="mt-1 text-xs leading-5 text-muted-foreground">{issue.code}: {issue.message}</p>)}</div>}
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/[.06] p-6">
        <h2 className="font-display text-2xl font-semibold">Current verification boundary</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">All entries in this edition are editorial prototypes with moderate confidence, no independent verification date, and no named source references. Sensitive entries must be reviewed by an appropriately qualified subject-matter or lived-experience reviewer before they can be presented as verified guidance. This tool never creates reviewer evidence, sources, or dates.</p>
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof FileSearch; label: string; value: number }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><Icon size={18} className="text-primary" /><div className="mt-4 font-display text-4xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>;
}

function ReviewMeta({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono-custom text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</dt><dd className="mt-1 text-foreground">{value}</dd></div>;
}