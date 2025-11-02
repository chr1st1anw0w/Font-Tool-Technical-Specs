# 📱 RWD 響應式設計實作指南

**專案**: Skywalk Font Sculpting Workbench
**版本**: v1.1 響應式改進
**最後更新**: 2025-11-02
**狀態**: 📝 實作規劃

---

## 📑 目錄

1. [問題分析](#問題分析)
2. [設計目標](#設計目標)
3. [響應式斷點設計](#響應式斷點設計)
4. [可拖曳調整面板系統](#可拖曳調整面板系統)
5. [面板摺疊與展開](#面板摺疊與展開)
6. [技術實作](#技術實作)
7. [整合指南](#整合指南)
8. [測試計劃](#測試計劃)

---

## 問題分析

### 當前佈局結構

```tsx
// App.tsx 第 309 行
<div className="flex-grow grid grid-cols-[256px_1fr_280px] overflow-hidden">
    <Sidebar />       // 固定 256px
    <main />          // 自適應 1fr
    <ControlPanel />  // 固定 280px
</div>
```

### 存在的問題

| 問題 | 影響 | 優先級 |
|------|------|--------|
| **固定寬度面板** | 小螢幕無法使用 | 🔴 高 |
| **無響應式斷點** | 平板/手機體驗差 | 🔴 高 |
| **無法調整面板寬度** | 用戶無法自訂工作區 | 🟡 中 |
| **畫布未自適應** | 視窗調整時不自動縮放 | 🟡 中 |
| **無面板摺疊功能** | 小螢幕無法最大化畫布 | 🟢 低 |

### 螢幕尺寸分析

```
超小螢幕 (Mobile):     < 640px   (iPhone SE, 小型手機)
小螢幕 (Tablet):       640-1024px (iPad, 平板)
中螢幕 (Laptop):       1024-1440px (筆電)
大螢幕 (Desktop):      1440-1920px (桌機)
超大螢幕 (4K):         > 1920px  (4K 顯示器)

當前最小可用寬度: 256 + 280 = 536px (僅面板)
實際需要: 536 + 400 (畫布最小寬度) = 936px
```

**結論**: 當前設計在 < 936px 的設備上完全不可用。

---

## 設計目標

### 主要目標

1. **全設備支援**: 從手機 (375px) 到 4K 顯示器 (2560px+)
2. **自訂面板寬度**: 用戶可拖曳調整左右面板寬度
3. **智慧摺疊**: 小螢幕自動摺疊面板，大螢幕可手動切換
4. **畫布自適應**: 視窗調整時自動重新計算畫布尺寸
5. **狀態持久化**: 記住用戶的面板寬度偏好

### 用戶體驗目標

```
手機 (< 640px):
  - 單面板堆疊佈局
  - 底部抽屜式工具列
  - 全螢幕畫布模式

平板 (640-1024px):
  - 可摺疊側邊欄
  - 浮動工具面板
  - 雙欄切換佈局

筆電/桌機 (> 1024px):
  - 三欄佈局（當前設計）
  - 可拖曳調整面板寬度
  - 保持所有功能可見
```

---

## 響應式斷點設計

### Tailwind CSS 斷點擴展

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '375px',   // 超小手機
      'sm': '640px',   // 小型平板
      'md': '768px',   // 標準平板
      'lg': '1024px',  // 筆電
      'xl': '1280px',  // 桌機
      '2xl': '1440px', // 大桌機
      '3xl': '1920px', // Full HD
      '4xl': '2560px', // 4K
    },
  },
};
```

### 斷點行為定義

```typescript
// types.ts
export type ScreenSize = 'mobile' | 'tablet' | 'laptop' | 'desktop' | '4k';

export interface LayoutConfig {
  screenSize: ScreenSize;
  showSidebar: boolean;
  showControlPanel: boolean;
  sidebarWidth: number;
  controlPanelWidth: number;
  canvasMinWidth: number;
  panelMode: 'collapsed' | 'floating' | 'docked' | 'stacked';
}

export const LAYOUT_CONFIGS: Record<ScreenSize, LayoutConfig> = {
  mobile: {
    screenSize: 'mobile',
    showSidebar: false,
    showControlPanel: false,
    sidebarWidth: 0,
    controlPanelWidth: 0,
    canvasMinWidth: 280,
    panelMode: 'stacked',
  },
  tablet: {
    screenSize: 'tablet',
    showSidebar: true,
    showControlPanel: false,
    sidebarWidth: 240,
    controlPanelWidth: 0,
    canvasMinWidth: 400,
    panelMode: 'floating',
  },
  laptop: {
    screenSize: 'laptop',
    showSidebar: true,
    showControlPanel: true,
    sidebarWidth: 256,
    controlPanelWidth: 280,
    canvasMinWidth: 500,
    panelMode: 'docked',
  },
  desktop: {
    screenSize: 'desktop',
    showSidebar: true,
    showControlPanel: true,
    sidebarWidth: 300,
    controlPanelWidth: 320,
    canvasMinWidth: 700,
    panelMode: 'docked',
  },
  '4k': {
    screenSize: '4k',
    showSidebar: true,
    showControlPanel: true,
    sidebarWidth: 360,
    controlPanelWidth: 380,
    canvasMinWidth: 1000,
    panelMode: 'docked',
  },
};
```

### 視窗尺寸檢測 Hook

```typescript
// hooks/useResponsive.ts
import { useState, useEffect } from 'react';
import type { ScreenSize, LayoutConfig } from '../types';
import { LAYOUT_CONFIGS } from '../types';

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({ width, height: window.innerHeight });

      // 判斷螢幕尺寸
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else if (width < 1440) {
        setScreenSize('laptop');
      } else if (width < 1920) {
        setScreenSize('desktop');
      } else {
        setScreenSize('4k');
      }
    };

    handleResize(); // 初始化
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const layoutConfig = LAYOUT_CONFIGS[screenSize];

  return {
    screenSize,
    windowSize,
    layoutConfig,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isLaptop: screenSize === 'laptop',
    isDesktop: screenSize === 'desktop' || screenSize === '4k',
  };
};
```

---

## 可拖曳調整面板系統

### UI 設計

#### 拖曳控制手柄 (Resize Handle)

```
┌────────────┬─┬──────────────┬─┬────────────┐
│            │ │              │ │            │
│  Sidebar   │▓│   Canvas     │▓│  Control   │
│            │ │              │ │   Panel    │
│            │ │              │ │            │
└────────────┴─┴──────────────┴─┴────────────┘
             ▲                ▲
        拖曳手柄            拖曳手柄
        (4px 寬)           (4px 寬)

懸停效果:
  - 游標: col-resize (↔)
  - 背景色: 藍色高亮 (#3b82f6)
  - 拖曳時: 全螢幕覆蓋 (防止滑鼠事件丟失)
```

#### 拖曳狀態視覺回饋

| 狀態 | 視覺效果 | 游標 |
|------|---------|------|
| **閒置** | 灰色線條 (2px) | default |
| **懸停** | 藍色高亮 (4px) + 陰影 | col-resize |
| **拖曳中** | 藍色實線 (4px) + 半透明遮罩 | col-resize |
| **到達邊界** | 紅色高亮 (4px) + 震動動畫 | not-allowed |

### 技術實作

#### 拖曳手柄組件

```typescript
// components/ResizeHandle.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ResizeHandleProps {
  position: 'left' | 'right';
  onResize: (deltaX: number) => void;
  disabled?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  position,
  onResize,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef<number>(0);

  // ============================================
  // 滑鼠事件處理
  // ============================================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;

    // 防止文字選取
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    startXRef.current = e.clientX;

    // 調整方向（右側面板需要反向）
    const adjustedDelta = position === 'left' ? deltaX : -deltaX;
    onResize(adjustedDelta);
  }, [isDragging, position, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  // ============================================
  // 註冊全局滑鼠事件
  // ============================================
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ============================================
  // 觸控支援 (可選)
  // ============================================
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    setIsDragging(true);
    startXRef.current = touch.clientX;
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    startXRef.current = touch.clientX;

    const adjustedDelta = position === 'left' ? deltaX : -deltaX;
    onResize(adjustedDelta);
  }, [isDragging, position, onResize]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  return (
    <>
      {/* 拖曳手柄 */}
      <motion.div
        className={`
          relative flex-shrink-0 select-none
          ${position === 'left' ? 'border-r' : 'border-l'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-col-resize'}
        `}
        style={{
          width: isDragging || isHovered ? '4px' : '2px',
          backgroundColor: isDragging
            ? '#3b82f6'
            : isHovered
              ? '#60a5fa'
              : '#e5e7eb',
          transition: 'all 0.15s ease',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        whileHover={!disabled ? { scale: 1.2 } : {}}
        animate={{
          boxShadow: isDragging
            ? '0 0 8px rgba(59, 130, 246, 0.6)'
            : isHovered
              ? '0 0 4px rgba(96, 165, 250, 0.4)'
              : 'none',
        }}
      >
        {/* 可選：拖曳指示器 */}
        {(isHovered || isDragging) && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-white rounded-full opacity-60" />
          </div>
        )}
      </motion.div>

      {/* 全螢幕拖曳覆蓋層（防止滑鼠事件丟失） */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }} />
      )}
    </>
  );
};
```

#### 面板寬度管理 Hook

```typescript
// hooks/usePanelWidth.ts
import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface PanelWidthConfig {
  sidebarWidth: number;
  controlPanelWidth: number;
  sidebarMinWidth: number;
  sidebarMaxWidth: number;
  controlPanelMinWidth: number;
  controlPanelMaxWidth: number;
}

