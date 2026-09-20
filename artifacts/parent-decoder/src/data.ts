export {
  contextLevels,
  createPrototypeEntry,
} from './dictionary/model';
export type {
  Category,
  ContextLevel,
  ContextMeaning,
  ConversationStarters,
  LexicalClass,
  LexicalClassificationSource,
  LexicalDisposition,
  PrototypeTermInput,
  ReviewStatus,
  SourceReference,
  SourceType,
  Term,
} from './dictionary/model';
export { lexicalClassDetails } from './dictionary/lexical-classification';

import {
  contextLevels,
  type Category,
  type ContextLevel,
  type ContextMeaning,
  type LexicalClass,
  type Term,
} from './dictionary/model';
import { terms } from './dictionary';

export { terms };
export const primaryTerms = terms.filter((term) =>
  term.lexicalClass === 'Slang or informal expression' ||
  term.lexicalClass === 'Established internet/platform/community terminology',
);
export const supportingTerms = terms.filter(
  (term) => term.lexicalClass === 'Supporting safety/clinical terminology',
);
export const guideTerms = terms.filter((term) => term.lexicalClass === 'Parent guide');
export const heldTerms = terms.filter((term) => term.lexicalClass === 'Held for verification');

export type TermSearchScope = 'primary' | 'supporting' | 'guides' | 'held' | 'all' | 'decoder';

export function termsForScope(scope: TermSearchScope = 'all') {
  if (scope === 'primary') return primaryTerms;
  if (scope === 'supporting') return supportingTerms;
  if (scope === 'guides') return guideTerms;
  if (scope === 'held') return heldTerms;
  if (scope === 'decoder') return [...primaryTerms, ...supportingTerms];
  return terms;
}

export function isPrimaryLexicalClass(lexicalClass: LexicalClass) {
  return lexicalClass === 'Slang or informal expression' ||
    lexicalClass === 'Established internet/platform/community terminology';
}
export const categories = Array.from(
  new Set(terms.flatMap((term) => term.categories)),
) as Category[];

export const risks: ContextLevel[] = ['GREEN', 'BLUE', 'YELLOW', 'ORANGE', 'RED'];

