# 📁 專案管理文檔系統 | Project Management Documentation System

**專案**: Skywalk Font Sculpting Workbench
**版本**: v1.0
**建立日期**: 2025-01-16

---

## 🎯 快速開始 | Quick Start

### 當前任務：Icon 按鈕優化

#### 第 1 步：複製提示詞給團隊成員

**給 Kiro (設計師)**:
```bash
cat project-management/templates/prompt-for-kiro.md
```
↑ 複製此文件內容，貼給 Kiro

**給 Grok Code Fast-1 (QA 工程師)**:
```bash
cat project-management/templates/prompt-for-grok.md
```
↑ 複製此文件內容，貼給 Grok

#### 第 2 步：Claude Code (你) 參考執行指南

```bash
cat project-management/templates/quick-guide-for-claude-pm.md
```
↑ 這是你的完整工作指南

---

## 📂 目錄結構 | Directory Structure

```
project-management/
├── README.md (本文件)                              # 系統總覽
├── TASK-001-Icon-Button-Optimization.md           # 任務詳細文檔
├── PROJECT-REVIEW-WORKFLOW.md                      # 審查流程規範
│
├── templates/                                      # 可重複使用的模板
│   ├── prompt-for-kiro.md                          # 🎨 給 Kiro 的提示詞
│   ├── prompt-for-grok.md                          # ⚡ 給 Grok 的提示詞
│   └── quick-guide-for-claude-pm.md                # 📋 PM 執行指南
│
├── logs/                                           # 所有紀錄文檔
│   ├── review-logs/                                # 審查記錄
│   │   ├── round-1/                                # 第一輪審查
│   │   │   ├── kiro-icon-design-report.md         # Kiro 設計報告 (待提交)
│   │   │   ├── grok-function-analysis-report.md   # Grok 分析報告 (待提交)
│   │   │   ├── kiro-acceptance-report.md          # Kiro 驗收報告 (待提交)
│   │   │   └── grok-acceptance-report.md          # Grok 驗收報告 (待提交)
│   │   ├── round-2/                                # 第二輪審查 (若需要)
│   │   └── round-3/                                # 第三輪審查 (若需要)
│   │
│   ├── meeting-logs/                               # 會議記錄
│   ├── decision-logs/                              # 決策記錄
│   │   └── TASK-001-closure.md                    # 結案報告 (待建立)
│   └── change-logs/                                # 變更記錄
│
└── reference-for-gemini/                           # 給 Gemini 的參考資料 (待建立)
```

---

## 📚 文檔說明 | Document Descriptions

### 1. 核心任務文檔

#### 📄 TASK-001-Icon-Button-Optimization.md
**用途**: Icon 優化任務的完整文檔
**對象**: 所有團隊成員
**內容**:
- 任務概述與目標
- 角色分工與提示詞
- 完整的工作流程 (5 階段)
- 驗收標準
- 時間規劃

**何時閱讀**: 開始任務前，了解全貌

---

#### 📄 PROJECT-REVIEW-WORKFLOW.md
**用途**: 標準審查流程規範
**對象**: Claude Code (PM)
**內容**:
- 完整的 5 階段審查流程
- 角色職責矩陣
- 修改指令包格式
- 問題嚴重度分類
- 決策判定邏輯

**何時閱讀**: 需要進行正式審查時

---

### 2. 提示詞模板 (Templates)

#### 🎨 prompt-for-kiro.md
**用途**: 給 Kiro 的任務提示詞
**如何使用**:
```bash
# 方法 1: 直接複製檔案內容
cat project-management/templates/prompt-for-kiro.md

# 方法 2: 在編輯器中打開
code project-management/templates/prompt-for-kiro.md
```
**複製後**: 貼給 Kiro (透過 Slack/Discord/Email 等)

---

#### ⚡ prompt-for-grok.md
**用途**: 給 Grok Code Fast-1 的任務提示詞
**如何使用**: 同上
**複製後**: 貼給 Grok

---

