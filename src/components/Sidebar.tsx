
import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { UploadIcon, SparklesIcon, LayersIcon, ToolsIcon, CursorClickIcon, PencilIcon, BezierCurveIcon, LineSegmentsIcon, EraserIcon, ScissorsIcon, ArrowsLeftRightIcon, ArrowsDownUpIcon, PlusIcon, MinusIcon, CopyIcon, PasteIcon, SpiralIcon, ScalesIcon, CameraRotateIcon, CoinVerticalIcon, MagicWandIcon, WrenchIcon, RulerIcon, MagnifyingGlassIcon, GridFourIcon, AlignLeftIcon, AlignTopIcon, AlignRightIcon } from './icons';
import LayerPanel from './LayerPanel';
import { Layer } from '../types';

interface SidebarProps {
    onSelectLetter: (key: string, svgString: string) => void;
    currentLetterKey: string | null;
    onImportSVG: (svgString: string) => void;
    // Layer props
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onReorderLayer: (id: string, direction: 'up' | 'down') => void;
    onSetActiveLayer: (id: string) => void;
}

const LettersPanel: React.FC<Pick<SidebarProps, 'onSelectLetter' | 'currentLetterKey' | 'onImportSVG'>> = ({ onSelectLetter, currentLetterKey, onImportSVG }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pasteContent, setPasteContent] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImportSVG(e.target?.result as string);
            };
            reader.readAsText(file);
            event.target.value = ''; // Reset file input
        }
    };
    
    const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const content = e.target.value;
        setPasteContent(content);
        if (content.trim().startsWith('<svg')) {
             onImportSVG(content);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">手動匯入</h3>
                <div className="space-y-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".svg"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        title="從電腦上傳 SVG 檔案"
                        className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                    >
                        <UploadIcon className="w-6 h-6 mb-1" />
                        <span className="text-sm font-medium">上傳檔案</span>
                    </button>
                    <div className="text-center text-gray-400 text-xs">或</div>
                    <textarea
                        value={pasteContent}
                        onChange={handlePasteChange}
                        placeholder="在此貼上 SVG 程式碼..."
                        title="貼上 SVG 程式碼以匯入"
                        className="w-full h-24 p-2 text-xs font-mono bg-white border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}

const ToolItem: React.FC<{ icon: React.ReactNode; label: string; description: string }> = ({ icon, label, description }) => (
    <div className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
        <div className="text-gray-700">
            {icon}
        </div>
        <div className="flex flex-col">
            <h4 className="text-sm font-bold text-gray-900 leading-tight">{label}</h4>
            <p className="text-xs text-gray-500 leading-normal">{description}</p>
        </div>
    </div>
);

const ToolsPanel: React.FC = () => {
    return (
        <div className="p-4 space-y-6 overflow-y-auto">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">節點與路徑工具</h3>
                <div className="space-y-2">
                    <ToolItem icon={<CursorClickIcon className="w-6 h-6" />} label="節點選擇" description="選擇並操作節點" />
                    <ToolItem icon={<PencilIcon className="w-6 h-6" />} label="鋼筆工具" description="自由繪製路徑" />
                    <ToolItem icon={<BezierCurveIcon className="w-6 h-6" />} label="貝茲曲線工具" description="建立與編輯貝茲曲線" />
                    <ToolItem icon={<LineSegmentsIcon className="w-6 h-6" />} label="直線工具" description="繪製直線" />
                    <ToolItem icon={<EraserIcon className="w-6 h-6" />} label="節點橡皮擦" description="擦除個別節點" />
                    <ToolItem icon={<ScissorsIcon className="w-6 h-6" />} label="路徑分割" description="在選定點分割路徑" />
                    <ToolItem icon={<ArrowsLeftRightIcon className="w-6 h-6" />} label="水平調整" description="水平調整節點" />
                    <ToolItem icon={<ArrowsDownUpIcon className="w-6 h-6" />} label="垂直調整" description="垂直調整節點" />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">節點與路徑操作</h3>
                <div className="space-y-2">
                    <ToolItem icon={<PlusIcon className="w-6 h-6" />} label="新增節點" description="在路徑上新增節點" />
                    <ToolItem icon={<MinusIcon className="w-6 h-6" />} label="移除節點" description="從路徑移除節點" />
                    <ToolItem icon={<CopyIcon className="w-6 h-6" />} label="複製路徑" description="複製選定的路徑" />
                    <ToolItem icon={<PasteIcon className="w-6 h-6" />} label="貼上路徑" description="貼上已複製的路徑" />
                    <ToolItem icon={<SpiralIcon className="w-6 h-6" />} label="旋轉路徑" description="旋轉選定的路徑" />
                    <ToolItem icon={<ScalesIcon className="w-6 h-6" />} label="縮放路徑" description="縮放選定的路徑" />
                    <ToolItem icon={<CameraRotateIcon className="w-6 h-6" />} label="水平翻轉" description="水平翻轉路徑" />
                    <ToolItem icon={<CoinVerticalIcon className="w-6 h-6" />} label="垂直翻轉" description="垂直翻轉路徑" />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">路徑優化</h3>
                <div className="space-y-2">
                    <ToolItem icon={<MagicWandIcon className="w-6 h-6" />} label="平滑路徑" description="平滑化路徑以獲得更乾淨的外觀" />
                    <ToolItem icon={<WrenchIcon className="w-6 h-6" />} label="簡化路徑" description="減少路徑中的節點數量" />
                    <ToolItem icon={<RulerIcon className="w-6 h-6" />} label="測量路徑" description="測量路徑上的距離和角度" />
                    <ToolItem icon={<MagnifyingGlassIcon className="w-6 h-6" />} label="縮放" description="放大和縮小路徑" />
                    <ToolItem icon={<GridFourIcon className="w-6 h-6" />} label="顯示網格" description="顯示網格以進行精確編輯" />
                    <ToolItem icon={<AlignLeftIcon className="w-6 h-6" />} label="靠左對齊" description="將選定的節點靠左對齊" />
                    <ToolItem icon={<AlignTopIcon className="w-6 h-6" />} label="靠上對齊" description="將選定的節點靠上對齊" />
                    <ToolItem icon={<AlignRightIcon className="w-6 h-6" />} label="靠右對齊" description="將選定的節點靠右對齊" />
                </div>
            </div>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'letters' | 'layers' | 'tools'>('letters');
    
    return (
        <aside
            className="w-[256px] h-full bg-gray-50 flex flex-col overflow-hidden"
            aria-label="Main Sidebar"
        >
            <div className="flex-shrink-0 border-b border-gray-200 flex bg-white">
                <TabButton 
                    label="匯入" 
                    icon={<UploadIcon className="w-4 h-4" />} 
                    isActive={activeTab === 'letters'} 
                    onClick={() => setActiveTab('letters')} 
                />
                <TabButton 
                    label="圖層" 
                    icon={<LayersIcon className="w-4 h-4" />} 
                    isActive={activeTab === 'layers'} 
                    onClick={() => setActiveTab('layers')} 
                />
                <TabButton 
                    label="工具" 
                    icon={<ToolsIcon className="w-4 h-4" />} 
                    isActive={activeTab === 'tools'} 
                    onClick={() => setActiveTab('tools')} 
                />
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'letters' && (
                    <LettersPanel 
                        onSelectLetter={props.onSelectLetter}
                        currentLetterKey={props.currentLetterKey}
                        onImportSVG={props.onImportSVG}
                    />
                )}
                 {activeTab === 'layers' && (
                    <LayerPanel
                        layers={props.layers}
                        activeLayerId={props.activeLayerId}
                        onAddLayer={props.onAddLayer}
                        onDeleteLayer={props.onDeleteLayer}
                        onUpdateLayer={props.onUpdateLayer}
                        onReorderLayer={props.onReorderLayer}
                        onSetActiveLayer={props.onSetActiveLayer}
                    />
                )}
                {activeTab === 'tools' && (
                    <ToolsPanel />
                )}
            </div>
        </aside>
    );
};

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            title={`切換到 ${label} 面板`}
            className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 p-3 text-sm font-medium border-b-2 transition-colors min-w-0",
                isActive ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700"
            )}
        >
            {icon}
            <span className="truncate">{label}</span>
        </button>
    )
}

export default Sidebar;
