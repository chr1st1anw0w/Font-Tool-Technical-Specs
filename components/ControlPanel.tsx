
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import paper from 'paper';
import type { TransformParams, PenToolSettings } from '../types';
import { BevelType } from '../types';
import Slider from './ui/Slider';
import { ParametersIcon, SparklesIcon, PenToolIcon, ColorSwatchIcon, BevelIcon, NoBevelIcon, ChamferIcon, FilletIcon, InsetSquareIcon, InsetChamferIcon, InsetRoundIcon, ListIcon, LinkIcon, UnlinkIcon } from './icons';
import ChristianWuLogo from './ChristianWuLogo';
import { aiService } from '../services/aiService';
import CollapsiblePanel from './ui/CollapsiblePanel';
import ColorPicker from './ui/ColorPicker';
import clsx from 'clsx';

interface ControlPanelProps {
    params: TransformParams;
    nodeOverrides: Map<string, Partial<TransformParams>>;
    selectedSegmentIds: string[];
    penSettings: PenToolSettings;
    onParamChange: <K extends keyof TransformParams>(param: K, value: TransformParams[K]) => void;
    onNodeOverrideChange: (segmentIds: string[], overrideParams: Partial<TransformParams>) => void;
    onResetNodeOverrides: (segmentIds: string[]) => void;
    onPenSettingChange: (settings: PenToolSettings) => void;
    onApplyStyle: (params: Partial<TransformParams>) => void;
    disabled: boolean;
    editMode: 'transform' | 'points' | 'pen';
    paperScope: paper.PaperScope | null;
    selectedItem: paper.Item | null;
}

const bevelTypes: { key: BevelType; label: string; icon: React.FC<{className?: string}> }[] = [
    { key: BevelType.NONE, label: '無', icon: NoBevelIcon },
    { key: BevelType.CHAMFER, label: '斜面', icon: ChamferIcon },
    { key: BevelType.FILLET, label: '圓角', icon: FilletIcon },
    { key: BevelType.CONCAVE_SQUARE, label: '內凹方', icon: InsetSquareIcon },
    { key: BevelType.CONCAVE_CHAMFER, label: '內凹斜', icon: InsetChamferIcon },
    { key: BevelType.CONCAVE_ROUND, label: '內凹圓', icon: InsetRoundIcon },
];

interface NodeBevelOverridePanelProps {
    selectedSegmentIds: string[];
    nodeOverrides: Map<string, Partial<TransformParams>>;
    globalParams: TransformParams;
    onNodeOverrideChange: (segmentIds: string[], overrideParams: Partial<TransformParams>) => void;
    onResetNodeOverrides: (segmentIds: string[]) => void;
}

