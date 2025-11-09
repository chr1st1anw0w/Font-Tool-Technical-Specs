# 給 Kiro 的提示詞 | Prompt for Kiro (Product Designer)

**複製以下內容，直接貼給 Kiro**

---

# Kiro 任務：Icon 按鈕設計審查

你是 Skywalk Font Sculpting Workbench 專案的 Product Designer (Kiro)，負責 UI/UX 設計審查。

## 專案背景
- **專案名稱**: Skywalk Font Sculpting Workbench
- **專案路徑**: `/Users/christianwu/Library/CloudStorage/Dropbox/skywalk-font-sculpting-workbench`
- **技術棧**: React 19 + TypeScript + Paper.js
- **設計系統**: 目前使用純文字按鈕，需優化為 icon 按鈕

## 你的任務
請審查整個應用程式，並完成以下工作：

### 1. 功能清單與 Icon 化建議
請檢視專案中的所有功能和選單，識別哪些可以視覺化成 SVG icon button。

**需要審查的檔案**:
```
/src/components/ControlPanel.tsx      # 右側控制面板
/src/components/Sidebar.tsx           # 左側邊欄
/src/components/LayerPanel.tsx        # 圖層面板
/src/components/ui/ContextMenu.tsx    # 右鍵選單
/src/App.tsx                          # 主要工具列
/src/components/icons.tsx             # 現有 icon 庫
```

**產出格式**:
請以 Markdown 表格形式列出：

| 功能名稱 | 當前狀態 | 建議 Icon | 優先級 | 設計說明 |
|---------|---------|----------|--------|---------|
| 復原 (Undo) | 文字按鈕 | ↶ 箭頭 | P0 | 標準左彎箭頭，全局通用 |
| 重做 (Redo) | 文字按鈕 | ↷ 箭頭 | P0 | 標準右彎箭頭，與復原成對 |
| 新增圖層 | 文字按鈕 | ➕ 圓形加號 | P1 | 簡潔的加號符號 |
| 刪除圖層 | 文字按鈕 | 🗑️ 垃圾桶 | P1 | 標準刪除圖標 |
| 匯出 SVG | 文字按鈕 | 💾 下載圖示 | P1 | 向下箭頭 + 托盤 |
| ... | ... | ... | ... | ... |

### 2. Icon 設計規範
請定義統一的設計規範：

**規格要求**:
- **尺寸**: 建議的 icon 尺寸 (如 24x24px, 32x32px)
- **風格**: 線條 (line) / 填充 (filled) / 雙色 (duotone) - 請選擇一種統一風格
- **線條粗細**: 1px / 1.5px / 2px - 請指定
- **圓角**: 有 / 無 - 請指定
- **色彩系統**:
  - 預設狀態: #______ (請填入色碼)
  - Hover 狀態: #______ (請填入色碼)
  - Active/選中狀態: #______ (請填入色碼)
  - Disabled 狀態: #______ (請填入色碼)

**範例格式**:
```markdown
## Icon 設計規範

### 基本規格
- **尺寸**: 24x24px (標準), 32x32px (主要操作)
- **風格**: Line (線條風格)
- **線條粗細**: 1.5px
- **圓角**: 2px
- **視覺權重**: Medium

### 色彩系統
- **預設**: #6B7280 (gray-500)
- **Hover**: #374151 (gray-700)
- **Active**: #2563EB (blue-600)
- **Disabled**: #D1D5DB (gray-300)

### 間距規範
- Icon 與文字間距: 8px
- 按鈕內邊距: 8px
- 觸控目標最小尺寸: 44x44px
```

### 3. 現有 Icon 庫評估
請檢查 `/src/components/icons.tsx` 中已有的 icon：

**評估清單**:
- [ ] 列出現有的所有 icon
- [ ] 評估每個 icon 是否符合新的設計規範
- [ ] 標註哪些需要重新設計
- [ ] 標註哪些可以保留

**產出格式**:
```markdown
## 現有 Icon 評估

| Icon 名稱 | 當前風格 | 是否符合規範 | 處理方式 |
|----------|---------|------------|---------|
| MenuIcon | 線條 | ✅ 符合 | 保留 |
| PlusIcon | 填充 | ❌ 不符合 | 需改為線條風格 |
| ... | ... | ... | ... |
```

### 4. 視覺層級建議
請根據功能重要性，建議視覺層級：

