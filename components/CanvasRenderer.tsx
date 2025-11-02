import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import type { TransformParams, Layer } from '../types';

interface CanvasRendererProps {
    svgData: { data: string; id: number } | null;
    params: TransformParams;
    onReady: (scope: any) => void;
    layers: Layer[];
    activeLayerId: string | null;
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ svgData, params, onReady, layers, activeLayerId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paperScopeRef = useRef<any>(null);

    // Initial setup
    useEffect(() => {
        if (canvasRef.current && !paperScopeRef.current) {
            const scope = new paper.PaperScope();
            scope.setup(canvasRef.current);
            paperScopeRef.current = scope;
            
            (scope as any).clearAllItems = () => {
                scope.project.layers.forEach((layer: paper.Layer) => {
                    if (layer.data.id) {
                        layer.removeChildren();
                    }
                });
                (scope.view as any).draw();
            };

            onReady(scope);
        }
    }, [onReady]);

    // Layer Synchronization
    useEffect(() => {
        if (!paperScopeRef.current) return;
        const scope = paperScopeRef.current;

        for (let i = scope.project.layers.length - 1; i >= 0; i--) {
            const paperLayer = scope.project.layers[i];
            if (paperLayer.data.id && !layers.some(l => l.id === paperLayer.data.id)) {
                paperLayer.remove();
            }
        }

        layers.forEach((layerData, index) => {
            let paperLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === layerData.id);
            if (paperLayer) {
                paperLayer.name = layerData.name;
                paperLayer.visible = layerData.visible;
                paperLayer.data.locked = layerData.locked;
            } else {
                paperLayer = new scope.Layer({
                    name: layerData.name,
                    visible: layerData.visible,
                    data: { id: layerData.id, locked: layerData.locked }
                });
            }
            scope.project.insertLayer(index, paperLayer);
        });
        
        const activePaperLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
        
        if (activePaperLayer) {
            activePaperLayer.activate();
        } else if (scope.project.layers.length > 0) {
             const topLayer = scope.project.layers[scope.project.layers.length - 1];
             if(topLayer) topLayer.activate();
        }

        (scope.view as any).draw();
    }, [layers, activeLayerId]);


    // SVG Data Loading
    useEffect(() => {
        if (svgData && paperScopeRef.current && activeLayerId) {
            const scope = paperScopeRef.current;
            try {
                const activeLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
                if (!activeLayer) {
                    console.error("No active layer found to add SVG to.");
                    return;
                }
                activeLayer.activate();
                
                scope.project.importSVG(svgData.data, {
                    expandShapes: true,
                    onLoad: (item: paper.Item) => {
                        if (!item) return;

                        let artwork: paper.Item = item;
                        artwork.data.isArtwork = true;
                        
                        const itemsToProcess = (artwork instanceof scope.Group || artwork instanceof scope.CompoundPath)
                            ? artwork.getItems({class: scope.Path})
                            : [artwork];

                        itemsToProcess.forEach((p: paper.Item) => {
                           if (p instanceof scope.Path) {
                             p.data.originalPath = p.clone({ insert: false });
                           }
                        });
                        
                        // Center the item in the view
                        artwork.position = scope.view.center;

                        // Apply current parameters for the first time
                        if (scope.updateItemTransformation) {
                            scope.updateItemTransformation(artwork, params);
                        }
                        
                        (scope.view as any).draw();
                    },
                    onError: (error: any) => console.error('SVG import error:', error)
                });
            } catch (error) {
                console.error('Error importing SVG:', error);
            }
        }
    }, [svgData, activeLayerId, params]);

    return (
        <canvas ref={canvasRef} data-paper-resize="true" className="w-full h-full cursor-default"></canvas>
    );
};

export default CanvasRenderer;