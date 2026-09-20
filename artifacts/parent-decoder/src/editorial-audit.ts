import type { Term } from '@/data';
import { lexicalClassDetails, type LexicalClass } from './dictionary/lexical-classification';

export type EditorialFlag =
  | 'prototype'
  | 'needs-verification'
  | 'sensitive-review'
  | 'ambiguous'
  | 'high-concern';

export type EditorialAuditIssue = {
  severity: 'ERROR' | 'WARN';
  code: string;
  message: string;
};

export type EditorialReviewEntry = {
  term: Term;
  flags: EditorialFlag[];
  issues: EditorialAuditIssue[];
};

const intentionallyAmbiguousSlugs = new Set(['dm', 'op', 'rn', 'otp', 'crash-out', 'oomf']);
const unsupportedCurrentnessClaims = /\b(latest|definitive|verified current|current as of|most popular|trending now)\b/i;
const unsupportedContextClaims = /\b(?:everyone|everybody|all teens|all young people|universally|always means|never means|widely used|popular among)\b/i;
const descriptiveLabelPattern = /\b(?:language|talk|pressure|support|check|request|participation|obligation|humiliation|abuse|persona|context|recovery|joke)\b/i;
export const sensitiveReviewCategories = new Set<Term['categories'][number]>([
  'Substance use',
  'Mental health',
  'Scams & financial safety',
  'Violence & weapons',
  'Body image & eating concerns',
  'Consent & sexual safety',
  'Risky challenges',
  'Sensitive topics',
]);

export function requiresSensitiveReview(term: Term) {
  return term.categories.some((category) => sensitiveReviewCategories.has(category));
}

export function isReviewEvidenceComplete(term: Term) {
  return term.reviewStatus === 'Reviewed' &&
    term.editorialStatus === 'Reviewed' &&
    Boolean(term.reviewer?.trim()) &&
    Boolean(term.reviewerRole?.trim()) &&
    term.lastVerifiedDate !== null &&
    term.sourceReferences.length > 0;
}

export function getReleaseReadiness(terms: Term[]) {
  const unsupportedReviewedTerms = terms.filter((term) =>
    term.editorialStatus === 'Reviewed' && !isReviewEvidenceComplete(term),
  );
  const pendingSensitiveTerms = terms.filter((term) =>
    requiresSensitiveReview(term) && term.reviewStatus !== 'Reviewed',
  );
  return {
    ready: unsupportedReviewedTerms.length === 0 && pendingSensitiveTerms.length === 0,
    prototypeOnly: unsupportedReviewedTerms.length === 0,
    blockingTerms: [...new Set([...unsupportedReviewedTerms, ...pendingSensitiveTerms])],
    pendingSensitiveTerms,
    unsupportedReviewedTerms,
  };
}