const NodeBevelOverridePanel: React.FC<NodeBevelOverridePanelProps> = ({
    selectedSegmentIds,
    nodeOverrides,
    globalParams,
    onNodeOverrideChange,
    onResetNodeOverrides,
}) => {
    // Determine if any selected node has an override
    const hasAnyOverride = selectedSegmentIds.some(id => nodeOverrides.has(id));
    const isLinked = !hasAnyOverride;

    // Use the first overridden value, or fallback to global if linked
    const firstOverride = selectedSegmentIds.length > 0 ? nodeOverrides.get(selectedSegmentIds[0]) : undefined;
    const currentBevelType = isLinked ? globalParams.bevelType : (firstOverride?.bevelType ?? globalParams.bevelType);
    const currentBevelSize = isLinked ? globalParams.bevelSize : (firstOverride?.bevelSize ?? globalParams.bevelSize);

    const handleToggleLink = () => {
        if (isLinked) {
            // Unlink: Apply current global params as overrides to all selected nodes
            onNodeOverrideChange(selectedSegmentIds, {
                bevelType: globalParams.bevelType,
                bevelSize: globalParams.bevelSize
            });
        } else {
            // Link: Remove overrides for all selected nodes
            onResetNodeOverrides(selectedSegmentIds);
        }
    };

    return (
        <div className={clsx(
            "space-y-4 border p-3 rounded-lg transition-colors",
            isLinked ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
        )}>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <p className={clsx("text-sm font-semibold", isLinked ? "text-gray-700" : "text-blue-800")}>
                        {selectedSegmentIds.length} 個節點
                    </p>
                     <button
                        onClick={handleToggleLink}
                        className={clsx(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                            isLinked 
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300" 
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        )}
                        title={isLinked ? "點擊以取消連結（設定獨立參數）" : "點擊以連結至全域設定"}
                    >
                        {isLinked ? (
                            <>
                                <LinkIcon className="w-3.5 h-3.5" />
                                已連結全域
                            </>
                        ) : (
                            <>
                                <UnlinkIcon className="w-3.5 h-3.5" />
                                獨立設定
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className={clsx("transition-opacity", isLinked && "opacity-50 pointer-events-none grayscale")}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">倒角類型</label>
                <div className="grid grid-cols-3 gap-2">
                    {bevelTypes.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => !isLinked && onNodeOverrideChange(selectedSegmentIds, { bevelType: key })}
                            disabled={isLinked}
                            title={`設定倒角類型為：${label}`}
                            className={clsx(
                                'border-2 rounded-lg p-2 text-center transition-all flex flex-col items-center justify-center h-[72px]',
                                currentBevelType === key
                                    ? 'border-blue-500 bg-white text-blue-600 font-semibold'
                                    : 'border-gray-200 bg-white/50 text-gray-500 hover:border-gray-300',
                                isLinked && 'cursor-not-allowed'
                            )}
                        >
                            <Icon className="w-6 h-6 mb-1" />
                            <span className="text-[11px] font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className={clsx("transition-opacity", isLinked && "opacity-50 pointer-events-none")}>
                <Slider
                    label="倒角尺寸"
                    value={currentBevelSize ?? 0}
                    onChange={(v) => onNodeOverrideChange(selectedSegmentIds, { bevelSize: v })}
                    min={0}
                    max={50}
                    step={0.5}
                    disabled={isLinked || currentBevelType === BevelType.NONE}
                />
            </div>
        </div>
    );
};


const ControlPanel: React.FC<ControlPanelProps> = ({
    params,
    nodeOverrides,
    selectedSegmentIds,
    penSettings,
    onParamChange,
    onNodeOverrideChange,
    onResetNodeOverrides,
    onPenSettingChange,
    onApplyStyle,
    disabled,
    editMode,
    paperScope,
    selectedItem,
}) => {
    const [stylePrompt, setStylePrompt] = useState('');
    const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
    const [styleError, setStyleError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Partial<TransformParams>[]>([]);
    
    const [palettePrompt, setPalettePrompt] = useState('');
    const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
    const [paletteError, setPaletteError] = useState<string | null>(null);
    const [palettes, setPalettes] = useState<{name: string; colors: string[]}[]>([]);
    
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

    const handleStyleGenerate = async () => {
        if (!stylePrompt) return;
        setIsGeneratingStyle(true);
        setStyleError(null);
        try {
            const result = await aiService.getStyleSuggestions(stylePrompt);
            setSuggestions(result);
        } catch (err) {
            setStyleError(err instanceof Error ? err.message : '生成失敗');
        } finally {
            setIsGeneratingStyle(false);
        }
    };
    
    const handlePaletteGenerate = async () => {
        if (!palettePrompt) return;
        setIsGeneratingPalette(true);
        setPaletteError(null);
        try {
            const result = await aiService.getColorPalettes(palettePrompt);
            setPalettes(result);
        } catch (err) {
            setPaletteError(err instanceof Error ? err.message : '生成失敗');
        } finally {
            setIsGeneratingPalette(false);
        }
    };

    const applyColorToSelection = (color: string) => {
        onParamChange('fillColor', color);
    };

    // Item structure logic
    const itemStructure = selectedItem?.children
        ?.filter(child => child.name)
        .map(child => ({ id: child.id, name: child.name }));
        
    useEffect(() => {
        if (!paperScope || !hoveredItemId) return;
        
        const item = paperScope.project.getItem({ id: parseInt(hoveredItemId, 10) });
        if(item) {
            item.set({
                selected: true,
                selectedColor: 'red'
            });
        }
        
        return () => {
            if(item) {
                 item.set({
                    selected: false,
                });
            }
        }

    }, [paperScope, hoveredItemId]);

    return (
        <aside
            className="w-full h-full bg-white border-l border-gray-200 flex flex-col"
            aria-label="Parameters Panel"
        >
            <div className="h-[49px] flex-shrink-0 flex items-center px-4 border-b border-gray-200">
                <ParametersIcon className="w-5 h-5 text-gray-500" />
                <h2 className="ml-2 text-base font-semibold text-gray-800">參數</h2>
            </div>

            <motion.div
                className="flex-grow overflow-y-auto"
                animate={{ opacity: disabled && editMode !== 'pen' ? 0.5 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {editMode === 'pen' ? (
                     <CollapsiblePanel
                        title="鋼筆工具設定"
                        icon={<PenToolIcon className="w-5 h-5 text-gray-500" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-5">
                             <Slider
                                label="筆觸寬度"
                                value={penSettings.strokeWidth}
                                onChange={(v) => onPenSettingChange({...penSettings, strokeWidth: v})}
                                min={1} max={50} step={0.5}
                            />
                            <ColorPicker
                                label="筆觸顏色"
                                color={penSettings.strokeColor}
                                onChange={(c) => onPenSettingChange({...penSettings, strokeColor: c ?? '#000000'})}
                            />
                            <ColorPicker
                                label="填充顏色"
                                color={penSettings.fillColor}
                                onChange={(c) => onPenSettingChange({...penSettings, fillColor: c})}
                                allowEmpty
                            />
                        </div>
                    </CollapsiblePanel>
                ) : (
                <>
                    <CollapsiblePanel 
                        title="AI 樣式建議" 
                        icon={<SparklesIcon className="w-5 h-5 text-blue-500" />}
                    >
                        <div className="space-y-4">
                            <textarea
                                value={stylePrompt}
                                onChange={(e) => setStylePrompt(e.target.value)}
                                placeholder="例如：'大膽且具未來感', '優雅的手寫體'"
                                className="w-full h-16 p-2 text-xs font-mono bg-white border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isGeneratingStyle || disabled}
                                title="輸入風格描述"
                            />
                            <button
                                onClick={handleStyleGenerate}
                                disabled={isGeneratingStyle || disabled}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400"
                                title="使用 AI 生成樣式建議"
                            >
                                {isGeneratingStyle ? '生成中...' : '生成樣式'}
                            </button>
                            {styleError && <p className="text-xs text-red-600">{styleError}</p>}
                            {suggestions.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-600">建議：</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => onApplyStyle(suggestion)}
                                                className="bg-gray-100 text-gray-700 text-xs text-left p-2 rounded-md hover:bg-gray-200"
                                            >
                                                <p>粗細: {suggestion.weight}</p>
                                                <p>寬度: {suggestion.width}%</p>
                                                <p>斜度: {suggestion.slant}°</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsiblePanel>
                    
                    <CollapsiblePanel
                        title="主要參數"
                        icon={<ParametersIcon className="w-5 h-5 text-gray-500" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-5">
                            <Slider label="字重" value={params.weight} onChange={(v) => onParamChange('weight', v)} min={1} max={200} step={1} disabled={disabled} />
                            <Slider label="寬度" value={params.width} onChange={(v) => onParamChange('width', v)} min={50} max={150} step={1} displaySuffix="%" disabled={disabled} />
                            <Slider label="斜度" value={params.slant} onChange={(v) => onParamChange('slant', v)} min={-30} max={30} step={1} displaySuffix="°" disabled={disabled} />
                            <Slider label="透明度" value={params.opacity} onChange={(v) => onParamChange('opacity', v)} min={0} max={1} step={0.01} disabled={disabled} />
                        </div>
                    </CollapsiblePanel>
                    
                    <CollapsiblePanel 
                        title="顏色與筆劃" 
                        icon={<ColorSwatchIcon className="w-5 h-5 text-gray-500" />}
                    >
                         <div className="space-y-4">
                            <ColorPicker
                                label="填充顏色"
                                color={params.fillColor}
                                onChange={(c) => onParamChange('fillColor', c ?? '#000000')}
                                disabled={disabled}
                            />
                             <ColorPicker
                                label="筆劃顏色"
                                color={params.strokeColor}
                                onChange={(c) => onParamChange('strokeColor', c ?? '#000000')}
                                disabled={disabled}
                            />
                             <Slider label="筆劃寬度" value={params.strokeWidth} onChange={(v) => onParamChange('strokeWidth', v)} min={0} max={50} step={0.5} disabled={disabled} />
                             
                             <div className="pt-2">
                                 <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                                    <SparklesIcon className="w-4 h-4 mr-2 text-blue-500" />
                                    AI 調色盤
                                </h3>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={palettePrompt}
                                        onChange={(e) => setPalettePrompt(e.target.value)}
                                        placeholder="例如：'寧靜的日落', '賽博龐克城市'"
                                        className="w-full p-2 text-xs font-mono bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isGeneratingPalette || disabled}
                                    />
                                    <button
                                        onClick={handlePaletteGenerate}
                                        disabled={isGeneratingPalette || disabled}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400"
                                    >
                                        {isGeneratingPalette ? '生成中...' : '生成調色盤'}
                                    </button>
                                    {paletteError && <p className="text-xs text-red-600">{paletteError}</p>}
                                </div>
                                {palettes.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {palettes.map((palette, i) => (
                                            <div key={i}>
                                                <p className="text-xs font-semibold text-gray-600 mb-1.5">{palette.name}</p>
                                                <div className="flex gap-1">
                                                    {palette.colors.map(color => (
                                                        <button
                                                            key={color}
                                                            className="w-6 h-6 rounded-full border border-gray-300/50"
                                                            style={{ backgroundColor: color }}
                                                            onClick={() => applyColorToSelection(color)}
                                                            title={`套用顏色: ${color}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>
                    </CollapsiblePanel>

                     <CollapsiblePanel 
                        title="倒角（全域）"
                        icon={<BevelIcon className="w-5 h-5 text-gray-500" />}
                    >
                         <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">倒角類型</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {bevelTypes.map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => onParamChange('bevelType', key)}
                                            title={`設定倒角類型為：${label}`}
                                            className={clsx(
                                                'border-2 rounded-lg p-2 text-center transition-all flex flex-col items-center justify-center h-[72px]',
                                                params.bevelType === key
                                                    ? 'border-blue-500 bg-white text-blue-600 font-semibold'
                                                    : 'border-gray-200 bg-white/50 text-gray-500 hover:border-gray-300',
                                            )}
                                        >
                                            <Icon className="w-6 h-6 mb-1" />
                                            <span className="text-[11px] font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Slider
                                label="倒角尺寸"
                                value={params.bevelSize}
                                onChange={(v) => onParamChange('bevelSize', v)}
                                min={0}
                                max={50}
                                step={0.5}
                                disabled={params.bevelType === BevelType.NONE || disabled}
                            />
                            <Slider
                                label="斜角角度"
                                value={params.chamferAngle}
                                onChange={(v) => onParamChange('chamferAngle', v)}
                                min={1}
                                max={89}
                                step={1}
                                displaySuffix="°"
                                disabled={params.bevelType !== BevelType.CHAMFER || disabled}
                            />
                         </div>
                    </CollapsiblePanel>

                    {selectedSegmentIds.length > 0 && editMode === 'points' && (
                        <CollapsiblePanel 
                            title="節點倒角覆蓋"
                            icon={<BevelIcon className="w-5 h-5 text-blue-500" />}
                            defaultOpen={true}
                        >
                           <NodeBevelOverridePanel
                             selectedSegmentIds={selectedSegmentIds}
                             nodeOverrides={nodeOverrides}
                             globalParams={params}
                             onNodeOverrideChange={onNodeOverrideChange}
                             onResetNodeOverrides={onResetNodeOverrides}
                           />
                        </CollapsiblePanel>
                    )}

                    {selectedItem && itemStructure && itemStructure.length > 0 && (
                        <CollapsiblePanel
                            title="物件結構"
                            icon={<ListIcon className="w-5 h-5 text-gray-500" />}
                        >
                            <div className="space-y-1">
                                {itemStructure.map(item => (
                                    <div 
                                        key={item.id} 
                                        onMouseEnter={() => setHoveredItemId(item.id.toString())}
                                        onMouseLeave={() => setHoveredItemId(null)}
                                        className="text-xs p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                    >
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                        </CollapsiblePanel>
                    )}
                </>
            )}
            </motion.div>
             <div className="p-4 mt-auto border-t border-gray-200">
                <a href="https://magicpath.design" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors">
                    <ChristianWuLogo className="h-4" />
                </a>
            </div>
        </aside>
    );
};

export default ControlPanel;
