import type { AdminIcsFormItemDto, IcsFormFilters, AdminDvtFormItemDto, DvtFormFilters } from '../types/api';

export interface FlattenedIcsForm {
  id: number;
  
  // Form data
  mainAddress: string;
  twitterLink?: string;
  discordLink?: string;
  additionalAddresses: string;
  
  // Status and metadata
  status: string;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
  updatedAt: string | null;
  lastReviewer?: string;
  
  // Scores
  ethStaker?: number;
  stakeCat?: number;
  obolTechne?: number;
  ssvVerified?: number;
  csmTestnet?: number;
  csmMainnet?: number;
  sdvtTestnet?: number;
  sdvtMainnet?: number;
  humanPassport?: number;
  circles?: number;
  ssvHumanity?: number;
  discord?: number;
  twitter?: number;
  aragonVotes?: number;
  snapshotVotes?: number;
  lidoGalxe?: number;
  highSignal?: number;
  gitPoaps?: number;
  totalScore: number;
  
  // Comments
  reasonComment?: string;
  mainAddressComment?: string;
  twitterLinkComment?: string;
  discordLinkComment?: string;
  additionalAddressesComment: string;
}

export const flattenIcsForm = (form: AdminIcsFormItemDto): FlattenedIcsForm => {
  // Calculate total score
  const scores = form.scores;
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  
  return {
    id: form.id,
    
    // Form data
    mainAddress: form.form.mainAddress,
    twitterLink: form.form.twitterLink || '',
    discordLink: form.form.discordLink || '',
    additionalAddresses: form.form.additionalAddresses?.join(', ') || '',
    
    // Status and metadata
    status: form.status,
    issued: form.issued,
    outdated: form.outdated,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt || '',
    lastReviewer: form.lastReviewer || '',
    
    // Scores
    ethStaker: scores.ethStaker,
    stakeCat: scores.stakeCat,
    obolTechne: scores.obolTechne,
    ssvVerified: scores.ssvVerified,
    csmTestnet: scores.csmTestnet,
    csmMainnet: scores.csmMainnet,
    sdvtTestnet: scores.sdvtTestnet,
    sdvtMainnet: scores.sdvtMainnet,
    humanPassport: scores.humanPassport,
    circles: scores.circles,
    ssvHumanity: scores.ssvHumanity,
    discord: scores.discord,
    twitter: scores.twitter,
    aragonVotes: scores.aragonVotes,
    snapshotVotes: scores.snapshotVotes,
    lidoGalxe: scores.lidoGalxe,
    highSignal: scores.highSignal,
    gitPoaps: scores.gitPoaps,
    totalScore,
    
    // Comments
    reasonComment: form.comments.reason || '',
    mainAddressComment: form.comments.mainAddress || '',
    twitterLinkComment: form.comments.twitterLink || '',
    discordLinkComment: form.comments.discordLink || '',
    additionalAddressesComment: form.comments.additionalAddresses?.join(', ') || '',
  };
};

export const generateCsvContent = (forms: AdminIcsFormItemDto[]): string => {
  if (forms.length === 0) return '';
  
  const flattenedForms = forms.map(flattenIcsForm);
  const headers = Object.keys(flattenedForms[0]);
  
  // Create header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = flattenedForms.map(form => {
    return headers.map(header => {
      const value = form[header as keyof FlattenedIcsForm];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape CSV values that contain commas, quotes, or newlines
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

export const generateFilename = (filters: IcsFormFilters): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const filterParts: string[] = [];
  
  if (filters.status) {
    filterParts.push(filters.status.toLowerCase());
  }
  
  if (typeof filters.issued === 'boolean') {
    filterParts.push(filters.issued ? 'issued' : 'not-issued');
  }
  
  if (typeof filters.outdated === 'boolean') {
    filterParts.push(filters.outdated ? 'outdated' : 'current');
  }
  
  if (filters.address) {
    filterParts.push(`addr-${filters.address.slice(0, 6)}`);
  }
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) {
      filterParts.push(`${filters.startDate}-to-${filters.endDate}`);
    } else if (filters.startDate) {
      filterParts.push(`from-${filters.startDate}`);
    } else if (filters.endDate) {
      filterParts.push(`until-${filters.endDate}`);
    }
  }
  
  const filterString = filterParts.length > 0 ? `-${filterParts.join('-')}` : '';
  
  return `ics-forms${filterString}-${date}.csv`;
};

