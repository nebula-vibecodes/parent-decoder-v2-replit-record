import {
  analyzeMessage,
  categories,
  contextLevels,
  findExactTermMatch,
  matchTermDetails,
  matchTerms,
  risks,
  searchTerms,
  suggestTermResults,
  terms,
  type Term,
} from '../src/data.ts';
import { dictionaryBatches } from '../src/dictionary/index.ts';
import { lexicalClassCounts, lexicalDispositionLedger } from '../src/dictionary/index.ts';
import {
  auditTerm,
  getReleaseReadiness,
  requiresSensitiveReview,
} from '../src/editorial-audit.ts';
import {
  dictionaryCandidates,
  type DictionaryCandidate,
} from '../src/dictionary-candidates.ts';
import { runPhase4QualityAudit } from './phase-4-quality-audit.ts';

type Severity = 'ERROR' | 'WARN';
type Finding = { severity: Severity; code: string; message: string };

const findings: Finding[] = [];
const expectedCategories = [
  'Everyday slang',
  'Texting',
  'Gaming',
  'Memes',
  'Emojis',
  'Relationships',
  'Social media',
  'Bullying & harassment',
  'Online safety',
  'Cultural & community',
  'Sensitive topics',
  'Substance use',
  'Mental health',
  'School & peer life',
  'Scams & financial safety',
  'Violence & weapons',
  'Body image & eating concerns',
  'Consent & sexual safety',
  'Risky challenges',
] as const;
const establishedCategories = [
  'Everyday slang',
  'Texting',
  'Gaming',
  'Memes',
  'Emojis',
  'Relationships',
  'Social media',
  'Bullying & harassment',
  'Online safety',
  'Cultural & community',
  'Sensitive topics',
] as const;
const sourceTypes = new Set([
  'Editorial',
  'Dictionary',
  'Documented usage',
  'Platform/community observation',
  'Expert-reviewed',
  'User-submitted pending review',
]);
const candidateTriageStates = new Set(['hold', 'reject', 'promote']);
const editorialStatuses = new Set(['Prototype', 'Reviewed', 'Held']);
const reviewStatuses = new Set(['Unreviewed', 'Reviewed', 'Held']);
const recordTypes = new Set(['term', 'guide']);
const unsupportedCandidateClaims = /\b(trending|viral|everyone uses|always means|definitive|verified current|most popular)\b/i;
const maximumBatchEntries = 8;
const privateIntakePatterns = [
  { label: 'email address', pattern: /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i },
  { label: 'social handle', pattern: /(^|\s)@[a-z0-9_.-]{2,}\b/i },
  { label: 'web link', pattern: /\b(?:https?:\/\/|www\.)\S+/i },
  { label: 'phone number', pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  { label: 'screenshot or transcript material', pattern: /\b(?:screenshot|screen capture|message transcript|full message text)\b/i },
];
const ordinaryWordAliases = new Set([
  'bars',
  'blue',
  'box',
  'cart',
  'clean',
  'code',
  'fire',
  'green',
  'high',
  'ice',
  'lean',
  'line',
  'mask',
  'party',
  'pressure',
  'private',
  'rank',
  'red',
  'safe',
  'school',
  'shot',
  'skin',
  'snow',
  'story',
  'trip',
  'weed',
]);
const sensitiveExpansionCategories = new Set([
  'Substance use',
  'Mental health',
  'School & peer life',
  'Scams & financial safety',
  'Violence & weapons',
  'Body image & eating concerns',
  'Consent & sexual safety',
  'Risky challenges',
  'Sensitive topics',
]);

function addFinding(severity: Severity, code: string, message: string) {
  findings.push({ severity, code, message });
}

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/[’']/g, '').replace(/[-\s]+/g, ' ');
}

function groupedValues(values: Array<{ key: string; slug: string }>) {
  const groups = new Map<string, string[]>();
  for (const { key, slug } of values) {
    const current = groups.get(key) ?? [];
    if (!current.includes(slug)) current.push(slug);
    groups.set(key, current);
  }
  return groups;
}

function duplicateKeys(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).filter(([, count]) => count > 1);
}

function slugsOf(found: Term[]) {
  return found.map((term) => term.slug);
}

function candidateText(candidate: DictionaryCandidate) {
  return [
    candidate.term,
    ...candidate.aliases,
    candidate.plainLanguageMeaning,
    candidate.observedContext,
    candidate.riskRationale,
    candidate.ambiguityNotes,
    candidate.triageReason,
  ].join(' ');
}

function expectSearch(label: string, query: string, expected: string[], scope = 'all' as const) {
  const actual = slugsOf(searchTerms(query, scope));
  const missing = expected.filter((slug) => !actual.includes(slug));
  const unexpected = actual.filter((slug) => !expected.includes(slug));
  if (missing.length || unexpected.length) {
    addFinding(
      'ERROR',
      'SEARCH_FIXTURE',
      `${label}: "${query}" expected ${expected.join(', ') || 'no results'}; got ${actual.join(', ') || 'no results'}.`,
    );
  } else {
    console.log(`  PASS search · ${label}: "${query}" → ${actual.join(', ') || 'no results'}`);
  }
}

