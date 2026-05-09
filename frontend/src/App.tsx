import { useEffect } from 'react';
import { ProductProvider, useProduct } from '@/contexts/ProductContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Playzone } from '@/components/layout/Playzone';

function AppContent() {
  const { productMode, currentStep, handleStepClick, setLastApiResponse, cashierMode, integrationMode } = useProduct();

  useEffect(() => {
    // 监听URL参数变化，处理支付回调
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const payStatus = urlParams.get('payStatus');
      const status = urlParams.get('status');
      const outTradeNo = urlParams.get('outTradeNo');
      const tradeToken = urlParams.get('tradeToken');
      const orderNo = urlParams.get('orderNo');
      
      const isSuccess = payStatus === 'SUCCESS' || payStatus === 'success' || status === 'SUCCESS' || status === 'success';
      
      // 处理支付成功回调，无论当前在哪个步骤
      if (isSuccess && (outTradeNo || orderNo) && window.location.pathname !== '/callback') {
        // 自动计算最后一个步骤（即成功页）
        // 在指定支付方式模式或组件模式下，成功页是 s4，其他通常是 s3
        const successStep = (cashierMode === 'SPECIFIC' || integrationMode === 'component') ? 's4' : 's3';
        handleStepClick(successStep);
        
        // 更新API响应数据
        setLastApiResponse({
          code: 'SUCCESS',
          msg: '支付成功',
          data: {
            outTradeNo: outTradeNo || orderNo,
            tradeToken,
            payStatus: 'SUCCESS',
            redirectUrl: window.location.href
          }
        });
        
        // 清除URL参数，避免重复处理
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // 处理/callback路径（PayerMax 收银台标准回跳路径）
      if (window.location.pathname === '/callback') {
        // API 模式成功步是 s3；指定收银台(SPECIFIC)和前置组件(component)模式成功步是 s4
        const successStep = (cashierMode === 'SPECIFIC' || integrationMode === 'component') ? 's4' : 's3';
        handleStepClick(successStep);
        
        // 更新API响应数据
        setLastApiResponse({
          code: 'SUCCESS',
          msg: '支付成功',
          data: {
            outTradeNo: outTradeNo || orderNo || 'ORDER_' + Date.now(),
            tradeToken,
            payStatus: 'SUCCESS',
            redirectUrl: window.location.href
          }
        });
        
        // 清除URL参数和路径，恢复到首页
        window.history.replaceState({}, document.title, '/');
      }
    };

    // 初始化时检查
    handleCallback();
    
    // 监听popstate事件
    window.addEventListener('popstate', handleCallback);
    return () => window.removeEventListener('popstate', handleCallback);
  }, [handleStepClick, setLastApiResponse, cashierMode, integrationMode]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        <Playzone />
      </div>
    </div>
  );
}

function App() {
  return (
    <ProductProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </ProductProvider>
  );
}

export default App;
