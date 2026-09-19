import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

interface IOSCopyResultButtonProps {
  textToCopy: string;
  label?: string;
  toastMessage?: string;
  className?: string;
}

export const IOSCopyResultButton: React.FC<IOSCopyResultButtonProps> = ({
  textToCopy,
  label,
  toastMessage,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const { language } = useLanguageAndUnit();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      const defaultToast = language === 'zh-TW' ? '已複製結果至剪貼簿' : '已复制结果至剪贴板';
      showToast(toastMessage || defaultToast, 'success');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      showToast(language === 'zh-TW' ? '複製失敗，請手動選取' : '复制失败，请手动选取', 'error');
    }
  };

  const defaultLabel = language === 'zh-TW' ? '複製速報' : '复制速报';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`h-9 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-medium border transition active:scale-95 apple-touch ${
        copied
          ? 'bg-ios-green/10 border-ios-green/30 text-ios-green dark:bg-ios-green/20 dark:border-ios-green/40'
          : 'bg-black/[0.03] dark:bg-white/[0.06] border-black/[0.08] dark:border-white/[0.12] text-slate-700 dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] hover:text-ios-blue'
      } ${className}`}
      title={label || defaultLabel}
      aria-label={label || defaultLabel}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-ios-green animate-in zoom-in-75 duration-200" />
          <span className="text-ios-green font-semibold">{language === 'zh-TW' ? '已複製' : '已复制'}</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{label || defaultLabel}</span>
        </>
      )}
    </button>
  );
};
