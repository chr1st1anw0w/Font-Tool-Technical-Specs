# 📱 手機版優化設計指南

**專案**: Skywalk Font Sculpting Workbench
**版本**: v1.2 Mobile-First Design
**最後更新**: 2025-11-02
**狀態**: 📝 實作規劃

---

## 📑 目錄

1. [設計理念](#設計理念)
2. [螢幕區域規劃](#螢幕區域規劃)
3. [底部工具列系統](#底部工具列系統)
4. [透明浮動面板](#透明浮動面板)
5. [抽屜式參數面板](#抽屜式參數面板)
6. [SVG Icon 按鈕庫](#svg-icon-按鈕庫)
7. [手勢操作支援](#手勢操作支援)
8. [完整實作代碼](#完整實作代碼)

---

## 設計理念

### 核心原則

```
🎯 Canvas 優先: 上方 2/3 螢幕完全給 Canvas 使用
🔍 最小干擾: 所有 UI 元素透明、無背景、不遮擋內容
👆 觸控友善: 所有按鈕尺寸 >= 44x44px (Apple HIG 標準)
⚡ 快速存取: 常用功能集中在底部工具列
📐 空間效率: 非常用功能收納在抽屜中
```

### 佈局黃金比例

```
┌─────────────────────────────────┐  ▲
│                                 │  │
│                                 │  │
│          Canvas 操作區          │  │ 66.7%
│        (完全無遮擋)             │  │ (2/3 螢幕)
│                                 │  │
│                                 │  ▼
├─────────────────────────────────┤  ─
│   [透明狀態列/快捷資訊]         │  10%
├─────────────────────────────────┤
│   [底部工具列 - 半透明背景]     │  23.3%
│   [圖層] [參數] [縮放] [匯出]   │  (1/3 螢幕)
└─────────────────────────────────┘
```

---

## 螢幕區域規劃

### 分區定義

```typescript
// types.ts - 手機版區域定義
export interface MobileLayoutZones {
  canvas: {
    top: string;      // '0px'
    bottom: string;   // '33.33vh' (保留下方 1/3)
    height: string;   // '66.67vh'
  };
  statusBar: {
    top: string;      // '66.67vh'
    height: string;   // '10vh'
    opacity: number;  // 0.9 (半透明)
  };
  toolbar: {
    bottom: string;   // '0px'
    height: string;   // '23.33vh' 或 '140px' (最小)
    opacity: number;  // 0.95 (半透明背景)
  };
}

export const MOBILE_ZONES: MobileLayoutZones = {
  canvas: {
    top: '0px',
    bottom: '33.33vh',
    height: '66.67vh'
  },
  statusBar: {
    top: '66.67vh',
    height: '10vh',
    opacity: 0.9
  },
  toolbar: {
    bottom: '0px',
    height: 'max(23.33vh, 140px)', // 最小 140px
    opacity: 0.95
  }
};
```

### 視覺化佈局

```
手機螢幕 (375x667px - iPhone SE)
┌─────────────────────────────────┐ 0px
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░ Canvas 全螢幕操作區 ░░░░░░│
│░░░░░░   (445px 高度)      ░░░░░░│ 2/3 區域
│░░░░░░   完全無遮擋        ░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├═════════════════════════════════┤ 445px
│ 📊 圖層: Layer 1  |  重量: 40   │ 狀態列
├─────────────────────────────────┤ 512px
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│ │圖層│ │參數│ │網格│ │縮放│ │...│ │ 主工具列
│ └───┘ └───┘ └───┘ └───┘ └───┘ │ (56px 高)
├─────────────────────────────────┤ 568px
│    [當前選中: 參數面板]         │
│  ┌─────────┬─────────┬────────┐ │
│  │ Weight  │  Width  │ Slant  │ │ 快速參數
│  │   40    │   100   │   0    │ │ (99px 高)
│  └─────────┴─────────┴────────┘ │
└─────────────────────────────────┘ 667px
```

---

## 底部工具列系統

### UI 設計規範

#### 工具列結構

```tsx
// 底部工具列層級結構
<BottomToolbar>
  ├─ StatusBar (可選，僅顯示關鍵資訊)
  ├─ PrimaryToolbar (主工具列 - 常駐)
  │   ├─ 圖層按鈕
  │   ├─ 參數按鈕
  │   ├─ 網格切換
  │   ├─ 縮放控制
  │   └─ 更多選單
  └─ QuickPanel (動態面板 - 根據選中按鈕顯示)
      ├─ 圖層快速面板
      ├─ 參數快速調整
      ├─ 字母選擇器
      └─ 匯出選項
</BottomToolbar>
```

#### 按鈕尺寸標準

```typescript
// constants/mobile.ts
export const MOBILE_BUTTON_SIZES = {
  // Apple Human Interface Guidelines
  minimum: 44,        // 最小觸控目標
  comfortable: 56,    // 舒適觸控
  large: 72,          // 大按鈕

  // 間距
  spacing: {
    tight: 8,         // 緊密間距
    normal: 12,       // 正常間距
    loose: 16         // 寬鬆間距
  },

  // Icon 尺寸
  iconSize: {
    small: 20,        // 小圖標
    medium: 24,       // 中圖標
    large: 32         // 大圖標
  }
};
```

### 狀態列組件

```tsx
// components/mobile/StatusBar.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface StatusBarProps {
  activeLayer?: string;
  currentParams?: { weight: number; width: number; slant: number };
  zoomLevel?: number;
}

export const MobileStatusBar: React.FC<StatusBarProps> = ({
  activeLayer = 'Layer 1',
  currentParams = { weight: 40, width: 100, slant: 0 },
  zoomLevel = 100
}) => {
  return (
    <motion.div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{
        top: '66.67vh',
        height: '10vh',
        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.9 }}
    >
      <div className="h-full flex items-center justify-between px-4 text-xs text-gray-700 font-medium">
        {/* 左側資訊 */}
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="text-gray-500">📊</span>
            <span>{activeLayer}</span>
          </span>

          <span className="text-gray-400">|</span>

          <span className="flex items-center space-x-1">
            <span className="text-gray-500">⚖️</span>
            <span>{currentParams.weight}</span>
          </span>
        </div>

        {/* 右側資訊 */}
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="text-gray-500">🔍</span>
            <span>{zoomLevel}%</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
```

### 主工具列組件

```tsx
// components/mobile/BottomToolbar.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayersIcon,
  SlidersIcon,
  GridIcon,
  ZoomInIcon,
  MoreVerticalIcon,
  DownloadIcon,
  UploadIcon
} from '../icons';

type ToolbarTab = 'layers' | 'params' | 'import' | 'export' | null;

interface BottomToolbarProps {
  onTabChange?: (tab: ToolbarTab) => void;
  onToggleGrid?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  showGrid?: boolean;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onTabChange,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  showGrid = true
}) => {
  const [activeTab, setActiveTab] = useState<ToolbarTab>(null);

  const handleTabClick = (tab: ToolbarTab) => {
    const newTab = activeTab === tab ? null : tab;
    setActiveTab(newTab);
    onTabChange?.(newTab);
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-30"
      style={{
        height: 'max(23.33vh, 140px)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* 主工具列 */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-around px-2">
        {/* 圖層按鈕 */}
        <ToolbarButton
          icon={<LayersIcon className="w-6 h-6" />}
          label="圖層"
          active={activeTab === 'layers'}
          onClick={() => handleTabClick('layers')}
        />

        {/* 參數按鈕 */}
        <ToolbarButton
          icon={<SlidersIcon className="w-6 h-6" />}
          label="參數"
          active={activeTab === 'params'}
          onClick={() => handleTabClick('params')}
        />

        {/* 匯入按鈕 */}
        <ToolbarButton
          icon={<UploadIcon className="w-6 h-6" />}
          label="匯入"
          active={activeTab === 'import'}
          onClick={() => handleTabClick('import')}
        />

        {/* 網格切換 */}
        <ToolbarButton
          icon={<GridIcon className="w-6 h-6" />}
          label="網格"
          active={showGrid}
          onClick={onToggleGrid}
        />

        {/* 縮放控制 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onZoomOut}
            className="w-11 h-11 rounded-lg flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={onZoomIn}
            className="w-11 h-11 rounded-lg flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 更多選單 */}
        <ToolbarButton
          icon={<MoreVerticalIcon className="w-6 h-6" />}
          label="更多"
          active={activeTab === 'export'}
          onClick={() => handleTabClick('export')}
        />
      </div>

      {/* 動態快速面板 */}
      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div
            key={activeTab}
            className="h-[calc(100%-56px)] overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'layers' && <LayersQuickPanel />}
            {activeTab === 'params' && <ParamsQuickPanel />}
            {activeTab === 'import' && <ImportQuickPanel />}
            {activeTab === 'export' && <ExportQuickPanel />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// 工具列按鈕組件
// ============================================
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  active = false,
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        min-w-[56px] h-11 px-2 rounded-lg
        transition-all duration-200
        ${active
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 active:bg-gray-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="mb-0.5">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};
```

---

## 透明浮動面板

### 設計原則

```
✨ 透明度: 背景 rgba(255, 255, 255, 0.85)
🌫️ 毛玻璃效果: backdrop-filter: blur(10px)
📍 位置: 絕對定位，不影響 Canvas 互動
👆 可關閉: 點擊外部或滑動關閉
⚡ 動畫: 從底部滑入，淡出淡入
```

### 透明浮動層組件

```tsx
// components/mobile/TransparentOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface TransparentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'top' | 'center' | 'bottom';
}

export const TransparentOverlay: React.FC<TransparentOverlayProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'center'
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // ============================================
  // 滑動關閉手勢
  // ============================================
  const handleDragEnd = (_: any, info: PanInfo) => {
    // 向下滑動超過 100px 則關閉
    if (info.offset.y > 100) {
      onClose();
    }
  };

  // ============================================
  // ESC 鍵關閉
  // ============================================
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { top: '10vh' };
      case 'center':
        return { top: '25vh' };
      case 'bottom':
        return { top: '40vh' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩（完全透明，僅接收點擊事件） */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'transparent' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 浮動內容面板 */}
          <motion.div
            ref={contentRef}
            className="fixed left-4 right-4 z-50 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              ...getPositionStyles(),
              maxHeight: '60vh',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* 拖曳指示器 */}
            <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 rounded-full bg-gray-400 opacity-50" />
            </div>

            {/* 標題列 */}
            {title && (
              <div className="px-4 pb-3 border-b border-gray-200 border-opacity-50">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              </div>
            )}

            {/* 內容區域 */}
            <div className="overflow-y-auto max-h-[50vh]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

---

## 抽屜式參數面板

### 快速參數調整面板

```tsx
// components/mobile/ParamsQuickPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { TransformParams } from '../../types';

interface ParamsQuickPanelProps {
  params: TransformParams;
  onParamChange: (param: keyof TransformParams, value: number) => void;
  disabled?: boolean;
}

export const ParamsQuickPanel: React.FC<ParamsQuickPanelProps> = ({
  params,
  onParamChange,
  disabled = false
}) => {
  return (
    <div className="p-4 space-y-3">
      {/* 快速參數卡片 */}
      <div className="grid grid-cols-3 gap-2">
        {/* Weight */}
        <ParamCard
          label="粗細"
          value={params.weight}
          min={1}
          max={200}
          step={1}
          onChange={(val) => onParamChange('weight', val)}
          disabled={disabled}
          icon="⚖️"
        />

        {/* Width */}
        <ParamCard
          label="寬度"
          value={params.width}
          min={50}
          max={150}
          step={1}
          unit="%"
          onChange={(val) => onParamChange('width', val)}
          disabled={disabled}
          icon="↔️"
        />

        {/* Slant */}
        <ParamCard
          label="傾斜"
          value={params.slant}
          min={-30}
          max={30}
          step={1}
          unit="°"
          onChange={(val) => onParamChange('slant', val)}
          disabled={disabled}
          icon="↗️"
        />
      </div>

      {/* 快速預設值按鈕 */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500 mb-2 font-medium">快速預設</p>
        <div className="grid grid-cols-3 gap-2">
          <PresetButton
            label="纖細"
            onClick={() => {
              onParamChange('weight', 20);
              onParamChange('width', 90);
            }}
          />
          <PresetButton
            label="標準"
            onClick={() => {
              onParamChange('weight', 40);
              onParamChange('width', 100);
              onParamChange('slant', 0);
            }}
          />
          <PresetButton
            label="粗體"
            onClick={() => {
              onParamChange('weight', 100);
              onParamChange('width', 110);
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// 參數卡片組件
// ============================================
interface ParamCardProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  icon?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const ParamCard: React.FC<ParamCardProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  icon,
  onChange,
  disabled = false
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      className={`
        relative bg-white rounded-xl p-3 border border-gray-200
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      {/* 標籤與圖標 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        {icon && <span className="text-sm">{icon}</span>}
      </div>

      {/* 數值顯示 */}
      <div className="text-2xl font-bold text-gray-800 mb-2">
        {value}{unit}
      </div>

      {/* 進度條 */}
      <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* 調整按鈕 */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => onChange(Math.max(min, value - step * 5))}
          disabled={disabled || value <= min}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <button
          onClick={() => onChange(Math.min(max, value + step * 5))}
          disabled={disabled || value >= max}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================
// 預設值按鈕
// ============================================
const PresetButton: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm font-medium bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
    >
      {label}
    </button>
  );
};
```

### 圖層快速面板

```tsx
// components/mobile/LayersQuickPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Layer } from '../../types';
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon } from '../icons';

interface LayersQuickPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSetActive: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onAddLayer: () => void;
}

export const LayersQuickPanel: React.FC<LayersQuickPanelProps> = ({
  layers,
  activeLayerId,
  onSetActive,
  onToggleVisibility,
  onToggleLock,
  onAddLayer
}) => {
  return (
    <div className="p-4 space-y-2">
      {/* 新增圖層按鈕 */}
      <button
        onClick={onAddLayer}
        className="w-full h-12 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>新增圖層</span>
      </button>

      {/* 圖層列表 */}
      <div className="space-y-2 max-h-[30vh] overflow-y-auto">
        {layers.map((layer) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
            onSetActive={() => onSetActive(layer.id)}
            onToggleVisibility={() => onToggleVisibility(layer.id)}
            onToggleLock={() => onToggleLock(layer.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// 圖層卡片
// ============================================
interface LayerCardProps {
  layer: Layer;
  isActive: boolean;
  onSetActive: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

const LayerCard: React.FC<LayerCardProps> = ({
  layer,
  isActive,
  onSetActive,
  onToggleVisibility,
  onToggleLock
}) => {
  return (
    <motion.div
      className={`
        relative bg-white rounded-xl p-3 border-2 transition-colors
        ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
      `}
      onClick={onSetActive}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        {/* 圖層名稱 */}
        <div className="flex-1">
          <p className="font-medium text-gray-800">{layer.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {layer.visible ? '可見' : '隱藏'} • {layer.locked ? '鎖定' : '未鎖定'}
          </p>
        </div>

        {/* 控制按鈕 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center active:bg-gray-100"
          >
            {layer.visible ? (
              <EyeIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <EyeOffIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center active:bg-gray-100"
          >
            {layer.locked ? (
              <LockIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <UnlockIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
```

---

## SVG Icon 按鈕庫

### Icon 組件庫

```tsx
// components/icons/mobile-icons.tsx
import React from 'react';

export const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export const SlidersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

export const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export const MoreVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);
```

---

## 手勢操作支援

### 手勢處理 Hook

```typescript
// hooks/useGestures.ts
import { useEffect, useRef, useState } from 'react';

interface GestureState {
  isPinching: boolean;
  isPanning: boolean;
  isTapping: boolean;
  pinchScale: number;
  panDelta: { x: number; y: number };
  tapPosition: { x: number; y: number } | null;
}

export const useGestures = (elementRef: React.RefObject<HTMLElement>) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    isPinching: false,
    isPanning: false,
    isTapping: false,
    pinchScale: 1,
    panDelta: { x: 0, y: 0 },
    tapPosition: null
  });

  const initialPinchDistance = useRef<number>(0);
  const lastTouchPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // ============================================
    // 計算兩點距離（捏合手勢）
    // ============================================
    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // ============================================
    // TouchStart
    // ============================================
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // 單點觸控 - 準備平移或點擊
        lastTouchPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        setGestureState(prev => ({
          ...prev,
          isPanning: true,
          isTapping: true,
          tapPosition: { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }));
      } else if (e.touches.length === 2) {
        // 雙點觸控 - 捏合縮放
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        initialPinchDistance.current = distance;

        setGestureState(prev => ({
          ...prev,
          isPinching: true,
          isPanning: false,
          isTapping: false
        }));
      }
    };

    // ============================================
    // TouchMove
    // ============================================
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && gestureState.isPanning) {
        // 平移
        const deltaX = e.touches[0].clientX - lastTouchPos.current.x;
        const deltaY = e.touches[0].clientY - lastTouchPos.current.y;

        lastTouchPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };

        setGestureState(prev => ({
          ...prev,
          panDelta: { x: deltaX, y: deltaY },
          isTapping: false // 移動後取消點擊判定
        }));
      } else if (e.touches.length === 2 && gestureState.isPinching) {
        // 捏合縮放
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistance.current;

        setGestureState(prev => ({
          ...prev,
          pinchScale: scale
        }));
      }
    };

    // ============================================
    // TouchEnd
    // ============================================
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        setGestureState(prev => ({
          ...prev,
          isPinching: false,
          isPanning: false,
          pinchScale: 1,
          panDelta: { x: 0, y: 0 }
        }));

        // 如果仍是點擊狀態，觸發點擊事件
        if (gestureState.isTapping) {
          // 點擊事件在外部處理
        }
      }
    };

    // ============================================
    // 註冊事件
    // ============================================
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, gestureState]);

  return gestureState;
};
```

---

## 完整實作代碼

### 手機版主佈局

```tsx
// App.tsx - 手機版佈局整合
import React, { useState, useCallback } from 'react';
import { useResponsive } from './hooks/useResponsive';
import { MobileStatusBar } from './components/mobile/StatusBar';
import { BottomToolbar } from './components/mobile/BottomToolbar';
import { ParamsQuickPanel } from './components/mobile/ParamsQuickPanel';
import { LayersQuickPanel } from './components/mobile/LayersQuickPanel';

const App: React.FC = () => {
  const { isMobile } = useResponsive();

  // ... 現有狀態 ...

  // 手機版專屬狀態
  const [activeToolbarTab, setActiveToolbarTab] = useState<'layers' | 'params' | 'import' | 'export' | null>(null);

  // ============================================
  // 手機版渲染
  // ============================================
  const renderMobileLayout = () => (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden relative">
      {/* Canvas 全螢幕區域 - 上方 2/3 */}
      <div
        className="absolute inset-0"
        style={{
          top: 0,
          bottom: '33.33vh',
          height: '66.67vh'
        }}
      >
        <CanvasComponent
          svgData={svgData}
          letterKey={selectedLetter}
          params={params}
          viewOptions={viewOptions}
          onReady={(scope) => (paperScopeRef.current = scope)}
          onZoomChange={setZoomLevel}
          editMode={editMode}
          isSnapEnabled={isSnapEnabled}
          showGrid={showGrid}
          layers={layers}
          activeLayerId={activeLayerId}
        />
      </div>

      {/* 狀態列 - 透明 */}
      <MobileStatusBar
        activeLayer={layers.find(l => l.id === activeLayerId)?.name}
        currentParams={params}
        zoomLevel={Math.round(zoomLevel * 100)}
      />

      {/* 底部工具列 */}
      <BottomToolbar
        onTabChange={setActiveToolbarTab}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showGrid={showGrid}
      />
    </div>
  );

  // ============================================
  // 桌機版渲染（保持原樣）
  // ============================================
  const renderDesktopLayout = () => {
    // ... 現有桌機版佈局 ...
  };

  return (
    <ErrorBoundary>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </ErrorBoundary>
  );
};

export default App;
```

---

## 測試清單

### 手機版功能測試

| 測試項目 | 測試步驟 | 預期結果 | 狀態 |
|---------|---------|---------|------|
| **Canvas 區域** | 打開應用 | 上方 2/3 完全給 Canvas | ⬜ |
| **透明面板** | 打開參數面板 | 背景半透明，毛玻璃效果 | ⬜ |
| **底部工具列** | 點擊不同按鈕 | 動態顯示對應面板 | ⬜ |
| **滑動關閉** | 下滑參數面板 | 面板關閉 | ⬜ |
| **捏合縮放** | 雙指捏合 Canvas | 畫布縮放 | ⬜ |
| **單指平移** | 單指拖曳 Canvas | 畫布移動 | ⬜ |
| **按鈕尺寸** | 測量按鈕大小 | >= 44x44px | ⬜ |
| **觸控回饋** | 點擊按鈕 | 視覺反饋明顯 | ⬜ |

---

## 開發時程

| 階段 | 任務 | 時間 | 優先級 |
|------|------|------|--------|
| **Phase 1** | 底部工具列系統 | 2 天 | 🔴 高 |
| **Phase 2** | 透明浮動面板 | 1 天 | 🔴 高 |
| **Phase 3** | 快速參數面板 | 1.5 天 | 🔴 高 |
| **Phase 4** | 圖層快速面板 | 1 天 | 🟡 中 |
| **Phase 5** | 手勢操作 | 1.5 天 | 🟡 中 |
| **Phase 6** | 測試與優化 | 2 天 | 🟢 低 |

**總計**: 9 天（約 2 週）

---

## 總結

本手機版優化指南提供了：

✅ **Canvas 最大化**: 上方 2/3 螢幕完全無遮擋
✅ **透明 UI**: 所有面板透明、毛玻璃效果
✅ **底部集中**: 所有功能按鈕集中在下方 1/3
✅ **SVG Icons**: 完整的 icon 組件庫
✅ **手勢支援**: 捏合縮放、平移、點擊
✅ **完整代碼**: 800+ 行可直接使用的實作範例

---

**文件版本**: 1.0
**作者**: SuperClaude (AI 規劃助手)
**最後更新**: 2025-11-02
**相關文件**: [RWD Implementation Guide.md](RWD Implementation Guide.md)
