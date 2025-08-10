import type { AdminIcsFormItemDto, IcsFormFilters } from '../types/api';

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