import {
  analyzeMessage,
  matchTerms,
  terms,
} from '../src/data.ts';
import type { ContextLevel } from '../src/dictionary/model';

type AuditCase = {
  pair: string;
  label: string;
  input: string;
  expectedMatches: string[];
  expectedRisk?: ContextLevel;
};

type NegativeControl = {
  label: string;
  input: string;
  expectedMatches: string[];
  expectedConfidence?: 'Low' | 'Medium' | 'High';
};

export const phase4AuditCases: AuditCase[] = [
  {
    pair: 'blackout · ordinary chat versus health context',
    label: 'ordinary power outage',
    input: 'The town had a blackout after the storm.',
    expectedMatches: ['blackout'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'blackout · ordinary chat versus health context',
    label: 'fictional missing-memory context',
    input: 'The film described a memory blackout without identifying a real person.',
    expectedMatches: ['blackout'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'lyrics · quoted performance versus personal interpretation',
    label: 'quoted fictional lyrics',
    input: 'The quoted lyrics described rivalry in a fictional story.',
    expectedMatches: ['lyrics'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'lyrics · quoted performance versus personal interpretation',
    label: 'captioned lyric discussion',
    input: 'The caption quoted lyrics and did not describe the listener.',
    expectedMatches: ['lyrics'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'opps · gaming versus music discussion',
    label: 'gaming opponent',
    input: 'The game streamer called the other team the opps.',
    expectedMatches: ['opps'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'opps · gaming versus music discussion',
    label: 'music performance language',
    input: 'The music discussion explained that opps can be a performance word.',
    expectedMatches: ['opps'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'fent · education versus fictional concern',
    label: 'prevention lesson',
    input: 'The health lesson discussed fentanyl without identifying a student.',
    expectedMatches: ['fent'],
    expectedRisk: 'ORANGE',
  },
  {
    pair: 'fent · education versus fictional concern',
    label: 'fictional prevention scene',
    input: 'A fictional prevention scene used the word fent and then asked for help.',
    expectedMatches: ['fent'],
    expectedRisk: 'ORANGE',
  },
  {
    pair: 'in recovery · public discussion versus personal milestone',
    label: 'public recovery discussion',
    input: 'The public post said they were in recovery after a community event.',
    expectedMatches: ['in-recovery'],
    expectedRisk: 'YELLOW',
  },
  {
    pair: 'in recovery · public discussion versus personal milestone',
    label: 'recovery milestone',
    input: 'The fictional character mentioned being in recovery as a hopeful milestone.',
    expectedMatches: ['in-recovery'],
    expectedRisk: 'YELLOW',
  },
  {
    pair: 'nodding off · ordinary sleep versus direct use statement',
    label: 'ordinary tiredness',
    input: 'After a long school day, the character was nodding off during a movie.',
    expectedMatches: ['nodding-off'],
    expectedRisk: 'YELLOW',
  },
  {
    pair: 'nodding off · ordinary sleep versus direct use statement',
    label: 'direct fictional use statement',
    input: 'The fictional narrator said they were nodding off after an unknown pill.',
    expectedMatches: ['nodding-off'],
    expectedRisk: 'YELLOW',
  },
  {
    pair: 'KMS · meme versus mental-health venting',
    label: 'dark meme context',
    input: 'The meme used KMS as dark humor and gave no personal details.',
    expectedMatches: ['kms'],
    expectedRisk: 'RED',
  },
  {
    pair: 'KMS · meme versus mental-health venting',
    label: 'fictional crisis context',
    input: 'The fictional character wrote KMS while describing a mental-health crisis.',
    expectedMatches: ['kms'],
    expectedRisk: 'RED',
  },
  {
    pair: 'pill emoji · medicine versus substance education',
    label: 'medicine reminder emoji',
    input: 'The family calendar used 💊 for a medicine reminder.',
    expectedMatches: ['pill-emoji'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'pill emoji · medicine versus substance education',
    label: 'prevention emoji',
    input: 'The prevention post used 💊 while discussing unknown pills.',
    expectedMatches: ['pill-emoji'],
    expectedRisk: 'BLUE',
  },
  {
    pair: 'retaliation talk · fiction versus credible danger',
    label: 'fictional conflict',
    input: 'The film review called the scene retaliation talk between fictional characters.',
    expectedMatches: [],
  },
  {
    pair: 'retaliation talk · fiction versus credible danger',
    label: 'specific safety concern',
    input: 'The adult heard retaliation talk with a named target and time.',
    expectedMatches: [],
  },
  {
    pair: 'code-switching · school versus identity discussion',
    label: 'school language context',
    input: 'The student described code-switching between home and school.',
    expectedMatches: ['code-switching'],
  },
  {
    pair: 'code-switching · school versus identity discussion',
    label: 'community language context',
    input: 'The essay discussed code-switching as part of identity and audience.',
    expectedMatches: ['code-switching'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'no-cap phrase',
    input: 'In the fictional chat, the player wrote “no cap, that was honest.”',
    expectedMatches: ['no-cap'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'tea phrase',
    input: 'The fictional friends asked to spill the tea after practice.',
    expectedMatches: ['tea'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'alternate account phrase',
    input: 'The fictional artist posted from an alternate account.',
    expectedMatches: ['alt-account'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'self-harm phrase',
    input: 'The fictional student told a counselor about self-harm.',
    expectedMatches: ['self-harm'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'bruh phrase',
    input: 'The fictional player typed “bruh” after the game froze.',
    expectedMatches: ['bruh'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'weed phrase',
    input: 'The fictional health lesson discussed cannabis policy.',
    expectedMatches: ['weed'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'xans phrase',
    input: 'The fictional lesson discussed xans without identifying a person.',
    expectedMatches: ['xans'],
  },
  {
    pair: 'alias cleanup · fictional positive matches',
    label: 'neurodivergent phrase',
    input: 'The fictional student described being neurodivergent and asked for support.',
    expectedMatches: ['neurodivergent'],
  },
  {
    pair: 'intentional overlap · ordinary and longer phrases',
    label: 'math ratio',
    input: 'The fictional recipe used a two-to-one ratio of water to rice.',
    expectedMatches: ['ratio'],
  },
  {
    pair: 'intentional overlap · ordinary and longer phrases',
    label: 'situationship is not ship',
    input: 'The fictional character described a situationship with no label.',
    expectedMatches: ['situationship'],
  },
  {
    pair: 'intentional overlap · ordinary and longer phrases',
    label: 'deadname is not dead',
    input: 'The fictional school updated the student’s deadname record.',
    expectedMatches: ['deadname'],
  },
  {
    pair: 'intentional overlap · ordinary and longer phrases',
    label: 'sextortion is not sexting',
    input: 'The fictional safety lesson explained sextortion without describing a real event.',
    expectedMatches: ['sextortion'],
  },
  {
    pair: 'intentional overlap · ordinary and longer phrases',
    label: 'polysubstance is not stan',
    input: 'The fictional lesson defined polysubstance as a health term.',
    expectedMatches: ['polysubstance'],
  },
];

export const phase4NegativeControls: NegativeControl[] = [
  {
    label: 'short abbreviation inside ordinary word',
    input: 'The operator completed an operation before lunch.',
    expectedMatches: [],
    expectedConfidence: 'Low',
  },
  {
    label: 'boundary-sensitive navigation word',
    input: 'The navigation lesson explained a sextant.',
    expectedMatches: [],
    expectedConfidence: 'Low',
  },
  {
    label: 'unknown noise',
    input: 'qzvplm nowhere',
    expectedMatches: [],
    expectedConfidence: 'Low',
  },
  {
    label: 'ordinary sewing context',
    input: 'The sewing class used a stitch in blue cloth.',
    expectedMatches: ['stitch'],
  },
  {
    label: 'literal cap is not no-cap',
    input: 'The fictional costume included a red cap.',
    expectedMatches: [],
  },
  {
    label: 'literal letter T is not tea shorthand',
    input: 'The fictional worksheet placed the letter T in the answer box.',
    expectedMatches: [],
  },
  {
    label: 'ordinary alternate route is not alt account',
    input: 'The fictional driver took an alternate route home.',
    expectedMatches: [],
  },
  {
    label: 'initials SH are not self-harm',
    input: 'The fictional form labeled the sample SH.',
    expectedMatches: [],
  },
  {
    label: 'ordinary bro address is not bruh',
    input: 'The fictional coach called out, “Bro, pass the ball.”',
    expectedMatches: [],
  },
  {
    label: 'literal pot is not weed',
    input: 'The fictional gardener moved a flower pot.',
    expectedMatches: [],
  },
  {
    label: 'fictional name Xan is not xans',
    input: 'The fictional character in the story was named Xan.',
    expectedMatches: [],
  },
  {
    label: 'initials ND are not neurodivergent',
    input: 'The fictional form marked the sample ND.',
    expectedMatches: [],
  },
];

const mediaContextSlugs = [
  'lyrics',
  'drill',
  'rap-context',
  'lyric-persona',
  'fan-edit',
  'original-audio',
  'stitch',
  'storytime',
];

function slugsFor(input: string) {
  return matchTerms(input).map((term) => term.slug);
}

function sameValues(actual: string[], expected: string[]) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export function runPhase4QualityAudit() {
  const failures: string[] = [];

  for (const fixture of phase4AuditCases) {
    const actualMatches = slugsFor(fixture.input);
    if (!sameValues(actualMatches, fixture.expectedMatches)) {
      failures.push(
        `${fixture.pair} / ${fixture.label}: expected ${fixture.expectedMatches.join(', ') || 'no matches'}, got ${actualMatches.join(', ') || 'no matches'}`,
      );
      continue;
    }

    const analysis = analyzeMessage(fixture.input);
    if (fixture.expectedRisk && analysis.riskLevel !== fixture.expectedRisk) {
      failures.push(
        `${fixture.pair} / ${fixture.label}: expected ${fixture.expectedRisk} risk, got ${analysis.riskLevel}`,
      );
    }

    for (const match of matchTerms(fixture.input)) {
      if (!/diagnosis or conclusion/i.test(match.riskExplanation)) {
        failures.push(`${fixture.pair} / ${fixture.label}: ${match.slug} risk explanation is too certain.`);
      }
    }
  }

  for (const fixture of phase4NegativeControls) {
    const actualMatches = slugsFor(fixture.input);
    if (!sameValues(actualMatches, fixture.expectedMatches)) {
      failures.push(
        `negative control ${fixture.label}: expected ${fixture.expectedMatches.join(', ') || 'no matches'}, got ${actualMatches.join(', ') || 'no matches'}`,
      );
      continue;
    }
    if (fixture.expectedConfidence && analyzeMessage(fixture.input).confidence !== fixture.expectedConfidence) {
      failures.push(
        `negative control ${fixture.label}: expected ${fixture.expectedConfidence} confidence, got ${analyzeMessage(fixture.input).confidence}`,
      );
    }
  }

  for (const slug of mediaContextSlugs) {
    const term = terms.find((candidate) => candidate.slug === slug);
    if (!term) {
      failures.push(`media caveat ${slug}: term is not published.`);
      continue;
    }
    const context = [
      term.parentExplanation,
      term.importantContextNotes.join(' '),
      term.doNotAssume.join(' '),
    ].join(' ');
    if (!/audio|video|visual|caption|thread|context/i.test(context)) {
      failures.push(`media caveat ${slug}: entry does not explain the limits of text-only interpretation.`);
    }
  }

  return failures;
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/phase-4-quality-audit.ts')) {
  const failures = runPhase4QualityAudit();
  console.log(`Phase 4 cross-context audit: ${phase4AuditCases.length} paired cases, ${phase4NegativeControls.length} negative controls.`);
  if (failures.length) {
    for (const failure of failures) console.error(`  FAIL ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('Phase 4 cross-context audit: PASS');
  }
}