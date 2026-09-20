export const REPORT_EXPLANATION_MAX_LENGTH = 500;

export const reportIssueOptions = [
  { value: 'incorrect-or-unclear-meaning', label: 'Incorrect or unclear meaning' },
  { value: 'missing-context', label: 'Missing context' },
  { value: 'broken-link-or-behavior', label: 'Broken link or behavior' },
  { value: 'accessibility-problem', label: 'Accessibility problem' },
  { value: 'privacy-concern', label: 'Privacy concern' },
  { value: 'other', label: 'Other' },
] as const;

export type ReportIssueCategory = (typeof reportIssueOptions)[number]['value'];
export type ReportRecordType = 'term' | 'guide' | 'product';

export type ReportFormInput = {
  category: string;
  explanation: string;
  privacyAcknowledged: boolean;
};

export type ReportFormErrors = Partial<Record<'category' | 'explanation' | 'privacyAcknowledged', string>>;

export type ReportDraft = {
  recipient: string;
  subject: string;
  body: string;
  mailto: string;
  plainText: string;
};

export function isValidPublicReportingRecipient(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const recipient = value.trim();
  return (
    recipient.length <= 254 &&
    !/[\r\n,;]/.test(recipient) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)
  );
}

export function isReportIssueCategory(value: string): value is ReportIssueCategory {
  return reportIssueOptions.some((option) => option.value === value);
}

export function validateReportForm(input: ReportFormInput): ReportFormErrors {
  const errors: ReportFormErrors = {};
  if (!isReportIssueCategory(input.category)) {
    errors.category = 'Choose what kind of issue you want to report.';
  }
  if (input.explanation.length > REPORT_EXPLANATION_MAX_LENGTH) {
    errors.explanation = `Keep the explanation to ${REPORT_EXPLANATION_MAX_LENGTH} characters or fewer.`;
  }
  if (!input.privacyAcknowledged) {
    errors.privacyAcknowledged = 'Confirm that you removed private and identifying information.';
  }
  return errors;
}

function publicPageUrl(pageUrl: string) {
  const url = new URL(pageUrl);
  return `${url.origin}${url.pathname}`;
}

export function buildReportDraft(input: {
  recipient: string;
  pageUrl: string;
  recordType: ReportRecordType;
  recordIdentity: string;
  category: ReportIssueCategory;
  explanation?: string;
}): ReportDraft {
  if (!isValidPublicReportingRecipient(input.recipient)) {
    throw new Error('A valid public reporting recipient is required.');
  }
  const option = reportIssueOptions.find((candidate) => candidate.value === input.category);
  if (!option) throw new Error('A valid issue category is required.');

  const recipient = input.recipient.trim();
  const identity = input.recordIdentity.trim();
  const recordLabel = input.recordType === 'guide' ? 'Guide' : input.recordType === 'product' ? 'Feedback scope' : 'Term';
  const subject = input.recordType === 'product'
    ? 'Parent Decoder feedback'
    : `Parent Decoder report: ${recordLabel.toLowerCase()} “${identity}”`;
  const explanation = input.explanation?.trim();
  const lines = [
    `Issue category: ${option.label}`,
    `Public page URL: ${publicPageUrl(input.pageUrl)}`,
    `${recordLabel}: ${identity}`,
  ];
  if (explanation) lines.push(`Optional explanation: ${explanation}`);
  lines.push(
    '',
    'Privacy reminder: Please send only information you are comfortable sharing. Do not include names, handles, screenshots, private messages, contact details, or identifying information about children.',
  );
  const body = lines.join('\n');
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    recipient,
    subject,
    body,
    mailto,
    plainText: `To: ${recipient}\nSubject: ${subject}\n\n${body}`,
  };
}