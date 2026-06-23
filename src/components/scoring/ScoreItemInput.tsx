import React, { useEffect, useState } from 'react';
import { Info, AlertCircle, AlertTriangle } from 'lucide-react';
import type { ScoreItem } from '../../config/scoringConfig';
import type { IcsScoresDto } from '../../types/api';
import { validateScoreValue, getCsmTestnetWarning, getCsmTestnetValidationError } from '../../utils/scoring';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toneIcon,
  toneBorder,
  toneTint,
} from '@/components/ui';

interface ScoreItemInputProps {
  item: ScoreItem;
  value: number;
  /**
   * Stable handler shared across every row. Receiving the score field id here
   * (instead of an inline `(value) => onScoreChange(item.id, value)` closure)
   * keeps this prop referentially stable, so React.memo can skip re-renders of
   * untouched rows when the parent re-renders for unrelated reasons.
   */
  onScoreChange: (itemId: keyof IcsScoresDto, value: number) => void;
  disabled?: boolean;
  allScores?: IcsScoresDto;
}

const ScoreItemInput: React.FC<ScoreItemInputProps> = ({
  item,
  value,
  onScoreChange,
  disabled = false,
  allScores,
}) => {
  const [inputError, setInputError] = useState(false);
  const [softWarning, setSoftWarning] = useState<string | null>(null);
  const [warningSeverity, setWarningSeverity] = useState<'error' | 'warning'>('warning');

  // Update validation state when scores change
  useEffect(() => {
    // Check hard validation first
    const isValidValue = validateScoreValue(item.id, value, item);
    setInputError(!isValidValue);

    // Handle CSM testnet special validation
    if (item.id === 'csmTestnet' && allScores) {
      const circlesScore = allScores.circles || 0;
      const validation = getCsmTestnetWarning(value, circlesScore);
      setSoftWarning(validation.isValid ? null : validation.warning || null);
      setWarningSeverity(validation.severity);
    } else {
      setSoftWarning(null);
      setWarningSeverity('warning');
    }
  }, [item, allScores, value]);

  const handleValueChange = (next: string) => {
    onScoreChange(item.id, parseInt(next));
    setInputError(false);
  };

  const getPointsDisplay = () => `${item.points} pts`;

  const isScored = value > 0;
  const isError = inputError || (softWarning !== null && warningSeverity === 'error');
  const isWarning = !isError && softWarning !== null;

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border px-2.5 py-2 transition-colors',
          isError
            ? cn(toneBorder.red, toneTint.red)
            : isWarning
              ? cn(toneBorder.amber, toneTint.amber)
              : isScored
                ? cn(toneBorder.emerald, toneTint.emerald)
                : 'border-border hover:bg-muted/50'
        )}
      >
        <div className="flex-shrink-0">
          <img
            src={item.icon}
            alt={item.name}
            className="size-6 rounded-full border border-border bg-background p-0.5"
          />
        </div>

        <div className="min-w-0 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-grow items-center gap-1">
              <h4 className="truncate text-sm font-medium text-foreground">{item.name}</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`About ${item.name}`}
                    className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium">{getPointsDisplay()}</p>
                  <p className="mt-1 opacity-90">{item.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">{getPointsDisplay()}</span>
              <Select
                value={String(value)}
                onValueChange={handleValueChange}
                disabled={disabled}
              >
                <SelectTrigger
                  aria-label={`${item.name} score`}
                  className={cn(
                    "h-7 w-[4.5rem] justify-center px-2 text-center tabular-nums",
                    inputError
                      ? "border-destructive focus:ring-destructive"
                      : isScored
                        ? toneBorder.emerald
                        : undefined
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {item.allowedValues.map((allowedValue) => (
                    <SelectItem key={allowedValue} value={String(allowedValue)}>
                      {allowedValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {inputError && (
            <p className={cn('mt-1 flex items-start gap-1 text-xs', toneIcon.red)}>
              <AlertCircle className="mt-0.5 size-3 flex-shrink-0" />
              {item.id === 'csmTestnet'
                ? getCsmTestnetValidationError(value) || `Value must be one of: ${item.allowedValues.join(', ')}`
                : `Value must be one of: ${item.allowedValues.join(', ')}`}
            </p>
          )}

          {!inputError && softWarning && (
            <p
              className={cn(
                'mt-1 flex items-start gap-1 text-xs',
                warningSeverity === 'error' ? toneIcon.red : toneIcon.amber
              )}
            >
              {warningSeverity === 'error' ? (
                <AlertCircle className="mt-0.5 size-3 flex-shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
              )}
              {softWarning}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ScoreItemInput);
