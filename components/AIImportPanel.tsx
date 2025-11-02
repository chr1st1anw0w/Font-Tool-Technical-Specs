import React, { useState } from 'react';
import { SparklesIcon, BrainIcon } from './icons';
import { aiService } from '../services/aiService';

interface AIImportPanelProps {
    onImportSVG: (svgString: string) => void;
}

const AIImportPanel: React.FC<AIImportPanelProps> = ({ onImportSVG }) => {
    const [prompt, setPrompt] = useState('');
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("請輸入描述。");
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const svgString = await aiService.textToSVG(prompt, useThinkingMode);
            onImportSVG(svgString);
            setPrompt(''); // Clear prompt on success
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
        <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                <SparklesIcon className="w-4 h-4 mr-2 text-blue-500" />
                AI 匯入助理
            </h3>
            <div className="space-y-2">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例如：一個未來感的字母 'X'，或 '一個 300x50px 的圓角矩形'"
                    className="w-full h-20 p-2 text-xs font-mono bg-white border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isGenerating}
                />
                 <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="thinking-mode"
                        checked={useThinkingMode}
                        onChange={(e) => setUseThinkingMode(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isGenerating}
                    />
                    <label htmlFor="thinking-mode" className="flex items-center text-xs text-gray-600 cursor-pointer">
                        <BrainIcon className="w-4 h-4 mr-1.5 text-purple-500" />
                        啟用深度思考模式
                    </label>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-wait"
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
                        '使用 AI 生成'
                    )}
                </button>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
        </div>
    );
};

export default AIImportPanel;
