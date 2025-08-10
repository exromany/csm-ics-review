import { ReactNode } from 'react';
import type { IcsScoresDto } from '../types/api';

import EthStakerIcon from '../assets/icons/ics-scores/ethstaker.png';
import StakeCatIcon from '../assets/icons/ics-scores/stakecat.png';
import ObolIcon from '../assets/icons/ics-scores/obol.png';
import SSVIcon from '../assets/icons/ics-scores/ssv.png';
import CSMIcon from '../assets/icons/ics-scores/csm.png';
import SDVTIcon from '../assets/icons/ics-scores/sdvt.png';
import HumanPassportIcon from '../assets/icons/ics-scores/human-passport.png';
import CirclesIcon from '../assets/icons/ics-scores/circles.png';
import DiscordIcon from '../assets/icons/ics-scores/discord.png';
import XTwitterIcon from '../assets/icons/ics-scores/x.png';
import AragonIcon from '../assets/icons/ics-scores/aragon.png';
import SnapshotIcon from '../assets/icons/ics-scores/snapshot.png';
import GalxeIcon from '../assets/icons/ics-scores/galxe.png';
import HighSignalIcon from '../assets/icons/ics-scores/high-signal.png';
import GitPOAPsIcon from '../assets/icons/ics-scores/git-poap.png';

export type IcsScoresItem = keyof IcsScoresDto;

export type ScoreSource = {
  id: string;
  title: string;
  description: string;
  min: number;
  max: number;
  items: ScoreItem[];
};

export type ScoreItem = {
  id: IcsScoresItem;
  name: string;
  icon: string;
  points: number | string;
  maxPoints: number;
  description: ReactNode;
};

export const TOTAL_SCORE_REQUIRED = 15;

