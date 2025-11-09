import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { TransformParams, Layer, SvgData } from '../../types';
import { LayersIcon, SlidersHorizontalIcon, UploadIcon, MoreVerticalIcon, SparklesIcon } from '../icons';
import Slider from '../ui/Slider';
import AIImportPanel from '../AIImportPanel';
import LayerPanel from '../LayerPanel';

type ToolbarTab = 'layers' | 'params' | 'import' | 'more' | null;

interface MobileUILayoutProps {
    params: TransformParams;
    onParamChange: <K extends keyof TransformParams>(param: K, value: TransformParams[K]) => void;
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onReorderLayer: (id: string, direction: 'up' | 'down') => void;
    onSetActiveLayer: (id: string) => void;
    onImportSVG: (svgString: string) => void;
    onExportSVG: () => void;
    onCopySVG: () => void;
    onClearCanvas: () => void;
    disabled: boolean;
}

const ToolbarButton: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void;}> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={clsx("flex flex-col items-center justify-center min-w-[56px] h-14 px-1 rounded-lg transition-colors", active ? 'bg-blue-100 text-blue-600' : 'text-gray-600 active:bg-gray-100')}>
        <div className="w-6 h-6">{icon}</div>
        <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
);

const ParamsQuickPanel: React.FC<Pick<MobileUILayoutProps, 'params' | 'onParamChange' | 'disabled'>> = ({ params, onParamChange, disabled }) => (
    <div className="p-4 space-y-4">
        <Slider label="字重" value={params.weight} onChange={(v) => onParamChange('weight', v)} min={1} max={200} step={1} disabled={disabled} />
        <Slider label="寬度" value={params.width} onChange={(v) => onParamChange('width', v)} min={50} max={150} step={1} displaySuffix="%" disabled={disabled} />
        <Slider label="斜度" value={params.slant} onChange={(v) => onParamChange('slant', v)} min={-30} max={30} step={1} displaySuffix="°" disabled={disabled} />
    </div>
);

const MorePanel: React.FC<Pick<MobileUILayoutProps, 'onExportSVG' | 'onCopySVG' | 'onClearCanvas' | 'disabled'>> = ({ onExportSVG, onCopySVG, onClearCanvas, disabled }) => (
    <div className="p-4 grid grid-cols-2 gap-4">
        <button onClick={onExportSVG} disabled={disabled} className="text-sm p-4 bg-gray-100 rounded-lg disabled:opacity-50 text-center font-medium active:bg-gray-200 transition-colors">匯出 SVG</button>
        <button onClick={onCopySVG} disabled={disabled} className="text-sm p-4 bg-gray-100 rounded-lg disabled:opacity-50 text-center font-medium active:bg-gray-200 transition-colors">複製 SVG</button>
        <button onClick={onClearCanvas} disabled={disabled} className="text-sm p-4 bg-red-50 text-red-700 rounded-lg disabled:opacity-50 text-center font-medium active:bg-red-100 transition-colors col-span-2">清空畫布</button>
    </div>
);

export const BottomToolbar: React.FC<MobileUILayoutProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ToolbarTab>(null);

    const handleTabClick = (tab: ToolbarTab) => {
        setActiveTab(prev => (prev === tab ? null : tab));
    };

    return (
        <div className="fixed left-0 right-0 bottom-0 z-30" style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            <div className="h-[64px] flex items-center justify-around px-4">
                <ToolbarButton icon={<LayersIcon />} label="圖層" active={activeTab === 'layers'} onClick={() => handleTabClick('layers')} />
                <ToolbarButton icon={<SlidersHorizontalIcon />} label="參數" active={activeTab === 'params'} onClick={() => handleTabClick('params')} />
                <ToolbarButton icon={<SparklesIcon />} label="AI 匯入" active={activeTab === 'import'} onClick={() => handleTabClick('import')} />
                <ToolbarButton icon={<MoreVerticalIcon />} label="更多" active={activeTab === 'more'} onClick={() => handleTabClick('more')} />
            </div>

            <AnimatePresence>
                {activeTab && (
                    <motion.div
                        key={activeTab}
                        className="overflow-y-auto bg-white/80 backdrop-blur-md border-t border-gray-200/50"
                        style={{ maxHeight: '50vh', height: 'auto' }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                    >
                        {activeTab === 'layers' && <LayerPanel {...props} />}
                        {activeTab === 'params' && <ParamsQuickPanel {...props} />}
                        {activeTab === 'import' && <div className="p-4"><AIImportPanel onImportSVG={props.onImportSVG} /></div>}
                        {activeTab === 'more' && <MorePanel {...props} />}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};