function expectMatch(label: string, input: string, expected: string[]) {
  const actual = slugsOf(matchTerms(input));
  const missing = expected.filter((slug) => !actual.includes(slug));
  const unexpected = actual.filter((slug) => !expected.includes(slug));
  if (missing.length || unexpected.length) {
    addFinding(
      'ERROR',
      'MATCH_FIXTURE',
      `${label}: "${input}" expected ${expected.join(', ') || 'no matches'}; got ${actual.join(', ') || 'no matches'}.`,
    );
  } else {
    console.log(`  PASS match · ${label}: "${input}" → ${actual.join(', ') || 'no matches'}`);
  }
}

function expectAnalysis(
  label: string,
  input: string,
  expectation: {
    matches?: string[];
    probableMeaning?: string | null;
    confidence?: 'High' | 'Medium' | 'Low';
    riskLevel?: Term['riskLevel'];
    contexts?: string[];
  },
) {
  const analysis = analyzeMessage(input);
  const actualMatches = slugsOf(analysis.matches);
  const missingMatches = (expectation.matches ?? []).filter((slug) => !actualMatches.includes(slug));
  const unexpectedMatches = expectation.matches
    ? actualMatches.filter((slug) => !expectation.matches?.includes(slug))
    : [];
  const missingContexts = (expectation.contexts ?? []).filter((context) => !analysis.contexts.includes(context));
  const problems = [
    missingMatches.length ? `missing matches ${missingMatches.join(', ')}` : '',
    unexpectedMatches.length ? `unexpected matches ${unexpectedMatches.join(', ')}` : '',
    expectation.probableMeaning !== undefined &&
    (analysis.probableMeaning?.slug ?? null) !== expectation.probableMeaning
      ? `probable meaning ${analysis.probableMeaning?.slug ?? 'none'}`
      : '',
    expectation.confidence && analysis.confidence !== expectation.confidence
      ? `confidence ${analysis.confidence}`
      : '',
    expectation.riskLevel && analysis.riskLevel !== expectation.riskLevel
      ? `risk ${analysis.riskLevel}`
      : '',
    missingContexts.length ? `missing contexts ${missingContexts.join(', ')}` : '',
  ].filter(Boolean);

  if (problems.length) {
    addFinding('ERROR', 'ANALYSIS_FIXTURE', `${label}: "${input}" — ${problems.join('; ')}.`);
  } else {
    console.log(`  PASS analysis · ${label}: ${actualMatches.join(', ') || 'no matches'} / ${analysis.confidence} / ${analysis.riskLevel}`);
  }
}

console.log('Parent Decoder dictionary QA');
console.log(`Entries: ${terms.length}`);

console.log('\nLexical classification');
const expectedLexicalCounts = {
  'Slang or informal expression': 105,
  'Established internet/platform/community terminology': 79,
  'Supporting safety/clinical terminology': 47,
  'Parent guide': 3,
  'Held for verification': 31,
} as const;
for (const [lexicalClass, expected] of Object.entries(expectedLexicalCounts)) {
  const actual = lexicalClassCounts[lexicalClass as keyof typeof lexicalClassCounts];
  if (actual !== expected) {
    addFinding('ERROR', 'LEXICAL_CLASS_COUNT', `${lexicalClass}: expected ${expected}; got ${actual}.`);
  } else {
    console.log(`  PASS lexical class · ${lexicalClass}: ${actual}`);
  }
}
if (lexicalDispositionLedger.length !== terms.length) {
  addFinding('ERROR', 'LEXICAL_LEDGER_COVERAGE', `Disposition ledger covers ${lexicalDispositionLedger.length}/${terms.length} records.`);
} else if (lexicalDispositionLedger.some((entry) => !entry.lexicalDisposition)) {
  addFinding('ERROR', 'LEXICAL_LEDGER_DISPOSITION', 'Every record in the disposition ledger needs a disposition.');
} else {
  console.log(`  PASS disposition ledger · ${lexicalDispositionLedger.length}/${terms.length} records`);
}
if (terms.some((term) => term.lexicalClassificationSource === 'default-hold')) {
  addFinding('ERROR', 'LEXICAL_CLASSIFICATION_NOT_EXPLICIT', 'A record is using the default held classification instead of an explicit or audited classification.');
}

console.log('\nBatch review sizes');
for (const batch of dictionaryBatches) {
  const count = batch.terms.length;
  if (count > maximumBatchEntries && !batch.reviewSizeException?.trim()) {
    addFinding(
      'ERROR',
      'BATCH_REVIEW_SIZE',
      `${batch.name}: ${count} entries exceeds the ${maximumBatchEntries}-entry review limit; split the batch or add a documented exception.`,
    );
  } else if (count > maximumBatchEntries) {
    console.log(`  PASS batch size · ${batch.name}: ${count} entries (exception: ${batch.reviewSizeException})`);
  } else {
    console.log(`  PASS batch size · ${batch.name}: ${count} entries`);
  }
}

console.log('\nCandidate intake and triage');
const candidateIds = groupedValues(
  dictionaryCandidates.map((candidate) => ({ key: normalize(candidate.id), slug: candidate.id })),
);
for (const [id, owners] of candidateIds) {
  if (owners.length > 1) addFinding('ERROR', 'CANDIDATE_DUPLICATE_ID', `"${id}" is used more than once.`);
}

const publishedTokens = new Map<string, Set<string>>();
for (const term of terms) {
  for (const token of [term.term, ...term.alternateSpellings, ...(term.matchTokens ?? [])]) {
    const key = normalize(token);
    const owners = publishedTokens.get(key) ?? new Set<string>();
    owners.add(term.slug);
    publishedTokens.set(key, owners);
  }
}

for (const candidate of dictionaryCandidates) {
  const record = candidate as unknown as Record<string, unknown>;
  const requiredCandidateText = [
    'id',
    'term',
    'plainLanguageMeaning',
    'observedContext',
    'riskRationale',
    'ambiguityNotes',
    'triageReason',
  ];
  for (const field of requiredCandidateText) {
    if (typeof record[field] !== 'string' || !(record[field] as string).trim()) {
      addFinding('ERROR', 'CANDIDATE_MISSING_FIELD', `${candidate.id || 'unknown candidate'}: ${field} must be a non-empty string.`);
    }
  }
  if (!Array.isArray(candidate.aliases) || !candidate.aliases.length) {
    addFinding('ERROR', 'CANDIDATE_MISSING_FIELD', `${candidate.id}: aliases must contain at least one alternate form.`);
  }
  if (!Array.isArray(candidate.categories) || !candidate.categories.length) {
    addFinding('ERROR', 'CANDIDATE_MISSING_FIELD', `${candidate.id}: categories must contain at least one category.`);
  } else {
    for (const category of candidate.categories) {
      if (!expectedCategories.includes(category)) {
        addFinding('ERROR', 'CANDIDATE_CATEGORY', `${candidate.id}: unsupported category "${category}".`);
      }
    }
  }
  if (!contextLevels[candidate.proposedRisk]) {
    addFinding('ERROR', 'CANDIDATE_RISK', `${candidate.id}: proposed context level is not supported.`);
  }
  if (!candidateTriageStates.has(candidate.triage)) {
    addFinding('ERROR', 'CANDIDATE_TRIAGE', `${candidate.id}: triage must be reject, hold, or promote.`);
  }
  if (candidate.needsVerification !== true) {
    addFinding('ERROR', 'CANDIDATE_VERIFICATION', `${candidate.id}: local candidates must remain marked as needing verification.`);
  }

  const intakeText = candidateText(candidate);
  if (unsupportedCandidateClaims.test(intakeText)) {
    addFinding('ERROR', 'CANDIDATE_UNSUPPORTED_CLAIM', `${candidate.id}: wording implies popularity, universality, or independent verification.`);
  }
  for (const privatePattern of privateIntakePatterns) {
    if (privatePattern.pattern.test(intakeText)) {
      addFinding('ERROR', 'CANDIDATE_PRIVATE_DATA', `${candidate.id}: remove the ${privatePattern.label} from local intake.`);
    }
  }
  if (/["“”]\S.*["“”]/.test(candidate.observedContext)) {
    addFinding('ERROR', 'CANDIDATE_TRANSCRIPT', `${candidate.id}: observed context must be an anonymous summary, not quoted message text.`);
  }

  const candidateTokens = [candidate.term, ...candidate.aliases];
  const collidingOwners = Array.from(new Set(
    candidateTokens.flatMap((token) => Array.from(publishedTokens.get(normalize(token)) ?? [])),
  ));
  if (candidate.triage === 'promote') {
    if (!candidate.promotedSlug) {
      addFinding('ERROR', 'CANDIDATE_PROMOTION', `${candidate.id}: promoted candidates need an exact promotedSlug.`);
      continue;
    }
    const published = terms.find((term) => term.slug === candidate.promotedSlug);
    if (!published) {
      addFinding('ERROR', 'CANDIDATE_PROMOTION', `${candidate.id}: promoted entry "${candidate.promotedSlug}" is not published.`);
      continue;
    }
    const unexpectedOwners = collidingOwners.filter((owner) => owner !== published.slug);
    if (unexpectedOwners.length) {
      addFinding('ERROR', 'CANDIDATE_COLLISION', `${candidate.id}: promotion collides with ${unexpectedOwners.join(', ')}.`);
    }
    const missingAliases = candidate.aliases.filter(
      (alias) => !published.alternateSpellings.some((publishedAlias) => normalize(publishedAlias) === normalize(alias)),
    );
    if (normalize(candidate.term) !== normalize(published.term) ||
        missingAliases.length ||
        candidate.proposedRisk !== published.riskLevel ||
        candidate.categories.some((category) => !published.categories.includes(category))) {
      addFinding('ERROR', 'CANDIDATE_PROMOTION_DRIFT', `${candidate.id}: promoted term, aliases, categories, or context level drifted from intake.`);
    } else if (auditTerm(published).length === 0) {
      console.log(`  PASS candidate · promote ${candidate.term} → ${published.slug}`);
    }
  } else {
    if (candidate.promotedSlug) {
      addFinding('ERROR', 'CANDIDATE_PROMOTION', `${candidate.id}: ${candidate.triage} candidates cannot have a promotedSlug.`);
    }
    if (candidate.triage === 'hold' && collidingOwners.length) {
      addFinding('ERROR', 'CANDIDATE_COLLISION', `${candidate.id}: held candidate already collides with ${collidingOwners.join(', ')}.`);
    } else if (candidate.triage === 'reject' && collidingOwners.length) {
      console.log(`  PASS candidate · reject ${candidate.term} · duplicate of ${collidingOwners.join(', ')}`);
    } else {
      console.log(`  PASS candidate · ${candidate.triage} ${candidate.term}`);
    }
  }
}

const candidateTerms = groupedValues(
  dictionaryCandidates.map((candidate) => ({ key: normalize(candidate.term), slug: candidate.id })),
);
for (const [candidateTerm, owners] of candidateTerms) {
  if (owners.length > 1) {
    addFinding('ERROR', 'CANDIDATE_DUPLICATE_TERM', `"${candidateTerm}" is proposed by ${owners.join(', ')}.`);
  }
}
const candidateTokenGroups = groupedValues(
  dictionaryCandidates.flatMap((candidate) =>
    [candidate.term, ...candidate.aliases].map((token) => ({
      key: normalize(token),
      slug: candidate.id,
    })),
  ),
);
for (const [token, owners] of candidateTokenGroups) {
  if (owners.length > 1) {
    addFinding('ERROR', 'CANDIDATE_DUPLICATE_TOKEN', `"${token}" is shared by ${owners.join(', ')}.`);
  }
}
const candidateSummary = dictionaryCandidates.reduce(
  (summary, candidate) => ({ ...summary, [candidate.triage]: summary[candidate.triage] + 1 }),
  { hold: 0, reject: 0, promote: 0 },
);
console.log(`  Triage summary · ${candidateSummary.promote} promote · ${candidateSummary.hold} hold · ${candidateSummary.reject} reject`);

const candidateGuardFixtures = [
  {
    label: 'private email',
    value: 'Contact person@example.com for context',
    detected: privateIntakePatterns.some(({ pattern }) => pattern.test('Contact person@example.com for context')),
  },
  {
    label: 'screenshot material',
    value: 'Copied from a screenshot',
    detected: privateIntakePatterns.some(({ pattern }) => pattern.test('Copied from a screenshot')),
  },
  {
    label: 'unsupported popularity claim',
    value: 'This is the most popular phrase',
    detected: unsupportedCandidateClaims.test('This is the most popular phrase'),
  },
];
for (const fixture of candidateGuardFixtures) {
  if (fixture.detected) {
    console.log(`  PASS candidate guard · ${fixture.label}`);
  } else {
    addFinding('ERROR', 'CANDIDATE_GUARD_FIXTURE', `${fixture.label}: failed to reject "${fixture.value}".`);
  }
}

for (const [slug, count] of duplicateKeys(terms.map((term) => normalize(term.slug)))) {
  addFinding('ERROR', 'DUPLICATE_SLUG', `"${slug}" appears ${count} times.`);
}

for (const [id, count] of duplicateKeys(terms.map((term) => normalize(term.id)))) {
  addFinding('ERROR', 'DUPLICATE_ID', `"${id}" appears ${count} times.`);
}

for (const [name, count] of duplicateKeys(terms.map((term) => normalize(term.term)))) {
  addFinding('ERROR', 'DUPLICATE_TERM', `"${name}" appears ${count} times.`);
}

const candidates = terms.flatMap((term) =>
  [term.term, ...term.alternateSpellings, ...(term.matchTokens ?? [])]
    .filter(Boolean)
    .map((candidate) => ({ key: normalize(candidate), slug: term.slug, candidate })),
);
const candidateGroups = groupedValues(candidates.map(({ key, slug }) => ({ key, slug })));
for (const [candidate, owners] of candidateGroups) {
  if (owners.length > 1) {
    addFinding('ERROR', 'DUPLICATE_MATCH_TOKEN', `"${candidate}" is shared by ${owners.join(', ')} and would create an ambiguous exact match.`);
  }
}

const singleWordCandidates = candidates.filter(({ key }) => key.length >= 4 && !key.includes(' '));
const reportedOverlapPairs = new Set<string>();
for (let index = 0; index < singleWordCandidates.length; index += 1) {
  for (let nextIndex = index + 1; nextIndex < singleWordCandidates.length; nextIndex += 1) {
    const left = singleWordCandidates[index];
    const right = singleWordCandidates[nextIndex];
    if (left.slug === right.slug || left.key === right.key) continue;
    if (left.key.includes(right.key) || right.key.includes(left.key)) {
      const pair = [left.slug, right.slug].sort().join(':');
      if (reportedOverlapPairs.has(pair)) continue;
      reportedOverlapPairs.add(pair);
      addFinding(
        'WARN',
        'OVERLAPPING_MATCH_TOKEN',
        `"${left.candidate}" (${left.slug}) overlaps "${right.candidate}" (${right.slug}); phrase-boundary matching must keep these separate.`,
      );
    }
  }
}

