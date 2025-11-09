# **Skywalk 工作台開發專案：AI 協作流程 v1.0**

**文件目的：** 本文件旨在定義一個清晰、高效且品質可控的開發流程，核心是將 **Google Gemini 2.5 Pro** 作為主要開發者，並由人類專家團隊（產品、設計、工程）進行指導、審查與驗證。

---

## **第一部分：角色與職責 (Roles & Responsibilities)**

明確的分工是高效協作的基礎。

### 1.  **產品經理 (PM) - Claude Code (我)**
*   **職責**:
    *   定義產品願景、目標與功能藍圖 (`PRODUCT_REQUIREMENTS.md`)。
    *   撰寫使用者故事 (User Stories) 和驗收標準 (Acceptance Criteria)。
    *   管理專案時程與功能優先級。
    *   從使用者和業務角度驗證最終交付的功能，確保其符合需求。
    *   作為最終決策者，決定功能是否上線。

### 2.  **產品設計師 (UI/UX Designer) - Kiro**
*   **職責**:
    *   負責所有使用者介面 (UI) 和使用者體驗 (UX) 設計。
    *   產出高保真視覺稿 (Mockups)、原型 (Prototypes) 和設計規範 (Design Specs)。
    *   定義互動流程、動畫效果和視覺風格。
    *   審核 Gemini 產出的前端介面，確保 100% 符合設計稿（Pixel-Perfect）。
    *   維護設計系統和組件庫。

### 3.  **工程師 (Engineer) - Cline, Grok Code Fast-1**
*   **職責**:
    *   擔任技術架構師和程式碼審查員 (Code Reviewer)。
    *   在開發前，審查 PM 的需求和設計師的設計稿，評估技術可行性，並提出技術規格建議（如組件拆分、狀態管理策略）。
    *   負責 **提示工程 (Prompt Engineering)** 的技術部分，將需求轉化為 Gemini 能理解的、精確的技術指令。
    *   **嚴格審查 (Review)** Gemini 產出的所有程式碼，檢查其品質、性能、可維護性、安全性和是否遵循編碼規範。
    *   處理需要複雜邏輯、手動調試或 AI 難以完成的任務。
    *   負責最終的程式碼整合、部署與維護。

### 4.  **主要開發者 (Main Developer) - Google Gemini 2.5 Pro (AI)**
*   **職責**:
    *   作為一個**指令執行者**，根據團隊提供的詳細提示 (Prompt) 生成程式碼。
    *   嚴格遵循指令，不進行主觀創造或偏離需求。
    *   產出符合指定格式 (XML) 的完整檔案內容。
*   **能力邊界**: AI 不具備理解模糊需求、主動創新或感知專案上下文的能力。其產出品質直接取決於提示的品質。

---

## **第二部分：開發工作流程 (Development Workflow)**

我們將採用一個結構化的瀑布式微循環流程，確保在每個階段都有明確的交付物和審查點。

### **【階段一：規劃與設計】**

1.  **需求定義 (PM - Claude)**
    *   Claude 根據產品藍圖，撰寫詳細的功能需求文件（PRD），類似您提供的 `PRODUCT_REQUIREMENTS.md`。
    *   **交付物**: 一份清晰的功能規格文件。

2.  **設計定稿 (Designer - Kiro)**
    *   Kiro 根據 PRD 進行 UI/UX 設計，產出高保真設計稿。
    *   **交付物**: Figma/Sketch 連結，包含完整的畫面、組件狀態和互動說明。

3.  **技術審查 (Engineer - Cline/Grok)**
    *   Cline/Grok 審查 PRD 和設計稿，提出技術實現方案。
    *   **交付物**: 一份簡短的技術筆記，說明：
        *   需要修改或新增哪些檔案。
        *   組件的 props 如何設計。
        *   狀態管理的建議。

### **【階段二：AI 開發與審查】**

4.  **提示工程 (全員協作)**
    *   這是**最關鍵的步驟**。團隊共同撰寫一份給 Gemini 的詳細開發提示。
    *   **PM (Claude)**: 提供使用者故事和業務邏輯。
    *   **Designer (Kiro)**: 提供視覺和互動描述，可附上圖片 Base64 或詳細的 CSS 參數。
    *   **Engineer (Cline/Grok)**: 提供精確的技術指令、檔案路徑、函式名稱、類型定義和程式碼結構。
    *   **交付物**: 一份經過團隊審核通過的、發送給 Gemini 的最終提示 (Prompt)。

5.  **AI 生成程式碼 (AI - Gemini)**
    *   將最終提示發送給 Gemini。
    *   **交付物**: Gemini 產出的 XML 格式程式碼。

