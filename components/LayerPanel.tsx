import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Layer } from '../types';
import { EyeIcon, EyeOffIcon, LockClosedIcon, LockOpenIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, PencilIcon } from './icons';

interface LayerPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onReorderLayer: (id: string, direction: 'up' | 'down') => void;
    onSetActiveLayer: (id: string) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
    layers,
    activeLayerId,
    onAddLayer,
    onDeleteLayer,
    onUpdateLayer,
    onReorderLayer,
    onSetActiveLayer
}) => {
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingLayerId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingLayerId]);

    const handleStartEdit = (layer: Layer) => {
        setEditingLayerId(layer.id);
        setEditingName(layer.name);
    };

    const handleConfirmEdit = () => {
        if (editingLayerId && editingName.trim()) {
            onUpdateLayer(editingLayerId, { name: editingName.trim() });
        }
        setEditingLayerId(null);
    };

    const handleCancelEdit = () => {
        setEditingLayerId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleConfirmEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow p-2 space-y-1 overflow-y-auto">
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        onClick={() => onSetActiveLayer(layer.id)}
                        onDoubleClick={() => handleStartEdit(layer)}
                        className={clsx(
                            "group flex items-center h-10 px-2 rounded-md cursor-pointer transition-colors",
                            activeLayerId === layer.id
                                ? 'bg-blue-100 text-blue-800'
                                : 'hover:bg-gray-100'
                        )}
                    >
                        {editingLayerId === layer.id ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleConfirmEdit}
                                onKeyDown={handleKeyDown}
                                className="flex-grow bg-white text-sm p-1 rounded border border-blue-400 focus:outline-none"
                            />
                        ) : (
                            <span className="flex-grow text-sm font-medium truncate">{layer.name}</span>
                        )}
                        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                                onClick={(e) => { e.stopPropagation(); handleStartEdit(layer); }}
                                className="p-1 rounded hover:bg-gray-200" title="重新命名">
                                <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }); }}
                                className="p-1 rounded hover:bg-gray-200" title={layer.visible ? '隱藏' : '顯示'}>
                                {layer.visible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4 text-gray-400" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { locked: !layer.locked }); }}
                                className="p-1 rounded hover:bg-gray-200" title={layer.locked ? '解鎖' : '鎖定'}>
                                {layer.locked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex-shrink-0 p-2 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <button onClick={onAddLayer} className="p-2 rounded-md hover:bg-gray-200" title="新增圖層">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => activeLayerId && onDeleteLayer(activeLayerId)} disabled={!activeLayerId || layers.length <= 1} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="刪除圖層">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
                 <div className="flex items-center space-x-1">
                    <button onClick={() => activeLayerId && onReorderLayer(activeLayerId, 'up')} disabled={!activeLayerId || layers.findIndex(l => l.id === activeLayerId) === 0} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="上移圖層">
                        <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => activeLayerId && onReorderLayer(activeLayerId, 'down')} disabled={!activeLayerId || layers.findIndex(l => l.id === activeLayerId) === layers.length - 1} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="下移圖層">
                        <ArrowDownIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LayerPanel;