for (const term of terms) {
  const record = term as unknown as Record<string, unknown>;
  const requiredTextFields = [
    'id',
    'slug',
    'term',
    'partOfSpeech',
    'definition',
    'parentExplanation',
    'generationRelevance',
    'region',
    'culturalCommunityContext',
    'origin',
    'register',
    'lifecycleStatus',
    'currentness',
    'riskExplanation',
    'commonHarmlessUsage',
    'potentiallyConcerningUsage',
    'editorialStatus',
    'confidenceLevel',
    'prototypeVerificationStatus',
    'reviewStatus',
  ];
  const requiredArrayFields = [
    'alternateSpellings',
    'meaningsByContext',
    'exampleUsage',
    'categories',
    'commonPlatforms',
    'ageGroups',
    'relatedTerms',
    'synonyms',
    'antonyms',
    'tone',
    'importantContextNotes',
    'doNotAssume',
  ];

  for (const field of requiredTextFields) {
    if (typeof record[field] !== 'string' || !(record[field] as string).trim()) {
      addFinding('ERROR', 'MISSING_FIELD', `${term.slug}: ${field} must be a non-empty string.`);
    }
  }
  for (const field of requiredArrayFields) {
    if (!Array.isArray(record[field]) || (record[field] as unknown[]).length === 0) {
      addFinding('ERROR', 'MISSING_FIELD', `${term.slug}: ${field} must be a non-empty array.`);
    }
  }
  if (!Array.isArray(term.sourceReferences)) {
    addFinding('ERROR', 'MISSING_FIELD', `${term.slug}: sourceReferences must be an array.`);
  }
  if (!recordTypes.has(term.recordType)) {
    addFinding('ERROR', 'RECORD_TYPE', `${term.slug}: recordType must be term or guide.`);
  }
  if (!editorialStatuses.has(term.editorialStatus)) {
    addFinding('ERROR', 'EDITORIAL_STATUS', `${term.slug}: unsupported editorial status "${term.editorialStatus}".`);
  }
  if (term.reviewer !== null && !term.reviewer.trim()) {
    addFinding('ERROR', 'REVIEWER', `${term.slug}: reviewer must be null or a non-empty name.`);
  }
  if (!reviewStatuses.has(term.reviewStatus)) {
    addFinding('ERROR', 'REVIEW_STATUS', `${term.slug}: unsupported review status "${term.reviewStatus}".`);
  }
  if (term.reviewerRole !== null && !term.reviewerRole.trim()) {
    addFinding('ERROR', 'REVIEWER_ROLE', `${term.slug}: reviewerRole must be null or a non-empty qualification.`);
  }
  if (term.reviewStatus === 'Reviewed') {
    if (term.editorialStatus !== 'Reviewed' ||
        !term.reviewer?.trim() ||
        !term.reviewerRole?.trim() ||
        term.lastVerifiedDate === null ||
        term.sourceReferences.length === 0) {
      addFinding(
        'ERROR',
        'INCOMPLETE_REVIEW_EVIDENCE',
        `${term.slug}: Reviewed entries require a qualified reviewer, role, source, and verification date.`,
      );
    }
  } else if (term.editorialStatus === 'Reviewed') {
    addFinding(
      'ERROR',
      'UNSUPPORTED_REVIEW_STATUS',
      `${term.slug}: editorial status Reviewed requires reviewStatus Reviewed.`,
    );
  }
  if (requiresSensitiveReview(term) &&
      term.reviewStatus !== 'Reviewed' &&
      term.editorialStatus === 'Reviewed') {
    addFinding(
      'ERROR',
      'SENSITIVE_REVIEW_GATE',
      `${term.slug}: sensitive entries cannot be published as Reviewed before qualified review.`,
    );
  }
  for (const source of term.sourceReferences) {
    if (!source.title?.trim()) {
      addFinding('ERROR', 'SOURCE_RECORD', `${term.slug}: every source needs a title.`);
    }
    if (source.url) {
      try {
        const parsed = new URL(source.url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
      } catch {
        addFinding('ERROR', 'SOURCE_RECORD', `${term.slug}: source URL "${source.url}" is malformed or unsafe.`);
      }
    }
  }
  if (!term.categories[0] || !contextLevels[term.riskLevel]) {
    addFinding('ERROR', 'CARD_SHAPE', `${term.slug}: term card requires a first category and valid context level.`);
  }
  if (term.sourceType && !sourceTypes.has(term.sourceType)) {
    addFinding('ERROR', 'SOURCE_TYPE', `${term.slug}: unsupported source type "${term.sourceType}".`);
  }
  if (term.editorialStatus === 'Prototype' && (term.lastVerifiedDate !== null || term.sourceReferences.length > 0)) {
    addFinding('WARN', 'PROTOTYPE_METADATA', `${term.slug}: prototype entry has a verification date or source reference.`);
  }
  for (const issue of auditTerm(term)) {
    addFinding(issue.severity, issue.code, `${term.slug}: ${issue.message}`);
  }
  const batch = dictionaryBatches.find((candidateBatch) =>
    candidateBatch.terms.some((candidate) => candidate.id === term.id),
  );
  const isGovernedExpansion = batch?.name.startsWith('phase-') ?? false;
  if (isGovernedExpansion) {
    const normalizedTokens = [...term.alternateSpellings, ...(term.matchTokens ?? [])]
      .map(normalize);
    for (const token of normalizedTokens) {
      if (ordinaryWordAliases.has(token)) {
        addFinding(
          'ERROR',
          'ORDINARY_WORD_ALIAS',
          `${term.slug}: "${token}" is too broad for a new published alias; keep it in context notes or hold it for review.`,
        );
      }
    }
    if (term.meaningsByContext.length < 2 || term.exampleUsage.length < 2) {
      addFinding(
        'ERROR',
        'INCOMPLETE_CONTEXT',
        `${term.slug}: governed expansions need at least two meanings and two non-sensational examples.`,
      );
    }
    if (term.importantContextNotes.length < 3 || term.doNotAssume.length < 2) {
      addFinding(
        'ERROR',
        'INCOMPLETE_PARENT_CONTEXT',
        `${term.slug}: governed expansions need proportional context notes and at least two do-not-assume statements.`,
      );
    }
    if (
      term.categories.some((category) => sensitiveExpansionCategories.has(category)) &&
      !/alone|ordinary|context|not necessarily|may be/i.test(
        `${term.commonHarmlessUsage} ${term.doNotAssume.join(' ')} ${term.importantContextNotes.join(' ')}`,
      )
    ) {
      addFinding(
        'ERROR',
        'MISSING_NOT_ALWAYS_ALARMING_GUIDANCE',
        `${term.slug}: sensitive entries must explain a plausible non-alarming or context-dependent interpretation.`,
      );
    }
  }
  const conversation = term.parentConversationStarters;
  for (const key of ['Curious', 'Casual', 'Concerned', 'Serious'] as const) {
    if (!conversation || !conversation[key]?.trim()) {
      addFinding('ERROR', 'CONVERSATION_STARTER', `${term.slug}: missing ${key} conversation starter.`);
    }
  }
}

for (const category of establishedCategories) {
  const count = terms.filter((term) => term.categories.includes(category)).length;
  if (!count) addFinding('ERROR', 'CATEGORY_COVERAGE', `${category} has no entries.`);
  else if (!categories.includes(category)) addFinding('ERROR', 'CATEGORY_EXPORT', `${category} is missing from the exported category filters.`);
  else console.log(`  PASS category · ${category}: ${count} entries`);
}
for (const category of expectedCategories.filter(
  (candidate) => !establishedCategories.includes(candidate as (typeof establishedCategories)[number]),
)) {
  const count = terms.filter((term) => term.categories.includes(category)).length;
  if (count) console.log(`  PASS expanded category · ${category}: ${count} entries`);
  else console.log(`  PENDING expanded category · ${category}: no entries yet`);
}

for (const risk of risks) {
  const count = terms.filter((term) => term.riskLevel === risk).length;
  if (!count) addFinding('ERROR', 'RISK_COVERAGE', `${risk} has no entries.`);
  else console.log(`  PASS context level · ${risk} (${contextLevels[risk].label}): ${count} entries`);
}

const expectedCardFields = terms.filter((term) =>
  Boolean(term.slug && term.definition && term.categories[0] && term.currentness && contextLevels[term.riskLevel]),
).length;
if (expectedCardFields !== terms.length) {
  addFinding('ERROR', 'CARD_COVERAGE', `${terms.length - expectedCardFields} entries are missing data used by term cards.`);
} else {
  console.log(`  PASS term cards · ${expectedCardFields}/${terms.length} entries have card-ready data`);
}

console.log('\nSearch fixtures');
expectSearch('exact term', 'rizz', ['rizz']);
expectSearch('pilot exact term', 'lock in', ['lock-in']);
expectSearch('pilot alias', 'one of my followers', ['oomf']);
expectSearch('integrated exact term', 'cooked', ['cooked']);
expectSearch('integrated punctuation normalization', 'COOKED!', ['cooked']);
expectSearch('integrated apostrophe normalization', "it's giving", ['its-giving']);
expectSearch('integrated conservative typo', 'cokked', ['cooked']);
expectSearch('alternate spelling', 'be right back', ['brb']);
expectSearch('phrase', 'go touch grass', ['touch-grass']);
expectSearch('emoji token', '💀', ['skull-emoji']);
expectSearch('meaning text', 'temporary security code', ['otp']);
expectSearch('no-result input', 'qzvplm nowhere', []);
expectSearch('supporting terms stay out of primary lookup', 'self-harm', [], 'primary');
expectSearch('supporting terminology lookup', 'self-harm', ['self-harm'], 'supporting');
expectSearch('held editorial phrase stays out of primary lookup', 'unexpected substance', [], 'primary');
expectSearch('held terminology lookup', 'unexpected substance', ['unexpected-substance'], 'held');
expectSearch('parent guide lookup', 'quieter than usual', ['quieter-than-usual'], 'guides');
if (findExactTermMatch('be-right-back')?.slug === 'brb') {
  console.log('  PASS search handoff · normalized alias opens brb');
} else {
  addFinding('ERROR', 'SEARCH_HANDOFF', 'Normalized home-search alias did not resolve to brb.');
}

console.log('\nFilter fixtures');
const filterFixtures = [
  {
    label: 'category filter',
    found: searchTerms('').filter((term) => term.categories.includes('Emojis')),
    expected: 6,
  },
  {
    label: 'context-level filter',
    found: searchTerms('').filter((term) => term.riskLevel === 'RED'),
    expected: 8,
  },
  {
    label: 'combined search, category, and context level',
    found: searchTerms('rizz').filter(
      (term) => term.categories.includes('Relationships') && term.riskLevel === 'GREEN',
    ),
    expected: 1,
  },
  {
    label: 'combined filters with no valid result',
    found: searchTerms('rizz').filter(
      (term) => term.categories.includes('Gaming') && term.riskLevel === 'RED',
    ),
    expected: 0,
  },
];
for (const fixture of filterFixtures) {
  if (fixture.found.length !== fixture.expected) {
    addFinding(
      'ERROR',
      'FILTER_FIXTURE',
      `${fixture.label}: expected ${fixture.expected} entries; got ${fixture.found.length}.`,
    );
  } else {
    console.log(`  PASS filter · ${fixture.label}: ${fixture.found.length} entries`);
  }
}

console.log('\nMatching fixtures');
expectMatch('exact term', 'rizz', ['rizz']);
expectMatch('pilot phrase', 'We need to lock in for the last round', ['lock-in']);
expectMatch('pilot ambiguity', 'Do not crash out over that post', ['crash-out']);
expectMatch('integrated multi-term sentence', 'Slay! That food is bussin, no cap.', ['slay', 'bussin', 'no-cap']);
expectMatch('integrated apostrophe', 'It’s giving a good vibe', ['its-giving', 'vibe']);
expectMatch('integrated conservative typo', 'I am cokked', ['cooked']);
expectMatch('alternate spelling', 'be right back', ['brb']);
expectMatch('phrase boundary', 'please touch grass', ['touch-grass']);
expectMatch('emoji token', 'I am dead 💀', ['skull-emoji']);
expectMatch('short-token boundary guard', 'stop turn late', []);
expectMatch('ship boundary guard', 'friendship situationship', ['situationship']);
expectMatch('sext boundary guard', 'sextant', []);
expectMatch('sensitive term', 'They threatened sextortion', ['sextortion']);
if (matchTerms('self-harm', 'primary').length !== 0) {
  addFinding('ERROR', 'PRIMARY_SUPPORTING_LEAK', 'Supporting term self-harm entered primary matching.');
} else if (matchTerms('self-harm', 'decoder')[0]?.lexicalClass !== 'Supporting safety/clinical terminology') {
  addFinding('ERROR', 'SUPPORTING_MATCH_LABEL', 'Decoder did not preserve the supporting lexical class for self-harm.');
} else {
  console.log('  PASS match scope · supporting terminology is labeled outside primary');
}
if (matchTerms('unexpected substance', 'decoder').length !== 0) {
  addFinding('ERROR', 'HELD_MATCH_LEAK', 'Held editorial phrase unexpectedly entered decoder matching.');
} else {
  console.log('  PASS match scope · held editorial phrase is excluded from decoder');
}

console.log('\nAmbiguity and decoder fixtures');
expectAnalysis('DM has platform and tabletop meanings', 'DM me after the session', {
  matches: ['dm'],
  probableMeaning: 'dm',
  confidence: 'High',
  contexts: ['Social media', 'Tabletop gaming'],
});
expectAnalysis('OP has gaming and forum meanings', 'The OP said the weapon is OP', {
  matches: ['op'],
  probableMeaning: 'op',
  confidence: 'High',
  contexts: ['Gaming', 'Forums and social media'],
});
expectAnalysis('RN has shorthand and health meanings', 'The RN is available right now', {
  matches: ['rn'],
  probableMeaning: 'rn',
  confidence: 'High',
  contexts: ['Texting', 'Health or work'],
});
expectAnalysis('OTP has fandom and security meanings', 'Never share your OTP', {
  matches: ['otp'],
  probableMeaning: 'otp',
  confidence: 'High',
  contexts: ['Fandom', 'Account security'],
});
expectAnalysis('OOMF keeps follower and friend meanings', 'OOMF recommended that song', {
  matches: ['oomf'],
  probableMeaning: 'oomf',
  confidence: 'High',
  riskLevel: 'BLUE',
  contexts: ['Social media', 'Friend-group conversation'],
});
const nestedMatches = matchTermDetails("That’s so cooked. That’s so cooked.");
if (
  nestedMatches.every((match) => match.term.slug !== 'thats-so-cooked') &&
  searchTerms('That’s so cooked', 'guides')[0]?.slug === 'thats-so-cooked'
) {
  console.log('  PASS analysis · parent guides are discoverable but not decoded as terms');
} else {
  addFinding(
    'ERROR',
    'GUIDE_DECODER_LEAK',
    `Parent guide should not decode as a term; got ${nestedMatches.map((match) => match.term.slug).join(', ') || 'no matches'}.`,
  );
}
if (suggestTermResults('cook')[0]?.term.slug === 'cooked') {
  console.log('  PASS analysis · low-confidence partial input suggests cooked');
} else {
  addFinding('ERROR', 'SUGGESTION_FIXTURE', 'Partial input "cook" did not rank cooked first.');
}
expectAnalysis('combined message aggregates context levels', 'No cap, IYKYK, and KMS', {
  matches: ['no-cap', 'iykyk', 'kms'],
  probableMeaning: 'no-cap',
  confidence: 'Medium',
  riskLevel: 'RED',
});
expectAnalysis('no local match stays low confidence', 'qzvplm nowhere', {
  probableMeaning: null,
  confidence: 'Low',
  riskLevel: 'GREEN',
});

console.log('\nEditorial audit fixtures');
const auditFixtureBase = terms[0];
const auditFixtures = [
  {
    label: 'prototype date claim',
    term: { ...auditFixtureBase, lastVerifiedDate: '2026-09-16' },
    code: 'PROTOTYPE_VERIFICATION_CLAIM',
  },
  {
    label: 'unsupported high confidence',
    term: { ...auditFixtureBase, editorialStatus: 'Reviewed', confidenceLevel: 'High' },
    code: 'UNSUPPORTED_HIGH_CONFIDENCE',
  },
  {
    label: 'unsupported expert review',
    term: { ...auditFixtureBase, editorialStatus: 'Reviewed', sourceType: 'Expert-reviewed' as const },
    code: 'UNSUPPORTED_EXPERT_REVIEW',
  },
];
for (const fixture of auditFixtures) {
  const codes = auditTerm(fixture.term).map((issue) => issue.code);
  if (codes.includes(fixture.code)) {
    console.log(`  PASS editorial audit · ${fixture.label} → ${fixture.code}`);
  } else {
    addFinding('ERROR', 'AUDIT_FIXTURE', `${fixture.label}: expected ${fixture.code}; got ${codes.join(', ') || 'no issues'}.`);
  }
}

const prototypeCount = terms.filter((term) => term.editorialStatus === 'Prototype').length;
const unverifiedCount = terms.filter((term) => term.lastVerifiedDate === null).length;
console.log('\nEditorial verification queue');
console.log(`  ${prototypeCount} prototype entries are marked for verification.`);
console.log(`  ${unverifiedCount} entries have no independent verification date.`);
console.log('  No sources, dates, or confidence values are fabricated by this validation pass.');
const releaseReadiness = getReleaseReadiness(terms);
console.log(`  Verified public launch: ${releaseReadiness.ready ? 'READY' : 'BLOCKED'}.`);
console.log(`  Sensitive entries awaiting qualified review: ${releaseReadiness.pendingSensitiveTerms.length}.`);
if (releaseReadiness.prototypeOnly) {
  console.log('  Prototype-only release: SAFE TO LABEL AS PROTOTYPE.');
}
if (process.argv.includes('--public-launch') && !releaseReadiness.ready) {
  addFinding(
    'ERROR',
    'PUBLIC_LAUNCH_BLOCKED',
    `${releaseReadiness.pendingSensitiveTerms.length} sensitive entries still need qualified independent review.`,
  );
}

console.log('\nCross-context quality audit');
const phase4AuditFailures = runPhase4QualityAudit();
if (phase4AuditFailures.length) {
  for (const failure of phase4AuditFailures) {
    addFinding('ERROR', 'CROSS_CONTEXT_AUDIT', failure);
  }
} else {
  console.log('  PASS cross-context audit · paired contexts, negative controls, and media caveats');
}

const warnings = findings.filter((finding) => finding.severity === 'WARN');
const errors = findings.filter((finding) => finding.severity === 'ERROR');
console.log('\nDuplicate and collision report');
console.log(`  Duplicate slugs: ${findings.filter((finding) => finding.code === 'DUPLICATE_SLUG').length}`);
console.log(`  Duplicate term names: ${findings.filter((finding) => finding.code === 'DUPLICATE_TERM').length}`);
console.log(`  Shared exact match tokens: ${findings.filter((finding) => finding.code === 'DUPLICATE_MATCH_TOKEN').length}`);
console.log(`  Boundary-protected token overlaps: ${findings.filter((finding) => finding.code === 'OVERLAPPING_MATCH_TOKEN').length}`);
console.log('  Intentional multi-meaning entries exercised: DM, OP, RN, OTP, crash out, OOMF');

console.log(`\nQA summary: ${errors.length} errors · ${warnings.length} warnings`);
if (findings.length) {
  for (const finding of findings) {
    console.log(`  ${finding.severity} ${finding.code} · ${finding.message}`);
  }
}

if (errors.length) {
  process.exitCode = 1;
} else {
  console.log('QA result: PASS');
}