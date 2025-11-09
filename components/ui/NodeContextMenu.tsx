
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import paper from 'paper';
import { NodeType } from '../../types';
import { CornerNodeIcon, SmoothNodeIcon, SymmetricNodeIcon, TrashIcon, RefreshIcon } from '../icons';

interface NodeContextMenuProps {
    x: number;
    y: number;
    segment: paper.Segment;
    onSetNodeType: (type: NodeType) => void;
    onResetHandles: () => void;
    onDeleteNode: () => void;
    onClose: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    x,
    y,
    segment,
    onSetNodeType,
    onResetHandles,
    onDeleteNode,
    onClose,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // 使用 capture 若需要在其他事件前攔截，這裡用 bubbling 應該足夠
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!segment) return null;

    // 嘗試從 segment.data 獲取當前節點類型，預設為平滑
    // 需要轉型為 any 因為 paper.js 的 TypeScript 定義可能不包含自定義 data 屬性的完整類型
    const currentType = (segment as any).data?.type || NodeType.SMOOTH;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed z-50 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 p-2 flex flex-col gap-1 min-w-[150px]"
                style={{ left: x, top: y }}
            >
                <div className="text-[10px] font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider">節點類型</div>
                <div className="flex bg-gray-100/50 p-1 rounded-md mb-1">
                    <button
                        onClick={() => onSetNodeType(NodeType.CORNER)}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${currentType === NodeType.CORNER ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200/50'}`}
                        title="尖角 (Corner)"
                    >
                        <CornerNodeIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onSetNodeType(NodeType.SMOOTH)}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${currentType === NodeType.SMOOTH ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200/50'}`}
                        title="平滑 (Smooth)"
                    >
                        <SmoothNodeIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onSetNodeType(NodeType.SYMMETRIC)}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${currentType === NodeType.SYMMETRIC ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200/50'}`}
                        title="對稱 (Symmetric)"
                    >
                        <SymmetricNodeIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="h-px bg-gray-200 my-1" />

                <button
                    onClick={onResetHandles}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors text-left"
                >
                    <RefreshIcon className="w-4 h-4 opacity-70" />
                    <span>重設控制桿</span>
                </button>
                <button
                    onClick={onDeleteNode}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors text-left"
                >
                    <TrashIcon className="w-4 h-4 opacity-70" />
                    <span>刪除節點</span>
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default NodeContextMenu;
