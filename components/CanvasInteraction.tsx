import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import { Layer } from '../types';

interface CanvasInteractionProps {
    paperScope: any;
    onZoomChange: (zoom: number) => void;
    editMode: 'transform' | 'points';
    isSnapEnabled: boolean;
    showGrid: boolean;
    layers: Layer[];
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const GRID_SIZE = 40; // Corresponds to the background-size in index.html CSS

const CanvasInteraction: React.FC<CanvasInteractionProps> = ({ 
    paperScope, 
    onZoomChange,
    editMode,
    isSnapEnabled,
    showGrid,
    layers
}) => {
    const panState = useRef({ isPanning: false, lastPoint: null as any });
    const isSpacePressed = useRef(false);
    const pointDragTargetRef = useRef<any>(null); // For point editing
    const artworkDragTargetRef = useRef<paper.Item | null>(null); // For object transform

    // Setup paper.js settings for selection visuals
    useEffect(() => {
        if (!paperScope) return;
        paperScope.settings.handleSize = 8;
        paperScope.settings.selectionColor = new paperScope.Color('#3B82F6'); // accent-blue
    }, [paperScope]);

    const handleWheel = useCallback((event: WheelEvent) => {
        if (!paperScope) return;
        
        event.preventDefault();
        const view = paperScope.view;
        const oldZoom = view.zoom;
        const mousePosition = new paperScope.Point(event.offsetX, event.offsetY);

        const viewPosition = view.viewToProject(mousePosition);
        
        const zoomFactor = 1.1;
        const newZoom = event.deltaY < 0
            ? Math.min(oldZoom * zoomFactor, MAX_ZOOM)
            : Math.max(oldZoom / zoomFactor, MIN_ZOOM);
        
        if (oldZoom !== newZoom) {
            view.zoom = newZoom;
            const newViewPosition = view.viewToProject(mousePosition);
            view.center = view.center.add(viewPosition.subtract(newViewPosition));
            onZoomChange(newZoom);
        }
    }, [paperScope, onZoomChange]);

    const handleMouseDown = useCallback((event: MouseEvent) => {
        if (!paperScope) return;
        
        const point = new paperScope.Point(event.offsetX, event.offsetY);

        if (event.button === 1 || (isSpacePressed.current && event.button === 0)) {
            event.preventDefault();
            panState.current.isPanning = true;
            panState.current.lastPoint = point;
            paperScope.view.element.style.cursor = 'grabbing';
            return;
        }

        if (editMode === 'transform' && event.button === 0) {
            const hitOptions = {
                fill: true,
                tolerance: 5 / paperScope.view.zoom,
            };
            const hitResult = paperScope.project.hitTest(point, hitOptions);
            
            paperScope.project.deselectAll();
            artworkDragTargetRef.current = null;

            if (hitResult) {
                let artwork = hitResult.item;
                // Traverse up to find the root artwork group
                while(artwork.parent && !artwork.data.isArtwork) {
                    artwork = artwork.parent;
                }

                if (artwork && artwork.data.isArtwork && !artwork.layer.data.locked) {
                    artwork.selected = true;
                    artworkDragTargetRef.current = artwork;
                }
            }
        }

        if (editMode === 'points' && event.button === 0) {
            const hitOptions = {
                segments: true,
                stroke: true,
                handles: true,
                fill: false,
                tolerance: 5 / paperScope.view.zoom,
            };
            const hitResult = paperScope.project.hitTest(point, hitOptions);

            paperScope.project.deselectAll();

            if (hitResult && !hitResult.item.layer.data.locked) {
                let artwork = hitResult.item;
                while (artwork.parent && !artwork.data.isArtwork) {
                    artwork = artwork.parent;
                }

                if (artwork && artwork.data.isArtwork) {
                    const paths = artwork.getItems({ class: paperScope.Path });
                    paths.forEach((p: paper.Path) => p.selected = true);
                } else {
                     hitResult.item.selected = true;
                }
                
                pointDragTargetRef.current = hitResult;
            } else {
                pointDragTargetRef.current = null;
            }
        }
    }, [paperScope, editMode]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!paperScope) return;
        
        const point = new paperScope.Point(event.offsetX, event.offsetY);
        const view = paperScope.view;

        if (panState.current.isPanning) {
            const delta = point.subtract(panState.current.lastPoint).divide(view.zoom);
            panState.current.lastPoint = point;
            view.center = view.center.subtract(delta);
            return;
        }

        if (editMode === 'transform' && artworkDragTargetRef.current) {
            const delta = new paperScope.Point(event.movementX, event.movementY).divide(view.zoom);
            let newPosition = artworkDragTargetRef.current.position.add(delta);
            
             if (isSnapEnabled && showGrid) {
                const center = artworkDragTargetRef.current.bounds.center;
                const snappedCenter = new paperScope.Point(
                    Math.round(center.x / GRID_SIZE) * GRID_SIZE,
                    Math.round(center.y / GRID_SIZE) * GRID_SIZE
                );
                const snapDelta = snappedCenter.subtract(center);
                newPosition = newPosition.add(snapDelta);
            }

            artworkDragTargetRef.current.position = artworkDragTargetRef.current.position.add(delta);
            return;
        }

        if (editMode === 'points' && pointDragTargetRef.current) {
            const dragTarget = pointDragTargetRef.current;
            if (dragTarget.item.layer.data.locked) {
                pointDragTargetRef.current = null;
                return;
            }
            
            let projectPoint = view.viewToProject(point);
            
            if (isSnapEnabled && showGrid && dragTarget.type === 'segment') {
                const gridSizeInProjectCoords = GRID_SIZE;
                projectPoint.x = Math.round(projectPoint.x / gridSizeInProjectCoords) * gridSizeInProjectCoords;
                projectPoint.y = Math.round(projectPoint.y / gridSizeInProjectCoords) * gridSizeInProjectCoords;
            }
            
            if (dragTarget.type === 'segment') {
                dragTarget.segment.point = projectPoint;
            } else if (dragTarget.type === 'handle-in') {
                dragTarget.segment.handleIn = projectPoint.subtract(dragTarget.segment.point);
            } else if (dragTarget.type === 'handle-out') {
                dragTarget.segment.handleOut = projectPoint.subtract(dragTarget.segment.point);
            }
        }
    }, [paperScope, editMode, isSnapEnabled, showGrid]);

    const handleMouseUp = useCallback(() => {
        if (!paperScope) return;
        
        panState.current.isPanning = false;
        pointDragTargetRef.current = null;
        artworkDragTargetRef.current = null;


        const canvas = paperScope.view.element;
        if (isSpacePressed.current) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }
    }, [paperScope]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!paperScope || event.repeat) return;
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        
        if (event.code === 'Space') {
            event.preventDefault();
            isSpacePressed.current = true;
            if (!panState.current.isPanning) {
                paperScope.view.element.style.cursor = 'grab';
            }
        }
    }, [paperScope]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        if (!paperScope) return;
        
        if (event.code === 'Space') {
            isSpacePressed.current = false;
            if (!panState.current.isPanning) {
                paperScope.view.element.style.cursor = 'default';
            }
        }
    }, [paperScope]);

    useEffect(() => {
        if (!paperScope) return;

        const canvas = paperScope.view.element;
        if (!canvas) return;
        
        // Clear previous selections when edit mode changes
        paperScope.project.deselectAll();

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        canvas.style.cursor = 'default';

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [paperScope, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp, editMode]);

    return null;
};

export default CanvasInteraction;