export function auditTerm(term: Term): EditorialAuditIssue[] {
  const issues: EditorialAuditIssue[] = [];
  const isPrototype = term.editorialStatus === 'Prototype';
  const lexicalClasses = Object.keys(lexicalClassDetails) as LexicalClass[];

  if (!lexicalClasses.includes(term.lexicalClass)) {
    issues.push({
      severity: 'ERROR',
      code: 'MISSING_LEXICAL_CLASSIFICATION',
      message: 'Every published record needs an explicit lexical classification.',
    });
  }
  if (term.lexicalClassificationSource === 'default-hold') {
    issues.push({
      severity: 'ERROR',
      code: 'LEXICAL_CLASSIFICATION_NOT_EXPLICIT',
      message: 'New records without an explicit lexical classification remain held and cannot enter published dictionary surfaces.',
    });
  }
  if (term.lexicalClass === 'Supporting safety/clinical terminology') {
    issues.push({
      severity: 'WARN',
      code: 'SUPPORTING_TERM_REQUIRES_LABELED_SURFACE',
      message: 'Supporting terminology must remain visibly labeled and separated from primary slang results.',
    });
  }
  if (term.lexicalClass === 'Held for verification' && term.reviewStatus === 'Reviewed') {
    issues.push({
      severity: 'ERROR',
      code: 'HELD_RECORD_REVIEW_CONFLICT',
      message: 'Held-for-verification records cannot be presented as independently reviewed.',
    });
  }
  if (
    term.lexicalClass === 'Slang or informal expression' &&
    descriptiveLabelPattern.test(term.term)
  ) {
    issues.push({
      severity: 'WARN',
      code: 'PROJECT_AUTHORED_LABEL',
      message: 'This canonical name resembles a project-authored descriptive label; retain it as slang only with credible usage evidence.',
    });
  }
  if (
    unsupportedContextClaims.test(
      `${term.generationRelevance} ${term.region} ${term.culturalCommunityContext} ${term.lifecycleStatus}`,
    )
  ) {
    issues.push({
      severity: 'WARN',
      code: 'UNSUPPORTED_CONTEXT_CLAIM',
      message: 'Age, region, currentness, or community wording needs an independent source or explicit uncertainty.',
    });
  }

  if (isPrototype) {
    if (term.sourceType !== 'Editorial') {
      issues.push({
        severity: 'ERROR',
        code: 'PROTOTYPE_SOURCE_TYPE',
        message: 'Prototype entries must remain labeled as editorial material.',
      });
    }
    if (term.sourceReferences.length > 0 || term.lastVerifiedDate !== null) {
      issues.push({
        severity: 'ERROR',
        code: 'PROTOTYPE_VERIFICATION_CLAIM',
        message: 'Prototype entries cannot carry sources or a verification date.',
      });
    }
    if (term.confidenceLevel !== 'Moderate') {
      issues.push({
        severity: 'ERROR',
        code: 'PROTOTYPE_CONFIDENCE',
        message: 'Prototype confidence must remain moderate until independently reviewed.',
      });
    }
    if (!term.definitionSource.includes('no independent source listed') ||
        !term.contextSource.includes('no independent source listed')) {
      issues.push({
        severity: 'ERROR',
        code: 'PROTOTYPE_SOURCE_WORDING',
        message: 'Prototype source fields must state that no independent source is listed.',
      });
    }
    if (!term.prototypeVerificationStatus.toLowerCase().includes('verification in progress')) {
      issues.push({
        severity: 'ERROR',
        code: 'PROTOTYPE_STATUS',
        message: 'Prototype entries must state that verification is in progress.',
      });
    }
  }

  if (term.lastVerifiedDate !== null &&
      !/^\d{4}-\d{2}-\d{2}$/.test(term.lastVerifiedDate)) {
    issues.push({
      severity: 'ERROR',
      code: 'VERIFICATION_DATE',
      message: 'Last-verified dates must use YYYY-MM-DD.',
    });
  }

  if (term.confidenceLevel === 'High' &&
      (term.sourceReferences.length === 0 || term.lastVerifiedDate === null)) {
    issues.push({
      severity: 'ERROR',
      code: 'UNSUPPORTED_HIGH_CONFIDENCE',
      message: 'High confidence requires a named source and verification date.',
    });
  }

  if (term.sourceType === 'Expert-reviewed' &&
      (term.sourceReferences.length === 0 || term.lastVerifiedDate === null)) {
    issues.push({
      severity: 'ERROR',
      code: 'UNSUPPORTED_EXPERT_REVIEW',
      message: 'Expert-reviewed status requires a named source and verification date.',
    });
  }

  if (term.reviewStatus === 'Reviewed' && !isReviewEvidenceComplete(term)) {
    issues.push({
      severity: 'ERROR',
      code: 'INCOMPLETE_REVIEW_EVIDENCE',
      message: 'Reviewed entries require a named qualified reviewer, role, source reference, and review date.',
    });
  }

  if (term.reviewStatus !== 'Reviewed' && term.editorialStatus === 'Reviewed') {
    issues.push({
      severity: 'ERROR',
      code: 'UNSUPPORTED_REVIEW_STATUS',
      message: 'An entry cannot be marked Reviewed until its review evidence is complete.',
    });
  }

  if (term.sourceReferences.some((source) => !source.title.trim())) {
    issues.push({
      severity: 'ERROR',
      code: 'SOURCE_TITLE',
      message: 'Every source reference needs a non-empty title.',
    });
  }

  if (unsupportedCurrentnessClaims.test(term.currentness)) {
    issues.push({
      severity: 'WARN',
      code: 'UNSUPPORTED_CURRENTNESS',
      message: 'Currentness wording implies live or independently verified trend data.',
    });
  }

  return issues;
}

export function buildEditorialReview(terms: Term[]): EditorialReviewEntry[] {
  return terms.map((term) => {
    const flags: EditorialFlag[] = [];
    if (term.editorialStatus === 'Prototype') flags.push('prototype');
    if (term.lastVerifiedDate === null || term.sourceReferences.length === 0) flags.push('needs-verification');
    if (requiresSensitiveReview(term) && term.reviewStatus !== 'Reviewed') flags.push('sensitive-review');
    if (intentionallyAmbiguousSlugs.has(term.slug)) flags.push('ambiguous');
    if (term.riskLevel === 'ORANGE' || term.riskLevel === 'RED') flags.push('high-concern');
    return { term, flags, issues: auditTerm(term) };
  });
}