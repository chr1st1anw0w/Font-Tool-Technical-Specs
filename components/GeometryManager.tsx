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

    const updateItemTransformation = useCallback((item: paper.Item, newParams: TransformParams) => {
        if (!item.data.isArtwork || !paperScope) return;
        const scope = paperScope;

        const oldParams: TransformParams = item.data.params || { weight: 40, width: 100, slant: 0 };
        
        const pivot = item.bounds.center;
        const RADIANS = Math.PI / 180;

        // Create matrix for OLD geometric params
        const oldMatrix = new scope.Matrix();
        if (oldParams.width !== 100) {
            oldMatrix.scale(oldParams.width / 100, 1, pivot);
        }
        if (oldParams.slant !== 0) {
            oldMatrix.shear(Math.tan(oldParams.slant * RADIANS), 0, pivot);
        }

        // Create matrix for NEW geometric params
        const newMatrix = new scope.Matrix();
        if (newParams.width !== 100) {
            newMatrix.scale(newParams.width / 100, 1, pivot);
        }
        if (newParams.slant !== 0) {
            newMatrix.shear(Math.tan(newParams.slant * RADIANS), 0, pivot);
        }

        // Calculate the delta transformation matrix: delta = new * old^-1
        const invertedOldMatrix = oldMatrix.inverted();
        const deltaMatrix = newMatrix.clone().append(invertedOldMatrix);

        const paths = item.getItems({ class: scope.Path });
        if (paths) {
            paths.forEach((path: paper.Path) => {
                // Apply delta matrix to bake the change into the geometry
                path.transform(deltaMatrix);
                
                // Apply style properties (non-geometric)
                path.strokeWidth = newParams.weight;
            });
        }

        // Store the newly applied params on the item
        item.data.params = { ...newParams };

    }, [paperScope]);

    const applyAllTransformations = useCallback(() => {
        if (!paperScope) return;
        const scope = paperScope;
        const artworkItems = scope.project.getItems({ data: { isArtwork: true } });
        artworkItems.forEach((item: paper.Item) => updateItemTransformation(item, params));
        scope.view.draw();
    }, [params, paperScope, updateItemTransformation]);


    // Attach transformation functions to paperScope for global access
    useEffect(() => {
        if (paperScope) {
            paperScope.updateItemTransformation = updateItemTransformation;
            paperScope.applyAllTransformations = applyAllTransformations;
        }
    }, [paperScope, updateItemTransformation, applyAllTransformations]);

    // Listen for param changes and apply them
    useEffect(() => {
        applyAllTransformations();
    }, [params, applyAllTransformations]);

    // Dimension Aids Logic (unchanged)
    useEffect(() => {
        if (!paperScope) return;
        if (!aidsLayerRef.current) {
            aidsLayerRef.current = new paperScope.Layer({ name: 'aids' });
            paperScope.project.addLayer(aidsLayerRef.current);
        }
        const aidsLayer = aidsLayerRef.current;
        aidsLayer.removeChildren();
        aidsLayer.visible = viewOptions.showAids && !!letterKey;

        if (aidsLayer.visible && letterKey) {
            const aids = drawDimensionAids(paperScope, letterKey, geometryMapRef.current);
            if (aids) aidsLayer.addChild(aids);
        }
    }, [paperScope, viewOptions.showAids, letterKey]);

    return null;
};

export default GeometryManager;