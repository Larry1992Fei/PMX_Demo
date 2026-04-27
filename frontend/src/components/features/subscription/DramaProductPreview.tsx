import React, { useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Play, Star, ChevronRight, Zap, Info, CheckCircle2, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 订阅代扣专用的短剧行业订阅页 - 策略增强版
 * 仅保留月卡为主体，动态展示 N天试用、前N期优惠等多种组合策略
 */
export const DramaProductPreview: React.FC = () => {
  const { subscriptionType, setSubscriptionType, formParams, updateFormParam, goNext } = useSubscription();

  const isTrial = subscriptionType === 'trial';
  const isDiscount = subscriptionType === 'discount';
  const isCombo = subscriptionType === 'trial_discount';
  const isStandard = subscriptionType === 'standard';

  // 基准原价
  const basePrice = '29.99';

  // 1. 同步逻辑：确保切换模式时价格正确 (首笔支付)
  useEffect(() => {
    let initialAmount = basePrice;
    if (isTrial || isCombo) initialAmount = '0';
    else if (isDiscount) initialAmount = formParams.trialPeriodAmount;
    
    updateFormParam('amount', initialAmount);
  }, [subscriptionType, formParams.trialPeriodAmount, isTrial, isDiscount, isCombo]); // eslint-disable-line

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative">
      {/* ── 1. 海报背景 ── */}
      <div className="relative h-[38%] w-full shrink-0">
        <img 
          src="/drama_cover.png" 
          alt="The Ultimate Revenge" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <h1 className="text-xl font-black tracking-tight italic text-white drop-shadow-xl">THE ULTIMATE REVENGE</h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Thriller • Romance • 100+ Eps</p>
        </div>
      </div>

      {/* ── 2. 交互式策略选择区 ── */}
      <div className="flex-1 px-5 pt-4 pb-32 space-y-4 overflow-y-auto scrollbar-hide">
        
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Select Your Offer</h3>
          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full border border-indigo-400/20">Monthly Plan</span>
        </div>

        <div className="space-y-2.5">
          {/* 策略 A: 7天免费试用 */}
          <button 
            onClick={() => setSubscriptionType('trial')}
            className={cn(
              "w-full p-4 rounded-2xl flex items-start gap-3 border-2 transition-all duration-300 relative text-left",
              isTrial 
                ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20" 
                : "bg-slate-900/40 border-white/5 hover:border-white/10"
            )}
          >
            <div className={cn("mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors", isTrial ? "bg-amber-500 border-amber-500" : "border-slate-700")}>
               {isTrial && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className={cn("text-[12px] font-black tracking-tight", isTrial ? "text-amber-500" : "text-slate-100")}>7-Day Free Access</p>
                <div className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Trial</div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">试用期间 0 元扣费。结束后按每月 {formParams.currency} {basePrice} 自动续费。</p>
            </div>
          </button>

          {/* 策略 B: 前3期优惠 19.9 */}
          <button 
            onClick={() => setSubscriptionType('discount')}
            className={cn(
              "w-full p-4 rounded-2xl flex items-start gap-3 border-2 transition-all duration-300 relative text-left",
              isDiscount 
                ? "bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/20" 
                : "bg-slate-900/40 border-white/5 hover:border-white/10"
            )}
          >
            <div className={cn("mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors", isDiscount ? "bg-indigo-600 border-indigo-600" : "border-slate-700")}>
               {isDiscount && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className={cn("text-[12px] font-black tracking-tight", isDiscount ? "text-indigo-400" : "text-slate-100")}>Introductory Offer</p>
                <div className="bg-indigo-600/20 text-indigo-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Save 33%</div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                前 <span className="text-white font-bold">{formParams.trialPeriodCount}</span> 个月仅需 <span className="text-white font-extrabold">{formParams.currency} {formParams.trialPeriodAmount}</span>，后续恢复原价。
              </p>
            </div>
          </button>

           {/* 策略 C: 组合优惠 (可选显示) */}
           <button 
            onClick={() => setSubscriptionType('trial_discount')}
            className={cn(
              "w-full p-4 rounded-2xl flex items-start gap-3 border-2 transition-all duration-300 relative text-left",
              isCombo 
                ? "bg-fuchsia-600/10 border-fuchsia-500 shadow-[0_0_15px_rgba(235,50,235,0.15)]" 
                : "bg-slate-900/40 border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className={cn("text-[12px] font-black tracking-tight", isCombo ? "text-fuchsia-400" : "text-slate-100")}>Double Combo Strategy</p>
                <div className="bg-fuchsia-600/20 text-fuchsia-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Best Value</div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">7天试用 + 前3个月特惠，全方位营销方案体验。</p>
            </div>
          </button>
        </div>

        <p className="text-[9px] text-slate-600 text-center leading-relaxed italic px-6 pt-2">
          * 用户点击上述卡片将即时同步 API 代码块中的订阅参数。
        </p>
      </div>

      {/* ── 3. 底部操作栏 ── */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
        <button
          onClick={goNext}
          className={cn(
            "w-full h-15 rounded-2xl text-white font-black text-sm flex flex-col items-center justify-center gap-0.5 shadow-2xl transition-all duration-300",
            (isTrial || isCombo)
              ? "bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-600/30"
              : "bg-indigo-600 shadow-indigo-600/40",
            "active:scale-95"
          )}
        >
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 fill-white" />
            <span>{isTrial ? `START ${formParams.trialDays}-DAY FREE TRIAL` : 'SUBSCRIBE & UNLOCK ALL'}</span>
          </div>
          <p className="text-[9px] text-white/70 font-bold tracking-widest leading-none">
             {isTrial ? 'Cancel Anytime' : `Only ${formParams.currency} ${isDiscount ? formParams.trialPeriodAmount : basePrice} to start`}
          </p>
        </button>
      </div>
    </div>
  );
};
