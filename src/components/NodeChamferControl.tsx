
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BevelType } from '../types';

export interface CornerInfo {
    type: 'convex' | 'concave' | 'straight';
    angle: number;
}

interface NodeBevelParams {
    bevelType: BevelType;
    bevelSize: number;
    segments?: number;
}

interface NodeChamferControlProps {
    cornerInfo: CornerInfo;
    currentParams: NodeBevelParams;
    onParamsChange: (params: NodeBevelParams) => void;
    onClose: () => void;
    position: { x: number; y: number };
}

const NodeChamferControl: React.FC<NodeChamferControlProps> = ({
    cornerInfo,
    currentParams,
    onParamsChange,
    onClose,
    position
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const bevelIcons = {
        [BevelType.NONE]: <path d="M4 20V4H20" stroke="currentColor" strokeWidth="2" fill="none" />,
        [BevelType.CHAMFER]: <path d="M4 20V10L10 4H20" stroke="currentColor" strokeWidth="2" fill="none" />,
        [BevelType.FILLET]: <path d="M4 20V12C4 7.58 7.58 4 12 4H20" stroke="currentColor" strokeWidth="2" fill="none" />,
        [BevelType.CONCAVE_SQUARE]: <path d="M4 20V12H12V4H20" stroke="currentColor" strokeWidth="2" fill="none" />,
        [BevelType.CONCAVE_CHAMFER]: <path d="M4 20V4L12 12H20" stroke="currentColor" strokeWidth="2" fill="none" />,
        [BevelType.CONCAVE_ROUND]: <path d="M4 20V4C4 9 9 12 14 12H20" stroke="currentColor" strokeWidth="2" fill="none" />
    };

    const basicTypes = [BevelType.NONE, BevelType.CHAMFER, BevelType.FILLET];
    const advancedTypes = [BevelType.CONCAVE_SQUARE, BevelType.CONCAVE_CHAMFER, BevelType.CONCAVE_ROUND];

    const updateParam = <K extends keyof NodeBevelParams>(key: K, value: NodeBevelParams[K]) => {
        onParamsChange({ ...currentParams, [key]: value });
    };

    const renderTypeButton = (type: BevelType) => (
        <button
            key={type}
            onClick={() => updateParam('bevelType', type)}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${
                currentParams.bevelType === type
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
            title={type.replace('_', ' ')}
        >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
                {bevelIcons[type]}
            </svg>
        </button>
    );

    return (
        <motion.div
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-[260px] overflow-hidden font-ui"
            style={{ left: position.x, top: position.y }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            drag
            dragMomentum={false}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 handle cursor-move">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Node Bevel</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-1">
                        <span className={cornerInfo.type === 'convex' ? 'text-blue-600 font-medium' : cornerInfo.type === 'concave' ? 'text-orange-600 font-medium' : ''}>
                            {cornerInfo.type === 'convex' ? 'Convex' : cornerInfo.type === 'concave' ? 'Concave' : 'Straight'}
                        </span>
                        <span>•</span>
                        <span>{Math.round(cornerInfo.angle)}°</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Basic Types */}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Type</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                        {basicTypes.map(renderTypeButton)}
                    </div>
                </div>

                {/* Size Slider */}
                <div className={currentParams.bevelType === BevelType.NONE ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-medium text-gray-500">Size</label>
                        <span className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{currentParams.bevelSize.toFixed(1)}px</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={50}
                        step={0.5}
                        value={currentParams.bevelSize}
                        onChange={(e) => updateParam('bevelSize', parseFloat(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Advanced Types Toggle */}
                <div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center text-xs text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                    >
                        <motion.svg
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            className="w-3 h-3 mr-1"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        >
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                        Advanced Types
                    </button>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex bg-gray-100 p-1 rounded-lg gap-1 mt-2">
                                    {advancedTypes.map(renderTypeButton)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Segments Slider (Conditional) */}
                <AnimatePresence>
                    {(currentParams.bevelType === BevelType.FILLET || currentParams.bevelType === BevelType.CONCAVE_ROUND) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                             <div className="flex justify-between items-center mb-1.5 mt-2">
                                <label className="text-xs font-medium text-gray-500">Smoothing</label>
                                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{currentParams.segments || 8}</span>
                            </div>
                            <input
                                type="range"
                                min={4}
                                max={32}
                                step={1}
                                value={currentParams.segments || 8}
                                onChange={(e) => updateParam('segments', parseInt(e.target.value))}
                                className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default NodeChamferControl;