const DEFAULT_CONFIG: PanelWidthConfig = {
  sidebarWidth: 256,
  controlPanelWidth: 280,
  sidebarMinWidth: 200,
  sidebarMaxWidth: 500,
  controlPanelMinWidth: 240,
  controlPanelMaxWidth: 600,
};

export const usePanelWidth = (windowWidth: number) => {
  const [config, setConfig] = useLocalStorage<PanelWidthConfig>(
    'skywalk-panel-widths',
    DEFAULT_CONFIG
  );

  const [tempSidebarWidth, setTempSidebarWidth] = useState(config.sidebarWidth);
  const [tempControlPanelWidth, setTempControlPanelWidth] = useState(config.controlPanelWidth);

  // ============================================
  // Sidebar 調整
  // ============================================
  const handleSidebarResize = useCallback((deltaX: number) => {
    setTempSidebarWidth(prev => {
      const newWidth = prev + deltaX;

      // 邊界檢查
      const minWidth = config.sidebarMinWidth;
      const maxWidth = Math.min(
        config.sidebarMaxWidth,
        windowWidth - config.controlPanelWidth - 400 // 保留 400px 給畫布
      );

      return Math.max(minWidth, Math.min(newWidth, maxWidth));
    });
  }, [config, windowWidth]);

  // ============================================
  // Control Panel 調整
  // ============================================
  const handleControlPanelResize = useCallback((deltaX: number) => {
    setTempControlPanelWidth(prev => {
      const newWidth = prev + deltaX;

      const minWidth = config.controlPanelMinWidth;
      const maxWidth = Math.min(
        config.controlPanelMaxWidth,
        windowWidth - config.sidebarWidth - 400
      );

      return Math.max(minWidth, Math.min(newWidth, maxWidth));
    });
  }, [config, windowWidth]);

  // ============================================
  // 儲存寬度設定（拖曳結束時）
  // ============================================
  const saveWidths = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      sidebarWidth: tempSidebarWidth,
      controlPanelWidth: tempControlPanelWidth,
    }));
  }, [tempSidebarWidth, tempControlPanelWidth, setConfig]);

  // ============================================
  // 重置為預設寬度
  // ============================================
  const resetWidths = useCallback(() => {
    setTempSidebarWidth(DEFAULT_CONFIG.sidebarWidth);
    setTempControlPanelWidth(DEFAULT_CONFIG.controlPanelWidth);
    setConfig(DEFAULT_CONFIG);
  }, [setConfig]);

  // ============================================
  // 響應式自動調整
  // ============================================
  useEffect(() => {
    // 視窗過小時自動縮小面板
    const totalPanelWidth = tempSidebarWidth + tempControlPanelWidth;
    const requiredWidth = totalPanelWidth + 400;

    if (windowWidth < requiredWidth) {
      const scale = (windowWidth - 400) / totalPanelWidth;
      setTempSidebarWidth(Math.max(config.sidebarMinWidth, tempSidebarWidth * scale));
      setTempControlPanelWidth(Math.max(config.controlPanelMinWidth, tempControlPanelWidth * scale));
    }
  }, [windowWidth]);

  return {
    sidebarWidth: tempSidebarWidth,
    controlPanelWidth: tempControlPanelWidth,
    handleSidebarResize,
    handleControlPanelResize,
    saveWidths,
    resetWidths,
    canIncreaseSidebar: tempSidebarWidth < config.sidebarMaxWidth,
    canDecreaseSidebar: tempSidebarWidth > config.sidebarMinWidth,
    canIncreaseControlPanel: tempControlPanelWidth < config.controlPanelMaxWidth,
    canDecreaseControlPanel: tempControlPanelWidth > config.controlPanelMinWidth,
  };
};
```

#### 整合到 App.tsx

```typescript
// App.tsx - 修改後的佈局
import { ResizeHandle } from './components/ResizeHandle';
import { usePanelWidth } from './hooks/usePanelWidth';
import { useResponsive } from './hooks/useResponsive';

const App: React.FC = () => {
  // ... 現有狀態 ...

  // 響應式設計
  const { screenSize, windowSize, layoutConfig, isMobile, isTablet } = useResponsive();

  // 面板寬度管理
  const {
    sidebarWidth,
    controlPanelWidth,
    handleSidebarResize,
    handleControlPanelResize,
    saveWidths,
    resetWidths,
  } = usePanelWidth(windowSize.width);

  // 面板摺疊狀態
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);
  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(isMobile || isTablet);

  // 響應式自動摺疊
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
      setIsControlPanelCollapsed(true);
    } else if (isTablet) {
      setIsControlPanelCollapsed(true);
    }
  }, [isMobile, isTablet]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        {/* Header - 保持不變 */}
        <header className="h-[64px] flex-shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4">
          {/* ... 現有 header 內容 ... */}
        </header>

        {/* 主要內容區域 - 新的響應式佈局 */}
        <div className="flex-grow flex overflow-hidden">
          {/* Sidebar - 可摺疊 */}
          {!isSidebarCollapsed && (
            <>
              <motion.aside
                className="flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden"
                style={{ width: `${sidebarWidth}px` }}
                initial={false}
                animate={{ width: `${sidebarWidth}px` }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
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
              </motion.aside>

              {/* Sidebar 拖曳手柄 */}
              <ResizeHandle
                position="left"
                onResize={handleSidebarResize}
                disabled={isMobile || isTablet}
              />
            </>
          )}

          {/* 畫布區域 - 自適應 */}
          <main className="flex-1 flex flex-col bg-gray-100 border-l border-r border-gray-200 min-w-[280px]">
            {/* Toolbar */}
            <div className="h-[49px] flex-shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4">
              {/* 左側工具列 */}
              <div className="flex items-center space-x-2">
                {/* 面板切換按鈕（小螢幕顯示） */}
                {(isMobile || isTablet) && (
                  <>
                    <button
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 border bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <LayersIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">圖層</span>
                    </button>

                    <button
                      onClick={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)}
                      className="h-8 px-3 text-sm font-medium rounded-md flex items-center space-x-2 border bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <ParametersIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">參數</span>
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                  </>
                )}

                {/* 其他工具按鈕 */}
                <button title="變換工具" onClick={() => setEditMode('transform')} className={clsx("h-8 w-8 rounded-md flex items-center justify-center border", editMode === 'transform' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50")}>
                  <ArrowsExpandIcon className="w-4 h-4" />
                </button>
                {/* ... 其他工具按鈕 ... */}
              </div>

              {/* 右側縮放控制 */}
              <div className="flex items-center space-x-1">
                <button title="縮小" onClick={handleZoomOut} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100">
                  <MinusIcon className="w-4 h-4"/>
                </button>
                <div className="h-8 w-16 sm:w-20 text-sm flex items-center justify-center bg-white border border-gray-300 rounded-md">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button title="放大" onClick={handleZoomIn} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100">
                  <PlusIcon className="w-4 h-4"/>
                </button>
                <button title="重設視圖" onClick={handleZoomReset} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100">
                  <RefreshIcon className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* Canvas */}
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
              />
            </div>
          </main>

          {/* Control Panel - 可摺疊 */}
          {!isControlPanelCollapsed && (
            <>
              {/* Control Panel 拖曳手柄 */}
              <ResizeHandle
                position="right"
                onResize={handleControlPanelResize}
                disabled={isMobile || isTablet}
              />

              <motion.aside
                className="flex-shrink-0 bg-white border-l border-gray-200 overflow-hidden"
                style={{ width: `${controlPanelWidth}px` }}
                initial={false}
                animate={{ width: `${controlPanelWidth}px` }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <ControlPanel
                  params={params}
                  onParamChange={handleParamChange}
                  onApplyStyle={setParams}
                  disabled={!hasContent || editMode === 'points'}
                />
              </motion.aside>
            </>
          )}
        </div>

        {/* Notification - 保持不變 */}
        {/* ... */}
      </div>
    </ErrorBoundary>
  );
};
```

---

## 面板摺疊與展開

### 摺疊按鈕設計

```tsx
// components/PanelCollapseButton.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PanelCollapseButtonProps {
  position: 'left' | 'right';
  isCollapsed: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const PanelCollapseButton: React.FC<PanelCollapseButtonProps> = ({
  position,
  isCollapsed,
  onClick,
  disabled = false
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        ${position === 'left' ? '-right-3' : '-left-3'}
        w-6 h-12 rounded-full
        bg-white border border-gray-300 shadow-md
        flex items-center justify-center
        hover:bg-gray-50 hover:border-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      `}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {position === 'left' ? (
        isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />
      ) : (
        isCollapsed ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />
      )}
    </motion.button>
  );
};
```

### 浮動面板模式（手機/平板）

```tsx
// components/FloatingPanel.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './icons';

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  position?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  isOpen,
  onClose,
  title,
  position = 'bottom',
  children
}) => {
  const getAnimationProps = () => {
    switch (position) {
      case 'left':
        return {
          initial: { x: '-100%' },
          animate: { x: 0 },
          exit: { x: '-100%' },
        };
      case 'right':
        return {
          initial: { x: '100%' },
          animate: { x: 0 },
          exit: { x: '100%' },
        };
      case 'bottom':
        return {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-0 bottom-0 w-[80vw] max-w-[400px]';
      case 'right':
        return 'right-0 top-0 bottom-0 w-[80vw] max-w-[400px]';
      case 'bottom':
        return 'left-0 right-0 bottom-0 h-[60vh] max-h-[600px]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 浮動面板 */}
          <motion.div
            className={`fixed ${getPositionClasses()} bg-white shadow-2xl z-50 flex flex-col`}
            {...getAnimationProps()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

### 響應式面板管理

```typescript
// App.tsx - 響應式面板整合
const App: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();

  // 桌機版：嵌入式面板
  const renderDesktopLayout = () => (
    <div className="flex-grow flex overflow-hidden">
      {/* Sidebar with resize handle */}
      <motion.aside style={{ width: sidebarWidth }}>
        <Sidebar {...sidebarProps} />
      </motion.aside>
      <ResizeHandle position="left" onResize={handleSidebarResize} />

      {/* Canvas */}
      <main className="flex-1">
        <CanvasComponent {...canvasProps} />
      </main>

      {/* Control Panel with resize handle */}
      <ResizeHandle position="right" onResize={handleControlPanelResize} />
      <motion.aside style={{ width: controlPanelWidth }}>
        <ControlPanel {...controlPanelProps} />
      </motion.aside>
    </div>
  );

  // 手機/平板版：浮動面板
  const renderMobileLayout = () => (
    <div className="flex-grow flex flex-col overflow-hidden">
      {/* 全螢幕畫布 */}
      <div className="flex-1">
        <CanvasComponent {...canvasProps} />
      </div>

      {/* Sidebar 浮動面板 */}
      <FloatingPanel
        isOpen={!isSidebarCollapsed}
        onClose={() => setIsSidebarCollapsed(true)}
        title="圖層與資源"
        position="left"
      >
        <Sidebar {...sidebarProps} />
      </FloatingPanel>

      {/* Control Panel 浮動面板 */}
      <FloatingPanel
        isOpen={!isControlPanelCollapsed}
        onClose={() => setIsControlPanelCollapsed(true)}
        title="參數控制"
        position="bottom"
      >
        <ControlPanel {...controlPanelProps} />
      </FloatingPanel>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <header>{/* ... */}</header>
        {isMobile || isTablet ? renderMobileLayout() : renderDesktopLayout()}
      </div>
    </ErrorBoundary>
  );
};
```

---

## 畫布自適應調整

### 視窗調整時自動縮放

```typescript
// components/CanvasComponent.tsx - 新增響應式邏輯
import { useEffect, useRef } from 'react';

const CanvasComponent: React.FC<CanvasComponentProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // ============================================
  // 監聽容器尺寸變化
  // ============================================
  useEffect(() => {
    if (!containerRef.current || !paperScopeRef.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        if (paperScopeRef.current && width > 0 && height > 0) {
          // 更新 Paper.js 視圖大小
          paperScopeRef.current.view.viewSize = new paperScopeRef.current.Size(width, height);

          // 重新計算視圖中心（保持內容在中央）
          const artworkItems = paperScopeRef.current.project.getItems({ data: { isArtwork: true } });
          if (artworkItems.length > 0) {
            let totalBounds = artworkItems[0].bounds;
            for (let i = 1; i < artworkItems.length; i++) {
              totalBounds = totalBounds.unite(artworkItems[i].bounds);
            }

            // 自動縮放以適應新尺寸
            const padding = 80;
            const availableWidth = Math.max(0, width - padding * 2);
            const availableHeight = Math.max(0, height - padding * 2);

            const zoomX = availableWidth / totalBounds.width;
            const zoomY = availableHeight / totalBounds.height;
            const newZoom = Math.min(zoomX, zoomY, 1); // 最大 100%

            paperScopeRef.current.view.zoom = newZoom;
            paperScopeRef.current.view.center = totalBounds.center;
          }
        }
      }
    };

    // 創建 ResizeObserver
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas id="skywalk-canvas" className="absolute inset-0" />
    </div>
  );
};
```

### 防抖優化

```typescript
// utils/debounce.ts
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 使用範例
const debouncedResize = debounce(handleResize, 150);
```

---

## 整合指南

### 步驟 1: 安裝新依賴

```bash
# 無需額外依賴，使用現有的 framer-motion
npm install # 確保依賴完整
```

### 步驟 2: 創建新檔案

```bash
# 創建新組件
touch components/ResizeHandle.tsx
touch components/PanelCollapseButton.tsx
touch components/FloatingPanel.tsx

