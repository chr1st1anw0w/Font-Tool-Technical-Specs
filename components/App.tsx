
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasComponent from './CanvasComponent';
import ControlPanel from './ControlPanel';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import PerformanceMonitor from './PerformanceMonitor';
import type { TransformParams, ViewOptions, Layer, PenToolSettings, SvgData } from '../types';
import { BevelType } from '../types';
import {
    CopyIcon, DownloadIcon, GridIcon, GuidesIcon, PanelsIcon,
    PlusIcon, MinusIcon, RefreshIcon, PenToolIcon, TrashIcon,
    UndoIcon, RedoIcon, UniteIcon, SubtractIcon, IntersectIcon, PasteIcon,
    GroupIcon, UngroupIcon, BringToFrontIcon, SendToBackIcon, FlipHorizontalIcon, FlipVerticalIcon,
    CodeIcon, SelectionIcon, DirectSelectionIcon, SelectAllIcon,
    SparklesIcon, LayersIcon, SettingsIcon, CheckCircleIcon, CopyPropertiesIcon, PastePropertiesIcon
} from './icons';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import useHistory from '../hooks/useHistory';
import clsx from 'clsx';
import paper from 'paper';
import ContextMenu, { MenuItem } from './ui/ContextMenu';
import ResizeHandle from './ui/ResizeHandle';

type EditMode = 'transform' | 'points' | 'pen';
type BooleanOperation = 'unite' | 'subtract' | 'intersect';
type SidebarTab = 'letters' | 'layers' | 'settings';

const defaultLayers: Layer[] = [{ id: `layer-${Date.now()}`, name: 'Layer 1', visible: true, locked: false }];

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 500;