**分類標準**:
```markdown
### 視覺層級分類

#### Primary Actions (主要操作)
**特徵**: 最常用、核心功能
**視覺規格**:
- Icon 大小: 32x32px
- 顏色: 品牌色 (彩色)
- 樣式: 填充或加粗線條
- 位置: 主工具列、置頂位置

**範例**: 復原、重做、儲存

---

#### Secondary Actions (次要操作)
**特徵**: 常用但非核心
**視覺規格**:
- Icon 大小: 24x24px
- 顏色: 單色 (灰階)
- 樣式: 標準線條
- 位置: 側邊欄、控制面板

**範例**: 圖層管理、倒角控制

---

#### Tertiary Actions (三級操作)
**特徵**: 輔助功能、低頻使用
**視覺規格**:
- Icon 大小: 20x20px
- 顏色: 淺灰色
- 樣式: 細線條
- 位置: 次要面板、右鍵選單

**範例**: AI 樣式建議、進階設定
```

### 5. 可訪問性 (Accessibility) 檢查
請確保以下可訪問性標準：

**檢查清單**:
- [ ] 每個 icon 都有對應的 `aria-label` 或 tooltip 文字說明
- [ ] Icon 與背景的對比度符合 WCAG AA 標準 (至少 4.5:1)
- [ ] 觸控目標大小至少 44x44px (Apple HIG, Material Design 標準)
- [ ] 支援鍵盤 Tab 鍵導航
- [ ] 支援 focus 狀態視覺提示
- [ ] 色盲友好設計 (不僅依賴顏色區分狀態)

**測試工具**:
- 對比度檢查: https://webaim.org/resources/contrastchecker/
- 色盲模擬: https://www.toptal.com/designers/colorfilter/

### 6. 參考設計系統
可參考的 icon 庫 (請選擇一個並說明理由)：

| Icon 庫 | 風格 | React 支援 | 授權 | 推薦度 |
|---------|------|-----------|------|--------|
| **Lucide Icons** | 線條、簡潔 | ✅ lucide-react | ISC (商用友好) | ⭐⭐⭐⭐⭐ |
| **Heroicons** | 線條/填充 | ✅ @heroicons/react | MIT | ⭐⭐⭐⭐⭐ |
| **Phosphor Icons** | 多風格 | ✅ phosphor-react | MIT | ⭐⭐⭐⭐ |
| **Tabler Icons** | 線條 | ✅ @tabler/icons-react | MIT | ⭐⭐⭐⭐ |
| **Material Icons** | Google 風格 | ✅ @mui/icons-material | Apache 2.0 | ⭐⭐⭐ |

**建議選擇**:
請說明你推薦使用哪個 icon 庫，並解釋原因。

**範例**:
```markdown
## Icon 庫選擇建議

### 推薦: Lucide Icons
**理由**:
1. 設計風格簡潔現代，符合專案調性
2. React 支援完整，Tree-shaking 優化
3. 圖標數量豐富 (>1000 個)
4. ISC 授權，商用無限制
5. 活躍維護，定期更新

### 安裝方式
```bash
npm install lucide-react
```

### 使用範例
```tsx
import { Undo, Redo, Plus, Trash2 } from 'lucide-react';

<button>
  <Undo size={24} strokeWidth={1.5} />
  <span>復原</span>
</button>
```
```

### 7. (選擇性) Figma 設計稿
若你使用 Figma 設計 icon：
- 請提供 Figma 分享連結
- 標註每個 icon 的用途
- 提供匯出的 SVG 檔案

## 交付物檢查清單
請確認你的報告包含以下內容：

- [ ] **功能 Icon 化清單** (含優先級 P0/P1/P2)
- [ ] **Icon 設計規範文檔** (尺寸、風格、色彩)
- [ ] **現有 icon 評估報告** (保留/修改/刪除)
- [ ] **視覺層級建議** (Primary/Secondary/Tertiary)
- [ ] **可訪問性檢查清單** (WCAG 合規)
- [ ] **Icon 庫選擇建議** (含理由)
- [ ] **(選擇性) Figma 設計稿連結**

## 報告儲存位置
請將你的報告儲存為：
```
/project-management/logs/review-logs/round-1/kiro-icon-design-report.md
```

## 截止時間
請在 **48 小時內** (2025-01-18 18:00) 完成審查並提交報告。

---

**角色**: Kiro (Product Designer)
**任務**: Icon 按鈕設計審查
**工具**: Figma / Sketch / Adobe XD (任選)
**聯絡人**: Claude Code (Product Manager)
