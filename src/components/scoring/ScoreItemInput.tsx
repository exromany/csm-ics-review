import React, { useState, useRef, useEffect } from 'react';
import type { ScoreItem } from '../../config/scoringConfig';
import type { IcsScoresDto } from '../../types/api';
import { validateScoreValue, getCsmTestnetWarning, getCsmTestnetValidationError } from '../../utils/scoring';

interface ScoreItemInputProps {
  item: ScoreItem;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  allScores?: IcsScoresDto;
}

const ScoreItemInput: React.FC<ScoreItemInputProps> = ({
  item,
  value,
  onChange,
  disabled = false,
  allScores,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [softWarning, setSoftWarning] = useState<string | null>(null);
  const [warningSeverity, setWarningSeverity] = useState<'error' | 'warning'>('warning');
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('left');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate tooltip position to avoid clipping
  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 288; // w-72 = 288px
      
      // Check if tooltip would overflow on the right side
      if (buttonRect.left + tooltipWidth > viewportWidth - 20) {
        setTooltipPosition('right');
      } else {
        setTooltipPosition('left');
      }
    }
  }, [showTooltip]);
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    
    // Hard validation (blocks invalid values)
    if (validateScoreValue(item.id, newValue, item)) {
      onChange(newValue);
      setInputError(false);
      
      // Handle CSM testnet special validation
      if (item.id === 'csmTestnet' && allScores) {
        const circlesScore = allScores.circles || 0;
        const validation = getCsmTestnetWarning(newValue, circlesScore);
        setSoftWarning(validation.isValid ? null : validation.warning || null);
        setWarningSeverity(validation.severity);
      } else {
        setSoftWarning(null);
        setWarningSeverity('warning');
      }
    } else {
      setInputError(true);
      setSoftWarning(null);
      setWarningSeverity('warning');
    }
  };

  const getPointsDisplay = () => {
    if (typeof item.points === 'string') {
      return `${item.points} pts`;
    }
    return `${item.points} pts`;
  };

  return (
    <div className="relative">
      <div className={`flex items-center space-x-3 p-2 rounded-md transition-colors border ${
        inputError 
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
          : softWarning 
          ? warningSeverity === 'error' 
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
            : 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
          : 'border-border hover:bg-muted/50'
      }`}>
        <div className="flex-shrink-0">
          <img
            src={item.icon}
            alt={item.name}
            className="w-6 h-6 rounded-full border border-border bg-white dark:bg-gray-200 p-0.5"
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 flex-grow min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
              <button
                ref={buttonRef}
                type="button"
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground">{getPointsDisplay()}</span>
              <input
                type="number"
                min="0"
                max={item.maxPoints}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                className={`
                  w-14 px-2 py-1 text-sm text-center border rounded
                  ${inputError 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:focus:border-red-400' 
                    : 'border-input focus:ring-ring focus:border-ring'
                  }
                  ${disabled 
                    ? 'bg-muted cursor-not-allowed' 
                    : 'bg-background'
                  }
                  text-foreground
                  focus:outline-none focus:ring-1
                `}
              />
            </div>
          </div>

          {inputError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {item.id === 'csmTestnet' 
                ? getCsmTestnetValidationError(value) || `Value must be between 0 and ${item.maxPoints}`
                : `Value must be between 0 and ${item.maxPoints}`
              }
            </p>
          )}
          
          {!inputError && softWarning && (
            <p className={`text-xs mt-1 flex items-start ${
              warningSeverity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                {warningSeverity === 'error' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                )}
              </svg>
              {softWarning}
            </p>
          )}
        </div>
      </div>

      {showTooltip && (
        <div 
          ref={tooltipRef}
          className={`
            absolute z-50 w-72 max-w-xs sm:max-w-sm p-3 mt-1 text-xs text-foreground 
            bg-popover border border-border rounded-lg shadow-xl top-full
            transform transition-opacity duration-200
            ${tooltipPosition === 'left' ? 'left-0' : 'right-0'}
          `}
          style={{
            // Ensure tooltip doesn't get clipped by parent containers
            zIndex: 9999
          }}
        >
          {/* Arrow pointer */}
          <div 
            className={`
              absolute -top-1 w-2 h-2 bg-popover border-l border-t border-border 
              transform rotate-45 
              ${tooltipPosition === 'left' ? 'left-4' : 'right-4'}
            `}
          />
          
          <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Points: {getPointsDisplay()}</div>
          <div className="leading-relaxed">{item.description}</div>
        </div>
      )}
    </div>
  );
};

export default ScoreItemInput;