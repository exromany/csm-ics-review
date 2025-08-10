import React from 'react';
import type { IcsScoresDto } from '../../types/api';
import type { ScoreSource } from '../../config/scoringConfig';
import { calculateGroupScore } from '../../utils/scoring';
import ScoreItemInput from './ScoreItemInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <CardTitle className="text-lg mb-1">{group.title}</CardTitle>
            <CardDescription className="leading-relaxed">{group.description}</CardDescription>
          </div>
          <div className="text-right ml-4">
            <div className="text-3xl font-bold text-primary">
              {groupScore.cappedScore}
              <span className="text-lg font-normal text-muted-foreground">/{group.max}</span>
            </div>
            {exceedsLimit && (
              <Badge variant="secondary" className="text-xs mt-1">
                Raw: {groupScore.rawScore} (capped)
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Progress
            value={(groupScore.cappedScore / group.max) * 100}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Min: {group.min}</span>
            <span>Max: {group.max}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {group.items.map((item) => (
            <ScoreItemInput
              key={item.id}
              item={item}
              value={scores[item.id] || 0}
              onChange={(value) => onScoreChange(item.id, value)}
              disabled={disabled}
              allScores={scores}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreGroupCard;