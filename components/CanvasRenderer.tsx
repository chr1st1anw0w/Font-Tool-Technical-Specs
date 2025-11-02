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
            
            // Define and attach clear function
            // FIX: Cast scope to any to attach custom method 'clearAllItems' as it doesn't exist on the type definition.
            (scope as any).clearAllItems = () => {
                scope.project.layers.forEach((layer: paper.Layer) => {
                    if (layer.data.id) { // Avoid clearing layers without our ID
                        layer.removeChildren();
                    }
                });
                // FIX: Cast view to any to call 'draw' method, likely due to incorrect typings.
                (scope.view as any).draw();
            };

            onReady(scope);
        }
    }, [onReady]);

    // Layer Synchronization
    useEffect(() => {
        if (!paperScopeRef.current) return;
        const scope = paperScopeRef.current;

        // Remove deleted layers from paper project
        for (let i = scope.project.layers.length - 1; i >= 0; i--) {
            const paperLayer = scope.project.layers[i];
            if (paperLayer.data.id && !layers.some(l => l.id === paperLayer.data.id)) {
                paperLayer.remove();
            }
        }

        // Add/update layers and ensure correct order
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
        
        // Activate the correct layer and select its items
        const activePaperLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
        
        scope.project.deselectAll();

        if (activePaperLayer) {
            activePaperLayer.activate();
            // Highlight all artwork items on the newly active layer
            activePaperLayer.children.forEach((child: paper.Item) => {
                if (child.data.isArtwork) {
                    child.selected = true;
                }
            });
        } else if (scope.project.layers.length > 0) {
            // Fallback to the top layer if active layer is not found (e.g., after deletion)
             const topLayer = scope.project.layers[scope.project.layers.length - 1];
             if(topLayer) topLayer.activate();
        }

        // FIX: Cast view to any to call 'draw' method, likely due to incorrect typings.
        (scope.view as any).draw();
    }, [layers, activeLayerId, paperScopeRef]);


    // SVG Data Loading
    useEffect(() => {
        if (svgData && paperScopeRef.current && activeLayerId) {
            const scope = paperScopeRef.current;
            try {
                scope.project.importSVG(svgData.data, {
                    expandShapes: true,
                    onLoad: (item: paper.Item) => {
                        if (!item) return;
                        
                        const activeLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
                        if (!activeLayer) {
                            console.error("No active layer found to add SVG to.");
                            return;
                        }
                         activeLayer.activate();

                        let artwork: paper.Group;
                        if (item.className === 'Group') {
                            artwork = item as paper.Group;
                        } else {
                            artwork = new scope.Group([item]);
                        }
                        
                        activeLayer.addChild(artwork);
                        artwork.data.isArtwork = true;

                        // Set initial styles before transform
                        const paths = artwork.getItems({ class: scope.Path });
                        paths.forEach((p: paper.Path) => {
                            p.fillColor = new scope.Color('black');
                            p.strokeColor = null; // We use strokeWidth to simulate weight, so no visible stroke
                        });

                        // Apply current parameters for the first time
                        if (scope.updateItemTransformation) {
                            scope.updateItemTransformation(artwork, params);
                        }
                        
                        // FIX: Cast view to any to call 'draw' method, likely due to incorrect typings.
                        (scope.view as any).draw();
                    },
                    onError: (error: any) => console.error('SVG import error:', error)
                });
            } catch (error) {
                console.error('Error importing SVG:', error);
            }
        }
    }, [svgData, activeLayerId, params]); // `params` is needed for initial transform

    return (
        <canvas ref={canvasRef} data-paper-resize="true" className="w-full h-full cursor-default"></canvas>
    );
};

export default CanvasRenderer;