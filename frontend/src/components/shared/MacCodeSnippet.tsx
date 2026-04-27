import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Copy, Check } from 'lucide-react';

interface MacCodeSnippetProps {
  codeString?: string; // Fallback
  endpoint?: { method: string; url: string };
  requestBody?: string;
  responseBody?: string;
  filename?: string;
  flashTrigger?: number;
  className?: string;
  onExecute?: () => void;
  isExecuteDisabled?: boolean;
}

export const MacCodeSnippet: React.FC<MacCodeSnippetProps> = ({ 
  codeString,
  endpoint,
  requestBody,
  responseBody,
  filename = 'index.ts', 
  flashTrigger = 0,
  className,
  onExecute,
  isExecuteDisabled
}) => {
  const [isFlashing, setIsFlashing] = React.useState(false);
  const [requestCopied, setRequestCopied] = React.useState(false);
  const [responseCopied, setResponseCopied] = React.useState(false);

  React.useEffect(() => {
    if (flashTrigger > 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [flashTrigger]);

  const finalRequest = requestBody || codeString || '';

  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JSON语法高亮实现
  const highlightJson = (jsonStr: string) => {
    try {
      // 解析JSON以确保格式正确
      const parsedJson = JSON.parse(jsonStr);
      // 重新序列化以获得标准格式
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      
      // 使用正则表达式进行简单的语法高亮
      let highlightedJson = formattedJson
        // 高亮键名
        .replace(/"([^"]+)"\s*:/g, '<span style="color: #7DD3FC;">$&</span>')
        // 高亮字符串值
        .replace(/:"([^"]+)"/g, ':<span style="color: #86EFAC;">$&</span>')
        // 高亮数字
        .replace(/\b(\d+)\b/g, '<span style="color: #FCD34D;">$&</span>')
        // 高亮布尔值和null
        .replace(/\b(true|false|null)\b/g, '<span style="color: #F9A8D4;">$&</span>');
      
      return highlightedJson;
    } catch (error) {
      return jsonStr;
    }
  };

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[14px] leading-[1.5] shadow-2xl border border-white/10 relative transition-all duration-500 flex flex-col w-full",
      isFlashing && "shadow-[0_0_30px_rgba(79,70,229,0.4)] border-indigo-500/50",
      className
    )}>
      {/* Mac 风格顶部控制栏 */}
      <div className="flex items-center px-4 h-10 bg-[#2d2d2d] border-b border-white/5 shrink-0">
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <div className="w-full text-center text-[#858585] text-[10px] font-bold -ml-10 tracking-widest font-sans uppercase">
          {filename}
        </div>
      </div>

      {/* 接口说明 (Endpoint) */}
      {endpoint && (
        <div className="px-5 py-3 bg-[#252526] border-b border-white/5 flex items-center gap-3 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-tight">
            {endpoint.method}
          </span>
          <span className="text-[11px] font-medium text-slate-400 truncate hover:text-slate-300 transition-colors cursor-default">
            {endpoint.url}
          </span>
        </div>
      )}

      {/* 核心滚动内容区 */}
      <div className="flex-1 overflow-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* 请求体 (Request) */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Request Body</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-600">Application/JSON</span>
              <button
                onClick={() => copyToClipboard(finalRequest, setRequestCopied)}
                className="p-1 rounded-md bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                title={requestCopied ? "Copied!" : "Copy to clipboard"}
              >
                {requestCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className={cn("transition-opacity duration-300", isFlashing && "opacity-70")}>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-[#d4d4d4]">
              <code dangerouslySetInnerHTML={{ __html: highlightJson(finalRequest) }} />
            </pre>
          </div>
        </div>

        {/* 响应体 (Response) - 仅在有内容时显示 */}
        {responseBody && (
          <div className="p-5 space-y-2 bg-indigo-500/[0.02] animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest">Response Body</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-tight tracking-wider">200 OK</span>
                </div>
                <button
                  onClick={() => copyToClipboard(responseBody, setResponseCopied)}
                  className="p-1 rounded-md bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                  title={responseCopied ? "Copied!" : "Copy to clipboard"}
                >
                  {responseCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-[#d4d4d4]">
              <code dangerouslySetInnerHTML={{ __html: highlightJson(responseBody) }} />
            </pre>
          </div>
        )}
      </div>

      {/* 内联执行底座 (Debug Action Bar) */}
      {onExecute && (
        <div className="shrink-0 h-11 bg-[#252526] border-t border-white/5 flex items-center justify-end px-4 gap-4">
          <span className="text-[9px] text-slate-600 font-bold tracking-widest uppercase items-center flex gap-1 animate-pulse">
            <div className="w-1 h-1 rounded-full bg-indigo-500" /> Ready to transmit
          </span>
          <button 
            onClick={onExecute}
            disabled={isExecuteDisabled}
            className={cn(
               "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
               isExecuteDisabled 
                 ? "text-[#666] bg-[#333] cursor-not-allowed" 
                 : "text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            )}
          >
             {isExecuteDisabled ? "DONE" : "RUN REQUEST"}
             {!isExecuteDisabled && <Play className="w-3 h-3 fill-current" />}
          </button>
        </div>
      )}
    </div>
  );
};