6.  **程式碼審查 (Quality Gate 1 - Engineer)**
    *   Cline/Grok 審查 Gemini 產出的每一行程式碼。
    *   **檢查點**:
        *   程式碼是否能正常運作？
        *   是否遵循專案的編碼規範 (ESLint, Prettier)？
        *   是否存在潛在的性能問題或安全漏洞？
        *   程式碼是否易於理解和維護？
    *   **結果**: 若不通過，回到步驟 4，撰寫一個更精確的**修正提示**。

7.  **功能與設計驗證 (Quality Gate 2 - Designer & PM)**
    *   在本地環境運行通過程式碼審查的版本。
    *   **Kiro (Designer)**: 驗證 UI 是否與設計稿完全一致，互動是否流暢。
    *   **Claude (PM)**: 驗證功能是否滿足 PRD 中定義的所有需求和驗收標準。
    *   **結果**: 若不通過，回到步驟 4，撰寫修正提示。

### **【階段三：完成與整合】**

8.  **迭代修正 (循環)**
    *   重複步驟 4-7，直到程式碼和功能完全符合所有要求。

9.  **手動整合 (Engineer - Cline/Grok)**
    *   Cline/Grok 將最終通過審查的程式碼合併到主開發分支中。
    *   **交付物**: 一個已合併的 Pull Request。

---

## **第三部分：溝通與反饋機制**

1.  **對 Gemini 的溝通原則**:
    *   **無狀態 (Stateless)**: 每次都提供完整的上下文（所有相關檔案的最新內容）。不要假設 Gemini 記得之前的對話。
    *   **指令清晰明確 (Explicit & Unambiguous)**: 避免使用「稍微調整一下」、「讓它好看一點」等模糊詞語。使用「將按鈕的 padding 從 `py-2` 改為 `py-3`」。
    *   **原子化任務 (Atomic Tasks)**: 盡量將一個大功能拆分成幾個小任務，分次讓 Gemini 完成，這樣更容易審查和修正。

2.  **標準提示模板 (Standard Prompt Template)**:
    ```
    Act as a world-class senior frontend engineer... (這是固定的開頭)

    **Context:**
    Here are the existing files in the app:
    --- START OF FILE [path/to/file1.tsx] ---
    [...file1 content...]
    --- END OF FILE [path/to/file1.tsx] ---

    --- START OF FILE [path/to/file2.css] ---
    [...file2 content...]
    --- END OF FILE [path/to/file2.css] ---

    **User Request:**
    [PM Claude 撰寫：從使用者角度描述需求，例如："我希望在頂部工具列新增一個'清除畫布'的按鈕。"]

    **Design Specifications (from Kiro):**
    - The button should use the `TrashIcon` SVG.
    - It should be placed next to the 'Redo' button, separated by a vertical divider.
    - When the canvas is empty, the button should be disabled with 50% opacity.
    - Tooltip text: "清空畫布".

    **Technical Implementation (from Cline/Grok):**
    1.  In `App.tsx`, create a new function `handleClearCanvas` that:
        - Calls `paperScopeRef.current.project.clear()`.
        - Resets the `svgData` and `selectedLetter` states to `null`.
        - Shows a notification: "畫布已清空".
    2.  Add a new button to the toolbar in `App.tsx` that calls `handleClearCanvas`.
    3.  The button's `disabled` attribute should be bound to `!canvasHasContent`.
    4.  Add a new `TrashIcon` to `components/icons.tsx` if it doesn't exist.
    ```

3.  **反饋與修正流程**:
    *   當審查發現問題時，**不要手動修改 Gemini 的程式碼**。
    *   而是，複製 Gemini 產出的有問題的程式碼，作為**新的上下文**，並撰寫一個**修正提示**。
    *   **範例修正提示**: "The code you provided for `handleClearCanvas` was good, but it forgot to reset the `canvasHasContent` state. Please update the function to also call `setCanvasHasContent(false)`."

---

## **第四部分：品質檢查點 (Quality Gates)**

為了確保最終產出的品質，我們設立三個核心檢查點：

1.  **提示審查 (Prompt Review Gate)**
    *   **時機**: 發送提示給 Gemini 之前。
    *   **負責人**: 全員。
    *   **標準**: 提示是否清晰、完整，且包含了 PM、設計師和工程師的所有要求？

2.  **程式碼審查 (Code Review Gate)**
    *   **時機**: Gemini 產出程式碼之後。
    *   **負責人**: Cline/Grok (Engineer)。
    *   **標準**: 功能正確、無性能問題、遵循規範、可讀性高。

3.  **功能驗收 (UAT Gate)**
    *   **時機**: 程式碼審查通過後。
    *   **負責人**: Claude (PM) 和 Kiro (Designer)。
    *   **標準**: 100% 符合 PRD 和設計稿。

---

這個流程將 AI 視為一個極其高效、但需要精確指令的「編碼工具人」。人類團隊的價值在於**策略、設計、架構和品質把關**，透過高品質的輸入（提示）來確保高品質的輸出（程式碼）。
