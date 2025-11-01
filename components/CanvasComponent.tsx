import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import type { TransformParams, ViewOptions } from '../types';
import CanvasRenderer from './CanvasRenderer';
import CanvasInteraction from './CanvasInteraction';
import GeometryManager from './GeometryManager';
import { FileCodeIcon } from './icons';

interface CanvasComponentProps {
    svgData: string | null;
    letterKey: string | null;
    params: TransformParams;
    viewOptions: ViewOptions;
    onReady: (scope: any) => void;
    onZoomChange: (zoom: number) => void;
    editMode: 'transform' | 'points';
    isSnapEnabled: boolean;
    showGrid: boolean;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
    svgData,
    letterKey,
    params,
    viewOptions,
    onReady,
    onZoomChange,
    editMode,
    isSnapEnabled,
    showGrid
}) => {
    const [paperScope, setPaperScope] = useState<any>(null);

    const handlePaperReady = useCallback((scope: any) => {
        setPaperScope(scope);
        onReady(scope);
    }, [onReady]);

    const handleGeometryUpdate = useCallback((paramKey: string, newValue: number) => {
        // Handle geometry updates if needed
        console.log(`Geometry updated: ${paramKey} = ${newValue}`);
    }, []);

    return (
        <div className={clsx("flex-grow h-full flex items-center justify-center relative overflow-hidden", showGrid && "canvas-grid")}>
            {svgData ? (
                <>
                    <CanvasRenderer
                        svgData={svgData}
                        params={params}
                        onReady={handlePaperReady}
                    />
                    {paperScope && (
                        <>
                            <CanvasInteraction
                                paperScope={paperScope}
                                onZoomChange={onZoomChange}
                                editMode={editMode}
                                isSnapEnabled={isSnapEnabled}
                                showGrid={showGrid}
                            />
                            <GeometryManager
                                paperScope={paperScope}
                                letterKey={letterKey}
                                params={params}
                                viewOptions={viewOptions}
                                onGeometryUpdate={handleGeometryUpdate}
                            />
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