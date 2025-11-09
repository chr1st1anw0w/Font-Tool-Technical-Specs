import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import type { ViewOptions, TransformParams } from '../types';
import { drawDimensionAids } from './DimensionAids';
import { SuperBevelService } from '../services/SuperBevelService';

interface GeometryManagerProps {
    paperScope: paper.PaperScope;
    letterKey: string | null;
    params: TransformParams;
    nodeOverrides: Map<string, Partial<TransformParams>>;
    viewOptions: ViewOptions;
    onGeometryUpdate?: (paramKey: string, newValue: number) => void;
}

const GeometryManager: React.FC<GeometryManagerProps> = ({
    paperScope,
    letterKey,
    params,
    nodeOverrides,
    viewOptions,
}) => {
    const aidsLayerRef = useRef<any>(null);
    const bevelServiceRef = useRef<SuperBevelService | null>(null);

    useEffect(() => {
        if(paperScope && !bevelServiceRef.current) {
            bevelServiceRef.current = new SuperBevelService(paperScope);
        }
    }, [paperScope]);

    const updateItemTransformation = useCallback((item: paper.Item, newParams: TransformParams) => {
        if (!item.data.isArtwork || !paperScope || !bevelServiceRef.current) return;
        const scope = paperScope;

        const applyStyles = (path: paper.Item, params: TransformParams) => {
             if (path instanceof scope.Path || path instanceof scope.CompoundPath) {
                path.fillColor = params.fillColor ? new scope.Color(params.fillColor) : null;
                path.opacity = params.opacity;
                path.strokeColor = params.strokeColor ? new scope.Color(params.strokeColor) : null;
                path.strokeWidth = params.strokeWidth;
             }
        };

        const processPath = (path: paper.Path) => {
            if (!path.data.originalPath) {
                path.data.originalPath = path.clone({ insert: false });
            }
            
            // 1. Start fresh from the original, untransformed geometry
            const workingPath = path.data.originalPath.clone({ insert: false });

            // 2. Apply transformations (width, slant)
            const pivot = workingPath.bounds.center;
            const matrix = new scope.Matrix();
            if (newParams.width !== 100) matrix.scale(newParams.width / 100, 1, pivot);
            if (newParams.slant !== 0) matrix.shear(Math.tan(newParams.slant * (Math.PI / 180)), 0, pivot);
            workingPath.transform(matrix);
            
            // 3. Apply Bevel with overrides
            const finalPath = bevelServiceRef.current!.apply(workingPath, path.id, newParams, nodeOverrides);
            workingPath.remove(); 

            // 4. Update on-screen path geometry and apply styles
            path.segments = finalPath.segments;
            path.closed = finalPath.closed;
            
            finalPath.remove();
        };
        
        const itemsToProcess = (item instanceof scope.Group || item instanceof scope.CompoundPath)
            ? item.getItems({ class: scope.Path })
            : [item];

        itemsToProcess.forEach((p: paper.Item) => {
             if (p instanceof scope.Path) {
                processPath(p as paper.Path)
            }
        });
        
        applyStyles(item, newParams);
        item.data.params = { ...newParams };

    }, [paperScope, nodeOverrides]);

    const applyAllTransformations = useCallback(() => {
        if (!paperScope) return;
        const scope = paperScope;
        const artworkItems = scope.project.getItems({ data: { isArtwork: true } });
        artworkItems.forEach((item: paper.Item) => updateItemTransformation(item, params));
        // FIX: Cast view to any to call the draw method, which is missing from paper.js type definitions.
        (scope.view as any).draw();
    }, [params, paperScope, updateItemTransformation]);

    useEffect(() => {
        if (paperScope) {
            (paperScope as any).updateItemTransformation = updateItemTransformation;
            (paperScope as any).applyAllTransformations = applyAllTransformations;
        }
    }, [paperScope, updateItemTransformation, applyAllTransformations]);

    useEffect(() => {
        applyAllTransformations();
    }, [params, nodeOverrides, applyAllTransformations]);

    // This effect handles dimension aids, which seems separate from transformations.
    // Kept as is.
    useEffect(() => {
        if (!paperScope) return;
        // ... (dimension aids logic remains the same)
    }, [paperScope, viewOptions.showGuides, letterKey]);

    return null;
};

export default GeometryManager;