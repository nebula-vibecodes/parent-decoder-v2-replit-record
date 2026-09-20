import assert from 'node:assert/strict';
import {
  analyzeMessage,
  findExactTermMatch,
  matchTermDetails,
  matchTerms,
  normalizeSearchText,
  searchTermResults,
  searchTerms,
  lexicalClassDetails,
  suggestTermResults,
  terms,
} from '../src/data.ts';
import { dictionaryCandidates } from '../src/dictionary-candidates.ts';
import {
  auditTerm,
  getReleaseReadiness,
  isReviewEvidenceComplete,
  requiresSensitiveReview,
} from '../src/editorial-audit.ts';
import { routeMeta } from '../src/components/route-quality.tsx';
import { classifyUnifiedInput } from '../src/components/unified-input';
import { createSavedPromptStore } from '../src/saved-prompts.ts';
import {
  buildReportDraft,
  isValidPublicReportingRecipient,
  REPORT_EXPLANATION_MAX_LENGTH,
  reportIssueOptions,
  validateReportForm,
} from '../src/report-email.ts';
import { runPhase4QualityAudit } from './phase-4-quality-audit.ts';

let assertions = 0;
function check(value: unknown, message: string) {
  assertions += 1;
  assert.ok(value, message);
}

function equal<T>(actual: T, expected: T, message: string) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const integratedSlugs = [
  'cooked',
  'slay',
  'bussin',
  'salty',
  'extra',
  'highkey',
  'skibidi',
  'gyatt',
  'fanum-tax',
  'bruh',
  'vibe',
  'goated',
  'understood-the-assignment',
  'its-giving',
  'np',
  'based',
  'thats-so-cooked',
  'quieter-than-usual',
  'new-trend-or-post',
];

const routeCases = [
  ['/', 'Home'],
  ['/discover', 'Home'],
  ['/dictionary', 'Dictionary'],
  ['/library', 'Dictionary'],
  ['/library/everyday-slang', 'Everyday slang · Dictionary'],
  ['/decoder', 'Decode a message'],
  ['/terms/ghosting', 'ghosting · Dictionary'],
  ['/conversation-starters', 'Conversation starters'],
  ['/saved', 'Saved prompts'],
  ['/approach', 'Privacy and responsible use'],
  ['/privacy', 'Privacy and responsible use'],
  ['/editorial-review', 'Editorial review'],
  ['/unknown', 'Page not found'],
] as const;
for (const [path, title] of routeCases) {
  equal(routeMeta(path).title, title, `${path} has a route-specific title`);
  check(routeMeta(path).description.length > 30, `${path} has a concise description`);
}

const storageData = new Map<string, string>();
const fakeStorage = {
  getItem: (key: string) => storageData.get(key) ?? null,
  setItem: (key: string, value: string) => { storageData.set(key, value); },
  removeItem: (key: string) => { storageData.delete(key); },
};
const firstStore = createSavedPromptStore(fakeStorage);
const firstSaved = firstStore.add('  No cap, what does this mean?  ');
equal(firstSaved.length, 1, 'saving trims and stores one prompt');
const secondStore = createSavedPromptStore(fakeStorage);
equal(secondStore.read()[0]?.text, 'No cap, what does this mean?', 'saved prompt persists in browser storage');
equal(secondStore.add('No cap, what does this mean?').length, 1, 'duplicate prompts are not duplicated');
secondStore.queue('Reuse this locally');
equal(secondStore.consume(), 'Reuse this locally', 'saved prompt reuse queues locally for the decoder');
equal(secondStore.consume(), '', 'queued prompt is consumed once');
equal(secondStore.remove(firstSaved[0].id).length, 0, 'saved prompt can be removed');
firstStore.add('One');
firstStore.add('Two');
equal(firstStore.clear().length, 0, 'saved prompts can be cleared');

