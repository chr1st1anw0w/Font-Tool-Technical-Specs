
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasComponent from './components/CanvasComponent';
import ControlPanel from './components/ControlPanel';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import type { TransformParams, ViewOptions, Layer, PenToolSettings, SvgData } from './types';
import { BevelType } from './types';
import {
    CopyIcon, GridIcon, PanelsIcon,
    PlusIcon, MinusIcon, RefreshIcon, PenToolIcon, TrashIcon,
    UndoIcon, RedoIcon, UniteIcon, SubtractIcon, IntersectIcon, PasteIcon,
    SelectionIcon, DirectSelectionIcon, SelectAllIcon,
    SparklesIcon, LayersIcon, SettingsIcon, DownloadIcon,
    GroupIcon, UngroupIcon, BringToFrontIcon, SendToBackIcon, FlipHorizontalIcon, FlipVerticalIcon,
    CodeIcon, PngIcon, CopyPropertiesIcon, PastePropertiesIcon, GuidesIcon, CheckCircleIcon
} from './components/icons';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorage } from './hooks/useLocalStorage';
import useHistory from './hooks/useHistory';
import clsx from 'clsx';
import paper from 'paper';
import ContextMenu, { MenuItem } from './components/ui/ContextMenu';
import ResizeHandle from './components/ui/ResizeHandle';

type EditMode = 'transform' | 'points' | 'pen';
type BooleanOperation = 'unite' | 'subtract' | 'intersect';
type SidebarTab = 'letters' | 'layers' | 'settings';

