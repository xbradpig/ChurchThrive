'use client';

import { cn } from '@/lib/cn';

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-ct-sm transition-all duration-200 border-2',
                  isCompleted
                    ? 'bg-ct-primary border-ct-primary text-white'
                    : isActive
                      ? 'bg-white border-ct-primary text-ct-primary'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-ct-xs font-medium whitespace-nowrap',
                  isCompleted || isActive ? 'text-ct-primary' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'w-12 sm:w-20 h-0.5 mx-2 mb-6 transition-colors duration-200',
                  isCompleted ? 'bg-ct-primary' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
