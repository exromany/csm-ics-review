import type { IcsScoresDto } from '../types/api';
import { getScoreBreakdown } from './scoring';
import { TOTAL_SCORE_REQUIRED } from '../config/scoringConfig';

export interface RejectionSuggestion {
  id: string;
  text: string;
  description: string;
}

/**
 * Generate contextual rejection reason suggestions based on scoring
 */
export function generateRejectionSuggestions(scores: IcsScoresDto): RejectionSuggestion[] {
  const breakdown = getScoreBreakdown(scores);
  const suggestions: RejectionSuggestion[] = [];

  // If the application is qualified (meets all requirements), don't show suggestions
  if (breakdown.isQualified) {
    return [];
  }

  // If total score is below requirement
  if (breakdown.totalScore < TOTAL_SCORE_REQUIRED) {
    suggestions.push({
      id: 'insufficient-total',
      text: `Your application earned ${breakdown.totalScore} out of ${TOTAL_SCORE_REQUIRED} points required to qualify.`,
      description: 'Total score below requirement'
    });
  }

  // If categories don't meet minimum requirements
  if (!breakdown.hasMinimumCategoryRequirements) {
    const failingCategories = breakdown.groups
      .filter(group => group.cappedScore < group.minLimit)
      .map(group => group.groupTitle.replace('Proof-of-', ''))
      .join(', ');

    suggestions.push({
      id: 'category-minimums',
      text: `Your application did not reach the minimum score required for some categories (${failingCategories}).`,
      description: 'Category minimum requirements not met'
    });
  }

  // If no specific issues found but still rejected (edge case for manual rejection)
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'general-rejection',
      text: 'Your application does not meet the current qualification criteria.',
      description: 'General rejection reason'
    });
  }

  return suggestions;
}