const defaultLayers: Layer[] = [{ id: `layer-${Date.now()}`, name: 'Layer 1', visible: true, locked: false }];

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 500;

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
            'p-2 rounded-md transition-all duration-200',
            active
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)] hover:text-[var(--text-primary)]',
            disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[var(--text-secondary)]',
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
            strokeColor: '#FFFFFF',
            fillColor: '#646CFF',
            opacity: 1,
            bevelType: BevelType.NONE,
            bevelSize: 8,
            chamferAngle: 45,
            segments: 8,
        },
        nodeOverrides: [],
    });

    const { params } = historyState;
    const nodeOverrides = new Map<string, Partial<TransformParams>>(historyState.nodeOverrides);
    
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
        strokeColor: '#FFFFFF',
        fillColor: null,
    });
    const [numSelectedItems, setNumSelectedItems] = useState(0);
    const [selectedItem, setSelectedItem] = useState<paper.Item | null>(null);
    const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

    const [panelWidths, setPanelWidths] = useLocalStorage('skywalk-panel-widths', { sidebar: 280, controlPanel: 300 });

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
            <div onContextMenu={handleContextMenu} className="h-screen w-screen bg-[var(--bg-canvas)] font-ui text-[var(--text-primary)] flex flex-col antialiased overflow-hidden">
                
                {/* Header */}
                <header className="h-14 flex-shrink-0 bg-[var(--bg-panel)] flex items-center justify-between px-4 border-b border-[var(--border-color)] z-10">
                    {/* Logo Area */}
                    <div className="flex items-center space-x-3 w-64">
                        <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">VectorFont AI</span>
                    </div>

                    {/* Center Tools */}
                    <div className="flex-1 flex justify-center items-center">
                        <div className="flex items-center bg-[var(--bg-canvas)] p-1 rounded-lg border border-[var(--border-color)]">
                            <IconButton active={editMode === 'transform'} onClick={() => setEditMode('transform')} tooltip="選取與變形 (V)">
                                <SelectionIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton active={editMode === 'points'} onClick={() => setEditMode('points')} tooltip="編輯節點 (A)">
                                <DirectSelectionIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton active={editMode === 'pen'} onClick={() => setEditMode('pen')} tooltip="鋼筆工具 (P)">
                                <PenToolIcon className="w-5 h-5" />
                            </IconButton>
                            <div className="w-px h-5 bg-[var(--border-color)] mx-2"></div>
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
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-3 w-64 justify-end">
                        <div className="flex items-center bg-[var(--bg-canvas)] p-1 rounded-lg border border-[var(--border-color)]">
                             <IconButton onClick={undo} disabled={!canUndo} tooltip="復原 (Cmd+Z)">
                                <UndoIcon className="w-4 h-4" />
                            </IconButton>
                            <IconButton onClick={redo} disabled={!canRedo} tooltip="重做 (Cmd+Shift+Z)">
                                <RedoIcon className="w-4 h-4" />
                            </IconButton>
                        </div>

                        <div className="flex items-center space-x-1">
                            <IconButton onClick={() => toggleViewOption('showGrid')} active={viewOptions.showGrid} tooltip="切換網格" className="bg-[var(--bg-panel-hover)]">
                                <GridIcon className="w-5 h-5" />
                            </IconButton>
                            <IconButton onClick={() => toggleViewOption('showGuides')} active={viewOptions.showGuides} tooltip="切換參考線" className="bg-[var(--bg-panel-hover)]">
                                <GuidesIcon className="w-5 h-5" />
                            </IconButton>
                             <IconButton onClick={() => setIsUiVisible(v => !v)} active={isUiVisible} tooltip="切換介面" className="bg-[var(--bg-panel-hover)]">
                                <PanelsIcon className="w-5 h-5" />
                            </IconButton>
                        </div>

                        <div className="flex items-center bg-[var(--bg-canvas)] p-1 rounded-lg border border-[var(--border-color)]">
                            <IconButton onClick={handleExportSVG} disabled={!hasContent} tooltip="匯出 SVG">
                                <DownloadIcon className="w-4 h-4" />
                            </IconButton>
                            <IconButton onClick={handleCopySVG} disabled={!hasContent} tooltip="複製 SVG 代碼">
                                <CodeIcon className="w-4 h-4" />
                            </IconButton>
                        </div>
                        
                        <IconButton onClick={handleClearCanvas} disabled={!hasContent} tooltip="清空畫布" className="hover:text-red-400 hover:bg-red-400/10">
                            <TrashIcon className="w-4 h-4" />
                        </IconButton>

                         <div className="w-9 h-9 rounded-full bg-[var(--bg-panel-hover)] border border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors">
                            <span className="text-xs font-bold text-[var(--text-secondary)]">CW</span>
                        </div>
                    </div>
                </header>

                {/* Main Workspace */}
                <main className="flex-grow flex h-[calc(100vh-56px)] overflow-hidden">
                    <AnimatePresence>
                        {isUiVisible && (
                            <div className="flex flex-shrink-0 h-full">
                                {/* Icon Rail - Updated background color */}
                                <motion.div
                                    className="w-[60px] bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col items-center py-4 space-y-4 z-20"
                                    initial={{ x: -60 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -60 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                >
                                    <RailButton 
                                        icon={<SparklesIcon className="w-6 h-6" />} 
                                        tooltip="資源庫" 
                                        isActive={activeSidebarTab === 'letters'} 
                                        onClick={() => setActiveSidebarTab('letters')} 
                                    />
                                    <RailButton 
                                        icon={<LayersIcon className="w-6 h-6" />} 
                                        tooltip="圖層" 
                                        isActive={activeSidebarTab === 'layers'} 
                                        onClick={() => setActiveSidebarTab('layers')} 
                                    />
                                     <div className="flex-grow" />
                                     <RailButton 
                                        icon={<SettingsIcon className="w-6 h-6" />} 
                                        tooltip="設定" 
                                        isActive={activeSidebarTab === 'settings'} 
                                        onClick={() => setActiveSidebarTab('settings')} 
                                    />
                                </motion.div>

                                {/* Expandable Sidebar Panel */}
                                <motion.aside
                                    className="flex-shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] overflow-hidden z-10 relative"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: panelWidths.sidebar, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
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
                                     <ResizeHandle 
                                        onDrag={handleSidebarResize} 
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent-primary)] transition-colors opacity-0 hover:opacity-100"
                                    />
                                </motion.aside>
                            </div>
                        )}
                    </AnimatePresence>
                    
                    {/* Canvas Area */}
                    <div className="flex-grow flex flex-col relative bg-[var(--bg-canvas)]">
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
                        
                        {/* Zoom & Pan Controls Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-[var(--bg-panel)] p-1.5 rounded-xl border border-[var(--border-color)] shadow-2xl z-20">
                            <IconButton onClick={handleZoomOut} tooltip="縮小" className="hover:bg-[var(--bg-canvas)]">
                                <MinusIcon className="w-4 h-4" />
                            </IconButton>
                            <button onClick={handleZoomReset} className="px-3 py-1.5 text-xs font-mono font-medium text-[var(--text-secondary)] hover:text-white transition-colors min-w-[60px] text-center">
                                {Math.round(zoomLevel * 100)}%
                            </button>
                            <IconButton onClick={handleZoomIn} tooltip="放大" className="hover:bg-[var(--bg-canvas)]">
                                <PlusIcon className="w-4 h-4" />
                            </IconButton>
                            <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
                            <IconButton onClick={handleZoomReset} tooltip="重設視圖" className="hover:bg-[var(--bg-canvas)]">
                                <RefreshIcon className="w-4 h-4" />
                            </IconButton>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isUiVisible &&
                            <motion.aside
                                className="flex-shrink-0 bg-[var(--bg-panel)] border-l border-[var(--border-color)] z-10 relative"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: panelWidths.controlPanel, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                 <ResizeHandle 
                                    onDrag={handleControlPanelResize} 
                                    className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent-primary)] transition-colors opacity-0 hover:opacity-100 z-20"
                                />
                                <div className="h-full overflow-y-auto custom-scrollbar">
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
                                </div>
                            </motion.aside>
                        }
                    </AnimatePresence>
                </main>
                
                <AnimatePresence>
                  {notification && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--accent-primary)] text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl z-50 flex items-center gap-2"
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

const RailButton: React.FC<{ icon: React.ReactNode; tooltip: string; isActive: boolean; onClick: () => void }> = ({ icon, tooltip, isActive, onClick }) => (
    <button
        onClick={onClick}
        title={tooltip}
        className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
            isActive 
                ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30" 
                : "text-[var(--text-tertiary)] hover:bg-[var(--bg-panel-hover)] hover:text-[var(--text-primary)]"
        )}
    >
        {icon}
        {/* Tooltip on hover right */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {tooltip}
        </div>
    </button>
)

export default App;
