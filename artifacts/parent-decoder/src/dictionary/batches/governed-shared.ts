import {
  createPrototypeEntry as entry,
  type Category,
  type ContextLevel,
  type Term,
} from '../model';

export type GovernedEntrySpec = {
  slug: string;
  term: string;
  aliases: string[];
  summary: string;
  parent: string;
  meanings: Array<{ context: string; meaning: string }>;
  examples: string[];
  categories: Category[];
  risk: ContextLevel;
  tone: string[];
  related: string[];
  harmless: string;
  concerning: string;
  platforms?: string[];
  ageGroups?: string[];
  region?: string;
  community?: string;
  origin?: string;
  partOfSpeech?: string;
  matchTokens?: string[];
  notes?: string[];
  doNotAssume?: string[];
  conversation?: {
    Curious: string;
    Casual: string;
    Concerned: string;
    Serious: string;
  };
};

function conversationFor(spec: GovernedEntrySpec) {
  return spec.conversation ?? {
    Curious: `What does “${spec.term}” mean in this conversation?`,
    Casual: `I’ve seen “${spec.term}” before — what did you mean by it here?`,
    Concerned: `I want to understand rather than assume. What was happening around “${spec.term}”?`,
    Serious: `If this connects to pressure or safety, can we talk about what happened and what support would help?`,
  };
}

function riskExplanationFor(risk: ContextLevel) {
  const guidance: Record<ContextLevel, string> = {
    GREEN:
      'Usually low-stakes or ordinary in context, but the surrounding words still matter; this is not a diagnosis or conclusion.',
    BLUE:
      'Context may change the meaning or impact, so read the surrounding situation rather than treating the term as proof; this is not a diagnosis or conclusion.',
    YELLOW:
      'Pause for context and a calm check-in when the surrounding pattern suggests harm, pressure, or targeting; this is not a diagnosis or conclusion.',
    ORANGE:
      'The surrounding situation may need prompt supportive attention when it includes concrete risk or present symptoms; the term alone is not a diagnosis or conclusion.',
    RED:
      'If the surrounding message points to immediate danger or a serious wellbeing concern, prioritize direct supportive help; the term alone is not a diagnosis or conclusion.',
  };
  return guidance[risk];
}

export function governedEntry(spec: GovernedEntrySpec): Term {
  return entry({
    id: spec.slug,
    recordType: 'term',
    slug: spec.slug,
    term: spec.term,
    alternateSpellings: spec.aliases,
    ...(spec.matchTokens ? { matchTokens: spec.matchTokens } : {}),
    pronunciation: null,
    partOfSpeech: spec.partOfSpeech ?? 'informal term',
    definition: spec.summary,
    parentExplanation: spec.parent,
    meaningsByContext: spec.meanings,
    exampleUsage: spec.examples,
    categories: spec.categories,
    commonPlatforms: spec.platforms ?? ['Text messages', 'Group chats', 'Social platforms'],
    ageGroups: spec.ageGroups ?? ['Tweens', 'Teens', 'Young adults', 'Adults'],
    generationRelevance:
      'Age and generation relevance are not independently established in this prototype; usage may vary by community and moment.',
    region:
      spec.region ??
      'Regional and multilingual meanings may differ; this prototype does not independently verify distribution.',
    culturalCommunityContext:
      spec.community ??
      'Read the surrounding words, relationship, audience, and tone. A phrase can shift between communities.',
    origin:
      spec.origin ??
      'Editorial prototype wording; origin and adoption are not independently verified in this edition.',
    relatedTerms: spec.related,
    synonyms: spec.related.slice(0, 2).length
      ? spec.related.slice(0, 2)
      : ['similar wording depends on context'],
    antonyms: ['not necessarily the opposite'],
    tone: spec.tone,
    register: 'Informal',
    lifecycleStatus: 'Prototype language; lifecycle is not independently verified.',
    currentness:
      'Meaning may shift by community and moment; this prototype does not track live frequency or popularity.',
    riskLevel: spec.risk,
    riskExplanation: riskExplanationFor(spec.risk),
    commonHarmlessUsage: spec.harmless,
    potentiallyConcerningUsage: spec.concerning,
    importantContextNotes: [
      'The phrase alone does not establish intent, danger, identity, or a problem.',
      'Ask for the person’s own meaning when the surrounding context is unclear.',
      ...(spec.notes ?? []),
    ],
    parentConversationStarters: conversationFor(spec),
    doNotAssume: spec.doNotAssume ?? [
      'Do not treat this phrase alone as proof of use, intent, danger, or identity.',
      'Look for repeated patterns and ask a calm question before drawing conclusions.',
    ],
  });
}