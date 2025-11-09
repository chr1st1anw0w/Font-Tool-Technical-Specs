# 給 Grok 的提示詞 | Prompt for Grok Code Fast-1 (QA Engineer)

**複製以下內容，直接貼給 Grok Code Fast-1**

---

# Grok 任務：Icon 按鈕功能分析與優化建議

你是 Skywalk Font Sculpting Workbench 專案的 QA Engineer 2 (Grok Code Fast-1)，負責性能測試、安全性檢查和優化建議。

## 專案背景
- **專案名稱**: Skywalk Font Sculpting Workbench
- **專案路徑**: `/Users/christianwu/Library/CloudStorage/Dropbox/skywalk-font-sculpting-workbench`
- **技術棧**: React 19 + TypeScript + Vite 6.2 + Paper.js
- **當前問題**: 按鈕為純文字形式，需優化為 icon 按鈕以提升用戶體驗

## 你的任務
請全面分析應用程式的功能、選單和右鍵選單，並提出優化建議。

---

## 第一部分：功能清單完整性審查

### 1.1 審查所有組件功能

**需要檢查的檔案**:
```bash
src/components/ControlPanel.tsx       # 右側控制面板 (321 行)
src/components/Sidebar.tsx            # 左側邊欄 (190 行)
src/components/LayerPanel.tsx         # 圖層管理面板 (131 行)
src/components/ui/ContextMenu.tsx     # 右鍵選單
src/components/CanvasInteraction.tsx  # 畫布互動功能 (358 行)
src/App.tsx                           # 主應用工具列
src/components/PenTool.tsx            # 鋼筆工具 (160 行)
```

### 1.2 產出功能清單

請以結構化的 Markdown 格式列出所有功能：

```markdown
# 功能清單完整列表

## 1. 主工具列 (App.tsx)
### 檔案操作
- [ ] 新建專案
- [ ] 開啟專案
- [ ] 儲存專案
- [ ] 另存新檔

### 編輯操作
- [ ] 復原 (Undo) - Ctrl+Z
- [ ] 重做 (Redo) - Ctrl+Shift+Z

### 匯出功能
- [ ] 匯出 SVG
- [ ] 匯出 PNG
- [ ] 匯出 OTF 字型

### 視圖控制
- [ ] 縮放比例顯示
- [ ] 縮放滑桿 (10% - 1600%)
- [ ] 重置視圖

---

## 2. 控制面板 (ControlPanel.tsx)
### 全域參數控制
- [ ] 粗細調整 (Weight Slider): 0-200
- [ ] 寬度調整 (Width Slider): 0-200
- [ ] 傾斜調整 (Slant Slider): -45° ~ +45°
- [ ] 描邊寬度 (Stroke Width): 0-20px
- [ ] 描邊顏色選擇器 (Stroke Color Picker)
- [ ] 填充顏色選擇器 (Fill Color Picker)
- [ ] 不透明度 (Opacity Slider): 0-100%

### 倒角控制 (Super Chamfer)
- [ ] 倒角類型選擇器:
  - None (無倒角)
  - Chamfer (斜面角)
  - Fillet (圓角)
  - Concave Square (內凹方角)
  - Concave Chamfer (內凹斜角)
  - Concave Round (內凹圓角)
- [ ] 倒角大小滑桿 (Bevel Size): 0-50px

### AI 功能
- [ ] AI 樣式建議按鈕
- [ ] 樣式建議列表顯示
- [ ] 應用建議樣式

---

## 3. 左側邊欄 (Sidebar.tsx)
### 匯入功能
- [ ] 預設字母庫 (A-Z 選擇)
- [ ] AI 匯入助理
  - [ ] 文字輸入框
  - [ ] 深度思考模式切換
  - [ ] 生成 SVG 按鈕
- [ ] 手動匯入 SVG 檔案
- [ ] 從剪貼簿貼上

### 圖層面板 (LayerPanel)
- [ ] 圖層列表顯示
- [ ] 新增圖層
- [ ] 刪除圖層
- [ ] 重命名圖層
- [ ] 切換圖層可見性 (眼睛圖示)
- [ ] 鎖定/解鎖圖層 (鎖頭圖示)
- [ ] 拖拽調整圖層順序

---

## 4. 右鍵選單 (ContextMenu.tsx)
### 編輯操作
- [ ] 複製 (Copy) - Ctrl+C
- [ ] 貼上 (Paste) - Ctrl+V
- [ ] 剪下 (Cut) - Ctrl+X
- [ ] 刪除 (Delete) - Delete

### 圖層操作
- [ ] 移至最上層 (Bring to Front)
- [ ] 移至最下層 (Send to Back)
- [ ] 上移一層 (Bring Forward)
- [ ] 下移一層 (Send Backward)

### 路徑操作
- [ ] 轉換為路徑
- [ ] 合併路徑
- [ ] 拆分路徑

---

## 5. 畫布互動 (CanvasInteraction.tsx)
### 工具模式
- [ ] 選取模式 (Selection Tool)
- [ ] 節點編輯模式 (Node Edit Mode)
- [ ] 鋼筆工具 (Pen Tool)
- [ ] 平移模式 (Pan Mode) - Space 鍵

### 視圖操作
- [ ] 縮放 (Zoom) - 滾輪
- [ ] 平移 (Pan) - 拖拽
- [ ] 重置視圖 - Ctrl+0

### 輔助功能
- [ ] 網格顯示 (Grid)
- [ ] 參考線 (Guides)
- [ ] 貼齊網格 (Snap to Grid)
- [ ] 尺寸輔助顯示
```

