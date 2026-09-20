export type ContextLevel = 'GREEN' | 'BLUE' | 'YELLOW' | 'ORANGE' | 'RED';
import {
  classifyLexicalRecord,
  type LexicalClass,
  type LexicalClassificationSource,
  type LexicalDisposition,
} from './lexical-classification';

export type {
  LexicalClass,
  LexicalClassificationSource,
  LexicalDisposition,
} from './lexical-classification';

export type Category =
  | 'Everyday slang'
  | 'Texting'
  | 'Gaming'
  | 'Memes'
  | 'Emojis'
  | 'Relationships'
  | 'Social media'
  | 'Bullying & harassment'
  | 'Online safety'
  | 'Cultural & community'
  | 'Sensitive topics'
  | 'Substance use'
  | 'Mental health'
  | 'School & peer life'
  | 'Scams & financial safety'
  | 'Violence & weapons'
  | 'Body image & eating concerns'
  | 'Consent & sexual safety'
  | 'Risky challenges';

export type ContextMeaning = {
  context: string;
  meaning: string;
};

export type ConversationStarters = {
  Curious: string;
  Casual: string;
  Concerned: string;
  Serious: string;
};

export type SourceReference = {
  title: string;
  publisher?: string;
  locator?: string;
  url?: string;
};

export type SourceType =
  | 'Editorial'
  | 'Dictionary'
  | 'Documented usage'
  | 'Platform/community observation'
  | 'Expert-reviewed'
  | 'User-submitted pending review';

export type ReviewStatus = 'Unreviewed' | 'Reviewed' | 'Held';

export type Term = {
  id: string;
  recordType: 'term' | 'guide';
  slug: string;
  term: string;
  alternateSpellings: string[];
  matchTokens?: string[];
  pronunciation: string | null;
  partOfSpeech: string;
  definition: string;
  parentExplanation: string;
  meaningsByContext: ContextMeaning[];
  exampleUsage: string[];
  categories: Category[];
  commonPlatforms: string[];
  ageGroups: string[];
  generationRelevance: string;
  region: string;
  culturalCommunityContext: string;
  origin: string;
  relatedTerms: string[];
  synonyms: string[];
  antonyms: string[];
  tone: string[];
  register: string;
  lifecycleStatus: string;
  currentness: string;
  lastVerifiedDate: string | null;
  reviewer: string | null;
  reviewerRole: string | null;
  reviewStatus: ReviewStatus;
  riskLevel: ContextLevel;
  riskExplanation: string;
  commonHarmlessUsage: string;
  potentiallyConcerningUsage: string;
  importantContextNotes: string[];
  parentConversationStarters: ConversationStarters;
  doNotAssume: string[];
  sourceReferences: SourceReference[];
  definitionSource: string;
  contextSource: string;
  sourceType: SourceType;
  editorialStatus: string;
  confidenceLevel: string;
  prototypeVerificationStatus: string;
  lexicalClass: LexicalClass;
  lexicalClassificationSource: LexicalClassificationSource;
  lexicalDisposition: LexicalDisposition;
  lexicalDispositionReason: string;
};

const prototypeStatus = {
  sourceReferences: [] as SourceReference[],
  definitionSource: 'Parent Decoder editorial guidance; no independent source listed',
  contextSource: 'Parent Decoder editorial guidance and prototype context notes; no independent source listed',
  sourceType: 'Editorial' as SourceType,
  editorialStatus: 'Prototype',
  confidenceLevel: 'Moderate',
  prototypeVerificationStatus: 'Prototype entry — verification in progress',
  lastVerifiedDate: null,
  reviewer: null,
  reviewerRole: null,
  reviewStatus: 'Unreviewed' as ReviewStatus,
};

const unsupportedPrototypeClaim =
  /\b(active|common|continually|current|established|important|increasingly|popular|recogniz(?:able|ed)|relevant|stable|widely)\b/i;
const broadPrototypeRegion = /^(?:global|english-language internet|english-language contexts)\b/i;

function normalizePrototypeMetadata(term: Term): Term {
  return {
    ...term,
    generationRelevance: unsupportedPrototypeClaim.test(term.generationRelevance)
      ? 'Age and generation relevance are not independently established in this prototype; usage may vary by community and moment.'
      : term.generationRelevance,
    region: broadPrototypeRegion.test(term.region)
      ? 'Regional and multilingual meanings may differ; this prototype does not independently verify distribution.'
      : term.region,
    lifecycleStatus: unsupportedPrototypeClaim.test(term.lifecycleStatus)
      ? 'Prototype language; lifecycle is not independently verified.'
      : term.lifecycleStatus,
    currentness: unsupportedPrototypeClaim.test(term.currentness)
      ? 'Meaning and frequency may shift by community and platform; this prototype does not track live frequency or popularity.'
      : term.currentness,
  };
}

export type PrototypeTermInput = Omit<
    Term,
    | 'id'
    | 'recordType'
    | 'sourceReferences'
    | 'definitionSource'
    | 'contextSource'
    | 'sourceType'
    | 'editorialStatus'
    | 'confidenceLevel'
    | 'prototypeVerificationStatus'
    | 'lastVerifiedDate'
    | 'reviewer'
    | 'reviewerRole'
    | 'reviewStatus'
    | 'lexicalClass'
    | 'lexicalClassificationSource'
    | 'lexicalDisposition'
    | 'lexicalDispositionReason'
  > & {
    id?: string;
    recordType?: 'term' | 'guide';
  lexicalClass?: LexicalClass;
  };

export function createPrototypeEntry(term: PrototypeTermInput): Term {
  const classification = classifyLexicalRecord({
    slug: term.slug,
    term: term.term,
    recordType: term.recordType ?? 'term',
    explicitClass: term.lexicalClass,
  });
  return normalizePrototypeMetadata({
    ...prototypeStatus,
    id: term.id ?? term.slug,
    recordType: term.recordType ?? 'term',
    ...term,
    lexicalClass: classification.lexicalClass,
    lexicalClassificationSource: classification.lexicalClassificationSource,
    lexicalDisposition: classification.lexicalDisposition,
    lexicalDispositionReason: classification.reason,
  });
}

export const contextLevels: Record<
  ContextLevel,
  { label: string; guidance: string }
> = {
  GREEN: {
    label: 'Everyday',
    guidance: 'Usually ordinary language; read the surrounding message.',
  },
  BLUE: {
    label: 'Contextual',
    guidance: 'Meaning shifts with the group, platform, or tone.',
  },
  YELLOW: {
    label: 'Sensitive',
    guidance: 'Pause and ask; it may land differently for different people.',
  },
  ORANGE: {
    label: 'Concerning',
    guidance: 'Look at the broader pattern and check in calmly.',
  },
  RED: {
    label: 'High Concern',
    guidance: 'A term alone proves nothing; prioritize a direct, supportive check-in.',
  },
};