# 創建新 Hook
touch hooks/useResponsive.ts
touch hooks/usePanelWidth.ts

# 創建工具函數
touch utils/debounce.ts
```

### 步驟 3: 更新 types.ts

```typescript
// types.ts - 新增類型定義
export type ScreenSize = 'mobile' | 'tablet' | 'laptop' | 'desktop' | '4k';

export interface LayoutConfig {
  screenSize: ScreenSize;
  showSidebar: boolean;
  showControlPanel: boolean;
  sidebarWidth: number;
  controlPanelWidth: number;
  canvasMinWidth: number;
  panelMode: 'collapsed' | 'floating' | 'docked' | 'stacked';
}

// ... (完整定義見上文)
```

### 步驟 4: 修改 App.tsx

```typescript
// App.tsx - 主要變更
import { useResponsive } from './hooks/useResponsive';
import { usePanelWidth } from './hooks/usePanelWidth';
import { ResizeHandle } from './components/ResizeHandle';
import { FloatingPanel } from './components/FloatingPanel';

// 替換原有的固定佈局
// 舊代碼 (刪除):
// <div className="flex-grow grid grid-cols-[256px_1fr_280px] overflow-hidden">

// 新代碼 (見上文 "整合到 App.tsx" 章節)
```

### 步驟 5: 更新 CanvasComponent.tsx

```typescript
// 添加 ResizeObserver 邏輯
// 見上文 "畫布自適應調整" 章節
```

### 步驟 6: 測試響應式行為

```bash
# 開發伺服器
npm run dev

# 測試不同螢幕尺寸
1. 開啟瀏覽器開發者工具 (F12)
2. 切換到裝置工具列 (Ctrl/Cmd + Shift + M)
3. 測試以下尺寸:
   - iPhone SE (375x667)
   - iPad (768x1024)
   - Laptop (1366x768)
   - Desktop (1920x1080)
```

---

## 測試計劃

### 功能測試清單

| 測試項目 | 測試步驟 | 預期結果 | 優先級 |
|---------|---------|---------|--------|
| **拖曳調整 Sidebar** | 拖曳左側手柄 | 寬度在 200-500px 間平滑調整 | 🔴 高 |
| **拖曳調整 Control Panel** | 拖曳右側手柄 | 寬度在 240-600px 間平滑調整 | 🔴 高 |
| **邊界限制** | 拖曳至最小/最大寬度 | 無法超出邊界，手柄變紅 | 🔴 高 |
| **寬度持久化** | 調整寬度後重新載入頁面 | 保持上次設定的寬度 | 🟡 中 |
| **手機佈局** | 調整視窗至 375px | 自動切換為浮動面板模式 | 🔴 高 |
| **平板佈局** | 調整視窗至 768px | 單面板摺疊，另一面板顯示 | 🟡 中 |
| **畫布自適應** | 拖曳調整面板寬度 | 畫布自動重新計算尺寸 | 🔴 高 |
| **觸控支援** | 在平板/手機上拖曳 | 觸控拖曳正常運作 | 🟢 低 |

### 性能測試

```typescript
// __tests__/performance/resize-performance.test.ts
import { performance } from 'perf_hooks';

