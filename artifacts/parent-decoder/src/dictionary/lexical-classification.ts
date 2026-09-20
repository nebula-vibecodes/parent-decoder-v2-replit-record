export type LexicalClass =
  | 'Slang or informal expression'
  | 'Established internet/platform/community terminology'
  | 'Supporting safety/clinical terminology'
  | 'Parent guide'
  | 'Held for verification';

export type LexicalClassificationSource =
  | 'audit-ledger'
  | 'explicit-entry'
  | 'default-hold';

export type LexicalDisposition =
  | 'Retain in primary dictionary'
  | 'Retain as a parent guide'
  | 'Move to supporting terminology'
  | 'Hold out of primary results';

export type LexicalClassification = {
  lexicalClass: LexicalClass;
  lexicalClassificationSource: LexicalClassificationSource;
  lexicalDisposition: LexicalDisposition;
  auditClass: 'A' | 'B' | 'C' | 'D' | 'G' | 'unclassified';
  reason: string;
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

function entries(value: string) {
  return new Set(value.split('|').map(normalize).filter(Boolean));
}

const slangTerms = entries(
  'rizz|delulu|ate|no cap|bet|lowkey|touch grass|sus|AFK|GG|IYKYK|ratio|POV|main character energy|side eye|receipts|fire|mid|tea|noob|ghosting|soft launch|ship|HMU|IKR|NGL|FOMO|/gen|sexting|KMS|BRB|IDK|IMO|TBH|RN|WYD|HBU|FR|FYI|DM|hard launch|situationship|red flag|green flag|ick|crush|stan|OTP|OP|clutch|rage quit|GG EZ|brainrot|sigma|aura|troll|catfishing|NSFW|unalive|lock in|crash out|OOMF|cooked|slay|bussin|salty|extra|highkey|skibidi|gyatt|Fanum tax|bruh|vibe|goated|understood the assignment|it’s giving|NP|based|nic|weed|greening out|xans|percs|fent|coke|molly|shrooms|whippets|tweaking|nodding off|comedown|hangover|opps|clout|seggs|y’all|innit|no mames|mandem|periodt|say less|yap|glazing|be so for real|bestie',
);

const establishedTerms = entries(
  'NPC|nerf|lore|mutuals|Close Friends|skull emoji|eyes emoji|folded hands emoji|FYP|copypasta|dogpiling|doxxing|grooming|parasocial|love bombing|lag|griefing|camping|smurfing|rage bait|cancelled|cyberbullying|block|mute|phishing|sextortion|swatting|location sharing|alt account|thinspo|move off platform|pill emoji|lyrics|drill|freestyle|diss track|memorial post|fan edit|original audio|duet|stitch|repost|video draft|photo mode|storytime|multi-part post|algospeak|creator fandom|livestream chat|shopping promo|romance scam|giveaway scam|fake job scam|marketplace scam|verification code request|burner account|boosting|account trading|loot box|skin betting|game-currency scam|livestream gifting|disappearing messages|screenshot alert|public callout|coordinated reporting|engagement bait|viral stunt|blackout challenge|queer|deadname|neurodivergent|stimming|masking|code-switching|reclaimed language|diet culture|😂|❤️',
);

const supportingTerms = entries(
  'self-harm|vape|cart|edible|pressed pill|meth|intoxicated|in recovery|polysubstance|overdose|naloxone|blackout|withdrawal|tolerance|relapse|sobriety|prescription stimulant|prescription pain medication|nicotine pouch|disposable vape|dab pen|cannabis pre-roll|party scene|peer pressure|community grief|panic attack|shutdown|burnout|hopeless|isolating|help-seeking|in therapy|coping|restricting|bingeing|purging|body checking|compulsive exercise|boundary testing|coercive control|consent check|rumor campaign|relational aggression|answer sharing|academic pressure|school discipline|threatening language',
);

const heldTerms = entries(
  'unexpected substance|refusal boundary|friend safety check|treatment support|rap context|lyric persona|rivalry talk|disrespect talk|retaliation talk|loyalty language|betrayal language|algorithm joke|context request|challenge participation|transformation pressure|private-contact pressure|gift obligation|image-sharing pressure|payment-app pressure|group-chat exclusion|coordinated humiliation|voice-chat abuse|rank harassment|creator-fan pressure|monetization pressure|dangerous dare|prove-yourself pressure|dangerous prank|trespassing challenge|solidarity language|body-image recovery',
);

const auditedSlangTerms = slangTerms;

export const lexicalClassDetails: Record<LexicalClass, { label: string; description: string }> = {
  'Slang or informal expression': {
    label: 'Slang',
    description: 'Informal language, shorthand, idiom, euphemism, or vernacular expression.',
  },
  'Established internet/platform/community terminology': {
    label: 'Internet/platform terminology',
    description: 'Established terminology used by online platforms, gaming, music, or communities.',
  },
  'Supporting safety/clinical terminology': {
    label: 'Supporting safety terminology',
    description: 'Useful clinical, safety, product, or general vocabulary; not presented as slang.',
  },
  'Parent guide': {
    label: 'Parent guide',
    description: 'A contextual guide for a parent question, not a decoded dictionary term.',
  },
  'Held for verification': {
    label: 'Held for verification',
    description: 'An editorial or uncertain label kept out of primary results until usage evidence exists.',
  },
};

function fromClass(
  lexicalClass: LexicalClass,
  source: LexicalClassificationSource,
  auditClass: LexicalClassification['auditClass'],
  reason: string,
): LexicalClassification {
  return {
    lexicalClass,
    lexicalClassificationSource: source,
    lexicalDisposition:
      lexicalClass === 'Parent guide'
        ? 'Retain as a parent guide'
        : lexicalClass === 'Supporting safety/clinical terminology'
          ? 'Move to supporting terminology'
          : lexicalClass === 'Held for verification'
            ? 'Hold out of primary results'
            : 'Retain in primary dictionary',
    auditClass,
    reason,
  };
}

export function classifyLexicalRecord(input: {
  slug: string;
  term: string;
  recordType: 'term' | 'guide';
  explicitClass?: LexicalClass;
}): LexicalClassification {
  if (input.explicitClass) {
    return fromClass(
      input.explicitClass,
      'explicit-entry',
      'unclassified',
      'The record supplies an explicit lexical class.',
    );
  }

  if (input.recordType === 'guide') {
    return fromClass(
      'Parent guide',
      'audit-ledger',
      'G',
      'The record is a parent guide and is not presented as a decoded term.',
    );
  }

  const key = normalize(input.term);
  if (supportingTerms.has(key)) {
    return fromClass(
      'Supporting safety/clinical terminology',
      'audit-ledger',
      'C',
      'Ordinary clinical, safety, product, or general vocabulary is separated from the primary slang dictionary.',
    );
  }
  if (heldTerms.has(key)) {
    return fromClass(
      'Held for verification',
      'audit-ledger',
      'D',
      'The label is editorial, descriptive, recognition-only, or not substantiated as established terminology.',
    );
  }
  if (establishedTerms.has(key)) {
    return fromClass(
      'Established internet/platform/community terminology',
      'audit-ledger',
      'B',
      'The term is retained as established internet, platform, gaming, music, safety, or community terminology.',
    );
  }
  if (auditedSlangTerms.has(key)) {
    return fromClass(
      'Slang or informal expression',
      'audit-ledger',
      'A',
      'The term is retained as recognizable slang, shorthand, idiom, euphemism, or informal vernacular.',
    );
  }

  return fromClass(
    'Held for verification',
    'default-hold',
    'unclassified',
    'No explicit lexical classification exists for this new record; it is held until editorial review assigns one.',
  );
}

export const auditedDispositionSets = {
  slang: slangTerms,
  established: establishedTerms,
  supporting: supportingTerms,
  held: heldTerms,
};