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

    const updateItemTransformation = useCallback((item: paper.Item, newParams: TransformParams, scope: any) => {
        if (!item.data.isArtwork) return;
    
        // Use default old params if not set yet (for initial transform)
        const oldParams: TransformParams = item.data.params || { weight: 40, width: 100, slant: 0 };
        const pivot = item.bounds.center;
        const RADIANS = Math.PI / 180;
    
        // 1. Undo previous geometric transforms in reverse order of application
        if (oldParams.slant !== 0) {
            item.shear(-Math.tan(oldParams.slant * RADIANS), 0, pivot);
        }
        if (oldParams.width !== 100) {
            const oldScale = oldParams.width / 100;
            if (oldScale !== 0) {
                item.scale(1 / oldScale, 1, pivot);
            }
        }
    
        // 2. Apply new geometric transforms
        if (newParams.width !== 100) {
            item.scale(newParams.width / 100, 1, pivot);
        }
        if (newParams.slant !== 0) {
            item.shear(Math.tan(newParams.slant * RADIANS), 0, pivot);
        }
    
        // 3. Apply style properties (non-geometric)
        const paths = item.getItems({ class: scope.Path });
        if (paths) {
            paths.forEach((path: paper.Path) => {
                path.strokeWidth = newParams.weight;
                path.fillColor = new scope.Color('black');
                path.strokeColor = null;
            });
        }
    
        // 4. Store the newly applied params on the item
        item.data.params = { ...newParams };
    }, []);

    const applyAllTransformations = useCallback(() => {
        if (!paperScopeRef.current) return;
        const scope = paperScopeRef.current;
        const artworkItems = scope.project.getItems({ data: { isArtwork: true } });
        artworkItems.forEach((item: paper.Item) => updateItemTransformation(item, params, scope));
        // FIX: Cast view to any to call 'draw' method, likely due to incorrect typings.
        (scope.view as any).draw();
    }, [params, updateItemTransformation]);

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
        
        // Activate the correct layer
        const activePaperLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
        if (activePaperLayer) {
            activePaperLayer.activate();
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
                        // Store initial default params, then transform to current global params
                        artwork.data.params = { weight: 40, width: 100, slant: 0 };
                        updateItemTransformation(artwork, params, scope);
                        
                        // FIX: Cast view to any to call 'draw' method, likely due to incorrect typings.
                        (scope.view as any).draw();
                    },
                    onError: (error: any) => console.error('SVG import error:', error)
                });
            } catch (error) {
                console.error('Error importing SVG:', error);
            }
        }
    }, [svgData, activeLayerId, params, updateItemTransformation]);


    // Apply transformations when params change
    useEffect(() => {
        applyAllTransformations();
    }, [params, applyAllTransformations]);


    return (
        <canvas ref={canvasRef} data-paper-resize="true" className="w-full h-full cursor-default"></canvas>
    );
};

export default CanvasRenderer;