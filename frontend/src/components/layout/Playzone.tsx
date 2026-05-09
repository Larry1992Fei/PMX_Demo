import React from 'react';
import { cn } from '@/lib/utils';
import { useProduct, MODES_DESC } from '@/contexts/ProductContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { DynamicStepper } from '@/components/shared/DynamicStepper';
import { MacCodeSnippet } from '@/components/shared/MacCodeSnippet';
import { PhoneSimulator } from '@/components/shared/PhoneSimulator';
import { StepRouter as SubscriptionStepRouter } from '@/components/features/subscription/StepRouter';
import { StandardStepRouter } from '@/components/features/standard/StepRouter';

export const Playzone: React.FC = () => {
  const { productMode } = useProduct();
  const isSubscription = productMode === 'SUBSCRIPTION';

  return isSubscription ? <SubscriptionPlayzone /> : <DefaultPlayzone />;
};

// ─── 订阅代扣沙盘 ─────────────────────────────────────────────────────────────
const SubscriptionPlayzone: React.FC = () => {
  const { productMode } = useProduct();
  const {
    steps, currentStepIndex, currentStep, isFinalStep,
    triggerFlash, payloadCode, goNext, goToStep,
  } = useSubscription();

  const stepperSteps = steps.map(s => ({ id: s.id, label: s.title }));
  const currentHint = steps[currentStepIndex]?.hint ?? '';

  return (
    <main className="flex-1 h-full overflow-hidden bg-slate-50 relative z-10 flex flex-col">
      <div className="bg-white border-b border-slate-200/70 px-10 pt-4 pb-5 shrink-0 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Operation Pipeline</h3>
            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-md border border-indigo-100">
              {MODES_DESC[productMode]}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Step {currentStepIndex + 1} / {steps.length}
          </span>
        </div>
        <DynamicStepper steps={stepperSteps} currentStepId={currentStep?.id} onStepClick={(_, index) => goToStep(index)} />
        {currentHint && (
          <p className="text-[11px] text-slate-400 font-semibold mt-3 flex items-center gap-1.5">
            <span>💡</span>{currentHint}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="w-full pb-20 pl-8">
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-7 flex flex-col space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-indigo-500 py-0.5">API Specification (Dev View)</h3>
              <div className="min-h-[560px]">
                <MacCodeSnippet
                  className="h-full"
                  requestBody={payloadCode}
                  filename={`${currentStep?.id ?? 'step'}.json`}
                  flashTrigger={triggerFlash}
                  onExecute={goNext}
                  isExecuteDisabled={isFinalStep}
                />
              </div>
            </div>
            <div className="col-span-5 flex flex-col space-y-2 items-center">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 w-full border-l-2 border-blue-500 py-0.5">Interactive Demo (User View)</h3>
              <PhoneSimulator theme="light">
                <SubscriptionStepRouter />
              </PhoneSimulator>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// ─── 标准收单沙盘 ─────────────────────────────────────────────────────────────
const DefaultPlayzone: React.FC = () => {
  const { productMode, steps, currentStep, handleStepClick, toNextStep, triggerFlash, mockApiData } = useProduct();
  const isFinalStep = currentStep === steps[steps.length - 1]?.id;
  const stepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <main className="flex-1 h-full overflow-hidden bg-slate-50 relative z-10 flex flex-col">
      <div className="bg-white border-b border-slate-200/70 px-10 pt-4 pb-5 shrink-0 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Operation Pipeline</h3>
            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-md border border-indigo-100">
              {MODES_DESC[productMode]}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Step {stepIndex + 1} / {steps.length}
          </span>
        </div>
        <DynamicStepper steps={steps} currentStepId={currentStep} onStepClick={handleStepClick} />
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="w-full pb-20 pl-8">
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-7 flex flex-col space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-indigo-500 py-0.5">API Specification (Dev View)</h3>
              <div className="min-h-[560px]">
                <MacCodeSnippet
                  className="h-full"
                  endpoint={mockApiData?.endpoint}
                  requestBody={mockApiData?.requestBody || "{}"}
                  responseBody={mockApiData?.responseBody}
                  filename={`system_${currentStep}.json`}
                  flashTrigger={triggerFlash}
                  onExecute={toNextStep}
                  isExecuteDisabled={isFinalStep}
                />
              </div>
            </div>
            <div className="col-span-5 flex flex-col space-y-2 items-center">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 w-full border-l-2 border-blue-500 py-0.5">Interactive Demo (User View)</h3>
              <PhoneSimulator theme="light">
                <StandardStepRouter />
              </PhoneSimulator>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
