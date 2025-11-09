
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import paper from 'paper';
import type { TransformParams, PenToolSettings } from '../types';
import { BevelType } from '../types';
import Slider from './ui/Slider';
import { SparklesIcon, PenToolIcon, SlidersIcon } from './icons';
import { aiService } from '../services/aiService';
import ColorPicker from './ui/ColorPicker';
import clsx from 'clsx';

// ... (Interfaces remain similar, update imports if needed)
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

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'properties' | 'ai'>('properties');

    return (
        <div className="h-full flex flex-col bg-[var(--bg-panel)]">
             {/* Tabs Header */}
             <div className="flex-shrink-0 h-14 flex items-center px-2 border-b border-[var(--border-color)]">
                <TabButton label="Properties" isActive={activeTab === 'properties'} onClick={() => setActiveTab('properties')} icon={<SlidersIcon className="w-4 h-4 mr-1.5"/>} />
                <TabButton label="AI Assistant" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<SparklesIcon className="w-4 h-4 mr-1.5"/>} />
             </div>

             <div className="flex-grow overflow-y-auto custom-scrollbar p-5 space-y-8">
                {activeTab === 'properties' && <PropertiesContent {...props} />}
                {activeTab === 'ai' && <AiAssistantContent {...props} />}
             </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; icon?: React.ReactNode }> = ({ label, isActive, onClick, icon }) => (
    <button
        onClick={onClick}
        className={clsx(
            "relative h-full px-4 flex items-center justify-center text-sm font-medium transition-colors",
            isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        )}
    >
        {icon}
        {label}
        {isActive && (
            <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" 
                layoutId="activeTabIndicator"
            />
        )}
    </button>
)

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">{title}</h3>
)

const bevelOptions = [
    { type: BevelType.NONE, label: 'None', icon: <path d="M4 20V4H20" stroke="currentColor" strokeWidth="2" fill="none"/> },
    { type: BevelType.CHAMFER, label: 'Chamfer', icon: <path d="M4 20V10L10 4H20" stroke="currentColor" strokeWidth="2" fill="none"/> },
    { type: BevelType.FILLET, label: 'Round', icon: <path d="M4 20V12C4 7.58172 7.58172 4 12 4H20" stroke="currentColor" strokeWidth="2" fill="none"/> },
    { type: BevelType.CONCAVE_SQUARE, label: 'In-Square', icon: <path d="M4 20V12H12V4H20" stroke="currentColor" strokeWidth="2" fill="none"/> },
    { type: BevelType.CONCAVE_CHAMFER, label: 'In-Chamfer', icon: <path d="M4 20V4L12 12H20" stroke="currentColor" strokeWidth="2" fill="none"/> }, // Simplified visual for readablity
    { type: BevelType.CONCAVE_ROUND, label: 'In-Round', icon: <path d="M4 20V4C4 9 9 12 14 12H20" stroke="currentColor" strokeWidth="2" fill="none"/> },
];

