import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasComponent from './components/CanvasComponent';
import ControlPanel from './components/ControlPanel';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import type { TransformParams, ViewOptions, Layer, PenToolSettings } from './types';
import { BevelType } from './types';
import {
    CopyIcon, EyeIcon, DownloadIcon, GridIcon, GuidesIcon,
    PlusIcon, MinusIcon, RefreshIcon, ArrowsExpandIcon, PenToolIcon, MagnetIcon, TrashIcon,
    UndoIcon, RedoIcon, UniteIcon, SubtractIcon, IntersectIcon, PencilIcon
} from './components/icons';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorage } from './hooks/useLocalStorage';
import useHistory from './hooks/useHistory';
import clsx from 'clsx';
import paper from 'paper';

type EditMode = 'transform' | 'points' | 'pen';
type BooleanOperation = 'unite' | 'subtract' | 'intersect';

const defaultLayers: Layer[] = [{ id: `layer-${Date.now()}`, name: 'Layer 1', visible: true, locked: false }];

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;

const App: React.FC = () => {
    const [svgData, setSvgData] = useState<{ data: string; id: number } | null>(null);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    
    const { 
      state: params, 
      set: setParams, 
      undo: undoParams, 
      redo: redoParams, 
      canUndo, 
      canRedo 
    } = useHistory<TransformParams>('skywalk-params-history', {
        weight: 40,
        width: 100,
        slant: 0,
        strokeWidth: 0,
        strokeColor: '#000000',
        fillColor: '#000000',
        opacity: 1,
        bevelType: BevelType.NONE,
        bevelSize: 8,
    });
    
    const [viewOptions, setViewOptions] = useLocalStorage<ViewOptions>('skywalk-view-options', {
        showAids: false,
        previewMode: false,
        previewBg: 'dark',
    });
    
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useLocalStorage<boolean>('skywalk-show-grid', true);
    const [isSnapEnabled, setIsSnapEnabled] = useState(true);
    const [showGuides, setShowGuides] = useState(true);
    const [editMode, setEditMode] = useState<EditMode>('transform');
    const [canvasHasContent, setCanvasHasContent] = useState(false);

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

    const paperScopeRef = useRef<any>(null);

    const showNotification = useCallback((message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const handleParamChange = useCallback(<K extends keyof TransformParams>(param: K, value: TransformParams[K]) => {
        setParams(prev => ({ ...prev, [param]: value }));
    }, [setParams]);
    
    const handleApplyStyle = useCallback((partialParams: Partial<TransformParams>) => {
        setParams(prev => ({ ...prev, ...partialParams }));
    }, [setParams]);

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

    const handleSelectLetter = useCallback((key: string, svgString: string) => {
        if (layers.length === 0 || !activeLayerId) {
            const newLayer: Layer = { id: `layer-${Date.now()}`, name: 'Layer 1', visible: true, locked: false };
            setLayers([newLayer]);
            setActiveLayerId(newLayer.id);
        }

        setIsLoading(true);
        setSelectedLetter(key);
        setSvgData({ data: svgString, id: Date.now() });
        setCanvasHasContent(true);
        showNotification(`已新增 ${key}`);
        setTimeout(() => {
            handleZoomReset();
            setIsLoading(false)
        }, 100);
    }, [showNotification, handleZoomReset, layers, activeLayerId, setLayers, setActiveLayerId]);
    
    const downloadData = useCallback((filename: string, data: string, type: string) => {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }, []);

    const handleExportSVG = useCallback(async () => {
        if (paperScopeRef.current) {
            try {
                paperScopeRef.current.project.deselectAll();
                const svgString = paperScopeRef.current.project.exportSVG({ asString: true });
                const filename = `skywalk-export.svg`;
                downloadData(filename, svgString, 'image/svg+xml');
                showNotification('SVG 檔案已匯出');
            } catch (error) {
                showNotification('匯出失敗，請再試一次');
                console.error('Export SVG failed:', error);
            }
        }
    }, [downloadData, showNotification]);
    
    const handleExportPNG = useCallback(async () => {
        if (paperScopeRef.current) {
             try {
                paperScopeRef.current.project.deselectAll();
                paperScopeRef.current.view.draw(); 
                const canvas = paperScopeRef.current.view.element;
                canvas.toBlob((blob: Blob | null) => {
                    if(blob){
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `skywalk-export.png`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        showNotification('PNG 圖片已匯出');
                    }
                });
            } catch (error) {
                showNotification('匯出失敗，請再試一次');
                console.error('Export PNG failed:', error);
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

    const handleSelectionChange = useCallback((count: number) => {
        setNumSelectedItems(count);
    }, []);

    const handleDeleteSelected = useCallback(() => {
        const scope = paperScopeRef.current;
        if (!scope) return;

        const selectedSegments = scope.project.getItems({ selected: true, class: scope.Segment });
        if (selectedSegments.length > 0) {
            selectedSegments.forEach((seg: paper.Segment) => seg.remove());
            showNotification(`${selectedSegments.length} 個節點已刪除`);
            return;
        }

        const selectedItems = scope.project.selectedItems;
        if (selectedItems.length > 0) {
            selectedItems.forEach((item: paper.Item) => item.remove());
            showNotification(`${selectedItems.length} 個物件已刪除`);
        }
    }, [showNotification]);

    useKeyboardShortcuts({
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onZoomReset: handleZoomReset,
        onExport: handleExportSVG,
        onUndo: undoParams,
        onRedo: redoParams,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
             if (e.key === 'p' || e.key === 'P') {
                if (
                    document.activeElement?.tagName !== 'INPUT' &&
                    document.activeElement?.tagName !== 'TEXTAREA'
                ) {
                    e.preventDefault();
                    setEditMode('pen');
                }
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                 if (
                    document.activeElement?.tagName !== 'INPUT' &&
                    document.activeElement?.tagName !== 'TEXTAREA'
                ) {
                    e.preventDefault();
                    handleDeleteSelected();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDeleteSelected]);
    
    const hasContent = canvasHasContent;

    return (
        <ErrorBoundary>
            <div className="h-screen w-screen bg-white font-ui text-gray-900 flex flex-col antialiased">
                <header className="h-[49px] flex-shrink-0 bg-white flex items-center justify-between px-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <h1 className="text-sm font-semibold tracking-wide">
                            <span className="font-bold">SKYWALK</span> 字體雕塑工作台
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 bg-button-secondary-bg border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg disabled:opacity-50" disabled={!hasContent}>
                            <EyeIcon className="w-4 h-4" />
                            <span>預覽</span>
                        </button>
                        <button onClick={handleExportPNG} className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 bg-button-secondary-bg border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg disabled:opacity-50" disabled={!hasContent}>
                            <DownloadIcon className="w-4 h-4" />
                            <span>PNG</span>
                        </button>
                        <button onClick={handleExportSVG} className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 bg-button-secondary-bg border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg disabled:opacity-50" disabled={!hasContent}>
                             <DownloadIcon className="w-4 h-4" />
                            <span>SVG</span>
                        </button>
                         <button onClick={handleCopySVG} className="h-8 px-4 text-sm font-semibold rounded-md flex items-center space-x-2 bg-button-primary-bg text-button-primary-text hover:bg-gray-800 disabled:opacity-50" disabled={!hasContent}>
                            <CopyIcon className="w-4 h-4" />
                            <span>複製程式碼</span>
                        </button>
                    </div>
                </header>
                
                <div className="flex-grow grid grid-cols-[256px_1fr_280px] overflow-hidden">
                    <Sidebar 
                        onSelectLetter={handleSelectLetter} 
                        currentLetterKey={selectedLetter} 
                        onImportSVG={(svg) => handleSelectLetter('Custom', svg)}
                        layers={layers}
                        activeLayerId={activeLayerId}
                        onAddLayer={handleAddLayer}
                        onDeleteLayer={handleDeleteLayer}
                        onUpdateLayer={handleUpdateLayer}
                        onReorderLayer={handleReorderLayer}
                        onSetActiveLayer={setActiveLayerId}
                    />

                    <main className="flex flex-col bg-gray-100 border-l border-r border-gray-200">
                         <div className="h-[49px] flex-shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4">
                            <div className="flex items-center space-x-2">
                                <button title="變換工具" onClick={() => setEditMode('transform')} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border", editMode === 'transform' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                    <ArrowsExpandIcon className="w-4 h-4" />
                                </button>
                                 <button title="鋼筆工具 (P)" onClick={() => setEditMode('pen')} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border", editMode === 'pen' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button title="節點編輯工具" onClick={() => setEditMode('points')} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border", editMode === 'points' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50", !hasContent && 'opacity-50 cursor-not-allowed')} disabled={!hasContent}>
                                    <PenToolIcon className="w-4 h-4" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                                <AnimatePresence>
                                {numSelectedItems >= 2 && (
                                    <motion.div initial={{opacity: 0, width: 0}} animate={{opacity: 1, width: 'auto'}} exit={{opacity: 0, width: 0}} className="flex items-center space-x-1 overflow-hidden">
                                        <div className="h-6 w-px bg-gray-200 mr-1"></div>
                                        <button title="合併" onClick={() => handleBooleanOperation('unite')} className="h-8 w-8 rounded-md flex items-center justify-center border bg-white border-gray-300 text-gray-600 hover:bg-gray-50">
                                            <UniteIcon className="w-4 h-4" />
                                        </button>
                                        <button title="裁切" onClick={() => handleBooleanOperation('subtract')} className="h-8 w-8 rounded-md flex items-center justify-center border bg-white border-gray-300 text-gray-600 hover:bg-gray-50">
                                            <SubtractIcon className="w-4 h-4" />
                                        </button>
                                        <button title="交集" onClick={() => handleBooleanOperation('intersect')} className="h-8 w-8 rounded-md flex items-center justify-center border bg-white border-gray-300 text-gray-600 hover:bg-gray-50">
                                            <IntersectIcon className="w-4 h-4" />
                                        </button>
                                        <div className="h-6 w-px bg-gray-200 ml-1"></div>
                                    </motion.div>
                                )}
                                </AnimatePresence>

                                <button title="復原 (Cmd+Z)" onClick={undoParams} disabled={!canUndo} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border bg-white border-gray-300 text-gray-600 hover:bg-gray-50", !canUndo && 'opacity-50 cursor-not-allowed')}>
                                    <UndoIcon className="w-4 h-4" />
                                </button>
                                <button title="重做 (Cmd+Shift+Z)" onClick={redoParams} disabled={!canRedo} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border bg-white border-gray-300 text-gray-600 hover:bg-gray-50", !canRedo && 'opacity-50 cursor-not-allowed')}>
                                    <RedoIcon className="w-4 h-4" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                                <button title="清空畫面" onClick={handleClearCanvas} disabled={!hasContent} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border bg-white border-gray-300 text-gray-600 hover:bg-gray-50", !hasContent && 'opacity-50 cursor-not-allowed')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                                <button title="切換網格" onClick={() => setShowGrid(!showGrid)} className={clsx("h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 border", showGrid ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                    <GridIcon className="w-4 h-4" />
                                    <span>網格</span>
                                </button>
                                <button
                                    title="貼齊網格"
                                    onClick={() => setIsSnapEnabled(!isSnapEnabled)}
                                    className={clsx("h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 border", isSnapEnabled && showGrid ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50", !showGrid && 'opacity-50 cursor-not-allowed')}
                                    disabled={!showGrid}
                                >
                                    <MagnetIcon className="w-4 h-4" />
                                    <span>貼齊</span>
                                </button>
                                <button title="切換參考線" onClick={() => setShowGuides(!showGuides)} className={clsx("h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 border", showGuides ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                    <GuidesIcon className="w-4 h-4" />
                                    <span>參考線</span>
                                </button>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button title="縮小" onClick={handleZoomOut} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100"><MinusIcon className="w-4 h-4"/></button>
                                <div className="h-8 w-20 text-sm flex items-center justify-center bg-white border border-gray-300 rounded-md">{Math.round(zoomLevel * 100)}%</div>
                                <button title="放大" onClick={handleZoomIn} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100"><PlusIcon className="w-4 h-4"/></button>
                                <button title="重設視圖" onClick={handleZoomReset} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100"><RefreshIcon className="w-4 h-4"/></button>
                            </div>
                         </div>
                        <div className="flex-grow relative">
                            <CanvasComponent 
                                svgData={svgData}
                                letterKey={selectedLetter}
                                params={params} 
                                viewOptions={viewOptions}
                                onReady={(scope) => paperScopeRef.current = scope}
                                onZoomChange={setZoomLevel}
                                editMode={editMode}
                                isSnapEnabled={isSnapEnabled}
                                showGrid={showGrid}
                                layers={layers}
                                activeLayerId={activeLayerId}
                                penSettings={penSettings}
                                onPathComplete={handlePathComplete}
                                onSelectionChange={handleSelectionChange}
                                onItemSelected={setSelectedItem} 
                            />
                        </div>
                    </main>

                    <ControlPanel 
                        params={params} 
                        penSettings={penSettings}
                        onParamChange={handleParamChange}
                        onPenSettingChange={setPenSettings}
                        onApplyStyle={handleApplyStyle}
                        disabled={!hasContent || editMode === 'points' || editMode === 'pen'}
                        editMode={editMode}
                        paperScope={paperScopeRef.current}
                        selectedItem={selectedItem}
                    />
                </div>

                <AnimatePresence>
                    {notification && (
                        <motion.div
                            className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-lg px-4 py-2 shadow-lg z-50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <p className="text-sm">{notification}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <PerformanceMonitor />
            </div>
        </ErrorBoundary>
    );
};

export default App;
