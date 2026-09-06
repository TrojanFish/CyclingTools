import React, { useState } from 'react';
import { X, Download, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  posterUrl?: string | null;
  title: string;
  downloadFileName?: string;
  fileName?: string;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  posterUrl,
  title,
  downloadFileName,
  fileName
}) => {
  const { showToast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const finalImageUrl = imageUrl || posterUrl;
  const finalFileName = downloadFileName || fileName || 'SoloRider_ShareCard.png';

  if (!isOpen || !finalImageUrl) return null;

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = finalImageUrl;
      a.download = finalFileName.endsWith('.png') ? finalFileName : `${finalFileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('海报图片已开始下载！', 'success');
    } catch (e) {
      showToast('下载海报失败，请长按图片直接保存', 'error');
    }
  };

  const handleCopyImage = async () => {
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const res = await fetch(finalImageUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type]: blob })
        ]);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2500);
        showToast('海报已复制到剪贴板，可直接粘贴分享！', 'success');
        return;
      }
      throw new Error('ClipboardItem not supported');
    } catch (err) {
      handleDownload();
      showToast('已为您直接下载图片（手机端长按亦可直接存图）', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 dark:bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-ios-popover overflow-hidden text-slate-900 dark:text-white isolate animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-ios-blue/10 dark:bg-ios-blue/25 blur-3xl rounded-full" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1E]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ios-blue/10 dark:bg-ios-blue/15 border border-ios-blue/20 dark:border-ios-blue/30 text-ios-blue flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-ios-blue" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">朋友圈 / 社群打卡高光海报</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition apple-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Poster Image Preview Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-black/40">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 max-w-full bg-[#1C1C1E]">
            <img
              src={finalImageUrl}
              alt={title}
              className="max-h-[58vh] w-auto object-contain block select-none pointer-events-auto"
            />
          </div>

          {/* Mobile Long Press Hint */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400 shadow-xs">
            <ImageIcon className="w-3.5 h-3.5 text-ios-blue shrink-0" />
            <span>手机端支持长按上方图片直接保存到系统相册</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="relative z-10 p-4 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1E]/95 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyImage}
            className="apple-touch flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition active:scale-95"
          >
            {hasCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-ios-blue" />
                <span>复制图片</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="apple-touch flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-ios-md transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>保存到相册 / 下载</span>
          </button>
        </div>
      </div>
    </div>
  );
};
