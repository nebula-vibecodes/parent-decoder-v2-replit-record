import {
  createPrototypeEntry as entry,
  type Category,
  type ContextLevel,
  type Term,
} from '../model';

export type IntegratedEntrySpec = {
  slug: string;
  term: string;
  aliases: string[];
  summary: string;
  parentExplanation: string;
  meanings: Array<{ context: string; meaning: string }>;
  examples: string[];
  categories: Category[];
  risk: ContextLevel;
  tone: string[];
  platforms: string[];
  related: string[];
  harmless: string;
  concerning: string;
  doNotAssume: string[];
  conversation: {
    Curious: string;
    Casual: string;
    Concerned: string;
    Serious: string;
  };
  region?: string;
  guide?: boolean;
};

export function integratedEntry(spec: IntegratedEntrySpec): Term {
  return entry({
    id: spec.slug,
    recordType: spec.guide ? 'guide' : 'term',
    slug: spec.slug,
    term: spec.term,
    alternateSpellings: spec.aliases,
    pronunciation: null,
    partOfSpeech: spec.guide ? 'topic guide' : 'informal term',
    definition: spec.summary,
    parentExplanation: spec.parentExplanation,
    meaningsByContext: spec.meanings,
    exampleUsage: spec.examples,
    categories: spec.categories,
    commonPlatforms: spec.platforms,
    ageGroups: ['Tweens', 'Teens', 'Young adults', 'Adults'],
    generationRelevance:
      'Use varies by age, community, platform, and moment; this prototype does not generalize usage.',
    region: spec.region ?? 'English-language contexts; regional and community meanings may differ.',
    culturalCommunityContext:
      'The phrase can shift between friend groups and platforms. Read the surrounding words, relationship, and tone.',
    origin:
      'Editorial prototype wording; origin and adoption are not independently verified in this edition.',
    relatedTerms: spec.related,
    synonyms: ['context-dependent equivalent'],
    antonyms: ['context-dependent contrast'],
    tone: spec.tone,
    register: 'Informal',
    lifecycleStatus: 'Prototype language',
    currentness:
      'Meaning may shift by community and moment; this prototype does not track live frequency or popularity.',
    riskLevel: spec.risk,
    riskExplanation:
      'This context level is guidance for reading the surrounding situation, not a diagnosis or conclusion.',
    commonHarmlessUsage: spec.harmless,
    potentiallyConcerningUsage: spec.concerning,
    importantContextNotes: [
      'The phrase alone does not establish intent, danger, or a problem.',
      'Ask for the person’s own meaning when the surrounding context is unclear.',
    ],
    parentConversationStarters: spec.conversation,
    doNotAssume: spec.doNotAssume,
  });
}