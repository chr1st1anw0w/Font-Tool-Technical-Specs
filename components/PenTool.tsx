import React, { useRef, useCallback, useEffect } from 'react';
import paper from 'paper';
import { PenToolSettings } from '../types';

interface PenToolState {
  isDrawing: boolean;
  currentPath: paper.Path | null;
  currentSegment: paper.Segment | null;
  isClosing: boolean;
}

interface PenToolProps {
  scope: paper.PaperScope;
  settings: PenToolSettings;
  onPathComplete: (path: paper.Path) => void;
  onCancel: () => void;
}

export const PenTool: React.FC<PenToolProps> = ({
  scope,
  settings,
  onPathComplete,
  onCancel
}) => {
  const stateRef = useRef<PenToolState>({
    isDrawing: false,
    currentPath: null,
    currentSegment: null,
    isClosing: false,
  });

  const closeThreshold = 10;

  const initPath = useCallback(() => {
    const path = new scope.Path({
      strokeColor: new scope.Color(settings.strokeColor),
      strokeWidth: settings.strokeWidth,
      fillColor: settings.fillColor ? new scope.Color(settings.fillColor) : null,
      fullySelected: false,
      closed: false
    });
    stateRef.current.currentPath = path;
    stateRef.current.isDrawing = true;
    return path;
  }, [scope, settings]);

  const addPoint = useCallback((point: paper.Point) => {
    const { currentPath } = stateRef.current;
    if (!currentPath) return;

    const segment = new scope.Segment(point);
    currentPath.add(segment);
    stateRef.current.currentSegment = segment;
  }, []);

  const updateHandle = useCallback((segment: paper.Segment, handlePoint: paper.Point) => {
    const delta = handlePoint.subtract(segment.point);
    segment.handleOut = delta;
    segment.handleIn = delta.multiply(-1); // Symmetric handle
  }, []);
  
  const checkClosePath = useCallback((point: paper.Point): boolean => {
    const { currentPath } = stateRef.current;
    if (!currentPath || currentPath.segments.length < 2) return false;
    const firstPoint = currentPath.firstSegment.point;
    return point.getDistance(firstPoint) < closeThreshold / scope.view.zoom;
  }, [scope]);

  const finishPath = useCallback((shouldClose: boolean = false) => {
    const { currentPath } = stateRef.current;
    if (!currentPath) return;

    if (shouldClose && currentPath.segments.length > 1) {
      currentPath.closePath();
    }
    
    if(currentPath.segments.length > 1) {
        currentPath.simplify(2);
        onPathComplete(currentPath);
    } else {
        currentPath.remove();
    }
    
    stateRef.current = { isDrawing: false, currentPath: null, currentSegment: null, isClosing: false };
  }, [onPathComplete]);

  useEffect(() => {
    if (!scope) return;
    
    const tool = new scope.Tool();
    
    tool.onMouseDown = (event: paper.ToolEvent) => {
      const { isDrawing } = stateRef.current;

      if (isDrawing && checkClosePath(event.point)) {
        finishPath(true);
        return;
      }
      
      if (!isDrawing) {
        initPath();
      }
      
      addPoint(event.point);
    };

    tool.onMouseDrag = (event: paper.ToolEvent) => {
      const { currentSegment } = stateRef.current;
      if (!currentSegment) return;
      updateHandle(currentSegment, event.point);
    };

    tool.onMouseMove = (event: paper.ToolEvent) => {
      if (stateRef.current.isDrawing) {
        stateRef.current.isClosing = checkClosePath(event.point);
         // TODO: Add visual cursor change for closing
      }
    };

    tool.activate();

    return () => {
      if (stateRef.current.currentPath) {
          stateRef.current.currentPath.remove();
      }
      tool.remove();
    };
  }, [scope, settings, initPath, addPoint, updateHandle, checkClosePath, finishPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const { isDrawing, currentPath } = stateRef.current;
      if (!isDrawing) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        finishPath(false);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        currentPath?.remove();
        onCancel();
        stateRef.current.isDrawing = false;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (currentPath && currentPath.segments.length > 0) {
          currentPath.removeSegment(currentPath.segments.length - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishPath, onCancel]);

  return null;
};