const PropertiesContent: React.FC<ControlPanelProps> = ({ params, onParamChange, editMode, penSettings, onPenSettingChange }) => {
    if (editMode === 'pen') {
        return (
            <div>
                <SectionHeader title="Pen Tool" />
                <div className="space-y-5">
                     <Slider label="Stroke Width" value={penSettings.strokeWidth} onChange={(v) => onPenSettingChange({...penSettings, strokeWidth: v})} min={1} max={50} step={0.5} />
                     <ColorPicker label="Stroke" color={penSettings.strokeColor} onChange={(c) => onPenSettingChange({...penSettings, strokeColor: c ?? '#000000'})} />
                     <ColorPicker label="Fill" color={penSettings.fillColor} onChange={(c) => onPenSettingChange({...penSettings, fillColor: c})} allowEmpty />
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-8">
                <div>
                    <SectionHeader title="Transform" />
                    <div className="grid grid-cols-2 gap-3">
                         {/* Visual placeholders for X/Y/W/H to match reference image style */}
                         <InputBox label="X" value="256px" readOnly />
                         <InputBox label="Y" value="512px" readOnly />
                         <InputBox label="W" value="480px" readOnly />
                         <InputBox label="H" value="600px" readOnly />
                    </div>
                    <div className="mt-3">
                        <InputBox label="Angle" value={`${params.slant}°`} readOnly />
                    </div>
                </div>

                <div>
                     <SectionHeader title="Typography" />
                     <div className="space-y-4">
                        <Slider label="Weight" value={params.weight} onChange={(v) => onParamChange('weight', v)} min={1} max={200} />
                        <Slider label="Width" value={params.width} onChange={(v) => onParamChange('width', v)} min={50} max={150} displaySuffix="%" />
                        <Slider label="Slant" value={params.slant} onChange={(v) => onParamChange('slant', v)} min={-30} max={30} displaySuffix="°" />
                     </div>
                </div>

                <div>
                    <SectionHeader title="Super Bevel" />
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {bevelOptions.map((option) => (
                                <button
                                    key={option.type}
                                    onClick={() => onParamChange('bevelType', option.type)}
                                    className={clsx(
                                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 h-16",
                                        params.bevelType === option.type
                                            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                                            : "bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                                    )}
                                    title={option.label}
                                >
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 mb-1">
                                        {option.icon}
                                    </svg>
                                    <span className="text-[10px] font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <motion.div 
                             initial={false}
                             animate={{ opacity: params.bevelType === BevelType.NONE ? 0.5 : 1, pointerEvents: params.bevelType === BevelType.NONE ? 'none' : 'auto' }}
                             className="space-y-4"
                        >
                            <Slider 
                                label="Bevel Size" 
                                value={params.bevelSize} 
                                onChange={(v) => onParamChange('bevelSize', v)} 
                                min={0} 
                                max={50} 
                                step={0.5}
                                displaySuffix="px"
                            />
                             {(params.bevelType === BevelType.CHAMFER || params.bevelType === BevelType.CONCAVE_CHAMFER) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                    <Slider 
                                        label="Chamfer Angle" 
                                        value={params.chamferAngle} 
                                        onChange={(v) => onParamChange('chamferAngle', v)} 
                                        min={15} 
                                        max={75} 
                                        displaySuffix="°"
                                    />
                                </motion.div>
                            )}
                             {(params.bevelType === BevelType.FILLET || params.bevelType === BevelType.CONCAVE_ROUND) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                    <Slider
                                        label="Smoothing"
                                        value={params.segments || 8}
                                        onChange={(v) => onParamChange('segments', v)}
                                        min={4}
                                        max={32}
                                        step={2}
                                    />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>

                <div>
                    <SectionHeader title="Appearance" />
                    <div className="space-y-4">
                        <ColorPicker label="Fill" color={params.fillColor} onChange={(c) => onParamChange('fillColor', c ?? '#000000')} />
                        <div className="grid grid-cols-2 gap-3">
                             <ColorPicker label="Stroke" color={params.strokeColor} onChange={(c) => onParamChange('strokeColor', c ?? '#000000')} />
                             <div className="mt-[26px]"> {/* Align with color picker input */}
                                 <InputBox label="" value={`${params.strokeWidth}px`} readOnly className="h-[42px]" />
                             </div>
                        </div>
                         <Slider label="Opacity" value={params.opacity * 100} onChange={(v) => onParamChange('opacity', v / 100)} min={0} max={100} displaySuffix="%" />
                    </div>
                </div>
            </div>
        </>
    );
};

const InputBox: React.FC<{ label: string; value: string; readOnly?: boolean; className?: string }> = ({ label, value, readOnly, className }) => (
    <div className="space-y-1.5">
        {label && <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>}
        <div className={clsx("bg-[var(--bg-input)] border border-[var(--border-color)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] flex items-center hover:border-[var(--border-highlight)] transition-colors", className)}>
            {value}
        </div>
    </div>
)


const AiAssistantContent: React.FC<ControlPanelProps> = ({ onApplyStyle }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<Partial<TransformParams>[]>([]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const result = await aiService.getStyleSuggestions(prompt);
            setSuggestions(result);
        } catch (err) { console.error(err); } 
        finally { setIsGenerating(false); }
    };

    return (
        <div className="space-y-4">
            <div className="bg-[var(--accent-primary)]/10 p-4 rounded-xl border border-[var(--accent-primary)]/20">
                <h4 className="text-[var(--accent-primary)] font-semibold mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    AI Style Generator
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mb-4">Describe the look you want, and I'll generate parameters for you.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Bold and futuristic', 'Elegant serif'..."
                    className="w-full h-24 p-3 text-sm bg-[var(--bg-canvas)] border border-[var(--border-color)] rounded-lg resize-none focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                    className="mt-3 w-full py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isGenerating ? 'Generating...' : <><SparklesIcon className="w-4 h-4" /> Generate Styles</>}
                </button>
            </div>

             {suggestions.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">SUGGESTIONS</label>
                    <div className="grid gap-2">
                        {suggestions.map((suggestion, i) => (
                             <button
                                key={i}
                                onClick={() => onApplyStyle(suggestion)}
                                className="text-left p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-primary)] transition-colors group"
                            >
                                <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Variant {i + 1}</div>
                                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                                    Wgt: {suggestion.weight}, Wdth: {suggestion.width}%, Slnt: {suggestion.slant}°
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ControlPanel;
