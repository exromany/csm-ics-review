import React from 'react';
import type { IcsScoresDto } from '../../types/api';
import { getScoreBreakdown, getScoreStatus } from '../../utils/scoring';
import { TOTAL_SCORE_REQUIRED } from '../../config/scoringConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface TotalScoreCardProps {
  scores: IcsScoresDto;
}

const TotalScoreCard: React.FC<TotalScoreCardProps> = ({ scores }) => {
  const breakdown = getScoreBreakdown(scores);
  const status = getScoreStatus(breakdown);

  const getStatusIcon = () => {
    if (breakdown.isQualified) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (breakdown.isPartiallyQualified) {
      return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    }
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${
        breakdown.isQualified 
          ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' 
          : breakdown.isPartiallyQualified
          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
          : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-xl">Total Score</CardTitle>
          {getStatusIcon()}
        </div>

        <div className="text-center mb-4">
          <div className={`text-5xl font-bold mb-1 ${
            breakdown.isQualified 
              ? 'text-green-600 dark:text-green-400' 
              : breakdown.isPartiallyQualified
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {breakdown.totalScore}
          </div>
          <div className="text-sm text-muted-foreground">
            out of {TOTAL_SCORE_REQUIRED} required points
          </div>
        </div>

        <div className="mb-4">
          <Progress
            value={(breakdown.totalScore / 23) * 100}
            className={`h-3 ${
              breakdown.isQualified 
                ? '[&>div]:bg-green-500' 
                : breakdown.isPartiallyQualified
                ? '[&>div]:bg-amber-500'
                : '[&>div]:bg-red-500'
            }`}
          />
        </div>

        <Badge 
          variant="outline"
          className={`w-full justify-center py-2 ${
            breakdown.isQualified 
              ? 'bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
              : breakdown.isPartiallyQualified
              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {status.message}
        </Badge>
      </CardHeader>

      <CardContent className="bg-muted/50">
        <h4 className="text-sm font-bold mb-3">Score Breakdown</h4>
        <div className="space-y-2">
          {breakdown.groups.map((group) => (
            <div key={group.groupId} className="flex items-center justify-between py-1">
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  group.cappedScore < group.minLimit 
                    ? 'text-destructive' 
                    : 'text-foreground'
                }`}>
                  {group.groupTitle.replace('Proof-of-', '')}
                </span>
                {group.cappedScore < group.minLimit && (
                  <Badge variant="destructive" className="text-xs ml-2">
                    min: {group.minLimit}
                  </Badge>
                )}
                {group.rawScore > group.cappedScore && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    capped from {group.rawScore}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold">
                  {group.cappedScore}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {group.maxLimit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Total Score</span>
            <span className="text-lg font-bold text-primary">
              {breakdown.totalScore} pts
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalScoreCard;