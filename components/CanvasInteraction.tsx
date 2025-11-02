import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import { Layer } from '../types';

interface CanvasInteractionProps {
    paperScope: any;
    onZoomChange: (zoom: number) => void;
    editMode: 'transform' | 'points' | 'pen';
    isSnapEnabled: boolean;
    showGrid: boolean;
    layers: Layer[];
    onSelectionChange: (count: number) => void;
    onItemSelected: (item: paper.Item | null) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const GRID_SIZE = 40; 

const CanvasInteraction: React.FC<CanvasInteractionProps> = ({ 
    paperScope, 
    onZoomChange,
    editMode,
    isSnapEnabled,
    showGrid,
    onSelectionChange,
    onItemSelected,
}) => {
    const panState = useRef({ isPanning: false, lastPoint: null as any });
    const isSpacePressed = useRef(false);
    const pointDragTargetRef = useRef<any>(null);
    const artworkDragTargetRef = useRef<paper.Item | null>(null);
    const selectionRectangleRef = useRef<paper.Path.Rectangle | null>(null);

    useEffect(() => {
        if (!paperScope) return;
        paperScope.settings.handleSize = 8;
        paperScope.settings.selectionColor = new paperScope.Color('#3B82F6');
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

    const handleMouseDown = useCallback((event: any) => {
        if (!paperScope || editMode === 'pen') return;
        
        const point = new paperScope.Point(event.point);
        const nativeEvent = event.event as MouseEvent;

        if (nativeEvent.button === 1 || (isSpacePressed.current && nativeEvent.button === 0)) {
            nativeEvent.preventDefault();
            panState.current.isPanning = true;
            panState.current.lastPoint = point;
            paperScope.view.element.style.cursor = 'grabbing';
            return;
        }

        if (editMode === 'transform' && nativeEvent.button === 0) {
            const hitOptions = { fill: true, tolerance: 5 / paperScope.view.zoom };
            const hitResult = paperScope.project.hitTest(point, hitOptions);
            
            const isShiftPressed = nativeEvent.shiftKey;

            if (hitResult) {
                let artwork = hitResult.item;
                while(artwork.parent && !artwork.data.isArtwork) {
                    artwork = artwork.parent;
                }

                if (artwork && artwork.data.isArtwork && !artwork.layer.data.locked) {
                    if (isShiftPressed) {
                        artwork.selected = !artwork.selected;
                    } else {
                        if (!artwork.selected) {
                            paperScope.project.deselectAll();
                            artwork.selected = true;
                        }
                    }
                    artworkDragTargetRef.current = artwork; // Prepare for dragging
                }
            } else {
                if (!isShiftPressed) {
                    paperScope.project.deselectAll();
                }
                selectionRectangleRef.current = new paperScope.Path.Rectangle({
                    from: point,
                    to: point,
                    strokeColor: '#3B82F6',
                    dashArray: [4, 4],
                    strokeWidth: 1 / paperScope.view.zoom,
                });
            }
        }

        if (editMode === 'points' && nativeEvent.button === 0) {
            const hitOptions = { segments: true, stroke: true, handles: true, tolerance: 5 / paperScope.view.zoom };
            const hitResult = paperScope.project.hitTest(point, hitOptions);
            
            if (!nativeEvent.shiftKey) {
                paperScope.project.deselectAll();
            }

            if (hitResult && !hitResult.item.layer.data.locked) {
                 if (hitResult.type === 'stroke') {
                    const location = hitResult.location;
                    const newSegment = hitResult.item.insert(location.index + 1, point);
                    newSegment.selected = true;
                    pointDragTargetRef.current = { type: 'segment', segment: newSegment };
                } else {
                    hitResult.item.selected = true;
                    pointDragTargetRef.current = hitResult;
                }
            } else {
                pointDragTargetRef.current = null;
            }
        }
        
        onSelectionChange(paperScope.project.selectedItems.length);
        onItemSelected(paperScope.project.selectedItems.length === 1 ? paperScope.project.selectedItems[0] : null);

    }, [paperScope, editMode, onSelectionChange, onItemSelected]);

    const handleMouseMove = useCallback((event: any) => {
        if (!paperScope || editMode === 'pen') return;
        
        const point = new paperScope.Point(event.point);
        const view = paperScope.view;

        if (panState.current.isPanning) {
            const delta = point.subtract(panState.current.lastPoint);
            panState.current.lastPoint = point;
            view.center = view.center.subtract(delta);
            return;
        }

        if (selectionRectangleRef.current) {
            selectionRectangleRef.current.segments[1].point.x = point.x;
            selectionRectangleRef.current.segments[2].point = point;
            selectionRectangleRef.current.segments[3].point.y = point.y;
        }

        if (editMode === 'transform' && artworkDragTargetRef.current && (event.event as MouseEvent).buttons === 1) {
            const delta = new paperScope.Point(event.delta);
            paperScope.project.selectedItems.forEach((item: paper.Item) => {
                 if (!item.layer.data.locked) {
                    item.position = item.position.add(delta);
                 }
            });
            return;
        }

        if (editMode === 'points' && pointDragTargetRef.current) {
            const dragTarget = pointDragTargetRef.current;
            if (dragTarget.item.layer.data.locked) {
                pointDragTargetRef.current = null;
                return;
            }
            
            let projectPoint = point;
            
            if (isSnapEnabled && showGrid && dragTarget.type === 'segment') {
                const gridSize = GRID_SIZE;
                projectPoint.x = Math.round(projectPoint.x / gridSize) * gridSize;
                projectPoint.y = Math.round(projectPoint.y / gridSize) * gridSize;
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
        if (!paperScope || editMode === 'pen') return;
        
        if (selectionRectangleRef.current) {
            const rect = selectionRectangleRef.current.bounds;
            paperScope.project.getItems({
                overlapping: rect,
                inside: rect.area === 0, // if it's just a click, select inside
            }).forEach((item: paper.Item) => {
                let artwork = item;
                 while(artwork.parent && !artwork.data.isArtwork) {
                    artwork = artwork.parent;
                }
                if(artwork.data.isArtwork && !artwork.layer.data.locked) {
                    artwork.selected = true;
                }
            });

            selectionRectangleRef.current.remove();
            selectionRectangleRef.current = null;
        }

        panState.current.isPanning = false;
        pointDragTargetRef.current = null;
        artworkDragTargetRef.current = null;

        const canvas = paperScope.view.element;
        if (isSpacePressed.current) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }

        onSelectionChange(paperScope.project.selectedItems.length);
        onItemSelected(paperScope.project.selectedItems.length === 1 ? paperScope.project.selectedItems[0] : null);
    }, [paperScope, editMode, onSelectionChange, onItemSelected]);

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
        const tool = new paperScope.Tool();
        tool.activate();

        if (!canvas) return;
        
        paperScope.project.deselectAll();
        onSelectionChange(0);
        onItemSelected(null);

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        tool.onMouseDown = handleMouseDown;
        tool.onMouseDrag = handleMouseMove;
        tool.onMouseUp = handleMouseUp;
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        canvas.style.cursor = editMode === 'pen' ? 'crosshair' : 'default';

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            tool.remove();
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [paperScope, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp, editMode, onSelectionChange, onItemSelected]);

    return null;
};

export default CanvasInteraction;