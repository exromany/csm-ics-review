import React from 'react';
import type { IcsScoresDto } from '../../types/api';
import { getScoreBreakdown, getScoreStatus, getScorePercentage } from '../../utils/scoring';
import { TOTAL_SCORE_REQUIRED } from '../../config/scoringConfig';
import {
  Panel,
  Progress,
  SoftBadge,
  type Tone,
  toneIcon,
  toneTint,
  toneIndicator,
} from '@/components/ui';
import { CheckCircle, AlertTriangle, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TotalScoreCardProps {
  scores: IcsScoresDto;
}

type QualState = 'qualified' | 'partial' | 'unqualified';

/**
 * Per-qualification visuals. A single semantic `tone` per state sources every
 * color from the shared tone module — accent text via `toneIcon`, the subtle
 * surface via `toneTint`, the Progress fill via `toneIndicator`, and the status
 * callout via `SoftBadge`. No raw palette literals live here.
 */
const STATE_META: Record<
  QualState,
  {
    Icon: LucideIcon;
    tone: Tone;
    accent: string;
    tint: string;
    indicator: string;
  }
> = {
  qualified: {
    Icon: CheckCircle,
    tone: 'emerald',
    accent: toneIcon.emerald,
    tint: toneTint.emerald,
    indicator: toneIndicator.emerald,
  },
  partial: {
    Icon: AlertTriangle,
    tone: 'amber',
    accent: toneIcon.amber,
    tint: toneTint.amber,
    indicator: toneIndicator.amber,
  },
  unqualified: {
    Icon: XCircle,
    tone: 'red',
    accent: toneIcon.red,
    tint: toneTint.red,
    indicator: toneIndicator.red,
  },
};

const TotalScoreCard: React.FC<TotalScoreCardProps> = ({ scores }) => {
  const breakdown = getScoreBreakdown(scores);
  const status = getScoreStatus(breakdown);

  const state: QualState = breakdown.isQualified
    ? 'qualified'
    : breakdown.isPartiallyQualified
      ? 'partial'
      : 'unqualified';
  const meta = STATE_META[state];
  const { Icon } = meta;

  return (
    <Panel className="overflow-hidden">
      <div className={cn('border-b p-6', meta.tint)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Score
          </span>
          <Icon className={cn('size-5', meta.accent)} />
        </div>

        <div className="mt-4 text-center">
          <div className={cn('text-5xl font-semibold tabular-nums', meta.accent)}>
            {breakdown.totalScore}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            out of {TOTAL_SCORE_REQUIRED} required points
          </div>
        </div>

        <div className="mt-4">
          <Progress
            value={getScorePercentage(breakdown.totalScore)}
            className={cn('h-2', meta.indicator)}
          />
        </div>

        <SoftBadge
          tone={meta.tone}
          size="sm"
          className="mt-4 w-full justify-center px-3 py-2 text-center"
        >
          {status.message}
        </SoftBadge>
      </div>

      <div className="p-5">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Score Breakdown
        </h4>
        <div className="space-y-1.5">
          {breakdown.groups.map((group) => {
            const belowMin = group.cappedScore < group.minLimit;
            return (
              <div
                key={group.groupId}
                className="flex items-center justify-between gap-2 py-0.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'truncate text-sm',
                      belowMin ? 'font-medium text-destructive' : 'text-foreground'
                    )}
                  >
                    {group.groupTitle.replace('Proof-of-', '')}
                  </span>
                  {belowMin && (
                    <span className="flex-shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-destructive">
                      min {group.minLimit}
                    </span>
                  )}
                  {group.rawScore > group.cappedScore && (
                    <span className="flex-shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                      capped from {group.rawScore}
                    </span>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-baseline gap-1 tabular-nums">
                  <span className="text-sm font-semibold">{group.cappedScore}</span>
                  <span className="text-xs text-muted-foreground">/ {group.maxLimit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total Score</span>
          <span className="text-base font-semibold tabular-nums text-primary">
            {breakdown.totalScore} pts
          </span>
        </div>
      </div>
    </Panel>
  );
};

export default React.memo(TotalScoreCard);