equal(terms.length, 265, 'the existing, integrated, and governed expansion records are published');
equal(new Set(terms.map((term) => term.id)).size, terms.length, 'record identities are unique');
equal(new Set(terms.map((term) => term.slug)).size, terms.length, 'record slugs are unique');
equal(
  terms.reduce<Record<string, number>>((counts, term) => {
    counts[term.lexicalClass] = (counts[term.lexicalClass] ?? 0) + 1;
    return counts;
  }, {}),
  {
    'Slang or informal expression': 105,
    'Established internet/platform/community terminology': 79,
    'Supporting safety/clinical terminology': 47,
    'Parent guide': 3,
    'Held for verification': 31,
  },
  'every record has an explicit final lexical class',
);
check(Boolean(lexicalClassDetails['Supporting safety/clinical terminology']), 'lexical class labels are available to the UI');
check(
  terms.every((term) => term.reviewStatus === 'Unreviewed' && !isReviewEvidenceComplete(term)),
  'the current edition does not claim independent review',
);
const pendingSensitiveTerms = terms.filter(requiresSensitiveReview);
equal(pendingSensitiveTerms.length, 121, 'sensitive review scope is explicit and stable');
const releaseReadiness = getReleaseReadiness(terms);
check(!releaseReadiness.ready, 'verified public launch remains blocked while sensitive entries are pending');
check(releaseReadiness.prototypeOnly, 'the current edition is safe only as clearly labelled prototype content');
for (const slug of integratedSlugs) {
  const term = terms.find((candidate) => candidate.slug === slug);
  check(term, `${slug} is published`);
  equal(term?.editorialStatus, 'Prototype', `${slug} remains a prototype`);
  equal(term?.lastVerifiedDate, null, `${slug} has no invented review date`);
  equal(term?.reviewer, null, `${slug} has no invented reviewer`);
  equal(term?.sourceReferences.length, 0, `${slug} has no invented source`);
}

equal(findExactTermMatch('ghosted')?.slug, 'ghosting', 'ghosted reuses ghosting');
equal(findExactTermMatch('no cap')?.slug, 'no-cap', 'no cap remains an exact phrase');
equal(findExactTermMatch('cap'), undefined, 'literal cap is not a no-cap alias');
equal(findExactTermMatch('dead')?.slug, 'skull-emoji', 'dead reuses skull emoji');
equal(findExactTermMatch('💀')?.slug, 'skull-emoji', 'emoji token resolves locally');
equal(findExactTermMatch('self-harm'), undefined, 'supporting terms are not primary home lookups');
equal(searchTerms('self-harm', 'supporting')[0]?.slug, 'self-harm', 'supporting terms have a separate lookup scope');
equal(searchTerms('unexpected substance', 'held')[0]?.slug, 'unexpected-substance', 'held terms remain directly reviewable');
equal(searchTerms('quieter than usual', 'guides')[0]?.slug, 'quieter-than-usual', 'parent guides remain discoverable');

equal(normalizeSearchText('  IT’S---GIVING  '), 'its giving', 'apostrophes and punctuation normalize');
equal(normalizeSearchText('fanum_tax'), 'fanum tax', 'underscores normalize as spacing');
equal(searchTermResults('COOKED!')[0]?.term.slug, 'cooked', 'punctuated primary search is exact');
equal(searchTermResults('we_are_cooked')[0]?.term.slug, 'cooked', 'spacing variant finds an alias');
equal(searchTermResults('cokked')[0]?.matchKind, 'typo', 'small typo ranks below confident matches');
equal(searchTermResults('cokked')[0]?.term.slug, 'cooked', 'small typo suggests cooked');
equal(searchTermResults('cooked')[0]?.score, 120, 'exact primary has top score');
equal(searchTermResults('so cooked')[0]?.score, 110, 'exact alias ranks below primary');

equal(
  matchTerms('SLAY! The food is BUSSIN, no cap.').map((term) => term.slug),
  ['slay', 'bussin', 'no-cap'],
  'multiple punctuated terms are recognized',
);
equal(
  matchTermDetails("That’s so cooked. That’s so cooked.").map((match) => match.term.slug),
  ['cooked', 'cooked'],
  'parent guides are not presented as decoded terms while constituent slang remains available',
);
equal(matchTerms('self-harm')[0]?.lexicalClass, 'Supporting safety/clinical terminology', 'decoder labels supporting terminology');
equal(matchTerms('unexpected substance'), [], 'held editorial phrases do not trigger confident decoder matches');
equal(
  matchTerms("it's giving a good vibe").map((term) => term.slug),
  ['its-giving', 'vibe'],
  'curly apostrophe and multiple phrases are recognized',
);
equal(matchTerms('cokked').map((term) => term.slug), ['cooked'], 'decoder recognizes a conservative typo');
equal(matchTerms('friendship situationship').map((term) => term.slug), ['situationship'], 'ship does not match inside words');
equal(matchTerms('sextant proratio').map((term) => term.slug), [], 'short boundary-sensitive terms avoid false positives');
equal(matchTermDetails('').length, 0, 'blank input has no matches');
equal(analyzeMessage('qzvplm nowhere').confidence, 'Low', 'unknown input remains low confidence');
equal(analyzeMessage('qzvplm nowhere').matches.length, 0, 'unknown input is not forced to a term');
equal(suggestTermResults('cook')[0]?.term.slug, 'cooked', 'partial input yields ranked suggestions');
equal(classifyUnifiedInput('rizz'), 'lookup', 'short term auto-detects as dictionary lookup');
equal(classifyUnifiedInput('friendship situationship'), 'lookup', 'short phrase auto-detects as lookup');
equal(classifyUnifiedInput('No cap, she ate that presentation. IYKYK.'), 'decode', 'longer message auto-detects as decoder input');
equal(classifyUnifiedInput(''), 'lookup', 'empty input has a safe lookup default');

