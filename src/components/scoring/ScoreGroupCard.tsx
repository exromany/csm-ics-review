import React from 'react';
import type { IcsScoresDto } from '../../types/api';
import type { ScoreSource } from '../../config/scoringConfig';
import { calculateGroupScore } from '../../utils/scoring';
import ScoreItemInput from './ScoreItemInput';
import { Panel } from '@/components/ui/panel';
import { Progress } from '@/components/ui/progress';

interface ScoreGroupCardProps {
  group: ScoreSource;
  scores: IcsScoresDto;
  onScoreChange: (field: keyof IcsScoresDto, value: number) => void;
  disabled?: boolean;
}

const ScoreGroupCard: React.FC<ScoreGroupCardProps> = ({
  group,
  scores,
  onScoreChange,
  disabled = false,
}) => {
  const groupScore = calculateGroupScore(scores, group);
  const exceedsLimit = groupScore.rawScore > group.max;

  return (
    <Panel className="flex h-fit flex-col">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-grow">
            <h3 className="text-sm font-semibold tracking-tight">{group.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {group.description}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end">
            <div className="text-2xl font-semibold tabular-nums">
              {groupScore.cappedScore}
              <span className="text-base font-normal text-muted-foreground">/{group.max}</span>
            </div>
            {exceedsLimit && (
              <span className="mt-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                Raw {groupScore.rawScore} (capped)
              </span>
            )}
          </div>
        </div>

        <div className="mt-3">
          <Progress value={(groupScore.cappedScore / group.max) * 100} className="h-1.5" />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>Min {group.min}</span>
            <span>Max {group.max}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3">
        {group.items.map((item) => (
          <ScoreItemInput
            key={item.id}
            item={item}
            value={scores[item.id] || 0}
            onScoreChange={onScoreChange}
            disabled={disabled}
            allScores={scores}
          />
        ))}
      </div>
    </Panel>
  );
};

export default React.memo(ScoreGroupCard);
