
import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Layer } from '../types';
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon, PlusIcon, TrashIcon } from './icons';

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

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-[var(--text-primary)]">Layers</h3>
                 <div className="flex items-center space-x-1">
                    <button onClick={onAddLayer} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)] rounded-md transition-colors">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                     <button onClick={() => activeLayerId && onDeleteLayer(activeLayerId)} disabled={!activeLayerId || layers.length <= 1} className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-[var(--bg-panel-hover)] rounded-md transition-colors disabled:opacity-30">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-grow space-y-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                {layers.map((layer) => (
                    <div
                        key={layer.id}
                        onClick={() => onSetActiveLayer(layer.id)}
                        onDoubleClick={() => handleStartEdit(layer)}
                        className={clsx(
                            "group flex items-center h-11 px-3 rounded-lg cursor-pointer transition-all border border-transparent",
                            activeLayerId === layer.id
                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                                : 'hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        )}
                    >
                        <div className="flex items-center space-x-3 flex-grow min-w-0">
                             <button
                                onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }); }}
                                className={clsx("flex-shrink-0 transition-colors", layer.visible ? "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                                {layer.visible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                            </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { locked: !layer.locked }); }}
                                className={clsx("flex-shrink-0 transition-colors", layer.locked ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100")}>
                                {layer.locked ? <LockIcon className="w-3.5 h-3.5" /> : <UnlockIcon className="w-3.5 h-3.5" />}
                            </button>

                            {editingLayerId === layer.id ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={handleConfirmEdit}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit()}
                                    className="flex-grow bg-[var(--bg-input)] text-sm p-1 rounded border border-[var(--accent-primary)] focus:outline-none text-[var(--text-primary)]"
                                />
                            ) : (
                                <span className="text-sm font-medium truncate">{layer.name}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LayerPanel;