export const SCORE_SOURCES: ScoreSource[] = [
  {
    id: 'proofOfExperience',
    title: 'Proof-of-Experience',
    description:
      'This group of proofs represents users experience in Ethereum validation',
    min: 5,
    max: 8,
    items: [
      {
        id: 'ethStaker',
        name: 'EthStaker solo-stakers list',
        icon: EthStakerIcon,
        points: 6,
        maxPoints: 6,
        description:
          'Submitted address is present in the latest EthStaker Solo Stakers list as a deposit address, and not excluded following the a Sybil analysis of the list',
      },
      {
        id: 'stakeCat',
        name: 'StakeCat solo-stakers list',
        icon: StakeCatIcon,
        points: 6,
        maxPoints: 6,
        description:
          'Submitted address is present in the latest StakeCat Solo Stakers list (Gnosischain-Solo-Stakers or Solo-Stakers-B), and not excluded following a Sybil analysis of the list',
      },
      {
        id: 'obolTechne',
        name: 'Obol Techne',
        icon: ObolIcon,
        points: '4-6',
        maxPoints: 6,
        description: (
          <>
            Submitted address has the Obol Techne credential assigned:
            <br />• 4 points for Base Credential
            <br />• 5 points for Bronze Credential
            <br />• 6 points for Silver Credential
          </>
        ),
      },
      {
        id: 'ssvVerified',
        name: 'SSV Verified operators',
        icon: SSVIcon,
        points: 7,
        maxPoints: 7,
        description:
          'Submitted address is present in the SSV Verified Operators list and does not belong to a professional operator',
      },
      {
        id: 'csmTestnet',
        name: 'CSM testnet participation',
        icon: CSMIcon,
        points: '4-5',
        maxPoints: 5,
        description: (
          <>
            4 points are assigned in case:
            <br />• Submitted address belongs to a Node Operator that has been
            active on CSM Testnet for at least 60 days
            <br />• Performance for the Node Operator is above the Performance
            threshold in several of the latest performance oracle reports.
            <br />5 points are assigned in case all the requirements from above
            are met, and the application contains an address that has Circles
            verification
          </>
        ),
      },
      {
        id: 'csmMainnet',
        name: 'CSM mainnet participation',
        icon: CSMIcon,
        points: 6,
        maxPoints: 6,
        description: (
          <>
            Submitted address belongs to a Node Operator that has been active on
            CSM Mainnet for at least 30 days
            <br />• Performance for the Node Operator is above the Performance
            threshold in the latest performance oracle report
          </>
        ),
      },
      {
        id: 'sdvtTestnet',
        name: 'SDVTM testnet participation',
        icon: SDVTIcon,
        points: 5,
        maxPoints: 5,
        description:
          'Submitted address participated in and completed the entire duration of a Simple DVT testnet with Obol, SSV, or Safestake as a home or community staker',
      },
      {
        id: 'sdvtMainnet',
        name: 'SDVTM mainnet participation',
        icon: SDVTIcon,
        points: 7,
        maxPoints: 7,
        description:
          'Submitted address is actively participating as a home or community staker in the Lido Simple DVT Module on mainnet at the time of application submission',
      },
    ],
  },
  {
    id: 'proofOfHumanity',
    title: 'Proof-of-Humanity',
    description:
      'This group of proofs allows users to earn a score by being verified by third-party platforms that apply their own rules for identifying real individuals',
    min: 4,
    max: 8,
    items: [
      {
        id: 'humanPassport',
        name: 'Human passport',
        icon: HumanPassportIcon,
        points: '3-8',
        maxPoints: 8,
        description:
          'Submitted address has the corresponding score according to a Lido customized scoring system on Human Passport',
      },
      {
        id: 'circles',
        name: 'Circles',
        icon: CirclesIcon,
        points: '3-8',
        maxPoints: 8,
        description:
          'Submitted address is verified via a dedicated Lido group on Circles',
      },
      {
        id: 'discord',
        name: 'Discord',
        icon: DiscordIcon,
        points: 2,
        maxPoints: 2,
        description: (
          <>
            • Submitted account is registered no less than 1 year ago
            <br />• A unique message with the address applying to be included in
            the list is published from this account to prove ownership
          </>
        ),
      },
      {
        id: 'twitter',
        name: 'X',
        icon: XTwitterIcon,
        points: 1,
        maxPoints: 1,
        description: (
          <>
            • Submitted account is registered no less than 1 year ago
            <br />• A unique message with the address applying to be included in
            the list is published from this account to prove ownership
          </>
        ),
      },
    ],
  },
  {
    id: 'proofOfEngagement',
    title: 'Proof-of-Engagement',
    description:
      'This group represents user engagement within the Ethereum and Lido ecosystems',
    min: 2,
    max: 7,
    items: [
      {
        id: 'aragonVotes',
        name: 'Participation in Aragon Votes',
        icon: AragonIcon,
        points: 2,
        maxPoints: 2,
        description:
          'Submitted address has voted at least twice with more than 100 LDO',
      },
      {
        id: 'snapshotVotes',
        name: 'Participation in Snapshot Votes',
        icon: SnapshotIcon,
        points: 1,
        maxPoints: 1,
        description:
          'Submitted address has voted at least three times with more than 100 LDO',
      },
      {
        id: 'lidoGalxe',
        name: 'Lido Galxe score',
        icon: GalxeIcon,
        points: '4-5',
        maxPoints: 5,
        description: (
          <>
            Submitted address has a score on the Lido Galxe space:
            <br />• 4 points if 4 ≤ Lido Galxe score ≤ 10
            <br />• 5 points if Lido Galxe score &gt; 10
          </>
        ),
      },
      {
        id: 'highSignal',
        name: 'Lido High Signal score',
        icon: HighSignalIcon,
        points: '2-5',
        maxPoints: 5,
        description: (
          <>
            Submitted address has a score on the Lido High Signal space:
            <br />• 2 points if 30 ≤ High Signal score ≤ 40
            <br />• 3 points if 40 &lt; High Signal score ≤ 60
            <br />• 4 points if 60 &lt; High Signal score ≤ 80
            <br />• 5 points if High Signal score &gt; 80
          </>
        ),
      },
      {
        id: 'gitPoaps',
        name: 'GitPOAPs',
        icon: GitPOAPsIcon,
        points: 2,
        maxPoints: 2,
        description:
          'Submitted address has at least one GitPOAP for contribution to the staking-related public good applications selected by CSM Committee',
      },
    ],
  },
];