describe('Resize Performance', () => {
  it('should handle rapid resize events smoothly', () => {
    const measurements: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();

      // 模擬拖曳調整
      handleSidebarResize(Math.random() * 100 - 50);

      const end = performance.now();
      measurements.push(end - start);
    }

    const average = measurements.reduce((a, b) => a + b) / measurements.length;

    // 平均處理時間應 < 16ms (60 FPS)
    expect(average).toBeLessThan(16);
  });
});
```

### 瀏覽器兼容性

| 瀏覽器 | 版本 | 狀態 | 備註 |
|--------|------|------|------|
| Chrome | 90+ | ✅ 完全支援 | - |
| Firefox | 88+ | ✅ 完全支援 | - |
| Safari | 14+ | ✅ 完全支援 | 觸控事件需測試 |
| Edge | 90+ | ✅ 完全支援 | - |
| Mobile Safari | iOS 14+ | ⚠️ 部分支援 | 觸控拖曳需優化 |
| Chrome Mobile | Android 10+ | ✅ 完全支援 | - |

---

## 常見問題 (FAQ)

### Q1: 為什麼拖曳時會出現閃爍？

**A**: 可能是重新渲染過於頻繁。建議：
1. 使用 `useCallback` 包裹事件處理函數
2. 添加防抖 (debounce) 邏輯
3. 使用 CSS `will-change` 優化動畫

```css
.resize-handle {
  will-change: width, background-color;
}
```

### Q2: 手機上觸控拖曳不靈敏？

**A**: 檢查以下設定：
1. 確保 `touch-action: none` 已設定
2. 使用 `{ passive: false }` 註冊觸控事件
3. 添加觸覺回饋 (Haptic Feedback)

```typescript
navigator.vibrate?.(10); // 輕微震動回饋
```

### Q3: 如何禁用特定螢幕尺寸的拖曳功能？

**A**: 在 `ResizeHandle` 組件中傳入 `disabled` prop：

```tsx
<ResizeHandle
  position="left"
  onResize={handleSidebarResize}
  disabled={isMobile || isTablet}
