import React from 'react';

interface ScoreGaugeProps {
  score: number;
  label?: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label }) => {
  const radius = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number): string => {
    if (score <= 40) return '#ef4444'; // red-500
    if (score <= 70) return '#f59e0b'; // amber-500
    return '#22c55e'; // green-500
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Foreground circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-neutral-900 dark:text-white">{score}</span>
        </div>
      </div>
      {label && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{label}</span>
      )}
    </div>
  );
};

export default ScoreGauge;