---

## 第二部分：使用頻率分析

### 2.1 頻率分類標準

請將所有功能按使用頻率分類：

| 頻率級別 | 定義 | Icon 優先級 | 建議視覺處理 |
|---------|------|-----------|------------|
| **極高** | 每分鐘使用 >3 次 | P0 (必須) | 大型 icon、彩色、置頂位置 |
| **高** | 每次工作階段使用 >10 次 | P1 (強烈建議) | 中型 icon、單色、主要區域 |
| **中** | 每次工作階段使用 3-10 次 | P2 (建議) | 標準 icon、次要區域 |
| **低** | 偶爾使用 <3 次 | P3 (可選) | 小型 icon 或保留文字 |

### 2.2 功能頻率評估表

請填寫此表格：

| 功能 | 預估使用頻率 | 頻率級別 | Icon 優先級 | 建議 Icon 大小 | 建議位置 |
|------|------------|---------|-----------|--------------|---------|
| 復原 (Undo) | 每分鐘 5-10 次 | 極高 | P0 | 32x32px | 主工具列左上 |
| 重做 (Redo) | 每分鐘 3-5 次 | 極高 | P0 | 32x32px | 主工具列左上 |
| 倒角類型切換 | 每次工作 20+ 次 | 高 | P1 | 24x24px | 控制面板頂部 |
| 新增圖層 | 每次工作 3-5 次 | 中 | P2 | 24x24px | 圖層面板頂部 |
| AI 樣式建議 | 探索性功能 | 低 | P3 | 20x20px | 控制面板底部 |
| ... | ... | ... | ... | ... | ... |

**評估依據**:
- 觀察現有專案文檔中的功能描述
- 推測典型用戶的工作流程
- 參考類似軟體 (Adobe Illustrator, Figma) 的使用模式

---

## 第三部分：右鍵選單優化建議

### 3.1 當前右鍵選單分析

請檢查 `src/components/ui/ContextMenu.tsx` 並回答：

1. **當前選單項目數量**: ___ 個
2. **是否有邏輯分組**: 有 / 無
3. **是否有分隔線**: 有 / 無
4. **是否顯示快捷鍵**: 有 / 無
5. **是否有 icon**: 有 / 無

### 3.2 優化建議

**最佳實踐標準**:
- 選單項目數量: 5-9 項 (符合人類短期記憶容量 7±2)
- 邏輯分組: 使用分隔線區分功能類別
- 快捷鍵顯示: 幫助用戶學習鍵盤操作
- Icon 輔助: 加速視覺識別

**優化範例**:
```markdown
### 右鍵選單優化建議

#### ❌ 當前結構 (假設)
- 複製
- 貼上
- 剪下
- 刪除
- 移至最上層
- 移至最下層
- 上移一層
- 下移一層
- 轉換為路徑
- 合併路徑

**問題**:
- 項目過多 (10 項，超過建議的 7±2)
- 無分組，視覺混亂
- 無快捷鍵提示
- 無 icon 加速識別

---

#### ✅ 優化後結構

**📋 編輯操作** (第一組)
- 📋 複製 (Ctrl+C)
- 📄 貼上 (Ctrl+V)
- ✂️ 剪下 (Ctrl+X)
- 🗑️ 刪除 (Delete)

--- *(分隔線)* ---

**📐 圖層排序** (第二組)
- ⬆️ 移至最上層 (Ctrl+Shift+])
- ⬇️ 移至最下層 (Ctrl+Shift+[)

--- *(分隔線)* ---

**🔧 路徑工具** (第三組，折疊子選單)
- 🔄 轉換為路徑
- ➕ 合併路徑
- ➖ 拆分路徑

**優化效果**:
- 分為 3 個邏輯組，認知負擔降低
- Icon 加速視覺識別
- 快捷鍵提示提升學習效率
- 低頻功能 (路徑工具) 折疊至子選單
```

