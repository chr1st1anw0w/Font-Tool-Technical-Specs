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
    onNodeSelect?: (segment: paper.Segment, point: paper.Point) => void;
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
    onNodeSelect,
}) => {
    const [paperScope, setPaperScope] = useState<any>(null);

    const handlePaperReady = useCallback((scope: any) => {
        setPaperScope(scope);
        onReady(scope);
    }, [onReady]);

    const hasContent = paperScope?.project.layers.some((l: paper.Layer) => l.hasChildren());

    return (
        <div className={clsx("flex-grow h-full flex items-center justify-center relative overflow-hidden", showGrid && "canvas-grid")}>
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
                                onNodeSelect={onNodeSelect}
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
                <div className="text-center text-gray-400 flex flex-col items-center">
                    <FileCodeIcon className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="mt-2 text-base font-medium text-gray-500">匯入 SVG 檔案以開始使用</p>
                </div>
            )}
        </div>
    );
};

export default CanvasComponent;