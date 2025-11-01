import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasComponent from './components/CanvasComponent';
import ControlPanel from './components/ControlPanel';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import type { TransformParams, ViewOptions } from './types';
import {
    CopyIcon, EyeIcon, DownloadIcon, GridIcon, GuidesIcon,
    PlusIcon, MinusIcon, RefreshIcon, ArrowsExpandIcon, PenToolIcon, MagnetIcon
} from './components/icons';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAutoSave } from './hooks/useAutoSave';
import clsx from 'clsx';

type EditMode = 'transform' | 'points';

const App: React.FC = () => {
    const [svgData, setSvgData] = useState<string | null>(null);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    
    const [params, setParams] = useLocalStorage<TransformParams>('skywalk-params', {
        weight: 40,
        width: 100,
        slant: 0,
    });
    
    const [viewOptions, setViewOptions] = useLocalStorage<ViewOptions>('skywalk-view-options', {
        showAids: false,
        previewMode: false,
        previewBg: 'dark',
    });
    
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [isSnapEnabled, setIsSnapEnabled] = useState(true);
    const [showGuides, setShowGuides] = useState(true);
    const [editMode, setEditMode] = useState<EditMode>('transform');

    const paperScopeRef = useRef<any>(null);
    const letterKeys = ['S', 'K', 'Y', 'W', 'A', 'L'];
    
    useAutoSave(params, selectedLetter);

    const showNotification = useCallback((message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const handleParamChange = useCallback(<K extends keyof TransformParams>(param: K, value: TransformParams[K]) => {
        setParams(prev => ({ ...prev, [param]: value }));
    }, [setParams]);
    
    const handleZoomReset = useCallback(() => {
        if (!paperScopeRef.current) return;
        const scope = paperScopeRef.current;
        const artwork = scope.project.getItem({ data: { isArtwork: true } });
        if (artwork && artwork.hasChildren()) {
            scope.view.fit(artwork.bounds, 80);
        } else {
            scope.view.zoom = 1;
        }
        setZoomLevel(scope.view.zoom);
    }, []);

    const handleSelectLetter = useCallback((key: string, svgString: string) => {
        setIsLoading(true);
        setSelectedLetter(key);
        setSvgData(svgString);
        showNotification(`已選擇字母 ${key}`);
        setTimeout(() => {
            handleZoomReset();
            setIsLoading(false)
        }, 100);
    }, [showNotification, handleZoomReset]);
    
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
                // Deselect items before exporting for a clean output
                paperScopeRef.current.project.deselectAll();
                const svgString = paperScopeRef.current.project.exportSVG({ asString: true });
                const filename = `skywalk-${selectedLetter || 'design'}.svg`;
                downloadData(filename, svgString, 'image/svg+xml');
                showNotification('SVG 檔案已匯出');
            } catch (error) {
                showNotification('匯出失敗，請再試一次');
                console.error('Export SVG failed:', error);
            }
        }
    }, [selectedLetter, downloadData, showNotification]);
    
    const handleExportPNG = useCallback(async () => {
        if (paperScopeRef.current) {
             try {
                // Deselect items before exporting for a clean output
                paperScopeRef.current.project.deselectAll();
                paperScopeRef.current.view.draw(); // Ensure deselection is rendered
                const canvas = paperScopeRef.current.view.element;
                canvas.toBlob((blob: Blob | null) => {
                    if(blob){
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `skywalk-${selectedLetter || 'design'}.png`;
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
    }, [selectedLetter, showNotification]);
    
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
        const newZoom = Math.min(view.zoom * 1.25, 16);
        view.zoom = newZoom;
        setZoomLevel(newZoom);
    }, []);

    const handleZoomOut = useCallback(() => {
        if (!paperScopeRef.current) return;
        const view = paperScopeRef.current.view;
        const newZoom = Math.max(view.zoom / 1.25, 0.1);
        view.zoom = newZoom;
        setZoomLevel(newZoom);
    }, []);

    const handleParamReset = () => {
        setParams({ weight: 40, width: 100, slant: 0 });
        showNotification('參數已重設');
    }

    useKeyboardShortcuts({
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onZoomReset: handleZoomReset,
        onExport: handleExportSVG,
    });

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
                        <button className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 bg-button-secondary-bg border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg disabled:opacity-50" disabled={!svgData}>
                            <EyeIcon className="w-4 h-4" />
                            <span>預覽</span>
                        </button>
                        <button onClick={handleExportPNG} className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 bg-button-secondary-bg border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg disabled:opacity-50" disabled={!svgData}>
                            <DownloadIcon className="w-4 h-4" />
                            <span>PNG</span>
                        </button>
                        <button onClick={handleExportSVG} className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 bg-button-secondary-bg border border-button-secondary-border text-button-secondary-text hover:bg-button-secondary-hover-bg disabled:opacity-50" disabled={!svgData}>
                             <DownloadIcon className="w-4 h-4" />
                            <span>SVG</span>
                        </button>
                         <button onClick={handleCopySVG} className="h-8 px-4 text-sm font-semibold rounded-md flex items-center space-x-2 bg-button-primary-bg text-button-primary-text hover:bg-gray-800 disabled:opacity-50" disabled={!svgData}>
                            <CopyIcon className="w-4 h-4" />
                            <span>複製程式碼</span>
                        </button>
                    </div>
                </header>
                
                <div className="flex-grow grid grid-cols-[256px_1fr_280px] overflow-hidden">
                    <Sidebar onSelectLetter={handleSelectLetter} currentLetterKey={selectedLetter} onImportSVG={(svg) => handleSelectLetter('Custom', svg)} />

                    <main className="flex flex-col bg-gray-100 border-l border-r border-gray-200">
                         <div className="h-[49px] flex-shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4">
                            <div className="flex items-center space-x-2">
                                <button title="變換工具" onClick={() => setEditMode('transform')} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border", editMode === 'transform' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                    <ArrowsExpandIcon className="w-4 h-4" />
                                </button>
                                <button title="節點編輯工具" onClick={() => setEditMode('points')} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border", editMode === 'points' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50", !svgData && 'opacity-50 cursor-not-allowed')} disabled={!svgData}>
                                    <PenToolIcon className="w-4 h-4" />
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
                            />
                        </div>
                    </main>

                    <ControlPanel 
                        params={params} 
                        onParamChange={handleParamChange}
                        onApplyStyle={setParams}
                        disabled={!svgData || editMode === 'points'}
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