# 📋 To Do Features - 專業向量編輯功能規劃

**專案**: Skywalk Font Sculpting Workbench
**版本**: v1.2 規劃文件
**最後更新**: 2025-11-02
**狀態**: 📝 規劃階段

---

## 📑 目錄

1. [概述](#概述)
2. [鋼筆工具 (Pen Tool)](#鋼筆工具-pen-tool)
3. [節點編輯增強 (Node Editing Enhancement)](#節點編輯增強-node-editing-enhancement)
4. [布林運算 (Boolean Operations)](#布林運算-boolean-operations)
5. [技術整合建議](#技術整合建議)
6. [測試計劃](#測試計劃)

---

## 概述

本文件詳細規劃三項專業向量編輯功能，目標為將 Skywalk 提升至專業級向量設計工具水準。所有功能基於 Paper.js 向量引擎，參考業界標準（Adobe Illustrator、Figma、Sketch）。

### 優先級與工作量評估

| 功能 | 優先級 | 預計工作量 | 前置依賴 | 目標版本 |
|------|--------|-----------|---------|---------|
| 鋼筆工具 | 🔴 高 | 5-7 天 | 無 | v1.2 |
| 節點編輯增強 | 🟡 中 | 3-5 天 | 鋼筆工具 | v1.2 |
| 布林運算 | 🟢 低 | 5-7 天 | 無 | v1.2 |

---

## 鋼筆工具 (Pen Tool)

### 功能概述

專業級貝茲曲線繪製工具，允許用戶創建精確的向量路徑。支援多種節點類型、即時預覽、路徑閉合等進階功能。

### UI/UX 設計

#### 工具列按鈕設計

```typescript
// 建議新增到 App.tsx 的工具列區域
interface PenToolButton {
  icon: 'PenTool'; // Lucide React Icon
  label: '鋼筆工具';
  shortcut: 'P';
  tooltip: '繪製貝茲曲線路徑 (P)';
  state: 'inactive' | 'drawing' | 'editing';
}
```

**視覺設計建議**:
```tsx
<Button
  variant={editMode === 'pen' ? 'default' : 'outline'}
  size="sm"
  onClick={() => setEditMode('pen')}
  className="gap-2"
  title="鋼筆工具 (P)"
>
  <PenTool className="h-4 w-4" />
  <span className="hidden sm:inline">鋼筆</span>
</Button>
```

#### 游標狀態設計

| 狀態 | 游標樣式 | 說明 |
|------|---------|------|
| **閒置** | `cursor-crosshair` | 準備創建第一個點 |
| **繪製中** | `cursor-crosshair + 小圓點` | 點擊創建新節點 |
| **閉合提示** | `cursor-crosshair + 小圓圈` | 懸停在起始點時 |
| **手柄拖曳** | `cursor-move` | 調整貝茲手柄 |
| **懸停節點** | `cursor-pointer` | 可點擊現有節點 |

#### 右側控制面板新增項目

```typescript
interface PenToolControls {
  // 路徑設定
  strokeWidth: number;        // 1-20px
  strokeColor: string;        // HEX color
  fillColor: string | null;   // HEX or null (無填充)

  // 繪製模式
  mode: 'freeform' | 'straight' | 'curve';

  // 節點設定
  defaultNodeType: 'corner' | 'smooth' | 'symmetric';

  // 智慧輔助
  snapToGrid: boolean;        // 貼齊網格
  snapToPath: boolean;        // 貼齊現有路徑
  showHandles: boolean;       // 顯示手柄
  autoClose: boolean;         // 自動閉合路徑
}
```

**UI 佈局建議**:
```tsx
<CollapsiblePanel title="鋼筆工具設定" defaultOpen={editMode === 'pen'}>
  <div className="space-y-4">
    {/* 筆觸寬度 */}
    <div>
      <Label>筆觸寬度</Label>
      <Slider
        value={penStrokeWidth}
        onChange={setPenStrokeWidth}
        min={1}
        max={20}
        step={0.5}
      />
    </div>

    {/* 節點類型 */}
    <div>
      <Label>預設節點類型</Label>
      <div className="flex gap-2">
        <Button size="sm" variant={nodeType === 'corner' ? 'default' : 'outline'}>
          尖角
        </Button>
        <Button size="sm" variant={nodeType === 'smooth' ? 'default' : 'outline'}>
          平滑
        </Button>
        <Button size="sm" variant={nodeType === 'symmetric' ? 'default' : 'outline'}>
          對稱
        </Button>
      </div>
    </div>

    {/* 智慧輔助 */}
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={snapToGrid} onChange={toggleSnapToGrid} />
        <span>貼齊網格</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={autoClose} onChange={toggleAutoClose} />
        <span>自動閉合路徑</span>
      </label>
    </div>
  </div>
</CollapsiblePanel>
```

### 技術實作

#### 核心狀態管理

```typescript
// types.ts - 新增類型定義
export interface PenToolState {
  isDrawing: boolean;
  currentPath: paper.Path | null;
  currentSegment: paper.Segment | null;
  tempHandles: {
    handleIn: paper.Point | null;
    handleOut: paper.Point | null;
  };
  segments: Array<{
    point: paper.Point;
    handleIn: paper.Point;
    handleOut: paper.Point;
    type: 'corner' | 'smooth' | 'symmetric';
  }>;
  isClosing: boolean;
  hoverPoint: paper.Point | null;
}

export interface PenToolSettings {
  strokeWidth: number;
  strokeColor: string;
  fillColor: string | null;
  defaultNodeType: 'corner' | 'smooth' | 'symmetric';
  snapToGrid: boolean;
  snapToPath: boolean;
  showHandles: boolean;
  autoClose: boolean;
  handleLength: number; // 預設手柄長度
  closeThreshold: number; // 閉合檢測距離 (px)
}
```

#### 主要組件結構

```typescript
// components/PenTool.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import paper from 'paper';

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
    tempHandles: { handleIn: null, handleOut: null },
    segments: [],
    isClosing: false,
    hoverPoint: null
  });

  // ============================================
  // 1. 初始化路徑
  // ============================================
  const initPath = useCallback(() => {
    const path = new scope.Path({
      strokeColor: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
      fillColor: settings.fillColor,
      fullySelected: false,
      closed: false
    });

    stateRef.current.currentPath = path;
    stateRef.current.isDrawing = true;
    stateRef.current.segments = [];

    return path;
  }, [scope, settings]);

  // ============================================
  // 2. 添加節點
  // ============================================
  const addPoint = useCallback((point: paper.Point, handleOut?: paper.Point) => {
    const { currentPath, segments, defaultNodeType } = stateRef.current;
    if (!currentPath) return;

    // 貼齊網格
    let snappedPoint = point.clone();
    if (settings.snapToGrid) {
      const gridSize = 10; // 與 CanvasInteraction 的網格大小一致
      snappedPoint = new scope.Point(
        Math.round(point.x / gridSize) * gridSize,
        Math.round(point.y / gridSize) * gridSize
      );
    }

    // 創建新段
    const segment = new scope.Segment({
      point: snappedPoint,
      handleIn: new scope.Point(0, 0),
      handleOut: handleOut || new scope.Point(0, 0)
    });

    currentPath.add(segment);

    segments.push({
      point: snappedPoint,
      handleIn: new scope.Point(0, 0),
      handleOut: handleOut || new scope.Point(0, 0),
      type: settings.defaultNodeType
    });

    stateRef.current.currentSegment = segment;
  }, [scope, settings]);

  // ============================================
  // 3. 拖曳手柄調整曲線
  // ============================================
  const updateHandle = useCallback((
    segment: paper.Segment,
    handlePoint: paper.Point,
    isOut: boolean
  ) => {
    const delta = handlePoint.subtract(segment.point);

    if (isOut) {
      segment.handleOut = delta;

      // 對稱模式：同步更新 handleIn
      if (settings.defaultNodeType === 'symmetric') {
        segment.handleIn = delta.multiply(-1);
      }
      // 平滑模式：保持方向一致但長度獨立
      else if (settings.defaultNodeType === 'smooth') {
        const angle = delta.angle;
        const inLength = segment.handleIn.length;
        segment.handleIn = new scope.Point({
          length: inLength,
          angle: angle + 180
        });
      }
    } else {
      segment.handleIn = delta;

      if (settings.defaultNodeType === 'symmetric') {
        segment.handleOut = delta.multiply(-1);
      }
      else if (settings.defaultNodeType === 'smooth') {
        const angle = delta.angle;
        const outLength = segment.handleOut.length;
        segment.handleOut = new scope.Point({
          length: outLength,
          angle: angle + 180
        });
      }
    }
  }, [scope, settings]);

  // ============================================
  // 4. 檢測路徑閉合
  // ============================================
  const checkClosePath = useCallback((point: paper.Point): boolean => {
    const { currentPath, segments } = stateRef.current;
    if (!currentPath || segments.length < 3) return false;

    const firstPoint = segments[0].point;
    const distance = point.getDistance(firstPoint);

    return distance < settings.closeThreshold;
  }, [settings]);

  // ============================================
  // 5. 完成路徑
  // ============================================
  const finishPath = useCallback((shouldClose: boolean = false) => {
    const { currentPath } = stateRef.current;
    if (!currentPath) return;

    if (shouldClose) {
      currentPath.closePath();
      if (settings.fillColor) {
        currentPath.fillColor = new scope.Color(settings.fillColor);
      }
    }

    // 簡化路徑（移除冗餘點）
    currentPath.simplify(2);

    // 回調通知父組件
    onPathComplete(currentPath);

    // 重置狀態
    stateRef.current = {
      isDrawing: false,
      currentPath: null,
      currentSegment: null,
      tempHandles: { handleIn: null, handleOut: null },
      segments: [],
      isClosing: false,
      hoverPoint: null
    };
  }, [scope, settings, onPathComplete]);

  // ============================================
  // 6. 滑鼠事件處理
  // ============================================
  useEffect(() => {
    if (!scope) return;

    const tool = new scope.Tool();
    let dragStartPoint: paper.Point | null = null;
    let isDraggingHandle = false;

    // MouseDown - 開始點或閉合路徑
    tool.onMouseDown = (event: paper.ToolEvent) => {
      const { currentPath, isDrawing } = stateRef.current;

      // 檢查是否點擊閉合
      if (isDrawing && checkClosePath(event.point)) {
        finishPath(true);
        return;
      }

      // 開始新路徑或添加點
      if (!isDrawing) {
        initPath();
      }

      addPoint(event.point);
      dragStartPoint = event.point.clone();
    };

    // MouseDrag - 拖曳創建手柄
    tool.onMouseDrag = (event: paper.ToolEvent) => {
      const { currentSegment } = stateRef.current;
      if (!currentSegment || !dragStartPoint) return;

      isDraggingHandle = true;
      updateHandle(currentSegment, event.point, true);
    };

    // MouseUp - 完成手柄拖曳
    tool.onMouseUp = (event: paper.ToolEvent) => {
      dragStartPoint = null;
      isDraggingHandle = false;
    };

    // MouseMove - 顯示預覽與懸停效果
    tool.onMouseMove = (event: paper.ToolEvent) => {
      const { isDrawing } = stateRef.current;

      if (isDrawing) {
        // 檢測是否懸停在起始點
        if (checkClosePath(event.point)) {
          stateRef.current.isClosing = true;
          // TODO: 更新游標樣式為閉合圖標
        } else {
          stateRef.current.isClosing = false;
        }
      }
    };

    tool.activate();

    return () => {
      tool.remove();
    };
  }, [scope, settings, initPath, addPoint, updateHandle, checkClosePath, finishPath]);

  // ============================================
  // 7. 鍵盤快捷鍵
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { isDrawing } = stateRef.current;

      // Enter - 完成路徑
      if (e.key === 'Enter' && isDrawing) {
        finishPath(false);
      }

      // Escape - 取消繪製
      if (e.key === 'Escape' && isDrawing) {
        const { currentPath } = stateRef.current;
        if (currentPath) {
          currentPath.remove();
        }
        onCancel();
        stateRef.current.isDrawing = false;
      }

      // Backspace/Delete - 刪除最後一個點
      if ((e.key === 'Backspace' || e.key === 'Delete') && isDrawing) {
        const { currentPath, segments } = stateRef.current;
        if (currentPath && segments.length > 0) {
          currentPath.removeSegment(segments.length - 1);
          segments.pop();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishPath, onCancel]);

  return null; // 此組件無需渲染 UI
};
```

#### 整合到主應用

```typescript
// App.tsx - 新增 PenTool 狀態
const [penToolSettings, setPenToolSettings] = useState<PenToolSettings>({
  strokeWidth: 2,
  strokeColor: '#000000',
  fillColor: null,
  defaultNodeType: 'smooth',
  snapToGrid: true,
  snapToPath: false,
  showHandles: true,
  autoClose: false,
  handleLength: 50,
  closeThreshold: 10
});

const handlePathComplete = useCallback((path: paper.Path) => {
  // 添加到當前圖層
  const activeLayer = layers.find(l => l.id === activeLayerId);
  if (!activeLayer) return;

  const newItem: CanvasItem = {
    id: `path-${Date.now()}`,
    type: 'path',
    svgData: path.exportSVG({ asString: true }) as string,
    parameters: globalParams,
    locked: false,
    visible: true
  };

  setLayers(prev => prev.map(layer =>
    layer.id === activeLayerId
      ? { ...layer, items: [...layer.items, newItem] }
      : layer
  ));

  addNotification('路徑創建成功', 'success');
}, [activeLayerId, layers, globalParams]);

// 在 CanvasComponent 中渲染
{editMode === 'pen' && canvasRef.current && (
  <PenTool
    scope={canvasRef.current}
    settings={penToolSettings}
    onPathComplete={handlePathComplete}
    onCancel={() => setEditMode('select')}
  />
)}
```

### 參數建議表

| 參數名稱 | 類型 | 預設值 | 範圍/選項 | 說明 |
|---------|------|--------|----------|------|
| `strokeWidth` | number | 2 | 0.5-20 | 筆觸寬度 (px) |
| `strokeColor` | string | '#000000' | HEX | 筆觸顏色 |
| `fillColor` | string \| null | null | HEX \| null | 填充顏色 |
| `defaultNodeType` | string | 'smooth' | 'corner' \| 'smooth' \| 'symmetric' | 預設節點類型 |
| `snapToGrid` | boolean | true | - | 啟用網格貼齊 |
| `snapToPath` | boolean | false | - | 啟用路徑貼齊 |
| `showHandles` | boolean | true | - | 顯示貝茲手柄 |
| `autoClose` | boolean | false | - | 自動閉合路徑 |
| `handleLength` | number | 50 | 10-200 | 預設手柄長度 (px) |
| `closeThreshold` | number | 10 | 5-30 | 閉合檢測距離 (px) |
| `simplifyTolerance` | number | 2 | 0-10 | 路徑簡化容差 |

### 代碼標籤建議

```typescript
// 標籤系統建議
enum PenToolTags {
  COMPONENT = 'pentool-component',
  STATE = 'pentool-state',
  HANDLER = 'pentool-handler',
  BEZIER = 'pentool-bezier',
  VALIDATION = 'pentool-validation'
}

// 使用範例
// @tag: pentool-component
// @tag: pentool-bezier
const updateHandle = (segment: paper.Segment, ...) => { ... }
```

---

## 節點編輯增強 (Node Editing Enhancement)

### 功能概述

增強現有的節點編輯模式，提供專業級的節點操作能力，包括節點添加/刪除、類型轉換、手柄獨立控制、批量操作等。

### UI/UX 設計

#### 節點懸停 UI

當滑鼠懸停在路徑上時，顯示可插入點的預覽：

```typescript
interface NodeHoverUI {
  showInsertPreview: boolean;
  previewPoint: paper.Point | null;
  previewCircle: paper.Path.Circle | null;
  highlightSegment: paper.Segment | null;
}
```

**視覺設計**:
- 懸停點：藍色半透明圓圈 (5px 半徑)
- 現有節點：綠色實心圓圈 (6px 半徑)
- 選中節點：藍色實心圓圈 + 外圈 (8px 半徑)
- 手柄：紫色線段 + 端點圓圈 (4px 半徑)

#### 右鍵選單設計

```typescript
interface NodeContextMenu {
  position: { x: number; y: number };
  targetSegment: paper.Segment | null;
  options: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => void;
    shortcut?: string;
    disabled?: boolean;
  }>;
}

// 選單項目
const nodeMenuOptions = [
  {
    label: '刪除節點',
    icon: <Trash2 className="h-4 w-4" />,
    action: () => deleteNode(selectedSegment),
    shortcut: 'Delete',
    disabled: path.segments.length <= 2
  },
  {
    label: '轉換為尖角',
    icon: <Square className="h-4 w-4" />,
    action: () => convertToCorner(selectedSegment),
    disabled: currentType === 'corner'
  },
  {
    label: '轉換為平滑',
    icon: <Circle className="h-4 w-4" />,
    action: () => convertToSmooth(selectedSegment),
    disabled: currentType === 'smooth'
  },
  {
    label: '轉換為對稱',
    icon: <Sparkles className="h-4 w-4" />,
    action: () => convertToSymmetric(selectedSegment),
    disabled: currentType === 'symmetric'
  },
  { type: 'divider' },
  {
    label: '斷開手柄',
    icon: <Unlink className="h-4 w-4" />,
    action: () => breakHandles(selectedSegment)
  },
  {
    label: '重置手柄',
    icon: <RotateCcw className="h-4 w-4" />,
    action: () => resetHandles(selectedSegment)
  }
];
```

#### 頂部工具列新增按鈕

```tsx
{editMode === 'edit' && selectedPath && (
  <div className="flex items-center gap-2 border-l pl-2">
    <Button
      size="sm"
      variant="ghost"
      onClick={addNodeAtMidpoint}
      title="在中點添加節點 (A)"
    >
      <Plus className="h-4 w-4" />
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={deleteSelectedNodes}
      disabled={selectedNodes.length === 0}
      title="刪除選中節點 (Delete)"
    >
      <Trash2 className="h-4 w-4" />
    </Button>

    <div className="h-4 border-l" />

    <Button
      size="sm"
      variant={nodeEditMode === 'independent' ? 'default' : 'ghost'}
      onClick={() => setNodeEditMode('independent')}
      title="獨立手柄模式 (Alt)"
    >
      <Unlink className="h-4 w-4" />
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={smoothSelectedNodes}
      disabled={selectedNodes.length === 0}
      title="平滑選中節點"
    >
      <Waves className="h-4 w-4" />
    </Button>
  </div>
)}
```

### 技術實作

#### 核心狀態管理

```typescript
// types.ts - 新增節點編輯狀態
export interface NodeEditState {
  selectedPath: paper.Path | null;
  selectedSegments: Set<number>; // segment indices
  hoveredSegment: number | null;
  hoveredCurve: number | null; // for insertion
  insertPreviewPoint: paper.Point | null;

  dragState: {
    isDragging: boolean;
    dragType: 'node' | 'handleIn' | 'handleOut';
    segmentIndex: number | null;
    startPoint: paper.Point | null;
  };

  mode: 'normal' | 'add' | 'delete' | 'independent';
  multiSelect: boolean;
}

export interface NodeEditSettings {
  nodeSize: number; // 節點視覺大小
  handleSize: number; // 手柄視覺大小
  hitTolerance: number; // 點擊容差
  showHandles: boolean;
  showDirections: boolean; // 顯示路徑方向
  magneticSnap: boolean; // 磁性貼齊
  snapDistance: number; // 貼齊距離
}
```

#### 主要組件實作

```typescript
// components/NodeEditor.tsx
import React, { useRef, useCallback, useEffect, useState } from 'react';
import paper from 'paper';

interface NodeEditorProps {
  scope: paper.PaperScope;
  path: paper.Path;
  settings: NodeEditSettings;
  onPathUpdate: (path: paper.Path) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  scope,
  path,
  settings,
  onPathUpdate
}) => {
  const stateRef = useRef<NodeEditState>({
    selectedPath: path,
    selectedSegments: new Set<number>(),
    hoveredSegment: null,
    hoveredCurve: null,
    insertPreviewPoint: null,
    dragState: {
      isDragging: false,
      dragType: 'node',
      segmentIndex: null,
      startPoint: null
    },
    mode: 'normal',
    multiSelect: false
  });

  const [visualLayer] = useState(() => new scope.Layer());

  // ============================================
  // 1. 繪製節點視覺化
  // ============================================
  const renderNodes = useCallback(() => {
    visualLayer.removeChildren();

    if (!path) return;

    path.segments.forEach((segment, index) => {
      const isSelected = stateRef.current.selectedSegments.has(index);
      const isHovered = stateRef.current.hoveredSegment === index;

      // 繪製節點
      const node = new scope.Path.Circle({
        center: segment.point,
        radius: settings.nodeSize,
        fillColor: isSelected ? '#3b82f6' : (isHovered ? '#60a5fa' : '#22c55e'),
        strokeColor: '#ffffff',
        strokeWidth: 2
      });

      visualLayer.addChild(node);

      // 繪製手柄
      if (settings.showHandles && (isSelected || isHovered)) {
        // HandleIn
        if (segment.handleIn.length > 0) {
          const handleInPoint = segment.point.add(segment.handleIn);
          const lineIn = new scope.Path.Line({
            from: segment.point,
            to: handleInPoint,
            strokeColor: '#a855f7',
            strokeWidth: 1,
            dashArray: [4, 2]
          });
          const circleIn = new scope.Path.Circle({
            center: handleInPoint,
            radius: settings.handleSize,
            fillColor: '#a855f7',
            strokeColor: '#ffffff',
            strokeWidth: 1
          });
          visualLayer.addChildren([lineIn, circleIn]);
        }

        // HandleOut
        if (segment.handleOut.length > 0) {
          const handleOutPoint = segment.point.add(segment.handleOut);
          const lineOut = new scope.Path.Line({
            from: segment.point,
            to: handleOutPoint,
            strokeColor: '#ec4899',
            strokeWidth: 1,
            dashArray: [4, 2]
          });
          const circleOut = new scope.Path.Circle({
            center: handleOutPoint,
            radius: settings.handleSize,
            fillColor: '#ec4899',
            strokeColor: '#ffffff',
            strokeWidth: 1
          });
          visualLayer.addChildren([lineOut, circleOut]);
        }
      }
    });

    // 繪製插入預覽
    if (stateRef.current.insertPreviewPoint) {
      const preview = new scope.Path.Circle({
        center: stateRef.current.insertPreviewPoint,
        radius: settings.nodeSize * 0.8,
        fillColor: '#3b82f6',
        opacity: 0.5
      });
      visualLayer.addChild(preview);
    }
  }, [scope, path, settings, visualLayer]);

  // ============================================
  // 2. 添加節點
  // ============================================
  const addNodeAtPoint = useCallback((point: paper.Point, curveIndex: number) => {
    if (!path || curveIndex < 0 || curveIndex >= path.curves.length) return;

    const curve = path.curves[curveIndex];
    const location = curve.getNearestLocation(point);

    if (location) {
      // 在曲線上的特定位置分割
      const newSegment = path.insert(curveIndex + 1, location.point);

      // 計算新節點的手柄
      const t = location.time; // 曲線參數 (0-1)
      const curve1 = path.curves[curveIndex];
      const curve2 = path.curves[curveIndex + 1];

      // 使用 De Casteljau 算法分割貝茲曲線
      newSegment.handleIn = curve1.getPointAt(t).subtract(location.point);
      newSegment.handleOut = curve2.getPointAt(0).subtract(location.point);

      onPathUpdate(path);
      renderNodes();
    }
  }, [path, onPathUpdate, renderNodes]);

  // ============================================
  // 3. 刪除節點
  // ============================================
  const deleteNode = useCallback((segmentIndex: number) => {
    if (!path || path.segments.length <= 2) {
      console.warn('Cannot delete: path must have at least 2 segments');
      return;
    }

    path.removeSegment(segmentIndex);
    stateRef.current.selectedSegments.delete(segmentIndex);

    onPathUpdate(path);
    renderNodes();
  }, [path, onPathUpdate, renderNodes]);

  // ============================================
  // 4. 節點類型轉換
  // ============================================
  const convertNodeType = useCallback((
    segmentIndex: number,
    type: 'corner' | 'smooth' | 'symmetric'
  ) => {
    if (!path) return;

    const segment = path.segments[segmentIndex];
    if (!segment) return;

    switch (type) {
      case 'corner':
        // 不做任何限制，手柄完全獨立
        break;

      case 'smooth':
        // 手柄保持共線但長度可不同
        if (segment.handleOut.length > 0) {
          const angle = segment.handleOut.angle;
          const inLength = segment.handleIn.length || segment.handleOut.length;
          segment.handleIn = new scope.Point({
            length: inLength,
            angle: angle + 180
          });
        }
        break;

      case 'symmetric':
        // 手柄共線且等長
        if (segment.handleOut.length > 0) {
          segment.handleIn = segment.handleOut.multiply(-1);
        } else if (segment.handleIn.length > 0) {
          segment.handleOut = segment.handleIn.multiply(-1);
        }
        break;
    }

    onPathUpdate(path);
    renderNodes();
  }, [scope, path, onPathUpdate, renderNodes]);

  // ============================================
  // 5. 平滑節點
  // ============================================
  const smoothNode = useCallback((segmentIndex: number) => {
    if (!path) return;

    const segment = path.segments[segmentIndex];
    const prev = path.segments[segmentIndex - 1] || path.segments[path.segments.length - 1];
    const next = path.segments[segmentIndex + 1] || path.segments[0];

    if (!segment || !prev || !next) return;

    // 計算切線方向
    const tangent = next.point.subtract(prev.point).normalize();
    const distance = Math.min(
      segment.point.getDistance(prev.point),
      segment.point.getDistance(next.point)
    ) * 0.3;

    segment.handleIn = tangent.multiply(-distance);
    segment.handleOut = tangent.multiply(distance);

    onPathUpdate(path);
    renderNodes();
  }, [path, onPathUpdate, renderNodes]);

  // ============================================
  // 6. 批量操作
  // ============================================
  const deleteSelectedNodes = useCallback(() => {
    if (!path) return;

    const indices = Array.from(stateRef.current.selectedSegments).sort((a, b) => b - a);

    if (path.segments.length - indices.length < 2) {
      console.warn('Cannot delete: must keep at least 2 nodes');
      return;
    }

    indices.forEach(index => {
      path.removeSegment(index);
    });

    stateRef.current.selectedSegments.clear();
    onPathUpdate(path);
    renderNodes();
  }, [path, onPathUpdate, renderNodes]);

  const smoothSelectedNodes = useCallback(() => {
    Array.from(stateRef.current.selectedSegments).forEach(index => {
      smoothNode(index);
    });
  }, [smoothNode]);

  // ============================================
  // 7. 滑鼠事件處理
  // ============================================
  useEffect(() => {
    if (!scope || !path) return;

    const tool = new scope.Tool();

    // MouseDown - 選擇節點或手柄
    tool.onMouseDown = (event: paper.ToolEvent) => {
      const hitResult = path.hitTest(event.point, {
        segments: true,
        stroke: true,
        tolerance: settings.hitTolerance
      });

      if (hitResult) {
        if (hitResult.type === 'segment') {
          const index = hitResult.segment.index;

          // Multi-select with Shift
          if (event.modifiers.shift) {
            if (stateRef.current.selectedSegments.has(index)) {
              stateRef.current.selectedSegments.delete(index);
            } else {
              stateRef.current.selectedSegments.add(index);
            }
          } else {
            stateRef.current.selectedSegments.clear();
            stateRef.current.selectedSegments.add(index);
          }

          stateRef.current.dragState = {
            isDragging: true,
            dragType: 'node',
            segmentIndex: index,
            startPoint: event.point.clone()
          };

          renderNodes();
        }
        else if (hitResult.type === 'stroke') {
          // 在曲線上插入新節點
          const curveIndex = hitResult.location.index;
          addNodeAtPoint(event.point, curveIndex);
        }
      } else {
        // 點擊空白處取消選擇
        stateRef.current.selectedSegments.clear();
        renderNodes();
      }
    };

    // MouseDrag - 拖曳節點或手柄
    tool.onMouseDrag = (event: paper.ToolEvent) => {
      const { dragState } = stateRef.current;

      if (dragState.isDragging && dragState.segmentIndex !== null) {
        const segment = path.segments[dragState.segmentIndex];
        const delta = event.point.subtract(event.downPoint);

        if (dragState.dragType === 'node') {
          // 拖曳節點
          segment.point = segment.point.add(delta);
        }
        // TODO: 處理手柄拖曳

        renderNodes();
      }
    };

    // MouseUp - 結束拖曳
    tool.onMouseUp = () => {
      if (stateRef.current.dragState.isDragging) {
        stateRef.current.dragState = {
          isDragging: false,
          dragType: 'node',
          segmentIndex: null,
          startPoint: null
        };
        onPathUpdate(path);
      }
    };

    // MouseMove - 懸停檢測
    tool.onMouseMove = (event: paper.ToolEvent) => {
      const hitResult = path.hitTest(event.point, {
        segments: true,
        stroke: true,
        tolerance: settings.hitTolerance
      });

      if (hitResult) {
        if (hitResult.type === 'segment') {
          stateRef.current.hoveredSegment = hitResult.segment.index;
          stateRef.current.insertPreviewPoint = null;
        } else if (hitResult.type === 'stroke') {
          stateRef.current.hoveredSegment = null;
          stateRef.current.insertPreviewPoint = event.point.clone();
          stateRef.current.hoveredCurve = hitResult.location.index;
        }
      } else {
        stateRef.current.hoveredSegment = null;
        stateRef.current.insertPreviewPoint = null;
      }

      renderNodes();
    };

    tool.activate();

    return () => {
      tool.remove();
    };
  }, [scope, path, settings, renderNodes, addNodeAtPoint, onPathUpdate]);

  // ============================================
  // 8. 鍵盤快捷鍵
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selected = stateRef.current.selectedSegments;

      // Delete/Backspace - 刪除選中節點
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size > 0) {
        e.preventDefault();
        deleteSelectedNodes();
      }

      // A - 添加節點模式
      if (e.key === 'a' || e.key === 'A') {
        stateRef.current.mode = 'add';
      }

      // Cmd/Ctrl+A - 全選節點
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        stateRef.current.selectedSegments.clear();
        path.segments.forEach((_, index) => {
          stateRef.current.selectedSegments.add(index);
        });
        renderNodes();
      }

      // S - 平滑選中節點
      if (e.key === 's' && selected.size > 0) {
        smoothSelectedNodes();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        stateRef.current.mode = 'normal';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [path, deleteSelectedNodes, smoothSelectedNodes, renderNodes]);

  // 初始渲染
  useEffect(() => {
    renderNodes();
  }, [renderNodes]);

  return null;
};
```

### 參數建議表

| 參數名稱 | 類型 | 預設值 | 範圍/選項 | 說明 |
|---------|------|--------|----------|------|
| `nodeSize` | number | 6 | 4-12 | 節點圓圈半徑 (px) |
| `handleSize` | number | 4 | 3-8 | 手柄圓圈半徑 (px) |
| `hitTolerance` | number | 8 | 5-20 | 點擊檢測容差 (px) |
| `showHandles` | boolean | true | - | 顯示貝茲手柄 |
| `showDirections` | boolean | false | - | 顯示路徑方向箭頭 |
| `magneticSnap` | boolean | true | - | 磁性貼齊功能 |
| `snapDistance` | number | 10 | 5-30 | 貼齊觸發距離 (px) |
| `smoothTension` | number | 0.3 | 0.1-0.5 | 平滑張力係數 |
| `minSegments` | number | 2 | 2-3 | 路徑最少節點數 |

### 代碼標籤建議

```typescript
enum NodeEditTags {
  COMPONENT = 'nodeedit-component',
  VISUAL = 'nodeedit-visual',
  MANIPULATION = 'nodeedit-manipulation',
  SELECTION = 'nodeedit-selection',
  CONVERSION = 'nodeedit-conversion'
}
```

---

## 布林運算 (Boolean Operations)

### 功能概述

實現專業級的路徑布林運算，允許用戶通過聯集、差集、交集等操作組合多個形狀，創建複雜的向量圖形。基於 Paper.js 內建的 `path.unite()`, `path.subtract()` 等方法。

### UI/UX 設計

#### 頂部工具列布林運算區

```tsx
// 僅在選中 2 個或以上路徑時顯示
{selectedPaths.length >= 2 && (
  <div className="flex items-center gap-2 border-l pl-2">
    <span className="text-sm text-gray-600">布林運算:</span>

    <Button
      size="sm"
      variant="ghost"
      onClick={() => performBoolean('unite')}
      title="聯集 (Ctrl+Shift+U)"
    >
      <Combine className="h-4 w-4" />
      <span className="ml-1 hidden md:inline">聯集</span>
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={() => performBoolean('subtract')}
      title="差集 (Ctrl+Shift+S)"
    >
      <Minus className="h-4 w-4" />
      <span className="ml-1 hidden md:inline">差集</span>
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={() => performBoolean('intersect')}
      title="交集 (Ctrl+Shift+I)"
    >
      <Intersect className="h-4 w-4" />
      <span className="ml-1 hidden md:inline">交集</span>
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={() => performBoolean('exclude')}
      title="排除 (Ctrl+Shift+X)"
    >
      <X className="h-4 w-4" />
      <span className="ml-1 hidden md:inline">排除</span>
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={() => performBoolean('divide')}
      title="分割 (Ctrl+Shift+D)"
    >
      <Scissors className="h-4 w-4" />
      <span className="ml-1 hidden md:inline">分割</span>
    </Button>
  </div>
)}
```

#### 右側面板 - 布林運算設定

```tsx
<CollapsiblePanel title="布林運算設定" defaultOpen={false}>
  <div className="space-y-4">
    {/* 運算順序 */}
    <div>
      <Label>運算順序</Label>
      <Select value={booleanOrder} onChange={setBooleanOrder}>
        <option value="selection-order">選擇順序</option>
        <option value="top-to-bottom">從上到下</option>
        <option value="bottom-to-top">從下到上</option>
      </Select>
    </div>

    {/* 結果處理 */}
    <div>
      <Label>運算後處理</Label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={removeOriginals}
          onChange={(e) => setRemoveOriginals(e.target.checked)}
        />
        <span>移除原始路徑</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={simplifyResult}
          onChange={(e) => setSimplifyResult(e.target.checked)}
        />
        <span>簡化結果路徑</span>
      </label>
    </div>

    {/* 簡化容差 */}
    {simplifyResult && (
      <div>
        <Label>簡化容差</Label>
        <Slider
          value={simplifyTolerance}
          onChange={setSimplifyTolerance}
          min={0.1}
          max={10}
          step={0.1}
        />
      </div>
    )}

    {/* 預覽模式 */}
    <div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={livePreview}
          onChange={(e) => setLivePreview(e.target.checked)}
        />
        <span>即時預覽結果</span>
      </label>
    </div>
  </div>
</CollapsiblePanel>
```

#### 布林運算圖示說明

```
聯集 (Unite):        差集 (Subtract):     交集 (Intersect):
┌───┐               ┌───┐               ┌───┐
│ A │ B             │ A │ B             │ A │ B
│  ┌┴─┐      →      │  ┌───┐    →          ┌─┐
└──┤ B│             └──┘   │                │▓│
   └──┘                    └──┘              └─┘
Result: A ∪ B        Result: A - B        Result: A ∩ B

排除 (Exclude):      分割 (Divide):
┌───┐               ┌───┐
│ A │ B             │ A │ B
│  ┌┴─┐      →      │  ┌┴─┐     →       ┌─┬─┬─┐
└──┤▓▓│             └──┤▓▓│              │1│2│3│
   └──┘                └──┘              └─┴─┴─┘
Result: (A∪B)-(A∩B)  Result: 多個獨立形狀
```

### 技術實作

#### 核心類型定義

```typescript
// types.ts - 布林運算類型
export type BooleanOperation =
  | 'unite'      // 聯集
  | 'subtract'   // 差集
  | 'intersect'  // 交集
  | 'exclude'    // 排除
  | 'divide';    // 分割

export interface BooleanSettings {
  operation: BooleanOperation;
  order: 'selection-order' | 'top-to-bottom' | 'bottom-to-top';
  removeOriginals: boolean;
  simplifyResult: boolean;
  simplifyTolerance: number;
  livePreview: boolean;
  preserveStyles: boolean; // 保留樣式（顏色、筆觸等）
}

export interface BooleanResult {
  success: boolean;
  resultPaths: paper.Path[];
  error?: string;
  stats: {
    originalCount: number;
    resultCount: number;
    operationTime: number; // ms
  };
}
```

#### 布林運算服務

```typescript
// services/booleanService.ts
import paper from 'paper';

export class BooleanService {
  /**
   * 執行布林運算
   * @param paths - 參與運算的路徑陣列
   * @param operation - 運算類型
   * @param settings - 運算設定
   */
  static performOperation(
    paths: paper.Path[],
    operation: BooleanOperation,
    settings: BooleanSettings
  ): BooleanResult {
    const startTime = performance.now();

    try {
      // 驗證輸入
      if (paths.length < 2 && operation !== 'divide') {
        throw new Error('布林運算需要至少 2 個路徑');
      }

      // 排序路徑
      const sortedPaths = this.sortPaths(paths, settings.order);

      // 執行運算
      let resultPaths: paper.Path[] = [];

      switch (operation) {
        case 'unite':
          resultPaths = [this.unite(sortedPaths)];
          break;
        case 'subtract':
          resultPaths = [this.subtract(sortedPaths)];
          break;
        case 'intersect':
          resultPaths = [this.intersect(sortedPaths)];
          break;
        case 'exclude':
          resultPaths = [this.exclude(sortedPaths)];
          break;
        case 'divide':
          resultPaths = this.divide(sortedPaths);
          break;
      }

      // 後處理
      resultPaths = resultPaths.filter(path => path && !path.isEmpty());

      if (settings.simplifyResult) {
        resultPaths.forEach(path => {
          path.simplify(settings.simplifyTolerance);
        });
      }

      if (settings.preserveStyles && paths.length > 0) {
        const sourceStyle = paths[0];
        resultPaths.forEach(path => {
          path.strokeColor = sourceStyle.strokeColor?.clone();
          path.fillColor = sourceStyle.fillColor?.clone();
          path.strokeWidth = sourceStyle.strokeWidth;
        });
      }

      const endTime = performance.now();

      return {
        success: true,
        resultPaths,
        stats: {
          originalCount: paths.length,
          resultCount: resultPaths.length,
          operationTime: endTime - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        resultPaths: [],
        error: error instanceof Error ? error.message : '未知錯誤',
        stats: {
          originalCount: paths.length,
          resultCount: 0,
          operationTime: performance.now() - startTime
        }
      };
    }
  }

  /**
   * 聯集運算 (A ∪ B)
   */
  private static unite(paths: paper.Path[]): paper.Path {
    let result = paths[0].clone();

    for (let i = 1; i < paths.length; i++) {
      const temp = result.unite(paths[i], { insert: false });
      if (temp) {
        result.remove();
        result = temp;
      }
    }

    return result;
  }

  /**
   * 差集運算 (A - B - C - ...)
   */
  private static subtract(paths: paper.Path[]): paper.Path {
    let result = paths[0].clone();

    for (let i = 1; i < paths.length; i++) {
      const temp = result.subtract(paths[i], { insert: false });
      if (temp) {
        result.remove();
        result = temp;
      }
    }

    return result;
  }

  /**
   * 交集運算 (A ∩ B ∩ C ∩ ...)
   */
  private static intersect(paths: paper.Path[]): paper.Path {
    let result = paths[0].clone();

    for (let i = 1; i < paths.length; i++) {
      const temp = result.intersect(paths[i], { insert: false });
      if (temp) {
        result.remove();
        result = temp;
      }
    }

    return result;
  }

  /**
   * 排除運算 ((A ∪ B) - (A ∩ B))
   */
  private static exclude(paths: paper.Path[]): paper.Path {
    if (paths.length !== 2) {
      throw new Error('排除運算僅支援 2 個路徑');
    }

    const union = paths[0].unite(paths[1], { insert: false });
    const intersection = paths[0].intersect(paths[1], { insert: false });

    if (!union || !intersection) {
      throw new Error('排除運算失敗');
    }

    const result = union.subtract(intersection, { insert: false });

    union.remove();
    intersection.remove();

    if (!result) {
      throw new Error('排除運算結果為空');
    }

    return result;
  }

  /**
   * 分割運算 (返回所有交叉區域)
   */
  private static divide(paths: paper.Path[]): paper.Path[] {
    const results: paper.Path[] = [];

    // 方法 1: 使用 Paper.js 的 divide 方法
    if (paths.length === 2) {
      const divided = paths[0].divide(paths[1], { insert: false });
      if (divided) {
        if (Array.isArray(divided)) {
          results.push(...divided);
        } else {
          results.push(divided);
        }
      }
    }
    // 方法 2: 多路徑分割（複雜情況）
    else {
      // 逐對分割並合併結果
      let currentPaths = [paths[0].clone()];

      for (let i = 1; i < paths.length; i++) {
        const newPaths: paper.Path[] = [];

        currentPaths.forEach(currentPath => {
          const divided = currentPath.divide(paths[i], { insert: false });

          if (divided) {
            if (Array.isArray(divided)) {
              newPaths.push(...divided);
            } else {
              newPaths.push(divided);
            }
          } else {
            newPaths.push(currentPath);
          }
        });

        currentPaths = newPaths;
      }

      results.push(...currentPaths);
    }

    return results.filter(path => path && !path.isEmpty());
  }

  /**
   * 路徑排序
   */
  private static sortPaths(
    paths: paper.Path[],
    order: BooleanSettings['order']
  ): paper.Path[] {
    switch (order) {
      case 'selection-order':
        return [...paths]; // 保持原順序

      case 'top-to-bottom':
        return [...paths].sort((a, b) => a.bounds.y - b.bounds.y);

      case 'bottom-to-top':
        return [...paths].sort((a, b) => b.bounds.y - a.bounds.y);

      default:
        return [...paths];
    }
  }

  /**
   * 檢查路徑是否有效
   */
  static validatePaths(paths: paper.Path[]): { valid: boolean; error?: string } {
    if (paths.length < 2) {
      return { valid: false, error: '至少需要 2 個路徑' };
    }

    for (const path of paths) {
      if (!path || path.isEmpty()) {
        return { valid: false, error: '存在空路徑' };
      }

      if (!path.closed) {
        return { valid: false, error: '所有路徑必須是閉合的' };
      }
    }

    return { valid: true };
  }

  /**
   * 預覽布林運算結果
   */
  static previewOperation(
    paths: paper.Path[],
    operation: BooleanOperation,
    settings: BooleanSettings
  ): paper.Group | null {
    try {
      const result = this.performOperation(paths, operation, settings);

      if (!result.success) return null;

      const previewGroup = new paper.Group();

      result.resultPaths.forEach(path => {
        const preview = path.clone();
        preview.strokeColor = new paper.Color('#3b82f6');
        preview.fillColor = new paper.Color(0.23, 0.51, 0.96, 0.3);
        preview.strokeWidth = 2;
        preview.dashArray = [5, 3];
        previewGroup.addChild(preview);
      });

      return previewGroup;
    } catch (error) {
      console.error('Preview error:', error);
      return null;
    }
  }
}
```

#### React 組件整合

```typescript
// components/BooleanOperations.tsx
import React, { useCallback, useState } from 'react';
import { BooleanService } from '../services/booleanService';
import type { BooleanOperation, BooleanSettings } from '../types';

interface BooleanOperationsProps {
  selectedPaths: paper.Path[];
  onComplete: (paths: paper.Path[], removeOriginals: boolean) => void;
  onError: (error: string) => void;
}

export const BooleanOperations: React.FC<BooleanOperationsProps> = ({
  selectedPaths,
  onComplete,
  onError
}) => {
  const [settings, setSettings] = useState<BooleanSettings>({
    operation: 'unite',
    order: 'selection-order',
    removeOriginals: true,
    simplifyResult: true,
    simplifyTolerance: 2,
    livePreview: false,
    preserveStyles: true
  });

  const [previewGroup, setPreviewGroup] = useState<paper.Group | null>(null);

  /**
   * 執行布林運算
   */
  const performBoolean = useCallback((operation: BooleanOperation) => {
    // 驗證
    const validation = BooleanService.validatePaths(selectedPaths);
    if (!validation.valid) {
      onError(validation.error || '路徑驗證失敗');
      return;
    }

    // 執行運算
    const result = BooleanService.performOperation(
      selectedPaths,
      operation,
      { ...settings, operation }
    );

    if (!result.success) {
      onError(result.error || '布林運算失敗');
      return;
    }

    // 通知完成
    onComplete(result.resultPaths, settings.removeOriginals);

    // 顯示統計
    console.log('Boolean operation stats:', result.stats);
  }, [selectedPaths, settings, onComplete, onError]);

  /**
   * 即時預覽
   */
  const updatePreview = useCallback(() => {
    if (!settings.livePreview || selectedPaths.length < 2) {
      if (previewGroup) {
        previewGroup.remove();
        setPreviewGroup(null);
      }
      return;
    }

    // 移除舊預覽
    if (previewGroup) {
      previewGroup.remove();
    }

    // 生成新預覽
    const preview = BooleanService.previewOperation(
      selectedPaths,
      settings.operation,
      settings
    );

    setPreviewGroup(preview);
  }, [selectedPaths, settings, previewGroup]);

  // 自動更新預覽
  React.useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  return (
    <div className="boolean-operations">
      {/* UI controls rendered here */}
      {/* See UI/UX Design section above for details */}
    </div>
  );
};
```

#### 整合到主應用

```typescript
// App.tsx - 添加布林運算處理
const handleBooleanComplete = useCallback((
  resultPaths: paper.Path[],
  removeOriginals: boolean
) => {
  const activeLayer = layers.find(l => l.id === activeLayerId);
  if (!activeLayer) return;

  // 添加結果路徑
  const newItems: CanvasItem[] = resultPaths.map((path, index) => ({
    id: `boolean-result-${Date.now()}-${index}`,
    type: 'path',
    svgData: path.exportSVG({ asString: true }) as string,
    parameters: globalParams,
    locked: false,
    visible: true
  }));

  // 更新圖層
  setLayers(prev => prev.map(layer => {
    if (layer.id !== activeLayerId) return layer;

    let updatedItems = [...layer.items];

    // 移除原始路徑
    if (removeOriginals) {
      const selectedIds = new Set(selectedItems.map(item => item.id));
      updatedItems = updatedItems.filter(item => !selectedIds.has(item.id));
    }

    // 添加結果
    updatedItems.push(...newItems);

    return { ...layer, items: updatedItems };
  }));

  // 清除選擇
  setSelectedItems([]);

  addNotification(
    `布林運算完成 (生成 ${resultPaths.length} 個形狀)`,
    'success'
  );
}, [activeLayerId, layers, globalParams, selectedItems, addNotification]);
```

### 參數建議表

| 參數名稱 | 類型 | 預設值 | 範圍/選項 | 說明 |
|---------|------|--------|----------|------|
| `operation` | string | 'unite' | 'unite' \| 'subtract' \| 'intersect' \| 'exclude' \| 'divide' | 運算類型 |
| `order` | string | 'selection-order' | 'selection-order' \| 'top-to-bottom' \| 'bottom-to-top' | 路徑運算順序 |
| `removeOriginals` | boolean | true | - | 運算後移除原始路徑 |
| `simplifyResult` | boolean | true | - | 簡化結果路徑 |
| `simplifyTolerance` | number | 2 | 0.1-10 | 簡化容差 (值越大越簡化) |
| `livePreview` | boolean | false | - | 即時預覽結果 |
| `preserveStyles` | boolean | true | - | 保留原始樣式 |
| `minArea` | number | 1 | 0.1-100 | 最小保留面積 (過濾微小碎片) |

### 代碼標籤建議

```typescript
enum BooleanTags {
  SERVICE = 'boolean-service',
  OPERATION = 'boolean-operation',
  VALIDATION = 'boolean-validation',
  PREVIEW = 'boolean-preview',
  OPTIMIZATION = 'boolean-optimization'
}

// 使用範例
// @tag: boolean-service
// @tag: boolean-operation
export class BooleanService { ... }
```

---

## 技術整合建議

### 檔案結構

```
src/
├── components/
│   ├── PenTool.tsx                    # 鋼筆工具組件
│   ├── NodeEditor.tsx                 # 節點編輯組件
│   ├── BooleanOperations.tsx          # 布林運算組件
│   └── ui/
│       ├── ContextMenu.tsx            # 右鍵選單
│       ├── ToolButton.tsx             # 工具按鈕
│       └── ColorPicker.tsx            # 顏色選擇器
├── services/
│   ├── booleanService.ts              # 布林運算邏輯
│   ├── pathService.ts                 # 路徑操作工具
│   └── validationService.ts           # 驗證服務
├── hooks/
│   ├── usePenTool.ts                  # 鋼筆工具 Hook
│   ├── useNodeEdit.ts                 # 節點編輯 Hook
│   └── useBooleanOperations.ts        # 布林運算 Hook
└── types.ts                           # 類型定義擴展
```

### 漸進式開發策略

#### Phase 1: 基礎功能 (Week 1)
- [ ] 鋼筆工具基本繪製
- [ ] 節點添加/刪除
- [ ] 布林聯集運算

#### Phase 2: 進階功能 (Week 2)
- [ ] 貝茲手柄控制
- [ ] 節點類型轉換
- [ ] 差集/交集運算

#### Phase 3: 優化與完善 (Week 3)
- [ ] 即時預覽
- [ ] 批量操作
- [ ] 分割運算
- [ ] 性能優化

#### Phase 4: 測試與文檔 (Week 4)
- [ ] 單元測試
- [ ] 整合測試
- [ ] 用戶文檔
- [ ] 性能基準測試

### 共用工具函數

```typescript
// services/pathService.ts
export class PathService {
  /**
   * 克隆路徑並保留樣式
   */
  static cloneWithStyle(path: paper.Path): paper.Path {
    const clone = path.clone();
    clone.strokeColor = path.strokeColor?.clone();
    clone.fillColor = path.fillColor?.clone();
    clone.strokeWidth = path.strokeWidth;
    clone.dashArray = path.dashArray;
    return clone;
  }

  /**
   * 計算路徑複雜度
   */
  static getComplexity(path: paper.Path): number {
    return path.segments.length + path.curves.length;
  }

  /**
   * 優化路徑（移除冗餘點）
   */
  static optimize(path: paper.Path, tolerance: number = 2): void {
    path.simplify(tolerance);

    // 移除過短的線段
    path.segments.forEach((segment, index) => {
      const next = path.segments[index + 1];
      if (next && segment.point.getDistance(next.point) < 1) {
        path.removeSegment(index);
      }
    });
  }

  /**
   * 檢查路徑是否自交
   */
  static isSelfIntersecting(path: paper.Path): boolean {
    const intersections = path.getIntersections(path);
    return intersections.length > 0;
  }
}
```

### 錯誤處理策略

```typescript
// services/validationService.ts
export class ValidationService {
  static validatePenToolInput(point: paper.Point): ValidationResult {
    if (!point || isNaN(point.x) || isNaN(point.y)) {
      return { valid: false, error: '無效的座標點' };
    }
    return { valid: true };
  }

  static validateNodeOperation(
    path: paper.Path,
    segmentIndex: number
  ): ValidationResult {
    if (!path || path.isEmpty()) {
      return { valid: false, error: '路徑為空' };
    }

    if (segmentIndex < 0 || segmentIndex >= path.segments.length) {
      return { valid: false, error: '無效的節點索引' };
    }

    return { valid: true };
  }

  static validateBooleanPaths(paths: paper.Path[]): ValidationResult {
    if (paths.length < 2) {
      return { valid: false, error: '至少需要 2 個路徑' };
    }

    for (const path of paths) {
      if (!path.closed) {
        return { valid: false, error: '路徑必須閉合' };
      }

      if (path.area < 1) {
        return { valid: false, error: '路徑面積過小' };
      }
    }

    return { valid: true };
  }
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

---

## 測試計劃

### 單元測試

```typescript
// __tests__/booleanService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import paper from 'paper';
import { BooleanService } from '../services/booleanService';

describe('BooleanService', () => {
  beforeEach(() => {
    // 初始化 Paper.js scope
    paper.setup(new paper.Size(800, 600));
  });

  it('should unite two circles', () => {
    const circle1 = new paper.Path.Circle({
      center: [100, 100],
      radius: 50,
      fillColor: 'red'
    });

    const circle2 = new paper.Path.Circle({
      center: [150, 100],
      radius: 50,
      fillColor: 'blue'
    });

    const result = BooleanService.performOperation(
      [circle1, circle2],
      'unite',
      {
        operation: 'unite',
        order: 'selection-order',
        removeOriginals: false,
        simplifyResult: false,
        simplifyTolerance: 2,
        livePreview: false,
        preserveStyles: false
      }
    );

    expect(result.success).toBe(true);
    expect(result.resultPaths.length).toBe(1);
    expect(result.resultPaths[0].area).toBeGreaterThan(circle1.area);
  });

  it('should validate paths before operation', () => {
    const openPath = new paper.Path.Line([0, 0], [100, 100]);

    const validation = BooleanService.validatePaths([openPath]);

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('閉合');
  });
});
```

### 整合測試腳本

```typescript
// __tests__/integration/advanced-features.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../App';

describe('Advanced Features Integration', () => {
  it('should activate pen tool with P key', () => {
    const { container } = render(<App />);

    fireEvent.keyDown(window, { key: 'p' });

    const penButton = screen.getByTitle(/鋼筆工具/);
    expect(penButton).toHaveClass('active');
  });

  it('should perform boolean unite on selected paths', async () => {
    const { container } = render(<App />);

    // TODO: 選擇兩個路徑
    // TODO: 點擊聯集按鈕
    // TODO: 驗證結果
  });
});
```

### 性能測試基準

```typescript
// __tests__/performance/boolean-benchmark.ts
import { performance } from 'perf_hooks';
import paper from 'paper';
import { BooleanService } from '../services/booleanService';

function benchmarkBoolean() {
  paper.setup(new paper.Size(1000, 1000));

  const iterations = 100;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const circle1 = new paper.Path.Circle({
      center: [Math.random() * 500, Math.random() * 500],
      radius: 50 + Math.random() * 50
    });

    const circle2 = new paper.Path.Circle({
      center: [Math.random() * 500, Math.random() * 500],
      radius: 50 + Math.random() * 50
    });

    const start = performance.now();

    BooleanService.performOperation([circle1, circle2], 'unite', {
      operation: 'unite',
      order: 'selection-order',
      removeOriginals: false,
      simplifyResult: true,
      simplifyTolerance: 2,
      livePreview: false,
      preserveStyles: false
    });

    const end = performance.now();
    results.push(end - start);
  }

  const average = results.reduce((a, b) => a + b, 0) / iterations;
  const max = Math.max(...results);
  const min = Math.min(...results);

  console.log(`Boolean Unite Performance:
    Average: ${average.toFixed(2)}ms
    Min: ${min.toFixed(2)}ms
    Max: ${max.toFixed(2)}ms
  `);
}

benchmarkBoolean();
```

---

## 附錄：快捷鍵完整列表

| 快捷鍵 | 功能 | 適用工具 |
|--------|------|---------|
| **P** | 啟用鋼筆工具 | 全局 |
| **V** | 啟用選擇工具 | 全局 |
| **A** | 啟用節點添加模式 | 節點編輯 |
| **Enter** | 完成當前路徑 | 鋼筆工具 |
| **Escape** | 取消當前操作 | 鋼筆/節點編輯 |
| **Delete/Backspace** | 刪除選中節點/路徑 | 節點編輯 |
| **Ctrl+Shift+U** | 聯集運算 | 布林運算 |
| **Ctrl+Shift+S** | 差集運算 | 布林運算 |
| **Ctrl+Shift+I** | 交集運算 | 布林運算 |
| **Ctrl+Shift+X** | 排除運算 | 布林運算 |
| **Ctrl+Shift+D** | 分割運算 | 布林運算 |
| **Ctrl+A** | 全選節點 | 節點編輯 |
| **Shift+Click** | 多選節點 | 節點編輯 |
| **Alt+Drag** | 獨立控制手柄 | 節點編輯 |
| **S** | 平滑選中節點 | 節點編輯 |

---

## 總結

本文件詳細規劃了三項專業向量編輯功能的實作細節，包括：

1. **鋼筆工具**: 完整的貝茲曲線繪製系統
2. **節點編輯增強**: 專業級的節點操作能力
3. **布林運算**: 複雜形狀組合功能

所有功能均基於 Paper.js API，提供工業級的向量編輯體驗，參考標準為 Adobe Illustrator、Figma 等專業工具。

**預計總開發時間**: 13-19 天
**建議開發順序**: 鋼筆工具 → 節點編輯增強 → 布林運算
**目標版本**: v1.2

---

**文件版本**: 1.0
**作者**: SuperClaude (AI 規劃助手)
**最後更新**: 2025-11-02
