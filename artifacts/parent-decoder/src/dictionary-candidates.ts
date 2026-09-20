import type { Category, ContextLevel } from './data';

export type CandidateTriage = 'hold' | 'reject' | 'promote';

export type DictionaryCandidate = {
  id: string;
  term: string;
  aliases: string[];
  plainLanguageMeaning: string;
  observedContext: string;
  categories: Category[];
  proposedRisk: ContextLevel;
  riskRationale: string;
  ambiguityNotes: string;
  needsVerification: boolean;
  triage: CandidateTriage;
  triageReason: string;
  promotedSlug?: string;
};

/**
 * Local editorial intake only. Keep observations summarized and anonymous:
 * no message transcripts, names, handles, links, screenshots, or contact details.
 */
export const dictionaryCandidates: DictionaryCandidate[] = [
  {
    id: 'candidate-lock-in',
    term: 'lock in',
    aliases: ['locked in', 'locking in'],
    plainLanguageMeaning: 'Focus closely or commit fully to a task, plan, or goal.',
    observedContext: 'Used as encouragement around schoolwork, games, sports, and group plans.',
    categories: ['Everyday slang', 'Gaming', 'Texting'],
    proposedRisk: 'GREEN',
    riskRationale: 'Usually ordinary encouragement; pressure and the underlying goal determine whether concern is warranted.',
    ambiguityNotes: 'Commitment can refer to a game choice, a task, or pressure to continue.',
    needsVerification: true,
    triage: 'promote',
    triageReason: 'Distinct phrase with enough context for a neutral prototype entry.',
    promotedSlug: 'lock-in',
  },
  {
    id: 'candidate-crash-out',
    term: 'crash out',
    aliases: ['crashing out', 'crashed out'],
    plainLanguageMeaning: 'Lose composure or react recklessly; in other contexts, go to sleep.',
    observedContext: 'Used in conflict commentary and everyday conversations about exhaustion.',
    categories: ['Everyday slang', 'Social media', 'Bullying & harassment'],
    proposedRisk: 'YELLOW',
    riskRationale: 'The label may refer to frustration, sleep, or unsafe behavior, so specific actions must be checked.',
    ambiguityNotes: 'The loss-of-control and sleep meanings must remain visible together.',
    needsVerification: true,
    triage: 'promote',
    triageReason: 'The multi-meaning phrase fills an ambiguity gap and can be framed without assuming danger.',
    promotedSlug: 'crash-out',
  },
  {
    id: 'candidate-oomf',
    term: 'OOMF',
    aliases: ['oomfie', 'one of my followers', 'one of my friends'],
    plainLanguageMeaning: 'An indirect reference to one follower or friend without naming them.',
    observedContext: 'Used in social posts and friend-group messages as a vague or playful reference.',
    categories: ['Social media', 'Texting', 'Relationships'],
    proposedRisk: 'BLUE',
    riskRationale: 'Usually ordinary indirect language; repeated targeting or pressure would come from the surrounding pattern.',
    ambiguityNotes: 'The final letter may be expanded as follower or friend depending on the community.',
    needsVerification: true,
    triage: 'promote',
    triageReason: 'Useful social-media shorthand with a clear ambiguity boundary.',
    promotedSlug: 'oomf',
  },
  {
    id: 'candidate-chopped',
    term: 'chopped',
    aliases: ['looking chopped'],
    plainLanguageMeaning: 'A possible appearance-based insult, with other ordinary meanings.',
    observedContext: 'Seen in short appearance comments, but the same word has several unrelated everyday uses.',
    categories: ['Everyday slang', 'Bullying & harassment'],
    proposedRisk: 'YELLOW',
    riskRationale: 'Person-directed use may be hurtful, but context is too limited to assign one stable meaning.',
    ambiguityNotes: 'Could describe appearance, food preparation, editing, removal, or another action.',
    needsVerification: true,
    triage: 'hold',
    triageReason: 'Hold until the entry can distinguish ordinary meanings from person-directed use without overmatching.',
  },
  {
    id: 'candidate-rizz-duplicate',
    term: 'rizz',
    aliases: ['rizzed up'],
    plainLanguageMeaning: 'Charm or confidence, especially while flirting.',
    observedContext: 'Submitted as a candidate even though the dictionary already includes it.',
    categories: ['Everyday slang', 'Relationships'],
    proposedRisk: 'GREEN',
    riskRationale: 'No new coverage is created by a duplicate entry.',
    ambiguityNotes: 'Any additional nuance belongs in the existing record.',
    needsVerification: true,
    triage: 'reject',
    triageReason: 'Already represented by the published rizz entry.',
  },
];