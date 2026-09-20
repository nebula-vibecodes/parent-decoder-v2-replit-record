import { ArrowUpRight, CircleAlert, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { contextLevels, lexicalClassDetails, type ContextLevel, type Term } from '@/data';

const riskStyles: Record<ContextLevel, string> = {
  GREEN: 'bg-primary/10 text-primary',
  BLUE: 'bg-[#dce8ed] text-[#245663]',
  YELLOW: 'bg-accent/12 text-[#a34f39]',
  ORANGE: 'bg-[#f0ddd0] text-[#9a4e35]',
  RED: 'bg-[#ead3d1] text-[#873d3b]',
};

export function RiskPill({ risk }: { risk: Term['riskLevel'] }) {
  const Icon = risk === 'ORANGE' || risk === 'RED' ? CircleAlert : risk === 'BLUE' || risk === 'YELLOW' ? MessageCircle : ShieldCheck;
  const level = contextLevels[risk];
  return <span title={level.guidance} aria-label={`${risk} · ${level.label}. ${level.guidance}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-custom text-[10px] uppercase tracking-[0.07em] ${riskStyles[risk]}`}><Icon aria-hidden="true" size={12} />{risk} · {level.label}</span>;
}

const lexicalStyles: Record<Term['lexicalClass'], string> = {
  'Slang or informal expression': 'bg-primary/10 text-primary',
  'Established internet/platform/community terminology': 'bg-[#dce8ed] text-[#245663]',
  'Supporting safety/clinical terminology': 'bg-[#f4efe4] text-[#8a5b2f]',
  'Parent guide': 'bg-[#eadfe8] text-[#704c6d]',
  'Held for verification': 'bg-[#f0ddd0] text-[#9a4e35]',
};

export function LexicalClassPill({ lexicalClass }: { lexicalClass: Term['lexicalClass'] }) {
  const details = lexicalClassDetails[lexicalClass];
  return (
    <span
      title={details.description}
      aria-label={`${details.label}. ${details.description}`}
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono-custom text-[9px] uppercase tracking-[0.07em] ${lexicalStyles[lexicalClass]}`}
    >
      {details.label}
    </span>
  );
}

export function TermCard({
  term,
  index = 0,
  discoveryNote,
}: {
  term: Term;
  index?: number;
  discoveryNote?: string;
}) {
  return (
    <Link href={`/term/${term.slug}`} className={`focus-ring group rise-in delay-${Math.min(index + 1, 4)} flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_4px_15px_rgba(57,66,60,0.035)] transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_15px_30px_rgba(57,66,60,0.1)]`} data-testid={`card-term-${term.slug}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2"><div className="font-mono-custom text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{term.categories[0]}</div><LexicalClassPill lexicalClass={term.lexicalClass} /></div>
          <h3 className="font-display text-[29px] font-semibold leading-none tracking-[-0.03em] text-foreground">{term.term}</h3>
        </div>
        <ArrowUpRight size={18} className="shrink-0 text-muted-foreground transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      {discoveryNote && <div className="mt-3 w-fit max-w-full truncate rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{discoveryNote}</div>}
      <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{term.definition}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><RiskPill risk={term.riskLevel} /><span className="font-mono-custom text-[9px] uppercase tracking-[.1em] text-muted-foreground">{term.recordType === 'guide' ? 'Topic guide' : term.lexicalDisposition}</span></div>
    </Link>
  );
}