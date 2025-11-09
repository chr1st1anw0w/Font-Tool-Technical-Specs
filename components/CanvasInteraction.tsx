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
    // FIX: Replaced onSelectionChange and onItemSelected with a single onSelectionUpdate callback to align with parent component's prop.
    onSelectionUpdate: (selection: { items: paper.Item[], segments: paper.Segment[] }) => void;
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
    onSelectionUpdate,
}) => {
    const panState = useRef({ isPanning: false, lastPoint: null as any });
    const isSpacePressed = useRef(false);
    const dragTargetRef = useRef<{
        type: 'segment' | 'handle-in' | 'handle-out';
        segment: paper.Segment;
    } | null>(null);
    const artworkDragTargetRef = useRef<paper.Item | null>(null);
    const selectionRectangleRef = useRef<paper.Path.Rectangle | null>(null);

    useEffect(() => {
        if (!paperScope) return;
        paperScope.settings.handleSize = 8;
        paperScope.settings.selectionColor = new paperScope.Color('#3B82F6');
    }, [paperScope]);
    
    useEffect(() => {
        if (!paperScope) return;
        const scope = paperScope;
        const items = scope.project.selectedItems;

        if (editMode === 'points') {
            items.forEach((item: paper.Item) => {
                 let artwork = item;
                 while(artwork.parent && !artwork.data.isArtwork) {
                    artwork = artwork.parent;
                }
                if (artwork instanceof scope.Path || artwork instanceof scope.CompoundPath) {
                    (artwork as any).fullySelected = true;
                }
            });
        } else {
            scope.project.getItems({ fullySelected: true }).forEach((item: paper.Item) => {
                (item as any).fullySelected = false;
            });
        }
        (scope.view as any).draw();
    }, [editMode, paperScope]);


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

    const triggerSelectionUpdate = useCallback(() => {
        const selectedItems = paperScope.project.selectedItems;
        const selectedSegments = paperScope.project.getItems({ selected: true, class: paperScope.Segment });
        onSelectionUpdate({ items: selectedItems, segments: selectedSegments });
    }, [paperScope, onSelectionUpdate]);

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
            dragTargetRef.current = null;
            const hitOptions = { segments: true, stroke: true, handles: true, tolerance: 5 / paperScope.view.zoom };

            const hitResult = paperScope.project.hitTest(point, hitOptions);

            if (!nativeEvent.shiftKey && hitResult?.type !== 'segment') {
                 paperScope.project.deselectAll();
            }

            if (hitResult && !hitResult.item.layer.data.locked) {
                 if(hitResult.item instanceof paperScope.Path) {
                    (hitResult.item as any).fullySelected = true;
                 }
                 if (hitResult.type === 'stroke') {
                    const newSegment = hitResult.item.insert(hitResult.location.index + 1, point);
                    newSegment.selected = true;
                    dragTargetRef.current = { type: 'segment', segment: newSegment };
                } else if (hitResult.segment) {
                    if (nativeEvent.shiftKey) {
                        hitResult.segment.selected = !hitResult.segment.selected;
                    } else {
                        hitResult.segment.selected = true;
                    }
                    dragTargetRef.current = { type: hitResult.type, segment: hitResult.segment };
                }
            }
        }
        
        triggerSelectionUpdate();
    }, [paperScope, editMode, triggerSelectionUpdate]);

    const handleMouseMove = useCallback((event: any) => { // This is paper's onMouseDrag
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

        if (editMode === 'points' && dragTargetRef.current) {
            const dragTarget = dragTargetRef.current;
            if (dragTarget.segment.path.layer.data.locked) {
                dragTargetRef.current = null;
                return;
            }
            
            let projectPoint = event.point;
            
            if (isSnapEnabled && showGrid && dragTarget.type === 'segment') {
                const gridSize = GRID_SIZE;
                projectPoint.x = Math.round(projectPoint.x / gridSize) * gridSize;
                projectPoint.y = Math.round(projectPoint.y / gridSize) * gridSize;
            }
            
            const segment = dragTarget.segment;

            if (dragTarget.type === 'segment') {
                // Also move other selected segments
                paperScope.project.getItems({class: paperScope.Segment, selected: true}).forEach((s: paper.Segment) => {
                    s.point = s.point.add(event.delta);
                })
            } else {
                const handle = projectPoint.subtract(segment.point);
                if (dragTarget.type === 'handle-in') {
                    segment.handleIn = handle;
                    if (!event.modifiers.alt) {
                        segment.handleOut = handle.multiply(-1);
                    }
                } else if (dragTarget.type === 'handle-out') {
                    segment.handleOut = handle;
                    if (!event.modifiers.alt) {
                        segment.handleIn = handle.multiply(-1);
                    }
                }
            }
        }
    }, [paperScope, editMode, isSnapEnabled, showGrid]);

    const handleMouseUp = useCallback(() => {
        if (!paperScope || editMode === 'pen') return;
        
        // Finalize artwork modification by updating originalPath
        if (editMode === 'points' && dragTargetRef.current) {
            const path = dragTargetRef.current.segment.path;
            
            let artworkRoot: paper.Item = path;
            while(artworkRoot.parent && !artworkRoot.data.isArtwork) {
                artworkRoot = artworkRoot.parent;
            }

            if (artworkRoot.data.isArtwork) {
                artworkRoot.data.originalPath = artworkRoot.clone({ insert: false });
            }
        }

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
                    if (editMode === 'points' && (artwork instanceof paperScope.Path || artwork instanceof paperScope.CompoundPath)) {
                        (artwork as any).fullySelected = true;
                    } else {
                        artwork.selected = true;
                    }
                }
            });

            selectionRectangleRef.current.remove();
            selectionRectangleRef.current = null;
        }

        panState.current.isPanning = false;
        dragTargetRef.current = null;
        artworkDragTargetRef.current = null;

        const canvas = paperScope.view.element;
        if (isSpacePressed.current) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }

        triggerSelectionUpdate();
    }, [paperScope, editMode, triggerSelectionUpdate]);

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
        
        if(editMode !== 'points') {
            paperScope.project.deselectAll();
        }
        onSelectionUpdate({ items: [], segments: [] });

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
    }, [paperScope, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp, editMode, onSelectionUpdate]);

    return null;
};

export default CanvasInteraction;