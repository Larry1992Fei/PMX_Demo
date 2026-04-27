import { useEffect } from 'react';
import { ProductProvider, useProduct } from '@/contexts/ProductContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Playzone } from '@/components/layout/Playzone';

function AppContent() {
  const { productMode, currentStep, setCurrentStep, setLastApiResponse } = useProduct();

  useEffect(() => {
    // 监听URL参数变化，处理支付回调
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const payStatus = urlParams.get('payStatus');
      const outTradeNo = urlParams.get('outTradeNo');
      const tradeToken = urlParams.get('tradeToken');
      const orderNo = urlParams.get('orderNo');
      
      // 处理支付成功回调，无论当前在哪个步骤
      if ((payStatus === 'SUCCESS' || payStatus === 'success') && (outTradeNo || orderNo)) {
        // 支付成功，跳转到第三步（付款体验）
        setCurrentStep('s3');
        
        // 更新API响应数据
        setLastApiResponse({
          code: 'SUCCESS',
          msg: '支付成功',
          data: {
            outTradeNo: outTradeNo || orderNo,
            tradeToken,
            payStatus,
            redirectUrl: window.location.href
          }
        });
        
        // 清除URL参数，避免重复处理
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // 处理/callback路径
      if (window.location.pathname === '/callback') {
        // 跳转到第三步（付款体验）
        setCurrentStep('s3');
        
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
        
        // 清除URL参数和路径，避免重复处理
        window.history.replaceState({}, document.title, '/');
      }
    };

    // 初始化时检查
    handleCallback();
    
    // 监听popstate事件
    window.addEventListener('popstate', handleCallback);
    return () => window.removeEventListener('popstate', handleCallback);
  }, [setCurrentStep, setLastApiResponse]);

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
