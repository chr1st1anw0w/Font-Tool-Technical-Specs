import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';

interface CanvasInteractionProps {
    paperScope: any;
    onZoomChange: (zoom: number) => void;
    editMode: 'transform' | 'points';
    isSnapEnabled: boolean;
    showGrid: boolean;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const GRID_SIZE = 20; // Corresponds to the background-size in index.html CSS

const CanvasInteraction: React.FC<CanvasInteractionProps> = ({ 
    paperScope, 
    onZoomChange,
    editMode,
    isSnapEnabled,
    showGrid
}) => {
    const panState = useRef({ isPanning: false, lastPoint: null as any });
    const isSpacePressed = useRef(false);
    const dragTargetRef = useRef<any>(null);

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

        // This is the point in project coordinates that the mouse is over
        const viewPosition = view.viewToProject(mousePosition);
        
        const zoomFactor = 1.1;
        const newZoom = event.deltaY < 0
            ? Math.min(oldZoom * zoomFactor, MAX_ZOOM)
            : Math.max(oldZoom / zoomFactor, MIN_ZOOM);
        
        if (oldZoom !== newZoom) {
            view.zoom = newZoom;

            // The new view coordinates of the same mouse position
            const newViewPosition = view.viewToProject(mousePosition);
            // Move the view center by the difference
            view.center = view.center.add(viewPosition.subtract(newViewPosition));
            onZoomChange(newZoom);
        }
    }, [paperScope, onZoomChange]);

    const handleMouseDown = useCallback((event: MouseEvent) => {
        if (!paperScope) return;
        
        const point = new paperScope.Point(event.offsetX, event.offsetY);

        // Pan logic (middle mouse or spacebar + left click)
        if (event.button === 1 || (isSpacePressed.current && event.button === 0)) {
            event.preventDefault();
            panState.current.isPanning = true;
            panState.current.lastPoint = point; // Use view coordinates for panning delta
            paperScope.view.element.style.cursor = 'grabbing';
            return;
        }

        // Point editing logic
        if (editMode === 'points' && event.button === 0) {
            const artwork = paperScope.project.getItem({ data: { isArtwork: true } });
            if (!artwork) return;
            
            const hitOptions = {
                segments: true,
                stroke: true,
                handles: true,
                fill: false, // Don't select by clicking fill, only stroke
                tolerance: 5 / paperScope.view.zoom,
            };
            const hitResult = artwork.hitTest(point, hitOptions);
            
            if (hitResult) {
                const item = hitResult.item;
                
                // If we're clicking a new item, deselect others.
                // If we're clicking a handle/segment of an already selected item, do nothing.
                if (!item.selected) {
                    paperScope.project.deselectAll();
                }
                item.selected = true;
                dragTargetRef.current = hitResult;
            } else {
                paperScope.project.deselectAll();
                dragTargetRef.current = null;
            }
        }
    }, [paperScope, editMode]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!paperScope) return;
        
        // Panning
        if (panState.current.isPanning) {
            const point = new paperScope.Point(event.offsetX, event.offsetY);
            const view = paperScope.view;
            // The delta is in view coordinates, which is what we want.
            const delta = point.subtract(panState.current.lastPoint);
            panState.current.lastPoint = point;
            view.center = view.center.subtract(delta);
            return;
        }

        // Point editing drag
        if (editMode === 'points' && dragTargetRef.current) {
            const point = new paperScope.Point(event.offsetX, event.offsetY);
            const dragTarget = dragTargetRef.current;
            let projectPoint = paperScope.view.viewToProject(point);
            
            if (isSnapEnabled && showGrid && dragTarget.type === 'segment') {
                const gridSizeInProjectCoords = GRID_SIZE / paperScope.view.zoom;
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
        dragTargetRef.current = null;

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
    }, [paperScope, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp]);

    return null;
};

export default CanvasInteraction;