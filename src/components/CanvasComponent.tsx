
import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import type { TransformParams, ViewOptions, Layer, PenToolSettings, SvgData } from '../types';
import CanvasRenderer from './CanvasRenderer';
import CanvasInteraction from './CanvasInteraction';
import GeometryManager from './GeometryManager';
import { PenTool } from './PenTool';
import { FileCodeIcon } from './icons';
import paper from 'paper';

interface CanvasComponentProps {
    svgData: SvgData;
    letterKey: string | null;
    params: TransformParams;
    nodeOverrides: Map<string, Partial<TransformParams>>;
    viewOptions: ViewOptions;
    onReady: (scope: any) => void;
    onZoomChange: (zoom: number) => void;
    editMode: 'transform' | 'points' | 'pen';
    isSnapEnabled: boolean;
    showGrid: boolean;
    layers: Layer[];
    activeLayerId: string | null;
    penSettings: PenToolSettings;
    onPathComplete: (path: paper.Path) => void;
    onSelectionUpdate: (selection: { items: paper.Item[], segments: paper.Segment[] }) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
    svgData,
    letterKey,
    params,
    nodeOverrides,
    viewOptions,
    onReady,
    onZoomChange,
    editMode,
    isSnapEnabled,
    showGrid,
    layers,
    activeLayerId,
    penSettings,
    onPathComplete,
    onSelectionUpdate,
}) => {
    const [paperScope, setPaperScope] = useState<any>(null);

    const handlePaperReady = useCallback((scope: any) => {
        setPaperScope(scope);
        onReady(scope);
    }, [onReady]);

    const hasContent = paperScope?.project.layers.some((l: paper.Layer) => l.hasChildren());

    return (
        <div className={clsx("flex-grow h-full flex items-center justify-center relative overflow-hidden", showGrid && "canvas-grid")}>
            {/* Top Left Glyph Indicator */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                 <span className="text-[var(--text-tertiary)] font-medium">Glyph: </span>
                 <span className="text-[var(--text-primary)] font-bold text-lg ml-1">{letterKey || 'None'}</span>
            </div>

            {/* Background Watermark 'A' - Visible when no content or always if desired to match ref precisely */}
            {!hasContent && letterKey === 'A' && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <span className="text-[40vw] font-bold text-[var(--text-primary)] opacity-[0.03] leading-none" style={{ filter: 'blur(2px)' }}>
                        A
                    </span>
                </div>
            )}

            {hasContent || svgData || editMode === 'pen' ? (
                <>
                    <CanvasRenderer
                        svgData={svgData}
                        params={params}
                        onReady={handlePaperReady}
                        layers={layers}
                        activeLayerId={activeLayerId}
                    />
                    {paperScope && (
                        <>
                            <CanvasInteraction
                                paperScope={paperScope}
                                onZoomChange={onZoomChange}
                                editMode={editMode}
                                isSnapEnabled={isSnapEnabled}
                                showGrid={showGrid}
                                layers={layers}
                                onSelectionUpdate={onSelectionUpdate}
                            />
                            <GeometryManager
                                paperScope={paperScope}
                                letterKey={letterKey}
                                params={params}
                                nodeOverrides={nodeOverrides}
                                viewOptions={viewOptions}
                            />
                            {editMode === 'pen' && (
                                <PenTool
                                    scope={paperScope}
                                    settings={penSettings}
                                    onPathComplete={onPathComplete}
                                    onCancel={() => {}}
                                />
                            )}
                        </>
                    )}
                </>
            ) : (
                <div className="text-center text-[var(--text-tertiary)] flex flex-col items-center opacity-50">
                    <FileCodeIcon className="w-16 h-16 mb-4" />
                    <p className="mt-2 text-base font-medium">Import an SVG to get started</p>
                </div>
            )}
        </div>
    );
};

export default CanvasComponent;
