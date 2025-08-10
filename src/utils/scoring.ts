import type { IcsScoresDto } from '../types/api';
import { SCORE_SOURCES, ScoreSource, ScoreItem, TOTAL_SCORE_REQUIRED } from '../config/scoringConfig';

export interface GroupScore {
  groupId: string;
  groupTitle: string;
  rawScore: number;
  cappedScore: number;
  maxLimit: number;
  minLimit: number;
}

export interface ScoreBreakdown {
  groups: GroupScore[];
  totalScore: number;
  isQualified: boolean;
  isPartiallyQualified: boolean;
  hasMinimumCategoryRequirements: boolean;
}

/**
 * Calculate the score for a single group with max limit enforcement
 */
export function calculateGroupScore(
  scores: IcsScoresDto,
  group: ScoreSource
): GroupScore {
  const rawScore = group.items.reduce((sum, item) => {
    const score = scores[item.id] || 0;
    return sum + score;
  }, 0);

  const cappedScore = Math.min(rawScore, group.max);

  return {
    groupId: group.id,
    groupTitle: group.title,
    rawScore,
    cappedScore,
    maxLimit: group.max,
    minLimit: group.min,
  };
}

/**
 * Calculate total score with all group limits applied
 */
export function calculateTotalScore(scores: IcsScoresDto): number {
  return SCORE_SOURCES.reduce((total, group) => {
    const groupScore = calculateGroupScore(scores, group);
    return total + groupScore.cappedScore;
  }, 0);
}

/**
 * Check if all categories meet their minimum requirements
 */
export function hasMinimumCategoryRequirements(groups: GroupScore[]): boolean {
  return groups.every(group => group.cappedScore >= group.minLimit);
}

/**
 * Get detailed breakdown of scores by groups
 */
export function getScoreBreakdown(scores: IcsScoresDto): ScoreBreakdown {
  const groups = SCORE_SOURCES.map(group => calculateGroupScore(scores, group));
  const totalScore = groups.reduce((sum, group) => sum + group.cappedScore, 0);
  const hasMinReqs = hasMinimumCategoryRequirements(groups);
  const meetsTotal = totalScore >= TOTAL_SCORE_REQUIRED;

  return {
    groups,
    totalScore,
    isQualified: meetsTotal && hasMinReqs,
    isPartiallyQualified: meetsTotal && !hasMinReqs,
    hasMinimumCategoryRequirements: hasMinReqs,
  };
}

/**
 * Check if the total score meets the qualification threshold
 */
export function isQualified(totalScore: number): boolean {
  return totalScore >= TOTAL_SCORE_REQUIRED;
}

/**
 * Validate if a score value is within the allowed range for an item
 */
export function validateScoreValue(
  itemId: keyof IcsScoresDto,
  value: number,
  scoreItem?: ScoreItem
): boolean {
  if (value < 0) return false;
  
  // Find the score item if not provided
  if (!scoreItem) {
    for (const group of SCORE_SOURCES) {
      const item = group.items.find(i => i.id === itemId);
      if (item) {
        scoreItem = item;
        break;
      }
    }
  }

  if (!scoreItem) return false;

  // Check against max points
  return value <= scoreItem.maxPoints;
}

/**
 * Get the score item configuration by ID
 */
export function getScoreItem(itemId: keyof IcsScoresDto): ScoreItem | undefined {
  for (const group of SCORE_SOURCES) {
    const item = group.items.find(i => i.id === itemId);
    if (item) return item;
  }
  return undefined;
}

/**
 * Get the group for a specific score item
 */
export function getScoreGroup(itemId: keyof IcsScoresDto): ScoreSource | undefined {
  return SCORE_SOURCES.find(group => 
    group.items.some(item => item.id === itemId)
  );
}

/**
 * Calculate the percentage of the maximum possible score
 */
export function getScorePercentage(totalScore: number): number {
  const maxPossibleScore = SCORE_SOURCES.reduce((sum, group) => sum + group.max, 0);
  return Math.round((totalScore / maxPossibleScore) * 100);
}

/**
 * Get validation error message for CSM testnet field
 */
export function getCsmTestnetValidationError(value: number): string | null {
  if (value < 0 || value > 5) {
    return 'Value must be between 0 and 5';
  }
  if (value !== 0 && value !== 4 && value !== 5) {
    return 'CSM testnet can only be 0, 4, or 5 points';
  }
  return null;
}

/**
 * Check if CSM testnet value should be highlighted with red warning
 */
export function getCsmTestnetWarning(csmTestnetScore: number, circlesScore: number): {
  isValid: boolean;
  warning?: string;
  severity: 'error' | 'warning';
} {
  // Values 1, 2, 3 are not valid options - show red error-style warning
  if (csmTestnetScore === 1 || csmTestnetScore === 2 || csmTestnetScore === 3) {
    return {
      isValid: false,
      warning: 'CSM testnet can only be 0, 4, or 5 points',
      severity: 'error'
    };
  }
  
  // If CSM testnet is 0, it's always valid
  if (csmTestnetScore === 0) {
    return { isValid: true, severity: 'warning' };
  }
  
  // If Circles has no points, CSM testnet should be 4 (or 0)
  if (circlesScore === 0 && csmTestnetScore === 5) {
    return {
      isValid: false,
      warning: 'CSM testnet should be 4 when Circles = 0 (5 points only when Circles verification exists)',
      severity: 'warning'
    };
  }
  
  // If Circles has points, CSM testnet should be 5 for optimal scoring
  if (circlesScore > 0 && csmTestnetScore === 4) {
    return {
      isValid: false,
      warning: 'CSM testnet should be 5 when Circles verification exists (current: 4, optimal: 5)',
      severity: 'warning'
    };
  }
  
  return { isValid: true, severity: 'warning' };
}

/**
 * Validate CSM testnet scoring logic based on Circles points (legacy function for compatibility)
 */
export function validateCsmTestnetLogic(csmTestnetScore: number, circlesScore: number): {
  isValid: boolean;
  warning?: string;
} {
  const result = getCsmTestnetWarning(csmTestnetScore, circlesScore);
  return {
    isValid: result.isValid,
    warning: result.warning
  };
}

/**
 * Get a status message based on the score breakdown
 */
export function getScoreStatus(breakdown: ScoreBreakdown): {
  status: 'qualified' | 'partially-qualified' | 'not-qualified';
  message: string;
  color: string;
} {
  const pointsNeeded = TOTAL_SCORE_REQUIRED - breakdown.totalScore;

  if (breakdown.isQualified) {
    return {
      status: 'qualified',
      message: `Qualified! Score exceeds the ${TOTAL_SCORE_REQUIRED} point requirement and all categories meet minimum requirements`,
      color: 'green',
    };
  } else if (breakdown.isPartiallyQualified) {
    const failingCategories = breakdown.groups.filter(group => group.cappedScore < group.minLimit);
    const categoryNames = failingCategories.map(g => g.groupTitle.replace('Proof-of-', '')).join(', ');
    return {
      status: 'partially-qualified',
      message: `Partially qualified. Total score meets requirement but these categories need improvement: ${categoryNames}`,
      color: 'yellow',
    };
  } else {
    return {
      status: 'not-qualified',
      message: `Not qualified. ${pointsNeeded} more point${pointsNeeded !== 1 ? 's' : ''} needed to reach ${TOTAL_SCORE_REQUIRED}`,
      color: 'red',
    };
  }
}