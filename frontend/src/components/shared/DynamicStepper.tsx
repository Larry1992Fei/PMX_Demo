import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DynamicStepperProps {
  steps: { id: string; label: string }[];
  currentStepId: string;
  onStepClick?: (id: string, index: number) => void;
}

export const DynamicStepper: React.FC<DynamicStepperProps> = ({ steps, currentStepId, onStepClick }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
             <div key={step.id} className="relative flex flex-col items-center flex-1 group">
                
                {/* 极简细线段 (除了最后一步都绘制连向下一个节点的线) */}
                {index < steps.length - 1 && (
                  <div className="absolute top-[7px] left-[50%] w-full flex items-center">
                    <div className={cn(
                      "h-[2px] w-full transition-all duration-700 ease-in-out",
                      (isCompleted || isCurrent) ? "bg-indigo-600" : "bg-slate-200"
                    )} />
                  </div>
                )}

                {/* 流转点 (Dots) */}
                <div 
                  onClick={() => onStepClick && onStepClick(step.id, index)}
                  className={cn(
                    "relative z-10 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all duration-500 cursor-pointer shadow-sm",
                    isCompleted ? "border-indigo-600 bg-indigo-600" : 
                    isCurrent   ? "border-indigo-600 ring-4 ring-indigo-100" : "border-slate-300"
                  )}
                >
                  {isCompleted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />}
                </div>

                {/* 文字标签 (Text Label) */}
                <div className={cn(
                   "mt-3 text-[11.5px] font-bold tracking-wide transition-colors duration-300 max-w-[80px] text-center",
                   (isCompleted || isCurrent) ? "text-indigo-900" : "text-slate-400"
                )}>
                  {step.label}
                </div>
             </div>
          );
        })}
      </div>
    </div>
  );
};
