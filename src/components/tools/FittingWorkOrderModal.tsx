import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Check, User, Wrench, Bike, FileText } from 'lucide-react';
import { RouleurLogo } from '../common/RouleurLogo';

export interface FittingWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRiderName?: string;
  initialBikeModel?: string;
  data: {
    height: number;
    inseam: number;
    torso: number;
    armLength: number;
    shoulderWidth?: number;
    sittingHeight?: number;
    thighLength?: number;
    lowerLegLength?: number;
    ridingStyle: string;
    saddleHeight: number;
    saddleHeightHamley: number;
    effectiveTopTube: number;
    stemLength: number;
    saddleDrop: number;
    handlebarWidth: number;
    crankLength: number | string;
    saddleSetback: number;
    frameSize: string;
    estimatedStack: number;
    estimatedReach: number;
    sittingHeightNote?: string;
    thighLowerLegNote?: string;
  };
}

interface FittingSheetContentProps {
  riderName: string;
  fitterName: string;
  bikeModel: string;
  orderDate: string;
  orderNo: string;
  ridingStyleName: string;
  data: FittingWorkOrderModalProps['data'];
}

const FittingSheetContent: React.FC<FittingSheetContentProps> = ({
  riderName,
  fitterName,
  bikeModel,
  orderDate,
  orderNo,
  ridingStyleName,
  data,
}) => {
  return (
    <div className="w-full max-w-[190mm] mx-auto bg-white text-slate-900 space-y-2.5 text-xs font-sans select-none">
      {/* 1. Sheet Header: Logo + Title + Order Meta */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <RouleurLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wider font-mono text-slate-900">ROULEUR PRO</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono font-bold">WORK ORDER</span>
            </div>
            <h1 className="text-xs font-bold text-slate-800 tracking-tight">
              公路车生物力学 Fitting 设定装车工单
            </h1>
          </div>
        </div>

        <div className="text-right font-mono text-[10px] text-slate-600 space-y-0.5">
          <div>工单编号: <span className="font-bold text-slate-900">{orderNo}</span></div>
          <div>拟合日期: <span className="text-slate-900">{orderDate}</span></div>
          <div>适用类型: <span className="font-semibold text-slate-900">{ridingStyleName}</span></div>
        </div>
      </div>

      {/* 2. Rider & Bike Info Bar */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 block text-[9px]">车手姓名 / RIDER:</span>
          <span className="font-bold text-slate-900 text-xs">{riderName}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px]">装车技师 / FITTER:</span>
          <span className="font-bold text-slate-900 text-xs">{fitterName}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px]">车辆品牌 / BIKE MODEL:</span>
          <span className="font-bold text-slate-900 text-xs">{bikeModel}</span>
        </div>
      </div>

      {/* 3. Section 1: Biometric Measurements */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-300 pb-0.5">
          <User className="w-3.5 h-3.5 text-slate-700" />
          <span>一、人体解剖学测量数据 (Rider Anthropometrics)</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="border border-slate-200 rounded p-1 bg-slate-50">
            <div className="text-[10px] text-slate-500">身高 (Height)</div>
            <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">{data.height} cm</div>
          </div>
          <div className="border border-slate-200 rounded p-1 bg-slate-50">
            <div className="text-[10px] text-slate-500">跨高 (Inseam)</div>
            <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">{data.inseam} cm</div>
          </div>
          <div className="border border-slate-200 rounded p-1 bg-slate-50">
            <div className="text-[10px] text-slate-500">躯干长 (Torso)</div>
            <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">{data.torso} cm</div>
          </div>
          <div className="border border-slate-200 rounded p-1 bg-slate-50">
            <div className="text-[10px] text-slate-500">手臂长 (Arm)</div>
            <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">{data.armLength} cm</div>
          </div>
        </div>
        {(data.sittingHeightNote || data.thighLowerLegNote) && (
          <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded p-1">
            <span className="font-semibold text-slate-800">身材比例研判：</span>
            {data.sittingHeightNote} {data.thighLowerLegNote}
          </div>
        )}
      </div>

      {/* 4. Section 2: Recommended Frame & Cockpit Geometry */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-300 pb-0.5">
          <Wrench className="w-3.5 h-3.5 text-slate-700" />
          <span>二、推荐车架与座舱核心拟合设定 (Recommended Fitting Geometry)</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="border-2 border-slate-800 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">推荐坐高 (LeMond)</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.saddleHeight} <span className="text-[10px] font-normal">cm</span></div>
            <div className="text-[9px] text-slate-500">BB中心至座垫顶点</div>
          </div>

          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">有效上管 (ETT)</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.effectiveTopTube} <span className="text-[10px] font-normal">cm</span></div>
            <div className="text-[9px] text-slate-500">水平有效几何跨距</div>
          </div>

          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">推荐把立长度</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.stemLength} <span className="text-[10px] font-normal">mm</span></div>
            <div className="text-[9px] text-slate-500">把立中对中规格</div>
          </div>

          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">座舱垂直落差 (Drop)</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.saddleDrop} <span className="text-[10px] font-normal">cm</span></div>
            <div className="text-[9px] text-slate-500">坐垫与车把落差</div>
          </div>

          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">车把宽度 (C-C)</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.handlebarWidth} <span className="text-[10px] font-normal">cm</span></div>
            <div className="text-[9px] text-slate-500">下把位中心间距</div>
          </div>

          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">推荐曲柄长度</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.crankLength} <span className="text-[10px] font-normal">mm</span></div>
            <div className="text-[9px] text-slate-500">踏频与关节发力</div>
          </div>

          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 font-medium">坐垫后移 (Setback)</div>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">{data.saddleSetback} <span className="text-[10px] font-normal">cm</span></div>
            <div className="text-[9px] text-slate-500">座垫鼻尖距BB垂线</div>
          </div>

          <div className="border-2 border-slate-900 rounded p-1.5 bg-slate-900 text-white">
            <div className="text-[10px] text-slate-300 font-medium">建议车架标称尺码</div>
            <div className="text-sm font-bold font-mono text-white">{data.frameSize}</div>
            <div className="text-[9px] text-slate-300">Stack ~{data.estimatedStack} / Reach ~{data.estimatedReach}</div>
          </div>
        </div>
      </div>

      {/* 5. Section 3: Vector Bike Geometry Schematic */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-300 pb-0.5">
          <Bike className="w-3.5 h-3.5 text-slate-700" />
          <span>三、装车关键基准线拟合图解 (Fitting Geometry Schematic)</span>
        </div>
        <div className="border border-slate-200 rounded p-1 bg-slate-50/50 flex justify-center">
          <svg viewBox="0 0 500 155" className="w-full max-w-[420px] h-auto text-slate-800">
            {/* Ground */}
            <line x1="20" y1="140" x2="480" y2="140" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />

            {/* Rear Wheel (80, 110) */}
            <circle cx="80" cy="110" r="30" fill="none" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="80" cy="110" r="3.5" fill="#1E293B" />

            {/* Front Wheel (420, 110) */}
            <circle cx="420" cy="110" r="30" fill="none" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="420" cy="110" r="3.5" fill="#1E293B" />

            {/* BB: (210, 110) */}
            <circle cx="210" cy="110" r="5" fill="#0F172A" />

            {/* Frame Lines */}
            <line x1="80" y1="110" x2="210" y2="110" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="210" y1="110" x2="185" y2="55" stroke="#0F172A" strokeWidth="3" />
            <line x1="185" y1="55" x2="175" y2="28" stroke="#475569" strokeWidth="2" />
            <path d="M 155 25 Q 175 25 195 27" stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            <line x1="345" y1="55" x2="355" y2="40" stroke="#0F172A" strokeWidth="3" />
            <line x1="210" y1="110" x2="345" y2="55" stroke="#0F172A" strokeWidth="3" />
            <line x1="185" y1="55" x2="345" y2="55" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="80" y1="110" x2="185" y2="55" stroke="#0F172A" strokeWidth="2" />
            <line x1="345" y1="55" x2="420" y2="110" stroke="#0F172A" strokeWidth="2.5" />

            {/* Stem & Handlebar */}
            <line x1="355" y1="40" x2="385" y2="40" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="385" cy="42" r="3" fill="#0F172A" />

            {/* Dimension Line: Saddle Height */}
            <line x1="215" y1="110" x2="180" y2="28" stroke="#2563EB" strokeWidth="1.2" strokeDasharray="2 2" />
            <text x="172" y="75" fill="#1D4ED8" fontSize="8" fontWeight="bold" fontFamily="monospace">坐高 {data.saddleHeight}cm</text>

            {/* Dimension Line: ETT */}
            <line x1="185" y1="49" x2="345" y2="49" stroke="#059669" strokeWidth="1.2" />
            <text x="245" y="45" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="monospace">ETT {data.effectiveTopTube}cm</text>

            {/* Dimension Line: Drop */}
            <line x1="175" y1="25" x2="400" y2="25" stroke="#7C3AED" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="385" y1="42" x2="400" y2="42" stroke="#7C3AED" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="396" y1="25" x2="396" y2="42" stroke="#7C3AED" strokeWidth="1.2" />
            <text x="403" y="36" fill="#7C3AED" fontSize="7.5" fontWeight="bold" fontFamily="monospace">落差 {data.saddleDrop}cm</text>
          </svg>
        </div>
      </div>

      {/* 6. Section 4: Workshop & Cleat Notes */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-300 pb-0.5">
          <FileText className="w-3.5 h-3.5 text-slate-700" />
          <span>四、锁鞋锁片与初次试骑调校备忘 (Cleat & Workshop Notes)</span>
        </div>
        <div className="border border-slate-200 rounded p-1.5 bg-slate-50 text-[10px] text-slate-700 space-y-0.5">
          <div className="flex items-start gap-1.5">
            <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>锁片前后位置：</strong>锁片中心轴线对齐脚掌第 1 与第 5 跖骨突起连线中心，避免跟腱过度拉伸与足底麻木。</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>动态膝关节角度：</strong>踩踏处于下死点（BDC 6点钟方向）时，膝关节屈曲角保持在 25°~35° 之间，臀部不得出现左右代偿摇摆。</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>把立垫圈安全冗余：</strong>新车建议在把立下方保留 15~20mm 调校垫圈，适应 200~500 公里身体柔韧性打开后再行裁切舵管。</span>
          </div>
        </div>
      </div>

      {/* 7. Section 5: Signature & Guarantee Confirmation */}
      <div className="pt-2 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block text-[9px] mb-2.5">主调技师签名 / FITTER SIGN:</span>
          <div className="border-b border-slate-400 font-mono text-xs pb-0.5 font-bold">{fitterName}</div>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] mb-2.5">车手客户确认 / RIDER SIGN:</span>
          <div className="border-b border-slate-400 font-mono text-xs pb-0.5 font-bold">{riderName}</div>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] mb-2.5">复检保障 / WARRANTY:</span>
          <div className="border-b border-slate-400 text-[10px] text-slate-700 pb-0.5">30天 / 500KM 免费微调保障</div>
        </div>
      </div>

      {/* 8. Footer Watermark */}
      <div className="text-center pt-0.5 text-[9px] text-slate-400 font-mono">
        Designed & Computed by Rouleur Pro Scientific Cycling Suite · 科学骑行，精准每一瓦
      </div>
    </div>
  );
};

export const FittingWorkOrderModal: React.FC<FittingWorkOrderModalProps> = ({
  isOpen,
  onClose,
  initialRiderName = '车手客户',
  initialBikeModel = '公路车 (Road Disc)',
  data,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [riderName, setRiderName] = useState<string>(initialRiderName);
  const [fitterName, setFitterName] = useState<string>('Rouleur 认证 Fitter');
  const [bikeModel, setBikeModel] = useState<string>(initialBikeModel);
  const [orderDate, setOrderDate] = useState<string>(todayStr);
  const [orderNo] = useState<string>(() => `ROU-FIT-${Date.now().toString().slice(-6)}`);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('is-printing-work-order');
    const cleanup = () => {
      document.body.classList.remove('is-printing-work-order');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2500);
  };

  const ridingStyleName =
    data.ridingStyle === 'racing'
      ? '竞技气动 (Racing / Aggressive)'
      : data.ridingStyle === 'endurance'
      ? '耐力巡航 (Endurance / Gran Fondo)'
      : '舒适休闲 (Recreational / Relaxed)';

  const sheetProps: FittingSheetContentProps = {
    riderName,
    fitterName,
    bikeModel,
    orderDate,
    orderNo,
    ridingStyleName,
    data,
  };

  return (
    <>
      {/* Screen Interactive Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-ios-popover overflow-hidden">
          {/* Modal Top Action Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-[#2C2C2E]/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ios-purple/10 text-ios-purple flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  专业 Fitting 装车工单
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  国际标准 A4 单页工单规范 · 适合车店施工调校与车手留档
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="apple-touch h-9 px-3.5 rounded-xl bg-ios-blue hover:bg-ios-blue/90 text-white font-semibold text-xs transition shadow-ios-sm flex items-center gap-1.5"
                title="打印工单"
              >
                <Printer className="w-4 h-4" />
                <span>打印</span>
              </button>
              <button
                onClick={onClose}
                className="apple-touch w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 transition"
                title="关闭"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customizable Quick Form Header (Screen only) */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-100/60 dark:bg-black/20 border-b border-black/[0.04] dark:border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">车手姓名</label>
              <input
                type="text"
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                className="w-full h-7 px-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">技师 / Fitter</label>
              <input
                type="text"
                value={fitterName}
                onChange={(e) => setFitterName(e.target.value)}
                className="w-full h-7 px-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">车辆品牌 / 型号</label>
              <input
                type="text"
                value={bikeModel}
                onChange={(e) => setBikeModel(e.target.value)}
                className="w-full h-7 px-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">测量日期</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full h-7 px-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Scrollable Printable A4 Sheet Paper Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 dark:bg-black/60 flex justify-center">
            <div className="w-full max-w-[210mm] bg-white text-slate-900 shadow-ios-card rounded-xl p-6 sm:p-8">
              <FittingSheetContent {...sheetProps} />
            </div>
          </div>
        </div>
      </div>

      {/* Top-Level Portal strictly for printing, isolated from modal scroll/layout context */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="print-work-order-portal" aria-hidden="true">
            <FittingSheetContent {...sheetProps} />
          </div>,
          document.body
        )}
    </>
  );
};