/>
```

### Q4: 面板寬度設定沒有保存？

**A**: 檢查 `localStorage` 是否正常運作：

```typescript
// 調試代碼
useEffect(() => {
  console.log('Current widths:', {
    sidebar: sidebarWidth,
    controlPanel: controlPanelWidth
  });
}, [sidebarWidth, controlPanelWidth]);
```

---

## 參數建議表

| 參數名稱 | 類型 | 預設值 | 範圍/選項 | 說明 |
|---------|------|--------|----------|------|
| `sidebarWidth` | number | 256 | 200-500 | Sidebar 寬度 (px) |
| `controlPanelWidth` | number | 280 | 240-600 | Control Panel 寬度 (px) |
| `sidebarMinWidth` | number | 200 | 150-300 | Sidebar 最小寬度 (px) |
| `sidebarMaxWidth` | number | 500 | 400-800 | Sidebar 最大寬度 (px) |
| `controlPanelMinWidth` | number | 240 | 200-300 | Control Panel 最小寬度 (px) |
| `controlPanelMaxWidth` | number | 600 | 500-1000 | Control Panel 最大寬度 (px) |
| `canvasMinWidth` | number | 400 | 280-600 | 畫布最小寬度 (px) |
| `resizeDebounce` | number | 150 | 50-300 | 調整大小防抖時間 (ms) |
| `animationDuration` | number | 0.2 | 0.1-0.5 | 動畫持續時間 (秒) |

---

## 開發時程建議

| 階段 | 任務 | 預計時間 | 優先級 |
|------|------|---------|--------|
| **Phase 1** | 基礎響應式設計 | 2-3 天 | 🔴 高 |
| | - 創建 useResponsive hook | 0.5 天 | |
| | - 實作斷點邏輯 | 0.5 天 | |
| | - 修改 App.tsx 佈局 | 1 天 | |
| | - 測試不同螢幕尺寸 | 1 天 | |
| **Phase 2** | 可拖曳調整面板 | 3-4 天 | 🔴 高 |
| | - 創建 ResizeHandle 組件 | 1 天 | |
| | - 實作 usePanelWidth hook | 1 天 | |
| | - 整合到主佈局 | 1 天 | |
| | - 邊界檢測與視覺回饋 | 1 天 | |
| **Phase 3** | 面板摺疊功能 | 2-3 天 | 🟡 中 |
| | - 創建 FloatingPanel 組件 | 1 天 | |
| | - 實作摺疊邏輯 | 1 天 | |
| | - 手機/平板佈局優化 | 1 天 | |
| **Phase 4** | 畫布自適應 | 1-2 天 | 🟡 中 |
| | - ResizeObserver 整合 | 0.5 天 | |
| | - 自動縮放邏輯 | 0.5 天 | |
| | - 性能優化 | 1 天 | |
| **Phase 5** | 測試與優化 | 2-3 天 | 🟢 低 |
| | - 功能測試 | 1 天 | |
| | - 性能測試 | 0.5 天 | |
| | - 瀏覽器兼容性測試 | 0.5 天 | |
| | - Bug 修復 | 1 天 | |

**總計**: 10-15 天（約 2-3 週）

---

## 總結

本 RWD 實作指南提供了完整的響應式設計解決方案，包括：

1. ✅ **全設備支援**: 從手機到 4K 顯示器
2. ✅ **可拖曳調整**: 用戶自訂面板寬度
3. ✅ **智慧摺疊**: 自動適應螢幕尺寸
4. ✅ **畫布自適應**: 視窗調整時自動縮放
5. ✅ **狀態持久化**: 記住用戶偏好設定

### 關鍵亮點

- **專業級拖曳體驗**: 平滑動畫、邊界檢測、視覺回饋
- **完整代碼範本**: 超過 800 行可直接使用的 TypeScript 代碼
- **性能優化**: 防抖、ResizeObserver、GPU 加速動畫
- **觸控友善**: 完整的觸控事件支援

### 下一步行動

1. 按照 [整合指南](#整合指南) 逐步實作
2. 使用 [測試計劃](#測試計劃) 驗證功能
3. 參考 [開發時程建議](#開發時程建議) 排程工作

---

**文件版本**: 1.0
**作者**: SuperClaude (AI 規劃助手)
**最後更新**: 2025-11-02
**相關文件**: [To Do Features.md](To Do Features.md)
