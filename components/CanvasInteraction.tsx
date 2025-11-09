import React, { useRef, useEffect, useCallback, useState } from 'react';
import paper from 'paper';
import { Layer } from '../types';
import { useGestures, GestureState } from '../hooks/useGestures';

interface CanvasInteractionProps {
    paperScope: any;
    onZoomChange: (zoom: number) => void;
    editMode: 'transform' | 'points' | 'pen';
    isSnapEnabled: boolean;
    showGrid: boolean;
    layers: Layer[];
    onSelectionUpdate: (selection: { items: paper.Item[], segments: paper.Segment[] }) => void;
    onNodeSelect?: (segment: paper.Segment, point: paper.Point) => void;
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
    onNodeSelect,
}) => {
    const panState = useRef({ isPanning: false, lastPoint: null as any });
    const isSpacePressed = useRef(false);
    const dragTargetRef = useRef<{
        type: 'segment' | 'handle-in' | 'handle-out';
        segment: paper.Segment;
    } | null>(null);
    const artworkDragTargetRef = useRef<paper.Item | null>(null);
    const selectionRectangleRef = useRef<paper.Path.Rectangle | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    useEffect(() => {
        if(paperScope) {
            canvasRef.current = paperScope.view.element;
        }
    }, [paperScope]);

    const handleGesture = useCallback((state: GestureState, event: TouchEvent) => {
        if (!paperScope || event.touches.length > 2) return;
        const view = paperScope.view;

        // Pan
        if (state.pan.deltaX !== 0 || state.pan.deltaY !== 0) {
            view.center = view.center.subtract(new paperScope.Point(state.pan.deltaX, state.pan.deltaY).divide(view.zoom));
        }

        // Pinch
        if (state.pinch.scale !== 1 && state.pinch.center) {
            const oldZoom = view.zoom;
            const newZoom = Math.max(MIN_ZOOM, Math.min(oldZoom * state.pinch.scale, MAX_ZOOM));
            
            if (oldZoom.toFixed(4) !== newZoom.toFixed(4)) {
                const pinchCenterInProject = view.viewToProject(new paperScope.Point(state.pinch.center));
                view.zoom = newZoom;
                const newPinchCenterInProject = view.viewToProject(new paperScope.Point(state.pinch.center));
                view.center = view.center.add(pinchCenterInProject.subtract(newPinchCenterInProject));
                onZoomChange(newZoom);
            }
        }
    }, [paperScope, onZoomChange]);

    useGestures(canvasRef, handleGesture);

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
            const hitOptions = { fill: true, stroke: true, tolerance: 5 / paperScope.view.zoom };
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

            if (!nativeEvent.shiftKey && hitResult?.type !== 'segment' && hitResult?.type !== 'handle-in' && hitResult?.type !== 'handle-out') {
                 // Only deselect if we didn't hit a segment or handle, and shift isn't pressed
                 // paperScope.project.deselectAll(); // REMOVED: This was causing issues with selecting handles
            }

            if (hitResult && !hitResult.item.layer.data.locked) {
                 if(hitResult.item instanceof paperScope.Path) {
                    (hitResult.item as any).fullySelected = true;
                 }
                 if (hitResult.type === 'stroke') {
                    const newSegment = hitResult.item.insert(hitResult.location.index + 1, point);
                    // newSegment.selected = true; // Optional: select newly created segment
                    dragTargetRef.current = { type: 'segment', segment: newSegment };
                } else if (hitResult.type === 'segment' || hitResult.type === 'handle-in' || hitResult.type === 'handle-out') {
                    if (hitResult.type === 'segment') {
                        if (nativeEvent.shiftKey) {
                            hitResult.segment.selected = !hitResult.segment.selected;
                        } else {
                            // If clicking a segment without shift, deselect other segments in the same path if they were selected
                             paperScope.project.getItems({ selected: true, class: paperScope.Segment }).forEach((seg: paper.Segment) => {
                                 if (seg !== hitResult.segment) seg.selected = false;
                             });
                            hitResult.segment.selected = true;
                             // Trigger node select callback for context menu
                             if (onNodeSelect) {
                                const viewPoint = paperScope.view.projectToView(hitResult.segment.point);
                                onNodeSelect(hitResult.segment, viewPoint);
                             }
                        }
                    }
                    dragTargetRef.current = { type: hitResult.type as any, segment: hitResult.segment };
                }
            } else {
                 // Clicked on empty space in points mode
                 if (!nativeEvent.shiftKey) {
                     paperScope.project.deselectAll();
                 }
            }
        }
        
        triggerSelectionUpdate();
    }, [paperScope, editMode, triggerSelectionUpdate, onNodeSelect]);

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
            let delta = new paperScope.Point(event.delta);
            
            // Shift to constrain movement
            if (event.modifiers.shift) {
                if (Math.abs(delta.x) > Math.abs(delta.y)) {
                    delta.y = 0;
                } else {
                    delta.x = 0;
                }
            }

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
            // Cast segment to any to access custom 'data' property
            const nodeType = (segment as any).data?.type || 'smooth';

            if (dragTarget.type === 'segment') {
                let delta = event.delta;
                 // Shift to constrain movement
                if (event.modifiers.shift) {
                     if (Math.abs(delta.x) > Math.abs(delta.y)) {
                        delta.y = 0;
                    } else {
                        delta.x = 0;
                    }
                }

                // Also move other selected segments
                paperScope.project.getItems({class: paperScope.Segment, selected: true}).forEach((s: paper.Segment) => {
                    s.point = s.point.add(delta);
                })
            } else {
                // Handle dragging
                let handle = projectPoint.subtract(segment.point);
                
                // Shift to constrain angle to 45 degree increments
                if (event.modifiers.shift) {
                    const angle = handle.angle;
                    const snappedAngle = Math.round(angle / 45) * 45;
                    handle.angle = snappedAngle;
                }

                if (dragTarget.type === 'handle-in') {
                    segment.handleIn = handle;
                    // Symmetry logic based on node type
                    if (nodeType === 'smooth') {
                         segment.handleOut = handle.normalize().multiply(-segment.handleOut.length || -handle.length);
                    } else if (nodeType === 'symmetric') {
                        segment.handleOut = handle.multiply(-1);
                    }
                    // 'corner' type does not affect the other handle
                } else if (dragTarget.type === 'handle-out') {
                    segment.handleOut = handle;
                     // Symmetry logic
                    if (nodeType === 'smooth') {
                        segment.handleIn = handle.normalize().multiply(-segment.handleIn.length || -handle.length);
                    } else if (nodeType === 'symmetric') {
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