#### 📋 quick-guide-for-claude-pm.md
**用途**: Claude Code (PM) 的執行指南
**如何使用**:
```bash
# 在瀏覽器中打開 Markdown 預覽
# 或在編輯器中打開
code project-management/templates/quick-guide-for-claude-pm.md
```
**包含內容**:
- 第 1-9 天的詳細執行步驟
- 所有需要複製貼上的指令
- 常見問題處理
- 快速命令參考

---

### 3. 日誌文件夾 (Logs)

#### 📁 review-logs/round-1/
**用途**: 存放第一輪審查的所有報告

**預期文件**:
- `kiro-icon-design-report.md` - Kiro 在 Day 3 提交
- `grok-function-analysis-report.md` - Grok 在 Day 3 提交
- `kiro-acceptance-report.md` - Kiro 在 Day 8 提交
- `grok-acceptance-report.md` - Grok 在 Day 8 提交

**PM 的工作**:
- Day 3: 收集設計和分析報告
- Day 8: 收集驗收報告

---

#### 📁 decision-logs/
**用途**: 記錄重要決策

**何時使用**:
- 當 Kiro 和 Grok 意見衝突，PM 做最終裁決時
- 結案時創建 `TASK-001-closure.md`

---

#### 📁 change-logs/
**用途**: 追蹤代碼變更

**建議文件**:
- `TASK-001-changes.md` - 列出所有修改的檔案

---

## 🚀 工作流程圖 | Workflow Diagram

```
Day 1: Claude Code (PM)
   │
   ├─→ 複製 prompt-for-kiro.md → 發送給 Kiro
   │
   └─→ 複製 prompt-for-grok.md → 發送給 Grok

Day 2-3: Kiro & Grok 並行工作
   │
   ├─→ Kiro 產出報告 → 儲存到 logs/review-logs/round-1/kiro-icon-design-report.md
   │
   └─→ Grok 產出報告 → 儲存到 logs/review-logs/round-1/grok-function-analysis-report.md

Day 3: Claude Code (PM) 整合
   │
   ├─→ 讀取兩份報告
   │
   ├─→ 交叉比對
   │
   └─→ 生成 TASK-001-Implementation-Guide-for-Gemini.md

Day 3: 發送給 Gemini
   │
   └─→ Gemini 開始開發

Day 5: 中期檢查
   │
   └─→ Claude Code 確認進度

Day 7: Gemini 提交
   │
   └─→ 提交 GitHub PR

Day 8: 驗收
   │
   ├─→ Kiro 設計驗收 → kiro-acceptance-report.md
   │
   └─→ Grok 性能驗收 → grok-acceptance-report.md

Day 9: Claude Code (PM) 結案
   │
   └─→ 創建 decision-logs/TASK-001-closure.md
```

---

## 🎯 當前任務狀態 | Current Task Status

### TASK-001: Icon 按鈕優化

| 階段 | 負責人 | 狀態 | 完成度 | 截止時間 |
|------|--------|------|--------|---------|
| 1. 任務發起 | Claude Code | ✅ 完成 | 100% | 2025-01-16 |
| 2. 設計審查 | Kiro | 🔲 待開始 | 0% | 2025-01-18 18:00 |
| 3. 功能分析 | Grok | 🔲 待開始 | 0% | 2025-01-18 18:00 |
| 4. 報告整合 | Claude Code | 🔲 待開始 | 0% | 2025-01-19 12:00 |
| 5. 實施開發 | Gemini | 🔲 待開始 | 0% | 2025-01-26 18:00 |
| 6. 驗收測試 | Kiro, Grok | 🔲 待開始 | 0% | 2025-01-27 18:00 |
| 7. 結案歸檔 | Claude Code | 🔲 待開始 | 0% | 2025-01-28 12:00 |

---

## 📖 使用指南 | User Guide

### For Claude Code (PM) - 你現在要做的事

#### ✅ 立即執行 (現在)

1. **發送任務給 Kiro**:
```bash
cat project-management/templates/prompt-for-kiro.md
```
↑ 複製此內容，透過你的溝通平台發送給 Kiro

2. **發送任務給 Grok**:
```bash
cat project-management/templates/prompt-for-grok.md
```
↑ 複製此內容，透過你的溝通平台發送給 Grok