export function getTerm(slug?: string) {
  return terms.find((term) => term.slug === slug);
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’'`]/g, '')
    .replace(/[\p{P}\p{Z}_]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SearchMatchKind =
  | 'term'
  | 'alias'
  | 'typo'
  | 'related'
  | 'meaning'
  | 'example';

export type TermSearchResult = {
  term: Term;
  matchKind: SearchMatchKind;
  matchedText: string;
  score: number;
};

function levenshtein(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function isConservativeTypo(query: string, candidate: string) {
  if (query.length < 5 || candidate.length < 5) return false;
  if (Math.abs(query.length - candidate.length) > 1) return false;
  if (query[0] !== candidate[0]) return false;
  return levenshtein(query, candidate) === 1;
}

export function searchTermResults(
  query: string,
  scope: TermSearchScope = 'primary',
): TermSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const scopedTerms = termsForScope(scope);
  const nonPrimaryExactTerms = termsForScope('supporting')
    .concat(termsForScope('held'), termsForScope('guides'))
    .flatMap((term) => [
      term.term,
      ...term.alternateSpellings,
      ...(term.matchTokens ?? []),
    ])
    .map(normalizeSearchText);
  if (scope === 'primary' && nonPrimaryExactTerms.includes(normalizedQuery)) {
    return [];
  }
  if (!normalizedQuery) {
    return scopedTerms.map((term) => ({
      term,
      matchKind: 'term',
      matchedText: term.term,
      score: 0,
    }));
  }

  const ranked = scopedTerms
    .map((term): TermSearchResult | null => {
      const normalizedTerm = normalizeSearchText(term.term);
      const aliases = [
        ...term.alternateSpellings,
        ...(term.matchTokens ?? []),
      ].map((value) => ({ value, normalized: normalizeSearchText(value) }));
      const related = term.relatedTerms.map((value) => ({
        value,
        normalized: normalizeSearchText(value),
      }));
      const definitions = [term.definition, term.parentExplanation];

      if (normalizedTerm === normalizedQuery) {
        return { term, matchKind: 'term', matchedText: term.term, score: 120 };
      }

      const exactAlias = aliases.find(({ normalized }) => normalized === normalizedQuery);
      if (exactAlias) {
        return { term, matchKind: 'alias', matchedText: exactAlias.value, score: 110 };
      }

      if (normalizedTerm.startsWith(normalizedQuery)) {
        return { term, matchKind: 'term', matchedText: term.term, score: 90 };
      }

      const prefixAlias = aliases.find(({ normalized }) => normalized.startsWith(normalizedQuery));
      if (prefixAlias) {
        return { term, matchKind: 'alias', matchedText: prefixAlias.value, score: 85 };
      }

      if (normalizedTerm.includes(normalizedQuery)) {
        return { term, matchKind: 'term', matchedText: term.term, score: 80 };
      }

      const partialAlias = aliases.find(({ normalized }) => normalized.includes(normalizedQuery));
      if (partialAlias) {
        return { term, matchKind: 'alias', matchedText: partialAlias.value, score: 75 };
      }

      if (isConservativeTypo(normalizedQuery, normalizedTerm)) {
        return { term, matchKind: 'typo', matchedText: term.term, score: 65 };
      }

      const typoAlias = aliases.find(({ normalized }) =>
        isConservativeTypo(normalizedQuery, normalized),
      );
      if (typoAlias) {
        return { term, matchKind: 'typo', matchedText: typoAlias.value, score: 60 };
      }

      const relatedMatch = related.find(({ normalized }) => normalized.includes(normalizedQuery));
      if (relatedMatch) {
        return { term, matchKind: 'related', matchedText: relatedMatch.value, score: 55 };
      }

      const meaningMatch = definitions.find((value) =>
        normalizeSearchText(value).includes(normalizedQuery),
      );
      if (meaningMatch) {
        return { term, matchKind: 'meaning', matchedText: meaningMatch, score: 40 };
      }

      const exampleMatch = term.exampleUsage.find((value) =>
        normalizeSearchText(value).includes(normalizedQuery),
      );
      if (exampleMatch) {
        return { term, matchKind: 'example', matchedText: exampleMatch, score: 30 };
      }

      return null;
    })
    .filter((result): result is TermSearchResult => result !== null)
    .sort((left, right) => right.score - left.score);

  const exactMatches = ranked.filter((result) => result.score >= 110);
  return exactMatches.length > 0 ? exactMatches : ranked;
}

export function searchTerms(query: string, scope: TermSearchScope = 'all') {
  return searchTermResults(query, scope).map(({ term }) => term);
}

export function findExactTermMatch(query: string, scope: TermSearchScope = 'primary') {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return undefined;

  return termsForScope(scope).find((term) =>
    [term.term, ...term.alternateSpellings, ...(term.matchTokens ?? [])]
      .map(normalizeSearchText)
      .includes(normalizedQuery),
  );
}

type IndexedText = {
  source: string;
  text: string;
  sourceIndexes: number[];
};

function normalizeWithIndexes(source: string): IndexedText {
  let text = '';
  const sourceIndexes: number[] = [];
  let sourceIndex = 0;
  for (const originalCharacter of source) {
    const character = originalCharacter.toLowerCase();
    if (/[’'`]/u.test(character)) {
      sourceIndex += originalCharacter.length;
      continue;
    }
    if (/[\p{L}\p{N}\p{S}]/u.test(character)) {
      for (const normalizedCharacter of character) {
        text += normalizedCharacter;
        sourceIndexes.push(sourceIndex);
      }
    } else if (text && text[text.length - 1] !== ' ') {
      text += ' ';
      sourceIndexes.push(sourceIndex);
    }
    sourceIndex += originalCharacter.length;
  }
  while (text.endsWith(' ')) {
    text = text.slice(0, -1);
    sourceIndexes.pop();
  }
  return { source, text, sourceIndexes };
}

function isWordCharacter(character?: string) {
  return Boolean(character && /[\p{L}\p{N}]/u.test(character));
}

function sourceEnd(indexed: IndexedText, normalizedEnd: number) {
  const lastSourceIndex = indexed.sourceIndexes[Math.max(0, normalizedEnd - 1)];
  if (lastSourceIndex === undefined) return 0;
  const point = indexed.source.codePointAt(lastSourceIndex);
  return lastSourceIndex + (point !== undefined && point > 0xffff ? 2 : 1);
}

export type RecognizedPhrase = {
  term: Term;
  kind: 'term' | 'alias' | 'typo';
  matchedText: string;
  canonicalText: string;
  start: number;
  end: number;
  score: number;
  explanation: string;
};

function phraseOccurrences(
  indexed: IndexedText,
  canonicalText: string,
  term: Term,
  kind: 'term' | 'alias',
  score: number,
): RecognizedPhrase[] {
  const normalizedPhrase = normalizeSearchText(canonicalText);
  if (!normalizedPhrase) return [];
  const found: RecognizedPhrase[] = [];
  let fromIndex = 0;
  while (fromIndex <= indexed.text.length - normalizedPhrase.length) {
    const start = indexed.text.indexOf(normalizedPhrase, fromIndex);
    if (start < 0) break;
    const end = start + normalizedPhrase.length;
    const hasBoundaries =
      !isWordCharacter(indexed.text[start - 1]) &&
      !isWordCharacter(indexed.text[end]);
    if (hasBoundaries) {
      const originalStart = indexed.sourceIndexes[start] ?? 0;
      const originalEnd = sourceEnd(indexed, end);
      found.push({
        term,
        kind,
        matchedText: indexed.source.slice(originalStart, originalEnd),
        canonicalText,
        start: originalStart,
        end: originalEnd,
        score,
        explanation:
          kind === 'term'
            ? `Matched the primary phrase “${term.term}”.`
            : `Matched alternate wording “${canonicalText}” for “${term.term}”.`,
      });
    }
    fromIndex = start + Math.max(1, normalizedPhrase.length);
  }
  return found;
}

function typoOccurrences(indexed: IndexedText, scopedTerms: Term[]): RecognizedPhrase[] {
  const words = Array.from(indexed.text.matchAll(/[^\s]+/gu)).map((match) => ({
    value: match[0],
    start: match.index,
  }));
  const exactTokens = new Set(
    scopedTerms.flatMap((term) =>
      [term.term, ...term.alternateSpellings, ...(term.matchTokens ?? [])]
        .map(normalizeSearchText)
        .filter(Boolean),
    ),
  );
  const found: RecognizedPhrase[] = [];
  for (const term of scopedTerms) {
    const candidates = [
      { value: term.term, kind: 'term' as const, score: 70 },
      ...term.alternateSpellings.map((value) => ({
        value,
        kind: 'alias' as const,
        score: 65,
      })),
    ];
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeSearchText(candidate.value);
      const wordCount = normalizedCandidate.split(' ').length;
      if (normalizedCandidate.length < 5 || wordCount > 4) continue;
      for (let index = 0; index <= words.length - wordCount; index += 1) {
        const window = words.slice(index, index + wordCount);
        const value = window.map((word) => word.value).join(' ');
        if (exactTokens.has(value) || !isConservativeTypo(value, normalizedCandidate)) {
          continue;
        }
        const normalizedStart = window[0].start;
        const normalizedEnd =
          window[window.length - 1].start + window[window.length - 1].value.length;
        const originalStart = indexed.sourceIndexes[normalizedStart] ?? 0;
        const originalEnd = sourceEnd(indexed, normalizedEnd);
        found.push({
          term,
          kind: 'typo',
          matchedText: indexed.source.slice(originalStart, originalEnd),
          canonicalText: candidate.value,
          start: originalStart,
          end: originalEnd,
          score: candidate.score,
          explanation: `Close spelling match: “${indexed.source.slice(originalStart, originalEnd)}” may mean “${candidate.value}”.`,
        });
      }
    }
  }
  return found;
}

function overlaps(left: RecognizedPhrase, right: RecognizedPhrase) {
  return left.start < right.end && right.start < left.end;
}

export function matchTermDetails(
  message: string,
  scope: TermSearchScope = 'decoder',
): RecognizedPhrase[] {
  const indexed = normalizeWithIndexes(message);
  if (!indexed.text) return [];
  const scopedTerms = termsForScope(scope);
  const confident = scopedTerms.flatMap((term) => [
    ...phraseOccurrences(indexed, term.term, term, 'term', 120),
    ...term.alternateSpellings.flatMap((alias) =>
      phraseOccurrences(indexed, alias, term, 'alias', 110),
    ),
    ...(term.matchTokens ?? []).flatMap((alias) =>
      phraseOccurrences(indexed, alias, term, 'alias', 110),
    ),
  ]);
  const candidates = [...confident, ...typoOccurrences(indexed, scopedTerms)].sort(
    (left, right) =>
      right.score - left.score ||
      (right.end - right.start) - (left.end - left.start) ||
      left.start - right.start,
  );
  const selected: RecognizedPhrase[] = [];
  for (const candidate of candidates) {
    if (selected.some((match) => overlaps(match, candidate))) continue;
    selected.push(candidate);
  }
  return selected.sort((left, right) => left.start - right.start);
}

export function matchTerms(message: string, scope: TermSearchScope = 'decoder') {
  const seen = new Set<string>();
  return matchTermDetails(message, scope)
    .filter(({ term }) => {
      if (seen.has(term.id)) return false;
      seen.add(term.id);
      return true;
    })
    .map(({ term }) => term);
}

export function suggestTermResults(
  input: string,
  limit = 5,
  scope: TermSearchScope = 'primary',
) {
  const normalized = normalizeSearchText(input);
  if (!normalized) return [];
  const words = normalized.split(' ');
  const queries = [normalized, ...words.filter((word) => word.length >= 4)];
  const best = new Map<string, TermSearchResult>();
  for (const query of queries) {
    for (const result of searchTermResults(query, scope)) {
      const existing = best.get(result.term.id);
      if (!existing || result.score > existing.score) best.set(result.term.id, result);
    }
  }
  return Array.from(best.values())
    .filter((result) => result.score >= 40)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export type DecoderConfidence = 'High' | 'Medium' | 'Low';

export type DecoderAnalysis = {
  input: string;
  matches: Term[];
  recognizedPhrases: RecognizedPhrase[];
  suggestions: TermSearchResult[];
  probableMeaning: Term | null;
  alternativeMeanings: ContextMeaning[];
  platforms: string[];
  contexts: string[];
  categories: Category[];
  riskLevel: ContextLevel;
  confidence: DecoderConfidence;
  moreConcerning: string[];
  probablyHarmless: string[];
  doNotAssume: string[];
  analysisMethod: string[];
};

const contextLevelOrder: ContextLevel[] = ['GREEN', 'BLUE', 'YELLOW', 'ORANGE', 'RED'];

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function analyzeMessage(input: string): DecoderAnalysis {
  const recognizedPhrases = matchTermDetails(input, 'decoder');
  const matches = matchTerms(input, 'decoder');
  const probableMeaning = matches[0] ?? null;
  const alternativeMeanings = unique(
    matches.flatMap((term) =>
      term.meaningsByContext.map((meaning) => `${meaning.context}: ${meaning.meaning}`),
    ),
  ).map((meaning) => {
    const [context, ...rest] = meaning.split(': ');
    return { context, meaning: rest.join(': ') };
  });
  const riskLevel = matches.reduce<ContextLevel>(
    (highest, term) =>
      contextLevelOrder.indexOf(term.riskLevel) > contextLevelOrder.indexOf(highest)
        ? term.riskLevel
        : highest,
    'GREEN',
  );

  return {
    input,
    matches,
    recognizedPhrases,
    suggestions: matches.length ? [] : suggestTermResults(input, 5, 'primary'),
    probableMeaning,
    alternativeMeanings,
    platforms: unique(matches.flatMap((term) => term.commonPlatforms)),
    contexts: unique(matches.flatMap((term) => term.meaningsByContext.map((meaning) => meaning.context))),
    categories: unique(matches.flatMap((term) => term.categories)) as Category[],
    riskLevel,
    confidence: matches.length === 0 ? 'Low' : matches.length === 1 ? 'High' : 'Medium',
    moreConcerning: matches.length
      ? unique(matches.map((term) => term.potentiallyConcerningUsage))
      : ['The message contains details about pressure, threats, secrecy, repeated targeting, or someone saying they may not be safe.'],
    probablyHarmless: matches.length
      ? unique(matches.map((term) => term.commonHarmlessUsage))
      : ['The phrase is ordinary language used in a familiar conversation, with no pressure, threats, or repeated pattern around it.'],
    doNotAssume: unique([
      'This term alone does not establish a problem.',
      'Context matters.',
      'Look for patterns rather than one word.',
      ...matches.flatMap((term) => term.doNotAssume),
    ]),
    analysisMethod: [
      'Matched lowercased words, aliases, and relevant emoji tokens against this local dictionary.',
      'Collected the matched entries’ stored meanings, platforms, contexts, and usage notes.',
      'Set confidence from the number of local matches; it does not infer intent, identity, or behavior.',
    ],
  };
}