---

## 第四部分：性能影響評估

### 4.1 Icon 實現方案對比

請評估以下方案的性能影響：

| 方案 | Bundle 大小影響 | 渲染性能 | 可維護性 | 建議 |
|------|---------------|---------|---------|------|
| **內聯 SVG** | +50-100KB | 快 | 中 | 適合 <20 個 icon |
| **SVG Sprite** | +20-40KB | 快 | 低 (需工具鏈) | 適合 >50 個 icon |
| **Icon Font** | +30-60KB | 中 | 低 (可訪問性差) | ❌ 不推薦 |
| **React Icon 庫** | +10-30KB (Tree-shaking) | 快 | 高 | ✅ **推薦** |

### 4.2 推薦方案

**建議使用**: `lucide-react`

**理由**:
1. **Bundle 大小優化**: 支援 Tree-shaking，只打包使用的 icon
2. **性能**: React 組件，支援 Virtual DOM 優化
3. **TypeScript 支援**: 完整的類型定義
4. **可自訂性**: 可動態調整大小、顏色、線條粗細
5. **一致性**: 統一的設計語言

**安裝方式**:
```bash
npm install lucide-react
```

**使用範例**:
```tsx
import { Undo, Redo, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

// 基本使用
<Undo size={24} />

// 自訂樣式
<Redo
  size={24}
  strokeWidth={1.5}
  color="#2563EB"
  className="hover:text-blue-700"
/>
```

### 4.3 性能測試計劃

請提供測試計劃來驗證 icon 優化不會降低性能：

```markdown
## 性能測試計劃

### 測試環境
- 瀏覽器: Chrome 120 (最新穩定版)
- 設備: MacBook Pro M1, 16GB RAM
- 測試工具: Lighthouse, Chrome DevTools

### 測試指標

| 指標 | 優化前基準 | 目標值 | 測試方法 |
|------|-----------|--------|---------|
| **首次內容繪製 (FCP)** | ___ ms | <1000ms | Lighthouse |
| **最大內容繪製 (LCP)** | ___ ms | <2500ms | Lighthouse |
| **互動就緒時間 (TTI)** | ___ ms | <3000ms | Lighthouse |
| **總阻塞時間 (TBT)** | ___ ms | <300ms | Lighthouse |
| **Bundle 大小** | ___ KB | 增加 <30KB | webpack-bundle-analyzer |
| **Icon 渲染時間** | N/A | <50ms (100個icon) | React DevTools Profiler |

### 測試步驟
1. **優化前**: 運行 `npm run build` 並記錄基準值
2. **實施 icon 優化**: 替換所有文字按鈕為 icon 按鈕
3. **優化後**: 再次運行測試並記錄數值
4. **對比分析**: 計算差異百分比
5. **結論**: 判定是否通過 (所有指標符合目標值)

### 驗收標準
- ✅ 所有 Lighthouse 指標保持在 "Good" 範圍
- ✅ Bundle 大小增加 <30KB
- ✅ Icon 渲染不影響 60 FPS 流暢度
```

---

## 第五部分：跨瀏覽器相容性

### 5.1 瀏覽器支援矩陣

請驗證 icon 實現在以下環境的相容性：

| 瀏覽器 | 版本 | SVG 支援 | CSS Variables | 測試狀態 |
|--------|------|---------|--------------|---------|
| Chrome | 120+ | ✅ 完整 | ✅ 完整 | 🔲 待測試 |
| Firefox | 121+ | ✅ 完整 | ✅ 完整 | 🔲 待測試 |
| Safari | 17+ | ⚠️ 部分 filter 不支援 | ✅ 完整 | 🔲 待測試 |
| Edge | 120+ | ✅ 完整 | ✅ 完整 | 🔲 待測試 |

### 5.2 已知相容性問題

**Safari 特別注意**:
- SVG `filter` 效果可能不完整 → 避免使用複雜濾鏡
- `backdrop-filter` 性能較差 → 慎用模糊效果

**解決方案**:
```tsx
// 使用特性檢測
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');

{supportsBackdropFilter ? (
  <div className="backdrop-blur-md">...</div>
) : (
  <div className="bg-white/90">...</div>
)}
```

---

## 第六部分：移動裝置體驗優化

### 6.1 觸控目標大小檢查

**標準要求**:
- Apple HIG (Human Interface Guidelines): 最小 44x44pt
- Material Design: 最小 48x48dp
- WCAG 2.1 AAA: 最小 44x44px

**檢查清單**:
- [ ] 主要操作按鈕 ≥ 44x44px
- [ ] 次要操作按鈕 ≥ 40x40px
- [ ] 按鈕間距 ≥ 8px (避免誤觸)