// FIX: Added a helper component for consistent button styling in the header.
const IconButton: React.FC<{
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
    tooltip: string;
    className?: string;
    children: React.ReactNode;
}> = ({ onClick, disabled, active, tooltip, className, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        className={clsx(
            'p-2 rounded-md transition-colors',
            {
                'bg-blue-100 text-blue-600': active,
                'hover:bg-gray-200': !active && !disabled,
                'opacity-50 cursor-not-allowed': disabled,
            },
            className
        )}
    >
        {children}
    </button>
);

const App: React.FC = () => {
    const [svgData, setSvgData] = useState<SvgData>(null);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    
    const { 
      state: historyState, 
      set: setHistoryState, 
      undo, 
      redo, 
      canUndo, 
      canRedo 
    } = useHistory<{
        params: TransformParams;
        nodeOverrides: [string, Partial<TransformParams>][];
    }>('skywalk-design-history', {
        params: {
            weight: 40,
            width: 100,
            slant: 0,
            strokeWidth: 0,
            strokeColor: '#000000',
            fillColor: '#000000',
            opacity: 1,
            bevelType: BevelType.NONE,
            bevelSize: 8,
            chamferAngle: 45,
        },
        nodeOverrides: [],
    });

    const { params } = historyState;
    const nodeOverrides = new Map(historyState.nodeOverrides);
    
    const [viewOptions, setViewOptions] = useLocalStorage<ViewOptions>('skywalk-view-options', {
        showGuides: true,
        previewMode: false,
        previewBg: 'dark',
        showGrid: true,
    });
    
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [isSnapEnabled, setIsSnapEnabled] = useState(true);
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [editMode, setEditMode] = useState<EditMode>('transform');
    const [canvasHasContent, setCanvasHasContent] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('letters');

    // Layer state
    const [layers, setLayers] = useLocalStorage<Layer[]>('skywalk-layers', defaultLayers);
    const [activeLayerId, setActiveLayerId] = useLocalStorage<string | null>('skywalk-active-layer', defaultLayers[0].id);
    
    const [penSettings, setPenSettings] = useState<PenToolSettings>({
        strokeWidth: 2,
        strokeColor: '#000000',
        fillColor: null,
    });
    const [numSelectedItems, setNumSelectedItems] = useState(0);
    const [selectedItem, setSelectedItem] = useState<paper.Item | null>(null);
    const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

    const [panelWidths, setPanelWidths] = useLocalStorage('skywalk-panel-widths', { sidebar: 256, controlPanel: 280 });

    const paperScopeRef = useRef<any>(null);
    const internalClipboardRef = useRef<string | null>(null);
    const propertiesClipboardRef = useRef<Partial<TransformParams> | null>(null);
    const pasteOffset = useRef({ x: 20, y: 20 });

    const handleSidebarResize = useCallback((deltaX: number) => {
        setPanelWidths(prev => ({
            ...prev,
            sidebar: Math.max(MIN_PANEL_WIDTH, Math.min(prev.sidebar + deltaX, MAX_PANEL_WIDTH))
        }));
    }, [setPanelWidths]);

    const handleControlPanelResize = useCallback((deltaX: number) => {
        setPanelWidths(prev => ({
            ...prev,
            controlPanel: Math.max(MIN_PANEL_WIDTH, Math.min(prev.controlPanel - deltaX, MAX_PANEL_WIDTH))
        }));
    }, [setPanelWidths]);

    const showNotification = useCallback((message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const handleParamChange = useCallback(<K extends keyof TransformParams>(param: K, value: TransformParams[K]) => {
        setHistoryState(prev => ({ ...prev, params: { ...prev.params, [param]: value } }));
    }, [setHistoryState]);
    
    const handleApplyStyle = useCallback((partialParams: Partial<TransformParams>) => {
        setHistoryState(prev => ({ ...prev, params: { ...prev.params, ...partialParams } }));
    }, [setHistoryState]);

    const handleNodeOverrideChange = useCallback((segmentIds: string[], overrideParams: Partial<TransformParams>) => {
        setHistoryState(prev => {
            const newOverrides = new Map<string, Partial<TransformParams>>(prev.nodeOverrides);
            segmentIds.forEach(id => {
                const existing: Partial<TransformParams> = newOverrides.get(id) || {};
                newOverrides.set(id, { ...existing, ...overrideParams });
            });
            return { ...prev, nodeOverrides: Array.from(newOverrides.entries()) };
        });
    }, [setHistoryState]);

    const handleResetNodeOverrides = useCallback((segmentIds: string[]) => {
        setHistoryState(prev => {
            const newOverrides = new Map<string, Partial<TransformParams>>(prev.nodeOverrides);
            segmentIds.forEach(id => {
                newOverrides.delete(id);
            });
            return { ...prev, nodeOverrides: Array.from(newOverrides.entries()) };
        });
        showNotification(`${segmentIds.length} 個節點的覆蓋設定已重設`);
    }, [setHistoryState, showNotification]);

    const toggleViewOption = useCallback((option: keyof ViewOptions) => {
        setViewOptions(prev => ({ ...prev, [option]: !prev[option] }));
    }, [setViewOptions]);

    const handleZoomReset = useCallback(() => {
        if (!paperScopeRef.current) return;
        const scope = paperScopeRef.current;
    
        const artworkItems = scope.project.getItems({ data: { isArtwork: true } });
    
        if (artworkItems.length > 0) {
            let totalBounds = artworkItems[0].bounds;
            for (let i = 1; i < artworkItems.length; i++) {
                totalBounds = totalBounds.unite(artworkItems[i].bounds);
            }
            const artworkBounds = totalBounds;
    
            if (artworkBounds && artworkBounds.width > 0 && artworkBounds.height > 0) {
                const viewSize = scope.view.size;
                const padding = 80;
                
                const availableWidth = Math.max(0, viewSize.width - padding * 2);
                const availableHeight = Math.max(0, viewSize.height - padding * 2);
    
                const zoomX = availableWidth / artworkBounds.width;
                const zoomY = availableHeight / artworkBounds.height;
                const newZoom = Math.min(zoomX, zoomY);
    
                scope.view.zoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
                scope.view.center = artworkBounds.center;
            } else {
                 scope.view.zoom = 1;
                 scope.view.center = artworkItems[0].position || new scope.Point(0, 0);
            }
    
        } else {
            scope.view.zoom = 1;
            scope.view.center = new scope.Point(0, 0); // Reset center if no content
        }
        setZoomLevel(scope.view.zoom);
    }, []);

    const handleSelectLetter = useCallback((key: string, svgString: string, offset?: {x: number, y: number}) => {
        if (layers.length === 0 || !activeLayerId) {
            const newLayer: Layer = { id: `layer-${Date.now()}`, name: 'Layer 1', visible: true, locked: false };
            setLayers([newLayer]);
            setActiveLayerId(newLayer.id);
        }

        setIsLoading(true);
        setSelectedLetter(key);
        setSvgData({ data: svgString, id: Date.now(), offset });
        setCanvasHasContent(true);
        showNotification(`已新增 ${key}`);
        setTimeout(() => {
            handleZoomReset();
            setIsLoading(false)
        }, 100);
    }, [showNotification, handleZoomReset, layers, activeLayerId, setLayers, setActiveLayerId]);
    
    const handleExportSVG = useCallback(async () => {
        if (paperScopeRef.current) {
            try {
                paperScopeRef.current.project.deselectAll();
                const svgString = paperScopeRef.current.project.exportSVG({ asString: true });
                const filename = `skywalk-export.svg`;
                // downloadData logic here if needed directly or keep using a helper
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
                showNotification('SVG 檔案已匯出');
            } catch (error) {
                showNotification('匯出失敗，請再試一次');
                console.error('Export SVG failed:', error);
            }
        }
    }, [showNotification]);
    
    const handleCopySVG = useCallback(async () => {
        if (paperScopeRef.current) {
            try {
                paperScopeRef.current.project.deselectAll();
                const svgString = paperScopeRef.current.project.exportSVG({ asString: true });
                await navigator.clipboard.writeText(svgString);
                showNotification('SVG 程式碼已複製到剪貼簿');
            } catch (error) {
                showNotification('複製失敗，請再試一次');
                console.error('Copy SVG failed:', error);
            }
        }
    }, [showNotification]);

    const handleZoomIn = useCallback(() => {
        if (!paperScopeRef.current) return;
        const view = paperScopeRef.current.view;
        const newZoom = Math.min(view.zoom * 1.25, MAX_ZOOM);
        view.zoom = newZoom;
        setZoomLevel(newZoom);
    }, []);

    const handleZoomOut = useCallback(() => {
        if (!paperScopeRef.current) return;
        const view = paperScopeRef.current.view;
        const newZoom = Math.max(view.zoom / 1.25, MIN_ZOOM);
        view.zoom = newZoom;
        setZoomLevel(newZoom);
    }, []);

    const handleAddLayer = useCallback(() => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            name: `Layer ${layers.length + 1}`,
            visible: true,
            locked: false,
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
    }, [layers.length, setLayers, setActiveLayerId]);

    const handleDeleteLayer = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.filter(l => l.id !== id);
            if (newLayers.length === 0) {
                 setActiveLayerId(null);
                 setSvgData(null);
                 setCanvasHasContent(false);
                 return [];
            }
            if (activeLayerId === id) {
                const newActiveIndex = Math.max(0, prev.findIndex(l => l.id === id) -1);
                setActiveLayerId(newLayers[newActiveIndex]?.id || null);
            }
            return newLayers;
        });
    }, [activeLayerId, setLayers, setActiveLayerId]);

    const handleUpdateLayer = useCallback((id: string, updates: Partial<Layer>) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }, [setLayers]);
    
    const handleReorderLayer = useCallback((id: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === id);
            if (index === -1) return prev;
            
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.length) return prev;

            const newLayers = [...prev];
            const [movedLayer] = newLayers.splice(index, 1);
            newLayers.splice(newIndex, 0, movedLayer);
            return newLayers;
        });
    }, [setLayers]);

    const handleClearCanvas = useCallback(() => {
        if (paperScopeRef.current?.clearAllItems) {
            paperScopeRef.current.clearAllItems();
            setSvgData(null);
            setSelectedLetter(null);
            setCanvasHasContent(false);
            showNotification('畫布已清空');
        }
    }, [showNotification]);

     const handlePathComplete = useCallback((path: paper.Path) => {
        if (!activeLayerId || !paperScopeRef.current) return;

        const scope = paperScopeRef.current;
        const activeLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
        
        if (activeLayer) {
            activeLayer.addChild(path);
            path.data.isArtwork = true;
            // Store original geometry for non-destructive edits
            path.data.originalPath = path.clone({ insert: false });
        }

        setCanvasHasContent(true);
        setEditMode('transform');
        showNotification('路徑創建成功');
    }, [activeLayerId, showNotification]);

    const handleBooleanOperation = useCallback((operation: BooleanOperation) => {
        const scope = paperScopeRef.current;
        if (!scope) return;

        const selected = scope.project.selectedItems.filter((item: paper.Item) => item.data.isArtwork);
        if (selected.length < 2) return;

        let result = selected[0];
        for (let i = 1; i < selected.length; i++) {
            result = result[operation](selected[i]);
        }
        
        selected.forEach((item: paper.Item) => item.remove());
        result.selected = true;
        result.data.isArtwork = true;
        result.data.originalPath = result.clone({ insert: false });
        
        setNumSelectedItems(1);
        showNotification('布林運算成功');

    }, [showNotification]);
    
    const handleSelectionUpdate = useCallback(({ items, segments }: { items: paper.Item[], segments: paper.Segment[] }) => {
        setNumSelectedItems(items.length);
        setSelectedItem(items.length === 1 ? items[0] : null);
        setSelectedSegmentIds(segments.map(s => `${s.path.id}-${s.index}`));
    }, []);

    const handleDeleteSelected = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;
    
        // A set to keep track of paths that have been modified
        const modifiedPaths = new Set<paper.Path>();
    
        // First, handle selected segments
        const selectedSegments = scope.project.getItems({ selected: true, class: scope.Segment });
        if (selectedSegments.length > 0) {
            const segmentsByPath = new Map<paper.Path, paper.Segment[]>();
            selectedSegments.forEach((seg: paper.Segment) => {
                if (!segmentsByPath.has(seg.path)) {
                    segmentsByPath.set(seg.path, []);
                }
                segmentsByPath.get(seg.path)!.push(seg);
            });
    
            let removedCount = 0;
            segmentsByPath.forEach((segments, path) => {
                // Keep at least 2 segments for a path to be valid
                if (path.segments.length - segments.length >= 2) {
                    segments.forEach(seg => {
                        seg.remove();
                        removedCount++;
                    });
                    modifiedPaths.add(path);
                }
            });
    
            if (removedCount > 0) {
                showNotification(`${removedCount} 個節點已刪除`);
                modifiedPaths.forEach(path => {
                    if (path.data.isArtwork) {
                        let artworkRoot: paper.Item = path;
                        while(artworkRoot.parent && !artworkRoot.data.isArtwork) {
                            artworkRoot = artworkRoot.parent;
                        }
                        artworkRoot.data.originalPath = artworkRoot.clone({ insert: false });
                    }
                });
                handleSelectionUpdate({ items: scope.project.selectedItems, segments: [] });
                return; // Don't proceed to delete the whole item
            }
        }
    
        // If no segments were deleted, proceed to delete whole items
        const selectedItems = scope.project.selectedItems;
        if (selectedItems.length > 0) {
            const count = selectedItems.length;
            [...selectedItems].forEach((item: paper.Item) => item.remove());
            showNotification(`${count} 個物件已刪除`);
            handleSelectionUpdate({ items: [], segments: [] });
        }
    }, [showNotification, handleSelectionUpdate]);
    
    const handleCopyItems = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope || scope.project.selectedItems.length === 0) return;

        const selected = scope.project.selectedItems.filter((item: paper.Item) => item.data.isArtwork);
        if (selected.length === 0) return;

        // Create a temporary group to export multiple items as one SVG
        const group = new scope.Group(selected);
        const svgString = group.exportSVG({ asString: true });
        group.remove(); // Clean up the temporary group
        
        internalClipboardRef.current = svgString;
        showNotification(`${selected.length} 個物件已複製`);
    }, [showNotification]);

    const handlePasteItems = useCallback(async () => {
        let pasted = false;
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                if (item.types.includes('text/html')) {
                    const blob = await item.getType('text/html');
                    const htmlText = await blob.text();
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlText;
                    const img = tempDiv.querySelector('img[src^="data:image/svg+xml"]');

                    if (img) {
                        const src = img.getAttribute('src');
                        if (src) {
                            let svgString = '';
                            const parts = src.split(',');
                            const header = parts[0];
                            const data = parts.slice(1).join(','); 

                            if (data) {
                                try {
                                    if (header.includes(';base64')) {
                                        // Handle base64 encoded SVG
                                        svgString = atob(data);
                                    } else {
                                        // Handle URL-encoded SVG
                                        svgString = decodeURIComponent(data);
                                    }
                                } catch (e) {
                                    console.error("Error decoding SVG data from clipboard:", e);
                                }
                            }
                            
                            if (svgString) {
                                handleSelectLetter(`pasted-figma-${Date.now()}`, svgString, pasteOffset.current);
                                pasteOffset.current = { x: pasteOffset.current.x + 20, y: pasteOffset.current.y + 20 };
                                pasted = true;
                                break;
                            }
                        }
                    }
                } else if (item.types.includes('text/plain')) {
                    const blob = await item.getType('text/plain');
                    const text = await blob.text();
                    if (text.trim().startsWith('<svg')) {
                        handleSelectLetter(`pasted-svg-${Date.now()}`, text, pasteOffset.current);
                        pasteOffset.current = { x: pasteOffset.current.x + 20, y: pasteOffset.current.y + 20 };
                        pasted = true;
                        break;
                    }
                }
            }
        } catch (err) {
            console.warn("讀取剪貼簿失敗，可能是權限問題或瀏覽器不支援。", err);
        }

        if (!pasted && internalClipboardRef.current) {
            handleSelectLetter(`pasted-internal-${Date.now()}`, internalClipboardRef.current, pasteOffset.current);
            pasteOffset.current = { x: pasteOffset.current.x + 20, y: pasteOffset.current.y + 20 };
            pasted = true;
        }

        if (!pasted) {
            showNotification("剪貼簿中沒有可貼上的內容");
        }
    }, [handleSelectLetter, showNotification]);

    const handleSelectAll = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope || !activeLayerId) return;

        const activePaperLayer = scope.project.layers.find((l: paper.Layer) => l.data.id === activeLayerId);
        if (activePaperLayer) {
            scope.project.deselectAll();
            activePaperLayer.children.forEach((child: paper.Item) => {
                if (child.data.isArtwork) {
                    child.selected = true;
                }
            });
            handleSelectionUpdate({
                items: scope.project.selectedItems,
                segments: []
            });
            showNotification("已全選");
        }
    }, [activeLayerId, handleSelectionUpdate, showNotification]);
    
    const handleCopyProperties = useCallback(() => {
        propertiesClipboardRef.current = { ...params };
        showNotification('屬性已複製');
    }, [params, showNotification]);

    const handlePasteProperties = useCallback(() => {
        if (propertiesClipboardRef.current) {
            handleApplyStyle(propertiesClipboardRef.current);
            showNotification('屬性已貼上');
        } else {
            showNotification('剪貼簿中沒有屬性可貼上');
        }
    }, [handleApplyStyle, showNotification]);

    const handleGroup = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;
        const selected = scope.project.selectedItems.filter((item: paper.Item) => item.data.isArtwork);
        
        if (selected.length > 1) { // Grouping
            const group = new scope.Group(selected);
            group.data.isArtwork = true;
            showNotification('物件已群組');
        } else if (selected.length === 1 && selected[0] instanceof scope.Group) { // Ungrouping
            const group = selected[0];
            group.parent.insertChildren(group.index, group.removeChildren());
            group.remove();
            showNotification('物件已解散群組');
        }

        handleSelectionUpdate({
            items: scope.project.selectedItems,
            segments: scope.project.getItems({ selected: true, class: scope.Segment })
        });
    }, [showNotification, handleSelectionUpdate]);

    const handleBringToFront = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;
        scope.project.selectedItems.forEach((item: paper.Item) => item.bringToFront());
        showNotification('已移至最上層');
    }, [showNotification]);

    const handleSendToBack = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;
        scope.project.selectedItems.forEach((item: paper.Item) => item.sendToBack());
        showNotification('已移至最下層');
    }, [showNotification]);

    const handleFlipHorizontal = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;
        const selected = scope.project.selectedItems;
        if (selected.length === 0) return;

        let totalBounds = selected[0].bounds;
        for (let i = 1; i < selected.length; i++) {
            totalBounds = totalBounds.unite(selected[i].bounds);
        }
        const center = totalBounds.center;
        selected.forEach((item: paper.Item) => item.scale(-1, 1, center));
        showNotification('已水平翻轉');
    }, [showNotification]);

    const handleFlipVertical = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;
        const selected = scope.project.selectedItems;
        if (selected.length === 0) return;
        
        let totalBounds = selected[0].bounds;
        for (let i = 1; i < selected.length; i++) {
            totalBounds = totalBounds.unite(selected[i].bounds);
        }
        const center = totalBounds.center;
        selected.forEach((item: paper.Item) => item.scale(1, -1, center));
        showNotification('已垂直翻轉');
    }, [showNotification]);

    const handleFlatten = useCallback(() => {
      handleBooleanOperation('unite');
      showNotification('物件已扁平化');
    }, [handleBooleanOperation, showNotification]);

    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        
        const scope = paperScopeRef.current;
        if (!scope) return;
        
        const selected = scope.project.selectedItems.filter((item: paper.Item) => item.data.isArtwork);
        const numSelected = selected.length;
        
        let items: MenuItem[] = [];

        // Group 1: Clipboard
        items.push({ label: '貼上', icon: <PasteIcon />, action: handlePasteItems, shortcut: 'Cmd+V' });
        if (numSelected > 0) {
            items.push({ label: '複製', icon: <CopyIcon />, action: handleCopyItems, shortcut: 'Cmd+C' });
            items.push({
                label: '複製為...',
                icon: <CopyIcon />,
                children: [
                    { label: 'SVG 程式碼', icon: <CodeIcon />, action: handleCopySVG },
                    // PNG export not implemented yet for context menu specifically, could reuse handleExportPNG if adapted
                ]
            });
            items.push({ type: 'divider' });
            items.push({ label: '複製屬性', icon: <CopyPropertiesIcon />, action: handleCopyProperties, shortcut: 'Alt+Cmd+C' });
            items.push({ label: '貼上屬性', icon: <PastePropertiesIcon />, action: handlePasteProperties, shortcut: 'Alt+Cmd+V', disabled: !propertiesClipboardRef.current });
            items.push({ type: 'divider' });
            items.push({ label: '刪除', icon: <TrashIcon />, action: handleDeleteSelected, shortcut: 'Delete' });
        }
        items.push({ label: '全選', icon: <SelectAllIcon />, action: handleSelectAll, shortcut: 'Cmd+A' });
        items.push({ type: 'divider' });


        // Group 2: Arrange & Group
        if (numSelected > 0) {
            items.push({ label: '移至最上層', icon: <BringToFrontIcon />, action: handleBringToFront });
            items.push({ label: '移至最下層', icon: <SendToBackIcon />, action: handleSendToBack });
            
            const isGroupSelected = numSelected === 1 && selected[0] instanceof scope.Group;
            if (numSelected > 1 || isGroupSelected) {
                 items.push({ label: isGroupSelected ? '解散群組' : '建立群組', icon: isGroupSelected ? <UngroupIcon /> : <GroupIcon />, action: handleGroup, shortcut: 'Cmd+G' });
            }
        }
        
        // Group 3: Path Operations
        if (numSelected >= 1) {
             items.push({ label: '扁平化', icon: <UniteIcon />, action: handleFlatten });
        }
        if (numSelected >= 2) {
            items.push({ label: '合併 (Unite)', icon: <UniteIcon />, action: () => handleBooleanOperation('unite') });
            items.push({ label: '裁切 (Subtract)', icon: <SubtractIcon />, action: () => handleBooleanOperation('subtract') });
            items.push({ label: '交集 (Intersect)', icon: <IntersectIcon />, action: () => handleBooleanOperation('intersect') });
        }
        if (numSelected > 0) {
            items.push({ type: 'divider' });
        }
        
        // Group 4: Transform
        if (numSelected > 0) {
            items.push({ label: '水平翻轉', icon: <FlipHorizontalIcon />, action: handleFlipHorizontal });
            items.push({ label: '垂直翻轉', icon: <FlipVerticalIcon />, action: handleFlipVertical });
            items.push({ type: 'divider' });
        }

        // Group 5: General
        items.push({ label: '復原', icon: <UndoIcon />, action: undo, disabled: !canUndo, shortcut: 'Cmd+Z' });
        items.push({ label: '重做', icon: <RedoIcon />, action: redo, disabled: !canRedo, shortcut: 'Cmd+Shift+Z' });
        items.push({ type: 'divider' });
        items.push({ label: '重設視圖', icon: <RefreshIcon />, action: handleZoomReset, shortcut: 'Cmd+0' });
        items.push({ label: '清空畫布', icon: <TrashIcon />, action: handleClearCanvas, disabled: !canvasHasContent });
    
        setContextMenu({ x: event.clientX, y: event.clientY, items });
    }, [canvasHasContent, canUndo, canRedo, handlePasteItems, handleCopyItems, handleCopySVG, handleDeleteSelected, handleSelectAll, handleBringToFront, handleSendToBack, handleGroup, handleFlatten, handleBooleanOperation, handleFlipHorizontal, handleFlipVertical, undo, redo, handleZoomReset, handleClearCanvas, handleCopyProperties, handlePasteProperties]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);
    
    useKeyboardShortcuts({
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onZoomReset: handleZoomReset,
        onExport: handleExportSVG,
        onUndo: undo,
        onRedo: redo,
        onGroup: handleGroup,
        onToggleUi: () => setIsUiVisible(v => !v),
        onCopy: handleCopyItems,
        onPaste: handlePasteItems,
        onSelectAll: handleSelectAll,
        onCopyProperties: handleCopyProperties,
        onPasteProperties: handlePasteProperties,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA'
            ) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'v':
                    e.preventDefault();
                    setEditMode('transform');
                    break;
                case 'a':
                    e.preventDefault();
                    setEditMode('points');
                    break;
                case 'p':
                    e.preventDefault();
                    setEditMode('pen');
                    break;
                case 'delete':
                case 'backspace':
                    e.preventDefault();
                    handleDeleteSelected();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDeleteSelected]);
    
    const hasContent = canvasHasContent;
    const isSingleGroupSelected = numSelectedItems === 1 && paperScopeRef.current?.project.selectedItems[0] instanceof paper.Group;


    return (
        <ErrorBoundary>
            <div onContextMenu={handleContextMenu} className="h-screen w-screen bg-white font-ui text-gray-900 flex flex-col antialiased">
                <header className="h-[49px] flex-shrink-0 bg-white flex items-center justify-between px-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        {/* FIX: Malformed SVG tag was fixed, completing the path element and correcting the stroke attribute. */}
                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                        <span className="font-bold text-lg tracking-tight">Skywalk</span>
                    </div>

                    <div className="flex-1 flex justify-center items-center space-x-1">
                        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                            <IconButton active={editMode === 'transform'} onClick={() => setEditMode('transform')} tooltip="選取與變形 (V)">
                                <SelectionIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton active={editMode === 'points'} onClick={() => setEditMode('points')} tooltip="編輯節點 (A)">
                                <DirectSelectionIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton active={editMode === 'pen'} onClick={() => setEditMode('pen')} tooltip="鋼筆工具 (P)">
                                <PenToolIcon className="w-5 h-5" />
                            </IconButton>
                        </div>
                        <div className="w-px h-5 bg-gray-200 mx-2"></div>
                        <div className="flex items-center space-x-1">
                            <IconButton onClick={() => handleBooleanOperation('unite')} disabled={numSelectedItems < 2} tooltip="合併">
                                <UniteIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton onClick={() => handleBooleanOperation('subtract')} disabled={numSelectedItems < 2} tooltip="裁切">
                                <SubtractIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton onClick={() => handleBooleanOperation('intersect')} disabled={numSelectedItems < 2} tooltip="交集">
                                <IntersectIcon className="w-5 h-5" />
                            </IconButton>
                        </div>
                        <div className="w-px h-5 bg-gray-200 mx-2"></div>
                        <div className="flex items-center space-x-1">
                             <IconButton onClick={handleGroup} disabled={!(numSelectedItems > 1 || isSingleGroupSelected)} tooltip={isSingleGroupSelected ? "解散群組 (Cmd+G)" : "建立群組 (Cmd+G)"}>
                                {isSingleGroupSelected ? <UngroupIcon className="w-5 h-5"/> : <GroupIcon className="w-5 h-5" />}
                             </IconButton>
                        </div>
                        <div className="w-px h-5 bg-gray-200 mx-2"></div>
                        <div className="flex items-center space-x-1">
                            <IconButton onClick={handleBringToFront} disabled={numSelectedItems < 1} tooltip="移至最上層"><BringToFrontIcon className="w-5 h-5" /></IconButton>
                            <IconButton onClick={handleSendToBack} disabled={numSelectedItems < 1} tooltip="移至最下層"><SendToBackIcon className="w-5 h-5" /></IconButton>
                        </div>
                        <div className="w-px h-5 bg-gray-200 mx-2"></div>
                        <div className="flex items-center space-x-1">
                            <IconButton onClick={handleFlipHorizontal} disabled={numSelectedItems < 1} tooltip="水平翻轉"><FlipHorizontalIcon className="w-5 h-5" /></IconButton>
                            <IconButton onClick={handleFlipVertical} disabled={numSelectedItems < 1} tooltip="垂直翻轉"><FlipVerticalIcon className="w-5 h-5" /></IconButton>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                         <div className="flex items-center space-x-2">
                            <IconButton onClick={handleZoomOut} tooltip="縮小"><MinusIcon /></IconButton>
                            <button onClick={handleZoomReset} className="w-16 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md py-1">{Math.round(zoomLevel * 100)}%</button>
                            <IconButton onClick={handleZoomIn} tooltip="放大"><PlusIcon /></IconButton>
                         </div>
                        <div className="w-px h-5 bg-gray-200 mx-1"></div>
                        <IconButton onClick={() => toggleViewOption('showGrid')} active={viewOptions.showGrid} tooltip="切換網格"><GridIcon className="w-5 h-5" /></IconButton>
                        <IconButton onClick={() => toggleViewOption('showGuides')} active={viewOptions.showGuides} tooltip="切換參考線"><GuidesIcon className="w-5 h-5"/></IconButton>
                        <IconButton onClick={() => setIsUiVisible(v => !v)} active={isUiVisible} tooltip="顯示/隱藏介面 (Cmd+\)"><PanelsIcon className="w-5 h-5"/></IconButton>
                        <div className="w-px h-5 bg-gray-200 mx-1"></div>
                        <IconButton onClick={undo} disabled={!canUndo} tooltip="復原"><UndoIcon /></IconButton>
                        <IconButton onClick={redo} disabled={!canRedo} tooltip="重做"><RedoIcon /></IconButton>
                        <div className="w-px h-5 bg-gray-200 mx-1"></div>
                        <IconButton onClick={handleExportSVG} disabled={!hasContent} tooltip="匯出 SVG"><DownloadIcon /></IconButton>
                        <IconButton onClick={handleCopySVG} disabled={!hasContent} tooltip="複製 SVG"><CopyIcon /></IconButton>
                        <IconButton onClick={handleClearCanvas} disabled={!hasContent} tooltip="清空畫布"><TrashIcon /></IconButton>
                    </div>
                </header>

                <main className="flex-grow flex h-[calc(100vh-49px)] overflow-hidden">
                    <AnimatePresence>
                        {isUiVisible &&
                            <motion.aside
                                className="flex-shrink-0 bg-gray-50"
                                initial={{ width: 0 }}
                                animate={{ width: panelWidths.sidebar }}
                                exit={{ width: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                            >
                                <Sidebar
                                    activeTab={activeSidebarTab}
                                    onSelectLetter={handleSelectLetter}
                                    currentLetterKey={selectedLetter}
                                    onImportSVG={(svg) => handleSelectLetter(`imported-${Date.now()}`, svg)}
                                    layers={layers}
                                    activeLayerId={activeLayerId}
                                    onAddLayer={handleAddLayer}
                                    onDeleteLayer={handleDeleteLayer}
                                    onUpdateLayer={handleUpdateLayer}
                                    onReorderLayer={handleReorderLayer}
                                    onSetActiveLayer={setActiveLayerId}
                                />
                            </motion.aside>
                        }
                    </AnimatePresence>
                    
                    {isUiVisible && <ResizeHandle onDrag={handleSidebarResize} />}

                    <div className="flex-grow flex flex-col relative bg-gray-100">
                        <CanvasComponent
                            svgData={svgData}
                            letterKey={selectedLetter}
                            params={params}
                            nodeOverrides={nodeOverrides}
                            viewOptions={viewOptions}
                            onReady={(scope) => (paperScopeRef.current = scope)}
                            onZoomChange={setZoomLevel}
                            editMode={editMode}
                            isSnapEnabled={isSnapEnabled}
                            showGrid={viewOptions.showGrid}
                            layers={layers}
                            activeLayerId={activeLayerId}
                            penSettings={penSettings}
                            onPathComplete={handlePathComplete}
                            onSelectionUpdate={handleSelectionUpdate}
                        />
                    </div>

                    {isUiVisible && <ResizeHandle onDrag={handleControlPanelResize} />}

                    <AnimatePresence>
                        {isUiVisible &&
                            <motion.aside
                                className="flex-shrink-0 bg-white"
                                initial={{ width: 0 }}
                                animate={{ width: panelWidths.controlPanel }}
                                exit={{ width: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                            >
                                <ControlPanel
                                    params={params}
                                    nodeOverrides={nodeOverrides}
                                    selectedSegmentIds={selectedSegmentIds}
                                    penSettings={penSettings}
                                    onParamChange={handleParamChange}
                                    onNodeOverrideChange={handleNodeOverrideChange}
                                    onResetNodeOverrides={handleResetNodeOverrides}
                                    onPenSettingChange={setPenSettings}
                                    onApplyStyle={handleApplyStyle}
                                    disabled={!hasContent}
                                    editMode={editMode}
                                    paperScope={paperScopeRef.current}
                                    selectedItem={selectedItem}
                                />
                            </motion.aside>
                        }
                    </AnimatePresence>
                </main>
                
                <AnimatePresence>
                  {notification && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm shadow-lg flex items-center gap-2"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-green-400" />
                      {notification}
                    </motion.div>
                  )}
                </AnimatePresence>

                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={contextMenu.items}
                        onClose={closeContextMenu}
                    />
                )}
                
                <PerformanceMonitor />
            </div>
        </ErrorBoundary>
    );
};

export default App;
