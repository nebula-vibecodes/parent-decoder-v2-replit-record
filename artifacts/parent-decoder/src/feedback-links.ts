import type { ReportRecordType } from '@/report-email';

export function feedbackHref(input: {
  recordIdentity?: string;
  recordType?: ReportRecordType;
  sourcePath: string;
}) {
  const params = new URLSearchParams({
    record: input.recordIdentity ?? 'Parent Decoder',
    recordType: input.recordType ?? 'product',
    from: input.sourcePath.split('?')[0] || '/',
  });
  return `/feedback?${params.toString()}`;
}