### 6.2 響應式 Icon 顯示策略

請定義不同斷點的 icon 顯示規則：

```markdown
## 響應式 Icon 策略

### Desktop (≥1024px)
**顯示方式**: Icon + 文字標籤
**Icon 大小**: 24x24px
**佈局**: 水平排列
**範例**:
```tsx
<button className="flex items-center gap-2">
  <Undo size={24} />
  <span>復原</span>
</button>
```

### Tablet (768px - 1023px)
**顯示方式**: Icon，hover 顯示 tooltip
**Icon 大小**: 28x28px (增大觸控目標)
**佈局**: 緊湊排列
**範例**:
```tsx
<Tooltip content="復原 (Ctrl+Z)">
  <button className="p-2">
    <Undo size={28} />
  </button>
</Tooltip>
```

### Mobile (≤767px)
**顯示方式**: 僅 icon，長按顯示名稱
**Icon 大小**: 32x32px (最大觸控友好)
**佈局**: 主要功能保留，次要功能收入選單
**優化**:
- 隱藏低頻功能
- 合併相關功能到下拉選單
- 固定主要工具列於底部 (拇指友好)
```

---

## 第七部分：可訪問性 (Accessibility) 檢查

### 7.1 ARIA 標籤檢查

請確保所有 icon 按鈕包含適當的 ARIA 屬性：

```tsx
// ✅ 正確範例
<button
  aria-label="復原上一步操作"
  title="復原 (Ctrl+Z)"
>
  <Undo size={24} />
</button>

// ❌ 錯誤範例 (缺少無障礙標籤)
<button>
  <Undo size={24} />
</button>
```

### 7.2 鍵盤導航支援

**檢查清單**:
- [ ] 所有 icon 按鈕可用 Tab 鍵聚焦
- [ ] Focus 狀態有明顯視覺提示 (outline 或 ring)
- [ ] 支援 Enter/Space 鍵觸發
- [ ] 支援 Esc 鍵關閉選單/對話框

### 7.3 顏色對比度測試

請使用工具驗證對比度：

**測試工具**: https://webaim.org/resources/contrastchecker/

| 元素 | 前景色 | 背景色 | 對比度 | WCAG AA | WCAG AAA |
|------|--------|--------|--------|---------|----------|
| 預設 icon | #6B7280 | #FFFFFF | ___ | ✅/❌ | ✅/❌ |
| Hover icon | #374151 | #FFFFFF | ___ | ✅/❌ | ✅/❌ |
| Active icon | #2563EB | #FFFFFF | ___ | ✅/❌ | ✅/❌ |
| Disabled icon | #D1D5DB | #FFFFFF | ___ | ✅/❌ | ✅/❌ |

**要求**: 所有狀態必須至少達到 WCAG AA 標準 (4.5:1)

---

## 第八部分：安全性考量

### 8.1 Icon 來源驗證

若使用第三方 icon 庫，請檢查：
- [ ] 授權合規 (MIT, ISC, Apache 2.0 等商用友好)
- [ ] 無已知安全漏洞 (`npm audit`)
- [ ] 活躍維護 (最近 6 個月有更新)
- [ ] 下載量 (npm 週下載 >100k)

### 8.2 XSS 防護

若允許用戶自訂 icon：
- [ ] 消毒 SVG 輸入 (使用 DOMPurify)
- [ ] 禁止內聯 JavaScript (`<script>` 標籤)
- [ ] 禁止事件屬性 (`onload`, `onerror` 等)

---

## 交付物檢查清單

請確認你的報告包含以下章節：

- [ ] **第一部分**: 完整功能清單 (所有按鈕、選單、右鍵選單)
- [ ] **第二部分**: 使用頻率分析表 (含優先級 P0/P1/P2/P3)
- [ ] **第三部分**: 右鍵選單優化建議 (含 before/after 對比)
- [ ] **第四部分**: 性能影響評估 (含 icon 庫推薦)
- [ ] **第五部分**: 跨瀏覽器相容性檢查
- [ ] **第六部分**: 移動裝置優化建議 (含響應式策略)
- [ ] **第七部分**: 可訪問性檢查 (ARIA、對比度、鍵盤)
- [ ] **第八部分**: 安全性考量

## 報告儲存位置
請將你的報告儲存為：
```
/project-management/logs/review-logs/round-1/grok-function-analysis-report.md
```

## 截止時間
請在 **48 小時內** (2025-01-18 18:00) 完成分析並提交報告。

---

**角色**: Grok Code Fast-1 (QA Engineer 2)
**任務**: Icon 按鈕功能分析與優化建議
**工具**: Chrome DevTools, Lighthouse, webpack-bundle-analyzer
**聯絡人**: Claude Code (Product Manager)