3. **閱讀你的執行指南**:
```bash
cat project-management/templates/quick-guide-for-claude-pm.md
```
↑ 打開此文件，了解接下來 9 天要做什麼

4. **設定提醒**:
- 2 天後 (2025-01-18 18:00): 檢查 Kiro 和 Grok 是否提交報告
- 5 天後 (2025-01-21): Gemini 中期檢查
- 7 天後 (2025-01-23): Gemini 最終交付

---

### For Kiro (Product Designer)

#### 你收到的提示詞內容
- 需要審查的檔案清單
- Icon 化建議表格
- 設計規範定義
- 可訪問性檢查清單
- 參考 icon 庫

#### 你的交付物
- 檔案位置: `project-management/logs/review-logs/round-1/kiro-icon-design-report.md`
- 截止時間: 48 小時內 (2025-01-18 18:00)

---

### For Grok Code Fast-1 (QA Engineer)

#### 你收到的提示詞內容
- 完整功能清單審查
- 使用頻率分析
- 右鍵選單優化建議
- 性能影響評估
- 跨瀏覽器相容性
- 移動裝置優化

#### 你的交付物
- 檔案位置: `project-management/logs/review-logs/round-1/grok-function-analysis-report.md`
- 截止時間: 48 小時內 (2025-01-18 18:00)

---

### For Gemini 2.5 Pro (Developer)

#### 你將收到的文檔
- `TASK-001-Implementation-Guide-for-Gemini.md` (Day 3 由 Claude Code 發送)
- 包含設計規範、優先級清單、技術指南、驗收標準

#### 你的交付物
- GitHub Pull Request
- CHANGELOG.md
- Icon 使用文檔
- 性能測試報告
- 截圖對比

#### 截止時間
- 7 天 (收到文檔後)

---

## 🔧 常用指令 | Useful Commands

### PM (Claude Code) 常用指令

```bash
# 查看所有模板
ls -lh project-management/templates/

# 讀取 Kiro 提示詞
cat project-management/templates/prompt-for-kiro.md

# 讀取 Grok 提示詞
cat project-management/templates/prompt-for-grok.md

# 查看當前任務
cat project-management/TASK-001-Icon-Button-Optimization.md

# 查看審查流程規範
cat project-management/PROJECT-REVIEW-WORKFLOW.md

# 檢查報告是否提交
ls -lh project-management/logs/review-logs/round-1/

# 讀取 Kiro 報告 (Day 3)
cat project-management/logs/review-logs/round-1/kiro-icon-design-report.md

# 讀取 Grok 報告 (Day 3)
cat project-management/logs/review-logs/round-1/grok-function-analysis-report.md
```

---

## 📊 項目管理最佳實踐 | Best Practices

### 1. 溝通清晰
- 使用結構化的提示詞 ✅
- 明確截止時間 ✅
- 定義驗收標準 ✅

### 2. 進度追蹤
- 設定中期檢查點 ✅
- 每日進度確認 (建議)
- 及早發現問題 ✅

### 3. 文檔管理
- 所有報告集中存放在 `logs/` ✅
- 使用統一的命名規範 ✅
- 保留完整的決策記錄 ✅

### 4. 品質控制
- 多角色驗收機制 ✅
- 明確的驗收標準 ✅
- 允許迭代修改 (最多 3 輪) ✅

---

## 🆘 需要幫助？ | Need Help?

### 常見問題

**Q: 我找不到某個文件？**
A: 執行 `tree project-management/` 查看完整目錄結構

**Q: Kiro 或 Grok 沒有按時提交報告？**
A: 參考 `templates/quick-guide-for-claude-pm.md` 的「常見問題處理」章節

**Q: 如何開始下一個任務？**
A: 複製 `TASK-001` 的結構，創建 `TASK-002-xxx.md`

---

## 📝 更新記錄 | Change Log

| 日期 | 版本 | 變更內容 |
|------|------|---------|
| 2025-01-16 | v1.0 | 初始版本，建立完整文檔系統 |

---

**系統建立者**: Claude Code
**最後更新**: 2025-01-16
**狀態**: ✅ 可用
