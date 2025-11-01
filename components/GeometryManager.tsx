import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import type { ViewOptions, TransformParams } from '../types';
import { drawDimensionAids } from './DimensionAids';

interface GeometryManagerProps {
    paperScope: any;
    letterKey: string | null;
    params: TransformParams;
    viewOptions: ViewOptions;
    onGeometryUpdate?: (paramKey: string, newValue: number) => void;
}

const GeometryManager: React.FC<GeometryManagerProps> = ({
    paperScope,
    letterKey,
    params,
    viewOptions,
    onGeometryUpdate
}) => {
    const geometryMapRef = useRef(new Map<string, any>());
    const aidsLayerRef = useRef<any>(null);

    const updateGeometry = useCallback((paramKey: string, newValue: number) => {
        const item = geometryMapRef.current.get(paramKey);
        if (!item) {
            console.warn(`Geometry item with key "${paramKey}" not found.`);
            return;
        }

        const bounds = item.bounds;
        switch (paramKey) {
            case 's-top-bar-width':
                item.bounds.right = bounds.left + newValue;
                break;
            case 's-left-stem-height':
                item.bounds.bottom = bounds.top + newValue;
                break;
            case 's-mid-bar-spacing':
                // This is more complex, involves moving multiple items
                const midBar = geometryMapRef.current.get('s-mid-bar');
                const leftStem = geometryMapRef.current.get('s-left-stem');
                if (midBar && leftStem) {
                    const diff = (leftStem.bounds.top + newValue) - midBar.bounds.top;
                    midBar.position.y += diff;
                    // And other dependent parts...
                }
                break;
            // Add more cases for all editable dimensions
        }

        // Trigger redraw
        if (onGeometryUpdate) {
            onGeometryUpdate(paramKey, newValue);
        }
    }, [onGeometryUpdate]);

    useEffect(() => {
        if (!paperScope) return;

        const scope = paperScope;
        aidsLayerRef.current = new scope.Layer({ name: 'aids' });
        scope.project.addLayer(aidsLayerRef.current);

        aidsLayerRef.current.onDoubleClick = (event: any) => {
            const hitResult = aidsLayerRef.current.hitTest(event.point, {
                fill: true,
                tolerance: 10
            });

            if (hitResult && hitResult.item) {
                let targetItem = hitResult.item;
                while (targetItem.parent && !targetItem.data.paramKey) {
                    targetItem = targetItem.parent;
                }

                const paramKey = targetItem.data.paramKey;
                if (paramKey) {
                    const currentValue = targetItem.data.currentValue;
                    const newValueStr = prompt(`Enter new value for ${paramKey} (current: ${currentValue}):`, `${currentValue}`);

                    if (newValueStr) {
                        const newValue = parseFloat(newValueStr);
                        if (isNaN(newValue) || newValue < 0 || newValue > 600) {
                            alert("Invalid input. Please enter a number between 0 and 600.");
                            return;
                        }

                        if (paramKey.includes('spacing')) {
                            const topItem = geometryMapRef.current.get(targetItem.data.geoKey);
                            const bottomItem = geometryMapRef.current.get(targetItem.data.relativeTo);
                            if (topItem && bottomItem) {
                                const currentSpacing = bottomItem.bounds.top - topItem.bounds.bottom;
                                const delta = newValue - currentSpacing;
                                // This is a simplified move; a real model would move dependent parts too.
                                bottomItem.position.y += delta;
                            }
                        } else { // Handle linear dimensions
                            const geoKey = targetItem.data.geoKey;
                            const itemToUpdate = geometryMapRef.current.get(geoKey);
                            const anchor = targetItem.data.anchor;

                            if (itemToUpdate) {
                                const bounds = itemToUpdate.bounds.clone();

                                if (paramKey.includes('width')) {
                                    if (anchor === 'left') bounds.right = bounds.left + newValue;
                                    else bounds.left = bounds.right - newValue;
                                } else if (paramKey.includes('height')) {
                                     if (anchor === 'top') bounds.bottom = bounds.top + newValue;
                                     else bounds.top = bounds.bottom - newValue;
                                }
                                itemToUpdate.bounds = bounds;
                            }
                        }

                        updateGeometry(paramKey, newValue);
                    }
                }
            }
        };
    }, [paperScope, updateGeometry]);

    useEffect(() => {
        if (!paperScope || !aidsLayerRef.current) return;

        const aidsLayer = aidsLayerRef.current;
        aidsLayer.removeChildren();
        aidsLayer.visible = viewOptions.showAids && !!letterKey;

        if (aidsLayer.visible && letterKey) {
            const aids = drawDimensionAids(paperScope, letterKey, geometryMapRef.current);
            if (aids) {
                aidsLayer.addChild(aids);
            }
        }

    }, [paperScope, viewOptions.showAids, letterKey, params]);

    // Expose geometry map for external access
    useEffect(() => {
        if (paperScope) {
            // Store geometry map in paper scope for external access
            paperScope.geometryMap = geometryMapRef.current;
        }
    }, [paperScope]);

    return null; // This component doesn't render anything
};

export default GeometryManager;