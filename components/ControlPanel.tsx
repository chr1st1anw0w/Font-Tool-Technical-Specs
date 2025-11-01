import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TransformParams } from '../types';
import Slider from './ui/Slider';
import { ParametersIcon, SparklesIcon } from './icons';
import MagicPathLogo from './MagicPathLogo';
import { aiService } from '../services/aiService';

interface ControlPanelProps {
    params: TransformParams;
    onParamChange: <K extends keyof TransformParams>(param: K, value: TransformParams[K]) => void;
    onApplyStyle: (params: TransformParams) => void;
    disabled: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, onParamChange, onApplyStyle, disabled }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<TransformParams[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("請輸入樣式描述。");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setSuggestions([]);
        try {
            const result = await aiService.getStyleSuggestions(prompt);
            setSuggestions(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("發生未知錯誤。");
            }
        } finally {
            setIsGenerating(false);
        }
    };

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
                className="flex-grow p-4 overflow-y-auto space-y-6"
                animate={{ opacity: disabled ? 0.5 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {/* AI Style Panel Content */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                            <SparklesIcon className="w-4 h-4 mr-2 text-blue-500" />
                            AI 樣式建議
                        </h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="例如：粗獷的機器人風格..."
                            className="w-full h-20 p-2 text-sm bg-white border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            disabled={disabled || isGenerating}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={disabled || isGenerating}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-button-primary-bg text-button-primary-text hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                生成中...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-4 h-4 mr-2"/>
                                生成樣式
                            </>
                        )}
                    </button>
                    
                    {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                    
                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {suggestions.map((style, index) => (
                                    <motion.div
                                        key={index}
                                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                                            <div>
                                                <div className="font-semibold text-gray-800">{style.weight}</div>
                                                <div className="text-gray-500">粗細</div>
                                            </div>
                                             <div>
                                                <div className="font-semibold text-gray-800">{style.width}%</div>
                                                <div className="text-gray-500">寬度</div>
                                            </div>
                                             <div>
                                                <div className="font-semibold text-gray-800">{style.slant}°</div>
                                                <div className="text-gray-500">傾斜</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onApplyStyle(style)}
                                            className="mt-2 w-full text-center py-1.5 text-xs font-semibold rounded-md bg-white border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg"
                                        >
                                            套用
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Global Controls */}
                <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">全域控制</h3>
                    <div className="space-y-5">
                        <Slider
                            label="粗細"
                            value={params.weight}
                            onChange={(v) => onParamChange('weight', v)}
                            min={1}
                            max={200}
                            step={1}
                            disabled={disabled}
                            minLabel="細"
                            maxLabel="粗"
                        />
                        <Slider
                            label="寬度"
                            value={params.width}
                            onChange={(v) => onParamChange('width', v)}
                            min={50}
                            max={150}
                            step={1}
                            displaySuffix="%"
                            disabled={disabled}
                            minLabel="窄"
                            maxLabel="寬"
                        />
                        <Slider
                            label="傾斜"
                            value={params.slant}
                            onChange={(v) => onParamChange('slant', v)}
                            min={-30}
                            max={30}
                            step={1}
                            displaySuffix="°"
                            disabled={disabled}
                            minLabel="-30°"
                            maxLabel="+30°"
                        />
                    </div>
                </div>
            </motion.div>

            <div className="p-4 mt-auto flex-shrink-0 border-t border-gray-200">
                <a 
                    href="#" 
                    className="flex items-center justify-center p-2 space-x-2 bg-gray-900 text-white rounded-md"
                    title="Powered by MagicPath"
                >
                    <span>Powered by</span>
                    <MagicPathLogo className="h-4" />
                </a>
            </div>
        </aside>
    );
};

export default ControlPanel;