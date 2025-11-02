import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TransformParams, PenToolSettings } from '../types';
import { BevelType } from '../types';
import Slider from './ui/Slider';
import { ParametersIcon, SparklesIcon, PenToolIcon, ColorSwatchIcon, BevelIcon, NoBevelIcon, ChamferIcon, FilletIcon, InsetSquareIcon, InsetChamferIcon, InsetRoundIcon, ListIcon } from './icons';
import ChristianWuLogo from './MagicPathLogo';
import { aiService } from '../services/aiService';
import CollapsiblePanel from './ui/CollapsiblePanel';
import ColorPicker from './ui/ColorPicker';
import clsx from 'clsx';

interface ControlPanelProps {
    params: TransformParams;
    penSettings: PenToolSettings;
    onParamChange: <K extends keyof TransformParams>(param: K, value: TransformParams[K]) => void;
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

const ControlPanel: React.FC<ControlPanelProps> = ({
    params,
    penSettings,
    onParamChange,
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
                            />
                            <button
                                onClick={handleStyleGenerate}
                                disabled={isGeneratingStyle || disabled}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400"
                            >
                                {isGeneratingStyle ? '生成中...' : '生成樣式'}
                            </button>
                            {styleError && <p className="text-xs text-red-600">{styleError}</p>}
                            {suggestions.length > 0 && (
                                <div className="space-y-2">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => onApplyStyle(s)} className="w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100 text-xs">
                                            樣式 {i + 1}: Wt: {s.weight}, Wd: {s.width}%, Sl: {s.slant}°
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel 
                        title="全域控制"
                        icon={<ParametersIcon className="w-5 h-5 text-gray-500" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-5">
                            <Slider label="粗細(Weight)" value={params.weight} onChange={(v) => onParamChange('weight', v)} min={1} max={200} step={1} disabled={disabled} />
                            <Slider label="寬度" value={params.width} onChange={(v) => onParamChange('width', v)} min={50} max={150} step={1} displaySuffix="%" disabled={disabled} />
                            <Slider label="傾斜" value={params.slant} onChange={(v) => onParamChange('slant', v)} min={-30} max={30} step={1} displaySuffix="°" disabled={disabled} />
                        </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="超級倒角設計" icon={<BevelIcon />} defaultOpen={true}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb