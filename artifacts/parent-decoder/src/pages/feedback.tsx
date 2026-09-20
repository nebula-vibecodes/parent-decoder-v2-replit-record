import { Flag, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { LocalNote, PageKicker } from '@/components/app-shell';
import { ReportErrorForm } from '@/components/report-form';
import { type ReportRecordType } from '@/report-email';

function publicSourceUrl(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return window.location.href;
  return `${window.location.origin}${value.split('?')[0] || '/'}`;
}

export default function Feedback() {
  const params = new URLSearchParams(window.location.search);
  const recordType: ReportRecordType = params.get('recordType') === 'term' || params.get('recordType') === 'guide'
    ? params.get('recordType') as ReportRecordType
    : 'product';
  const recordIdentity = params.get('record')?.trim() || 'Parent Decoder';
  const isContextual = recordType !== 'product' && recordIdentity !== 'Parent Decoder';
  const sourceUrl = publicSourceUrl(params.get('from'));

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div className="rise-in">
          <PageKicker><Flag size={13} /> A clear feedback path</PageKicker>
          <h1 className="font-display text-6xl font-semibold leading-[.88] tracking-[-.06em] sm:text-7xl">Help us keep the context clear.</h1>
          <p className="mt-6 max-w-xl text-[17px] leading-7 text-muted-foreground">
            Tell us what would make Parent Decoder more useful. Feedback can be about the product, a dictionary term, a topic guide, accessibility, or a broken link.
          </p>
          {isContextual && <p className="mt-5 rounded-xl border border-primary/15 bg-primary/[.06] px-4 py-3 text-sm leading-6 text-foreground">This feedback is about <strong>{recordType === 'guide' ? 'the guide' : 'the term'} “{recordIdentity}”.</strong> Only that public identity and the public page location are carried here.</p>}
          <div className="mt-8 rounded-2xl border border-[#d7cfc2] bg-[#f4efe4] p-6 sm:p-7">
            <div className="flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.16em] text-primary"><ShieldCheck size={15} /> What helps most</div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Say which term, guide, link, or interaction needs attention.</li>
              <li>Describe what you expected and what happened instead.</li>
              <li>Keep the explanation short enough for an editor to act on.</li>
            </ul>
          </div>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[.06] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold">Please protect privacy</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Do not include names, handles, screenshots, private messages, contact details, or identifying information about children. Parent Decoder does not need the original message or any saved prompt to review feedback.</p>
          </div>
        </div>
        <div className="rise-in delay-1">
          <ReportErrorForm recordIdentity={recordIdentity} recordType={recordType} pageUrl={sourceUrl} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <LocalNote>Your email application opens only after you choose to prepare a draft.</LocalNote>
            <Link href="/privacy" className="focus-ring text-sm font-semibold text-primary hover:underline">Read privacy boundaries</Link>
          </div>
        </div>
      </div>
    </div>
  );
}