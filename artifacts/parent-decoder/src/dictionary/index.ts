import { currentBatchTerms } from './batches/current-batch';
import { expansionTerms } from './batches/expansion';
import { foundationTerms } from './batches/foundation';
import { integrationPhraseTermsA } from './batches/integration-phrases-a';
import { integrationPhraseTermsB } from './batches/integration-phrases-b';
import { integrationGuideTerms } from './batches/integration-guides';
import { phase2SubstanceFoundations } from './batches/phase-2-substance-foundations';
import { phase2SubstanceMedications } from './batches/phase-2-substance-medications';
import { phase2SubstanceParty } from './batches/phase-2-substance-party';
import { phase7SubstanceSafety } from './batches/phase-7-substance-safety';
import { phase7SubstanceLifecycle } from './batches/phase-7-substance-lifecycle';
import { phase7SubstanceContexts } from './batches/phase-7-substance-contexts';
import { phase8MusicLyricContext } from './batches/phase-8-music-lyric-context';
import { phase8MusicCommunity } from './batches/phase-8-music-community';
import { phase9TikTokPlatform } from './batches/phase-9-tiktok-platform';
import { phase9TikTokCultureSafety } from './batches/phase-9-tiktok-culture-safety';
import { phase3MentalHealth } from './batches/phase-3-mental-health';
import { phase3BodyImage } from './batches/phase-3-body-image';
import { phase4ExploitationConsent } from './batches/phase-4-exploitation-consent';
import { phase4ScamsPrivacy } from './batches/phase-4-scams-privacy';
import { phase5SchoolPeer } from './batches/phase-5-school-peer';
import { phase5GamingSafety } from './batches/phase-5-gaming-safety';
import { phase5SocialBehavior } from './batches/phase-5-social-behavior';
import { phase5RiskyChallenges } from './batches/phase-5-risky-challenges';
import { phase6IdentityCommunity } from './batches/phase-6-identity-community';
import { phase6RegionalMultilingual } from './batches/phase-6-regional-multilingual';
import { phase6OrdinaryYouth } from './batches/phase-6-ordinary-youth';
import type { Term } from './model';

export type DictionaryBatch = {
  name: string;
  terms: Term[];
  reviewSizeException?: string;
};

export const dictionaryBatches: DictionaryBatch[] = [
  {
    name: 'foundation',
    terms: foundationTerms,
    reviewSizeException:
      'Historical foundation entries were retained during the initial batch split; see EDITORIAL_WORKFLOW.md.',
  },
  {
    name: 'expansion',
    terms: expansionTerms,
    reviewSizeException:
      'Historical expansion entries were retained during the initial batch split; see EDITORIAL_WORKFLOW.md.',
  },
  {
    name: 'current-batch',
    terms: currentBatchTerms,
  },
  {
    name: 'integration-phrases-a',
    terms: integrationPhraseTermsA,
  },
  {
    name: 'integration-phrases-b',
    terms: integrationPhraseTermsB,
  },
  {
    name: 'integration-guides',
    terms: integrationGuideTerms,
  },
  {
    name: 'phase-2-substance-foundations',
    terms: [...phase2SubstanceFoundations],
  },
  {
    name: 'phase-2-substance-medications',
    terms: [...phase2SubstanceMedications],
  },
  {
    name: 'phase-2-substance-party',
    terms: [...phase2SubstanceParty],
  },
  {
    name: 'phase-7-substance-safety',
    terms: [...phase7SubstanceSafety],
  },
  {
    name: 'phase-7-substance-lifecycle',
    terms: [...phase7SubstanceLifecycle],
  },
  {
    name: 'phase-7-substance-contexts',
    terms: [...phase7SubstanceContexts],
  },
  {
    name: 'phase-8-music-lyric-context',
    terms: [...phase8MusicLyricContext],
  },
  {
    name: 'phase-8-music-community',
    terms: [...phase8MusicCommunity],
  },
  {
    name: 'phase-9-tiktok-platform',
    terms: [...phase9TikTokPlatform],
  },
  {
    name: 'phase-9-tiktok-culture-safety',
    terms: [...phase9TikTokCultureSafety],
  },
  {
    name: 'phase-3-mental-health',
    terms: [...phase3MentalHealth],
  },
  {
    name: 'phase-3-body-image',
    terms: [...phase3BodyImage],
  },
  {
    name: 'phase-4-exploitation-consent',
    terms: [...phase4ExploitationConsent],
  },
  {
    name: 'phase-4-scams-privacy',
    terms: [...phase4ScamsPrivacy],
  },
  {
    name: 'phase-5-school-peer',
    terms: [...phase5SchoolPeer],
  },
  {
    name: 'phase-5-gaming-safety',
    terms: [...phase5GamingSafety],
  },
  {
    name: 'phase-5-social-behavior',
    terms: [...phase5SocialBehavior],
  },
  {
    name: 'phase-5-risky-challenges',
    terms: [...phase5RiskyChallenges],
  },
  {
    name: 'phase-6-identity-community',
    terms: [...phase6IdentityCommunity],
  },
  {
    name: 'phase-6-regional-multilingual',
    terms: [...phase6RegionalMultilingual],
  },
  {
    name: 'phase-6-ordinary-youth',
    terms: [...phase6OrdinaryYouth],
  },
];

export const terms: Term[] = dictionaryBatches.flatMap((batch) => batch.terms);

export const lexicalDispositionLedger = terms.map((term) => ({
  slug: term.slug,
  term: term.term,
  lexicalClass: term.lexicalClass,
  lexicalClassificationSource: term.lexicalClassificationSource,
  lexicalDisposition: term.lexicalDisposition,
  lexicalDispositionReason: term.lexicalDispositionReason,
}));

export const lexicalClassCounts = lexicalDispositionLedger.reduce(
  (counts, entry) => ({
    ...counts,
    [entry.lexicalClass]: counts[entry.lexicalClass] + 1,
  }),
  {
    'Slang or informal expression': 0,
    'Established internet/platform/community terminology': 0,
    'Supporting safety/clinical terminology': 0,
    'Parent guide': 0,
    'Held for verification': 0,
  } as Record<Term['lexicalClass'], number>,
);
