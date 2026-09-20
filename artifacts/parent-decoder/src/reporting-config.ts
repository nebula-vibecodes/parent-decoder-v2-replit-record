declare global {
  interface Window {
    PARENT_DECODER_CONFIG?: {
      reportingRecipient?: unknown;
    };
  }
}

import { isValidPublicReportingRecipient } from '@/report-email';

export function getPublicReportingRecipient() {
  const configured = window.PARENT_DECODER_CONFIG?.reportingRecipient;
  return isValidPublicReportingRecipient(configured) ? configured.trim() : null;
}