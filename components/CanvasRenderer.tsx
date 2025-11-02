import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import type { TransformParams } from '../types';

interface CanvasRendererProps {
    svgData: string | null;
    params: TransformParams;
    onReady: (scope: any) => void;
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ svgData, params, onReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paperScopeRef = useRef<any>(null);
    // FIX: Provide a specific type for the ref to avoid 'unknown' type errors.
    const originalPathsRef = useRef<paper.Item[]>([]);
    const artworkRef = useRef<any>(null);

    const applyTransformations = useCallback(() => {
        if (!paperScopeRef.current || !artworkRef.current) return;

        const scope = paperScopeRef.current;
        const art = artworkRef.current;

        const pivot = art.bounds.center;

        // Reset transformations before applying new ones
        art.scaling = new scope.Point(1, 1);
        art.shearing = new scope.Point(0, 0);

        art.scale(params.width / 100, 1, pivot);
        const shearX = Math.tan(params.slant * (Math.PI / 180));
        art.shear(shearX, 0, pivot);

        const paths = art.getItems({ class: scope.Path });
        if (paths && Array.isArray(paths)) {
            paths.forEach((path: any) => {
                path.strokeWidth = params.weight;
                // FIX: Use paper.Color for fill color to fix type error.
                path.fillColor = new scope.Color('black');
                path.strokeColor = null; // No stroke on filled paths
            });
        }

        scope.view.draw();
    }, [params]);

    const redrawArtwork = useCallback(() => {
        if (!paperScopeRef.current) return;
        const scope = paperScopeRef.current;
        
        if (artworkRef.current) {
            artworkRef.current.remove();
        }

        if (originalPathsRef.current && originalPathsRef.current.length > 0) {
            const newItems = Array.from(originalPathsRef.current)
                .filter(item => item) // 過濾掉 null/undefined 項目
                .map(item => item.clone());
            
            if (newItems.length > 0) {
                artworkRef.current = new scope.Group(newItems);
                artworkRef.current.data.isArtwork = true;
                scope.project.activeLayer.addChild(artworkRef.current);
                applyTransformations();
            }
        }
    }, [applyTransformations]);

    useEffect(() => {
        applyTransformations();
    }, [params, applyTransformations]);

    useEffect(() => {
        if (canvasRef.current && !paperScopeRef.current) {
            const scope = new paper.PaperScope();
            scope.setup(canvasRef.current);
            paperScopeRef.current = scope;
            onReady(scope);
        }
    }, [onReady]);

    useEffect(() => {
        if (svgData && paperScopeRef.current) {
            const scope = paperScopeRef.current;
            scope.project.activeLayer.removeChildren();
            artworkRef.current = null;
            originalPathsRef.current = [];

            try {
                scope.project.importSVG(svgData, {
                    expandShapes: true,
                    // FIX: Type the imported item correctly to allow type inference.
                    onLoad: (item: paper.Item) => {
                        try {
                            if (!item) {
                                console.warn('SVG import failed: no item received');
                                return;
                            }
                            
                            // FIX: Use paper.Color for fill color to fix type error.
                            item.fillColor = new scope.Color('black');
                            item.strokeColor = null;

                            const itemsToProcess = item.children ? [...item.children] : [item];
                            
                            originalPathsRef.current = itemsToProcess
                                .map(child => child.clone ? child.clone() : null)
                                .filter(Boolean);

                            item.remove();
                            
                            if (originalPathsRef.current.length > 0) {
                                redrawArtwork();
                            }
                        } catch (error) {
                            console.error('Error processing SVG item:', error);
                        }
                    },
                    onError: (error: any) => {
                        console.error('SVG import error:', error);
                    }
                });
            } catch (error) {
                console.error('Error importing SVG:', error);
            }
        }
    }, [svgData, redrawArtwork]);

    return (
        <canvas ref={canvasRef} data-paper-resize="true" className="w-full h-full cursor-default"></canvas>
    );
};

export default CanvasRenderer;