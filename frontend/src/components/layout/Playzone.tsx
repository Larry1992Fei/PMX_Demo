import React from 'react';
import { useProduct, MODES_DESC } from '@/contexts/ProductContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { DynamicStepper } from '@/components/shared/DynamicStepper';
import { MacCodeSnippet } from '@/components/shared/MacCodeSnippet';
import { PhoneSimulator } from '@/components/shared/PhoneSimulator';
import { StepRouter } from '@/components/features/subscription/StepRouter';
import { StandardProductPreview } from '@/components/features/standard/ProductPreview';
import { DramaProductPreview } from '@/components/features/subscription/DramaProductPreview';
import { CheckCircle2, Loader2, Fingerprint, Code2, ArrowRight, Check, ChevronRight, Star, Truck, ShieldCheck } from 'lucide-react';

export const Playzone: React.FC = () => {
  const { productMode } = useProduct();
  const isSubscription = productMode === 'SUBSCRIPTION';

  return isSubscription ? <SubscriptionPlayzone /> : <DefaultPlayzone />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 订阅代扣沙盘（数据源来自 SubscriptionContext）
// ═══════════════════════════════════════════════════════════════════════════════
const SubscriptionPlayzone: React.FC = () => {
  const { productMode } = useProduct();
  const {
    steps, currentStepIndex, currentStep, isFinalStep,
    triggerFlash, payloadCode, goNext, goPrev, goToStep,
  } = useSubscription();

  // 将 StepConfig 适配为 DynamicStepper 需要的格式
  const stepperSteps = steps.map(s => ({ id: s.id, label: s.title }));
  const currentHint = steps[currentStepIndex]?.hint ?? '';

  return (
    <main className="flex-1 h-full overflow-hidden bg-slate-50 relative z-10 flex flex-col">

      {/* ── 通栏进度导航 ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/70 px-10 pt-4 pb-5 shrink-0 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Operation Pipeline</h3>
            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-md border border-indigo-100">
              {MODES_DESC[productMode]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Step {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
        </div>

        <DynamicStepper
          steps={stepperSteps}
          currentStepId={currentStep?.id}
          onStepClick={(_, index) => goToStep(index)}
        />

        {/* 步骤提示文字 */}
        {currentHint && (
          <p className="text-[11px] text-slate-400 font-semibold mt-3 flex items-center gap-1.5">
            <span>💡</span>{currentHint}
          </p>
        )}
      </div>


      {/* ── 主沙盘区（两栏对齐布局） ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="w-full pb-20 pl-8">
          <div className="grid grid-cols-12 gap-4 items-start">

            {/* 左：代码视角（7/12） */}
            <div className="col-span-7 flex flex-col space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-indigo-500 py-0.5">
                API Specification (Dev View)
              </h3>
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

            {/* 右：仿真手机（5/12） */}
            <div className="col-span-5 flex flex-col space-y-2 items-center">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 w-full border-l-2 border-blue-500 py-0.5">
                Interactive Demo (User View)
              </h3>
              <PhoneSimulator theme="light">
                <SubscriptionPhoneContent />
              </PhoneSimulator>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

// ─── 订阅模式仿真手机内容 ──────────────────────────────────────────────────────
const SubscriptionPhoneContent: React.FC = () => {
  const { currentStep, subMode, paymentMethod, goNext, isFinalStep, formParams } = useSubscription();
  const stepId = currentStep?.id ?? '';
  const pmType = paymentMethod;

  // 初始配置态 -> 行业标准商品展示
  if (stepId.endsWith('-1')) {
    return <DramaProductPreview />;
  }

  // 组件挂载态
  if (stepId.includes('component')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-5 animate-in slide-in-from-right-4 duration-400">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center shadow-inner">
          <span className="text-3xl">🔌</span>
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800">前置组件</h3>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed px-2">SDK 正在初始化支付组件...</p>
        </div>
        <div className="w-full border-2 border-dashed border-purple-200 rounded-xl py-6 flex flex-col items-center gap-2 bg-purple-50/40">
          <span className="text-2xl">💳</span>
          <span className="text-[11px] font-bold text-purple-400">{pmType.toUpperCase()} 组件加载区</span>
        </div>
        <button onClick={goNext} disabled={isFinalStep}
          className="w-full h-11 bg-purple-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/20 active:scale-95 transition-transform disabled:opacity-40">
          确认绑定
        </button>
      </div>
    );
  }

  // 收银台 / 支付态
  if (stepId.includes('activate') || stepId.includes('bind') || stepId === 'pm-2') {
    const amount = subMode === 'payermax' ? formParams.amount : subMode === 'nonperiodic' ? formParams.npAmount : formParams.merchantAmount;
    const currency = subMode === 'payermax' ? formParams.currency : subMode === 'nonperiodic' ? formParams.npCurrency : formParams.merchantCurrency;
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-bottom-6 duration-400">
        <div className="h-40 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-b-[2rem] p-5 flex flex-col justify-end shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider relative z-10">
            {subMode === 'nonperiodic' ? '本次扣款金额' : subMode === 'merchant' ? '首次绑定金额' : '首期绑定金额'}
          </p>
          <p className="text-white text-4xl font-extrabold tracking-tighter mt-0.5 relative z-10">
            {currency} {parseFloat(amount || '0').toFixed(2)}
          </p>
        </div>
        <div className="flex-1 p-5 flex flex-col items-center justify-center space-y-3">
          <div className="w-full h-12 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center px-4 gap-3 cursor-pointer hover:border-indigo-400 transition-colors">
            <div className="w-8 h-5 bg-[#1434CB] rounded flex items-center justify-center text-[8px] text-white font-bold italic">VISA</div>
            <div className="flex flex-col flex-1 leading-tight">
              <span className="text-xs font-extrabold text-slate-800">选择支付方式</span>
              <span className="text-[10px] text-slate-400">{pmType.toUpperCase()}</span>
            </div>
          </div>
          <button onClick={goNext} disabled={isFinalStep}
            className="w-full h-12 bg-slate-900 rounded-xl shadow-md flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-40 text-[13px] font-extrabold">
            {pmType === 'applepay' ? '  Pay with Apple Pay' : pmType === 'googlepay' ? ' Pay with Google' : '确认支付'}
          </button>
        </div>
      </div>
    );
  }

  // 代扣完成 / Webhook 态
  if (stepId.includes('complete') || stepId.includes('deduct')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-5 bg-emerald-500 text-white animate-in zoom-in-90 duration-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-400 opacity-30 rounded-full scale-[2] blur-3xl" />
        <div className="relative z-10 w-20 h-20 bg-emerald-400/80 rounded-full flex items-center justify-center border-[5px] border-emerald-200/50 backdrop-blur-md shadow-xl">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="text-2xl font-extrabold tracking-tight">完成</h3>
          <p className="text-emerald-100 mt-2 font-semibold text-xs opacity-90 leading-relaxed">
            {stepId.includes('deduct') ? 'Webhook 代扣成功' : '订阅已激活'}<br/>系统已收到回调通知
          </p>
        </div>
      </div>
    );
  }

  // 默认占位
  return (
    <div className="flex items-center justify-center h-full text-slate-300 text-sm font-bold">
      <div className="text-center space-y-2">
        <div className="text-3xl">📱</div>
        <div>用户视角预览</div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// 默认沙盘（非订阅模式：保留原有仿真手机逻辑）
// ═══════════════════════════════════════════════════════════════════════════════
const DefaultPlayzone: React.FC = () => {
  const { productMode, steps, currentStep, handleStepClick, toNextStep, triggerFlash, mockApiData } = useProduct();
  const isFinalStep = currentStep === steps[steps.length - 1].id;
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
                  endpoint={mockApiData.endpoint}
                  requestBody={mockApiData.requestBody}
                  responseBody={mockApiData.responseBody}
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
                <RenderPhoneContent step={currentStep} mode={productMode} toNextStep={toNextStep} isFinal={isFinalStep} />
              </PhoneSimulator>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// ── 原仿真手机内容（仅非订阅模式使用）────────────────────────────────────────
const RenderPhoneContent: React.FC<{ step: string; mode: string; toNextStep: () => void; isFinal: boolean }> = ({ step, mode, toNextStep }) => {
  const { redirectUrl, integrationMode, cashierMode, paymentMethod, setCashierPaymentMethod } = useProduct();

  // 如果有重定向 URL (标准收单流程中)，则渲染仿真浏览器
  // 但全量收银台模式下的 STEP3 不显示 iframe，显示原本页面
  if (redirectUrl && (step === 's2' || (step === 's3' && cashierMode !== 'ALL'))) {
    // 监听iframe消息，捕获支付成功回调
    React.useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        try {
          // 检查消息来源是否为PayerMax收银台
          if (event.origin.includes('payermax.com')) {
            const data = event.data;
            if (data.payStatus === 'SUCCESS' || data.status === 'SUCCESS') {
              // 支付成功，跳转到第三步
              toNextStep();
            }
          }
        } catch (error) {
          console.error('处理iframe消息失败:', error);
        }
      };

      // 监听message事件
      window.addEventListener('message', handleMessage);
      
      // 清理监听器
      return () => window.removeEventListener('message', handleMessage);
    }, [toNextStep]);

    return (
      <div className="h-full bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-500">
        <div className="h-10 bg-slate-50 flex items-center px-4 gap-2 border-b border-slate-100 flex-none font-sans">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
          </div>
          <div className="flex-1 bg-white h-6 rounded-md border border-slate-100 flex items-center px-3 text-[10px] text-slate-400 truncate">
            <span className="text-emerald-500 mr-1 font-bold">https://</span>
            {redirectUrl.split('//')[1]}
          </div>
        </div>
        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          <iframe 
            src={redirectUrl} 
            className="w-full h-full border-none"
            title="PayerMax Cashier"
            sandbox="allow-scripts allow-popups allow-same-origin"
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              try {
                const iframeUrl = iframe.contentWindow?.location.href;
                if (iframeUrl && iframeUrl.includes('/callback')) {
                  toNextStep();
                }
              } catch (error) {
                // 跨域访问可能会抛出错误，忽略
              }
            }}
          />
        </div>
        <div className="h-8 bg-slate-50 border-t border-slate-100 flex items-center justify-around flex-none">
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 rotate-180" />
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="w-4 h-4 rounded-sm border border-slate-300" />
        </div>
      </div>
    );
  }

  if (step === 's1') return <StandardProductPreview />;

  if (step === 's2') {
    // 自建收银台步骤（仅指定支付方式模式）
    if (cashierMode === 'SPECIFIC') {
      return (
        <div className="flex flex-col h-full bg-white relative">
          {/* 1. 商品主图区 */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
            <img 
              src="/product.png" 
              alt="Premium Gadget" 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold text-slate-800">4.9</span>
            </div>
          </div>

          {/* 2. 商品简述区 */}
          <div className="flex-1 px-5 pt-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                  PayerMax Premium <br/>Smart Watch Pro
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Limited Edition • Space Gray</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-600 block">USD</span>
                <span className="text-2xl font-black text-slate-900 leading-none">
                  11.00
                </span>
              </div>
            </div>

            {/* 核心卖点小组件 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-1.5 bg-blue-100/50 rounded-lg"><Truck className="w-3.5 h-3.5 text-blue-600" /></div>
                <span className="text-[9px] font-bold text-slate-500">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-1.5 bg-emerald-100/50 rounded-lg"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /></div>
                <span className="text-[9px] font-bold text-slate-500">2Y Warranty</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                Experience the next level of technology with PayerMax Premium Smart Watch. Featuring an OLED display, advanced heart rate monitoring, and 14-day battery life.
              </p>
            </div>
          </div>
          
          {/* 3. 半屏弹窗收银台 */}
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-xl z-10">
            <div className="p-3">
              <div className="space-y-1.5">
                <button 
                  onClick={() => {
                    const paymentMethod = 'card';
                    setCashierPaymentMethod(paymentMethod);
                    // 直接将选择的支付方式传递给 toNextStep
                    toNextStep(paymentMethod);
                  }}
                  className="w-full p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="text-base">💳</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Credit/Debit Card</h4>
                      <p className="text-xs text-slate-400">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                
                <button 
                  onClick={() => {
                    const paymentMethod = 'applepay';
                    setCashierPaymentMethod(paymentMethod);
                    // 直接将选择的支付方式传递给 toNextStep
                    toNextStep(paymentMethod);
                  }}
                  className="w-full p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
                      <span className="text-base">🍎</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Apple Pay</h4>
                      <p className="text-xs text-slate-400">Pay with Apple devices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                
                <button 
                  onClick={() => {
                    const paymentMethod = 'googlepay';
                    setCashierPaymentMethod(paymentMethod);
                    // 直接将选择的支付方式传递给 toNextStep
                    toNextStep(paymentMethod);
                  }}
                  className="w-full p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                      <span className="text-base">🤖</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Google Pay</h4>
                      <p className="text-xs text-slate-400">Pay with Google devices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                
                <button 
                  onClick={() => {
                    const paymentMethod = 'apm';
                    setCashierPaymentMethod(paymentMethod);
                    // 直接将选择的支付方式传递给 toNextStep
                    toNextStep(paymentMethod);
                  }}
                  className="w-full p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                      <span className="text-base">💱</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Alternative Payments</h4>
                      <p className="text-xs text-slate-400">Local payment methods</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // 全量收银台模式：下单展示步骤
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
          <div><h3 className="text-xl font-extrabold text-slate-800">全量收银台</h3><p className="text-xs font-medium text-slate-400 mt-2 px-4 leading-relaxed">PayerMax 会话正在初始化，将为您提供多种支付方式选择。</p></div>
          <div className="w-full pt-10 border-t border-slate-100 mt-auto opacity-40 hover:opacity-100 transition-opacity">
            <button onClick={toNextStep} className="text-xs text-indigo-600 font-bold flex items-center justify-center w-full gap-1">Skip / Force Process <ArrowRight className="w-3 h-3" /></button>
          </div>
        </div>
      );
    }
  }

  if (step === 's3') {
    // 下单展示步骤（指定支付方式模式）
    if (cashierMode === 'SPECIFIC') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-inner"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          <div><h3 className="text-xl font-extrabold text-slate-800">下单展示</h3><p className="text-xs font-medium text-slate-400 mt-2 px-4 leading-relaxed">正在处理 {paymentMethod.toUpperCase()} 支付请求，请稍候。</p></div>
          <div className="w-full pt-10 border-t border-slate-100 mt-auto opacity-40 hover:opacity-100 transition-opacity">
            <button onClick={toNextStep} className="text-xs text-blue-600 font-bold flex items-center justify-center w-full gap-1">Skip / Force Process <ArrowRight className="w-3 h-3" /></button>
          </div>
        </div>
      );
    } else {
      // 支付成功步骤（全量收银台模式）
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 bg-emerald-500 text-white animate-in zoom-in-90 duration-500 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-50" />
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative z-10"><Check className="w-10 h-10" /></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-extrabold">Payment Successful</h3>
            <p className="text-sm font-medium opacity-90 max-w-xs">Your transaction has been completed successfully. Thank you for your purchase!</p>
          </div>
          <div className="w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-xl p-4 relative z-10">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20">
              <span className="text-sm font-medium">Order Number</span>
              <span className="text-sm font-bold">ORDER_{Date.now()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-lg font-extrabold">$11.00</span>
            </div>
          </div>
          <div className="w-full pt-10 border-t border-white/20 mt-auto relative z-10">
            <button onClick={toNextStep} className="w-full h-12 bg-white text-emerald-600 font-bold rounded-lg">Continue</button>
          </div>
        </div>
      );
    }
  }

  if (step === 's4') {
    // 支付成功步骤（指定支付方式模式）
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 bg-emerald-500 text-white animate-in zoom-in-90 duration-500 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-50" />
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative z-10"><Check className="w-10 h-10" /></div>
        <div className="relative z-10 space-y-2">
          <h3 className="text-2xl font-extrabold">Payment Successful</h3>
          <p className="text-sm font-medium opacity-90 max-w-xs">Your transaction has been completed successfully. Thank you for your purchase!</p>
        </div>
        <div className="w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-xl p-4 relative z-10">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20">
            <span className="text-sm font-medium">Order Number</span>
            <span className="text-sm font-bold">ORDER_{Date.now()}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20">
            <span className="text-sm font-medium">Payment Method</span>
            <span className="text-sm font-bold">{paymentMethod.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Amount</span>
            <span className="text-lg font-extrabold">$11.00</span>
          </div>
        </div>
        <div className="w-full pt-10 border-t border-white/20 mt-auto relative z-10">
          <button onClick={toNextStep} className="w-full h-12 bg-white text-emerald-600 font-bold rounded-lg">Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
      <p className="text-slate-400 text-sm">暂无内容</p>
    </div>
  );
};