for (const candidate of dictionaryCandidates) {
  const text = JSON.stringify(candidate);
  check(!/\bhttps?:\/\//i.test(text), `${candidate.id} contains no link`);
  check(!/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i.test(text), `${candidate.id} contains no email`);
  equal(candidate.needsVerification, true, `${candidate.id} remains marked for verification`);
}

const unsupported = {
  ...terms[0],
  currentness: 'Trending now',
};
check(
  auditTerm(unsupported).some((issue) => issue.code === 'UNSUPPORTED_CURRENTNESS'),
  'unsupported live-currentness claims are detected',
);

equal(isValidPublicReportingRecipient(''), false, 'an empty reporting recipient is unavailable');
equal(isValidPublicReportingRecipient('owner@example.test'), true, 'a dedicated public reporting recipient is accepted');
equal(isValidPublicReportingRecipient('one@example.test,two@example.test'), false, 'multiple recipients are rejected');
equal(reportIssueOptions.length, 6, 'the public report form has six focused issue categories');

const missingReportFields = validateReportForm({
  category: '',
  explanation: '',
  privacyAcknowledged: false,
});
check(Boolean(missingReportFields.category), 'report category is required');
check(Boolean(missingReportFields.privacyAcknowledged), 'privacy acknowledgment is required');
equal(
  validateReportForm({
    category: 'accessibility-problem',
    explanation: 'x'.repeat(REPORT_EXPLANATION_MAX_LENGTH + 1),
    privacyAcknowledged: true,
  }).explanation,
  `Keep the explanation to ${REPORT_EXPLANATION_MAX_LENGTH} characters or fewer.`,
  'report explanations enforce the length limit',
);

const reportDraft = buildReportDraft({
  recipient: 'pilot@example.test',
  pageUrl: 'https://parent-decoder.example/term/rizz?private-query=do-not-copy#history',
  recordType: 'term',
  recordIdentity: 'rizz',
  category: 'incorrect-or-unclear-meaning',
  explanation: 'The public definition could be clearer.',
  decoderInput: 'PRIVATE DECODER INPUT',
  savedPrompts: 'PRIVATE SAVED PROMPTS',
  browsingHistory: 'PRIVATE HISTORY',
  localStorage: 'PRIVATE STORAGE',
  deviceDetails: 'PRIVATE DEVICE',
  accountInformation: 'PRIVATE ACCOUNT',
  hiddenMetadata: 'PRIVATE METADATA',
} as Parameters<typeof buildReportDraft>[0] & Record<string, string>);
equal(reportDraft.recipient, 'pilot@example.test', 'the configured recipient is used');
check(reportDraft.subject.includes('Parent Decoder') && reportDraft.subject.includes('rizz'), 'the subject names the app and entry');
check(reportDraft.body.includes('Issue category: Incorrect or unclear meaning'), 'the body includes the selected category');
check(reportDraft.body.includes('Public page URL: https://parent-decoder.example/term/rizz'), 'the body includes a query-free public page URL');
check(reportDraft.body.includes('Term: rizz'), 'the body includes the term identity');
check(reportDraft.body.includes('Optional explanation: The public definition could be clearer.'), 'the body includes the optional explanation');
for (const excluded of ['private-query', 'PRIVATE DECODER INPUT', 'PRIVATE SAVED PROMPTS', 'PRIVATE HISTORY', 'PRIVATE STORAGE', 'PRIVATE DEVICE', 'PRIVATE ACCOUNT', 'PRIVATE METADATA']) {
  check(!reportDraft.mailto.includes(excluded) && !decodeURIComponent(reportDraft.mailto).includes(excluded), `the report excludes ${excluded}`);
}

equal(runPhase4QualityAudit().length, 0, 'cross-context quality audit passes');

console.log(`Parent Decoder integration tests: ${assertions} assertions passed.`);