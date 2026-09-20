import { Check, Clipboard, Flag, Mail, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  buildReportDraft,
  REPORT_EXPLANATION_MAX_LENGTH,
  reportIssueOptions,
  validateReportForm,
  type ReportDraft,
  type ReportIssueCategory,
  type ReportRecordType,
} from '@/report-email';
import { getPublicReportingRecipient } from '@/reporting-config';

type ReportErrorFormProps = {
  recordIdentity: string;
  recordType: ReportRecordType;
  pageUrl?: string;
};

export function ReportErrorForm({ recordIdentity, recordType, pageUrl }: ReportErrorFormProps) {
  const recipient = getPublicReportingRecipient();
  const [category, setCategory] = useState('');
  const [explanation, setExplanation] = useState('');
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validateReportForm>>({});
  const [prepared, setPrepared] = useState<ReportDraft | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const categoryRef = useRef<HTMLSelectElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const privacyRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLHeadingElement>(null);

  if (!recipient) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="report-unavailable">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Flag size={18} /></span>
          <div>
            <h2 className="font-display text-2xl font-semibold">Reporting is not configured yet.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">No report was created, sent, stored, or discarded. An owner must set a valid public reporting recipient in <span className="font-mono-custom text-xs text-foreground">public/reporting-config.js</span> before the email-composer flow can open.</p>
          </div>
        </div>
      </section>
    );
  }

  const prepareEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateReportForm({ category, explanation, privacyAcknowledged });
    setErrors(nextErrors);
    setPrepared(null);
    setCopyState('idle');
    if (nextErrors.category) {
      categoryRef.current?.focus();
      return;
    }
    if (nextErrors.explanation) {
      explanationRef.current?.focus();
      return;
    }
    if (nextErrors.privacyAcknowledged) {
      privacyRef.current?.focus();
      return;
    }

    const draft = buildReportDraft({
      recipient,
      pageUrl: pageUrl ?? window.location.href,
      recordType,
      recordIdentity,
      category: category as ReportIssueCategory,
      explanation,
    });
    setPrepared(draft);

    const composerLink = document.createElement('a');
    composerLink.href = draft.mailto;
    composerLink.hidden = true;
    composerLink.setAttribute('aria-hidden', 'true');
    document.body.append(composerLink);
    composerLink.click();
    composerLink.remove();
    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  const copyReport = async () => {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.plainText);
      setCopyState('copied');
    } catch {
      setCopyState('manual');
      window.requestAnimationFrame(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>('[data-testid="textarea-report-copy"]');
        textarea?.focus();
        textarea?.select();
      });
    }
  };

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="report-form">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Flag size={18} /></span>
        <div>
          <h2 className="font-display text-2xl font-semibold">Report an issue</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Prepare a draft for your own email application. Parent Decoder does not transmit, store, queue, or log the report.</p>
        </div>
      </div>

      <form onSubmit={prepareEmail} noValidate className="mt-6 grid min-w-0 gap-5">
        <div>
            <label htmlFor="report-entry" className="text-xs font-semibold text-foreground">{recordType === 'guide' ? 'Current guide' : recordType === 'product' ? 'Feedback scope' : 'Current term'}</label>
          <input id="report-entry" value={recordIdentity} readOnly className="mt-2 min-h-11 w-full rounded-xl border border-input bg-secondary/45 px-3 text-sm text-foreground" data-testid="input-report-entry" />
        </div>

        <div>
          <label htmlFor="report-category" className="text-xs font-semibold text-foreground">Issue category <span aria-hidden="true">*</span></label>
          <select
            ref={categoryRef}
            id="report-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setErrors((current) => ({ ...current, category: undefined }));
            }}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'report-category-error' : undefined}
            className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
            data-testid="select-report-issue"
          >
            <option value="">Choose an issue</option>
            {reportIssueOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {errors.category && <p id="report-category-error" role="alert" className="mt-2 text-sm text-destructive">{errors.category}</p>}
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label htmlFor="report-explanation" className="text-xs font-semibold text-foreground">Optional short explanation</label>
            <span id="report-explanation-count" className="font-mono-custom text-[10px] text-muted-foreground">{explanation.length}/{REPORT_EXPLANATION_MAX_LENGTH}</span>
          </div>
          <textarea
            ref={explanationRef}
            id="report-explanation"
            value={explanation}
            onChange={(event) => {
              setExplanation(event.target.value);
              setErrors((current) => ({ ...current, explanation: undefined }));
            }}
            rows={4}
            maxLength={REPORT_EXPLANATION_MAX_LENGTH}
            aria-invalid={Boolean(errors.explanation)}
            aria-describedby={`report-explanation-count${errors.explanation ? ' report-explanation-error' : ''}`}
            placeholder="What would make this entry clearer or more accurate?"
            className="focus-ring mt-2 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm leading-6 outline-none placeholder:text-muted-foreground"
            data-testid="textarea-report-details"
          />
          {errors.explanation && <p id="report-explanation-error" role="alert" className="mt-2 text-sm text-destructive">{errors.explanation}</p>}
        </div>

        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/35 p-4 text-sm leading-6">
            <input
              ref={privacyRef}
              type="checkbox"
              checked={privacyAcknowledged}
              onChange={(event) => {
                setPrivacyAcknowledged(event.target.checked);
                setErrors((current) => ({ ...current, privacyAcknowledged: undefined }));
              }}
              aria-invalid={Boolean(errors.privacyAcknowledged)}
              aria-describedby={errors.privacyAcknowledged ? 'report-privacy-error' : undefined}
              className="focus-ring mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
              data-testid="checkbox-report-privacy"
            />
            <span>I removed names, handles, screenshots, private messages, contact details, and identifying information about children. <span aria-hidden="true">*</span></span>
          </label>
          {errors.privacyAcknowledged && <p id="report-privacy-error" role="alert" className="mt-2 text-sm text-destructive">{errors.privacyAcknowledged}</p>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono-custom text-[10px] uppercase leading-5 tracking-[.12em] text-muted-foreground">You choose whether to edit, cancel, or send</p>
          <button type="submit" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90" data-testid="button-submit-report"><Mail size={15} /> Prepare email</button>
        </div>
      </form>

      {prepared && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[.06] p-5" role="status" data-testid="report-prepared-status">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={17} /></span>
            <div className="min-w-0">
              <h3 ref={statusRef} tabIndex={-1} className="focus-ring font-display text-xl font-semibold">Email draft prepared.</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">We asked your email application to open. Review the draft and choose Send there. Parent Decoder has not sent the email.</p>
            </div>
          </div>

          <div className="mt-5 border-t border-primary/15 pt-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><ShieldCheck size={15} className="text-primary" /> If no email application opened</div>
            <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">Copy the plain-text report below and email it to <span className="font-semibold text-foreground" data-testid="text-report-recipient">{prepared.recipient}</span>.</p>
            <label htmlFor="report-copy" className="sr-only">Plain-text report</label>
            <textarea id="report-copy" readOnly value={prepared.plainText} rows={9} className="focus-ring mt-3 w-full resize-y overflow-auto rounded-xl border border-input bg-background p-3 font-mono-custom text-xs leading-5 text-foreground" data-testid="textarea-report-copy" />
            <button type="button" onClick={copyReport} className="focus-ring mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary" data-testid="button-copy-report"><Clipboard size={14} /> {copyState === 'copied' ? 'Copied report' : 'Copy plain-text report'}</button>
            {copyState === 'manual' && <p className="mt-2 text-sm text-muted-foreground" role="status">Automatic copy was unavailable. The report text is selected so you can copy it manually.</p>}
          </div>
        </div>
      )}
    </section>
  );
}