export interface FlattenedDvtForm {
  id: number;
  mainAddress: string;
  discordLink: string;
  telegramUsername: string;
  clusterMember1Address: string;
  clusterMember1Discord: string;
  clusterMember1Telegram: string;
  clusterMember2Address: string;
  clusterMember2Discord: string;
  clusterMember2Telegram: string;
  clusterMember3Address: string;
  clusterMember3Discord: string;
  clusterMember3Telegram: string;
  clusterMember4Address: string;
  clusterMember4Discord: string;
  clusterMember4Telegram: string;
  status: string;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
  updatedAt: string | null;
  lastReviewer: string;
  reasonComment: string;
  mainAddressComment: string;
  discordLinkComment: string;
  telegramUsernameComment: string;
  clusterMember1Comment: string;
  clusterMember2Comment: string;
  clusterMember3Comment: string;
  clusterMember4Comment: string;
}

export const flattenDvtForm = (form: AdminDvtFormItemDto): FlattenedDvtForm => {
  const members = form.form.clusterMembers || [];
  const memberComments = form.comments.clusterMembers || [];

  return {
    id: form.id,
    mainAddress: form.form.mainAddress,
    discordLink: form.form.discordLink || '',
    telegramUsername: form.form.telegramUsername || '',
    clusterMember1Address: members[0]?.address || '',
    clusterMember1Discord: members[0]?.discordHandle || '',
    clusterMember1Telegram: members[0]?.telegramUsername || '',
    clusterMember2Address: members[1]?.address || '',
    clusterMember2Discord: members[1]?.discordHandle || '',
    clusterMember2Telegram: members[1]?.telegramUsername || '',
    clusterMember3Address: members[2]?.address || '',
    clusterMember3Discord: members[2]?.discordHandle || '',
    clusterMember3Telegram: members[2]?.telegramUsername || '',
    clusterMember4Address: members[3]?.address || '',
    clusterMember4Discord: members[3]?.discordHandle || '',
    clusterMember4Telegram: members[3]?.telegramUsername || '',
    status: form.status,
    issued: form.issued,
    outdated: form.outdated,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt || '',
    lastReviewer: form.lastReviewer || '',
    reasonComment: form.comments.reason || '',
    mainAddressComment: form.comments.mainAddress || '',
    discordLinkComment: form.comments.discordLink || '',
    telegramUsernameComment: form.comments.telegramUsername || '',
    clusterMember1Comment: memberComments[0] || '',
    clusterMember2Comment: memberComments[1] || '',
    clusterMember3Comment: memberComments[2] || '',
    clusterMember4Comment: memberComments[3] || '',
  };
};

export const generateDvtCsvContent = (forms: AdminDvtFormItemDto[]): string => {
  if (forms.length === 0) return '';

  const flattenedForms = forms.map(flattenDvtForm);
  const headers = Object.keys(flattenedForms[0]);
  const headerRow = headers.join(',');

  const dataRows = flattenedForms.map(form => {
    return headers.map(header => {
      const value = form[header as keyof FlattenedDvtForm];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

export const generateDvtFilename = (filters: DvtFormFilters): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const filterParts: string[] = [];

  if (filters.status) filterParts.push(filters.status.toLowerCase());
  if (typeof filters.issued === 'boolean') filterParts.push(filters.issued ? 'issued' : 'not-issued');
  if (typeof filters.outdated === 'boolean') filterParts.push(filters.outdated ? 'outdated' : 'current');
  if (filters.address) filterParts.push(`addr-${filters.address.slice(0, 6)}`);
  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) filterParts.push(`${filters.startDate}-to-${filters.endDate}`);
    else if (filters.startDate) filterParts.push(`from-${filters.startDate}`);
    else if (filters.endDate) filterParts.push(`until-${filters.endDate}`);
  }

  const filterString = filterParts.length > 0 ? `-${filterParts.join('-')}` : '';
  return `dvt-forms${filterString}-${date}.csv`;
};

export const downloadCsv = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};