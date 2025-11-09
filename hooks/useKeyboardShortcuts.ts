import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onLetterSelect?: (index: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onToggleAids?: () => void;
  onGroup?: () => void;
  onToggleUi?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onCopyProperties?: () => void;
  onPasteProperties?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 防止在輸入框中觸發快捷鍵
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // 字母選擇 (1-6)
    if (!isModifierPressed && /^[1-6]$/.test(key)) {
      event.preventDefault();
      const index = parseInt(key) - 1;
      shortcuts.onLetterSelect?.(index);
      return;
    }
    
    // Alt + Cmd/Ctrl shortcuts
    if (isModifierPressed && altKey) {
        switch (key.toLowerCase()) {
            case 'c':
                event.preventDefault();
                shortcuts.onCopyProperties?.();
                break;
            case 'v':
                event.preventDefault();
                shortcuts.onPasteProperties?.();
                break;
        }
        return; // Prevent fall-through to other shortcuts
    }


    // Ctrl/Cmd + 快捷鍵
    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (shiftKey) {
            shortcuts.onRedo?.();
          } else {
            shortcuts.onUndo?.();
          }
          break;
        case 'y':
          event.preventDefault();
          shortcuts.onRedo?.();
          break;
        case 's':
          event.preventDefault();
          shortcuts.onSave?.();
          break;
        case 'e':
          event.preventDefault();
          shortcuts.onExport?.();
          break;
        case '=':
        case '+':
          event.preventDefault();
          shortcuts.onZoomIn?.();
          break;
        case '-':
          event.preventDefault();
          shortcuts.onZoomOut?.();
          break;
        case '0':
          event.preventDefault();
          shortcuts.onZoomReset?.();
          break;
        case 'g':
          event.preventDefault();
          shortcuts.onGroup?.();
          break;
        case '\\':
          event.preventDefault();
          shortcuts.onToggleUi?.();
          break;
        case 'c':
          event.preventDefault();
          shortcuts.onCopy?.();
          break;
        case 'v':
          event.preventDefault();
          shortcuts.onPaste?.();
          break;
        case 'a':
          event.preventDefault();
          shortcuts.onSelectAll?.();
          break;
      }
    }

    // 其他快捷鍵
    switch (key) {
      case 'h':
        if (!isModifierPressed) {
          event.preventDefault();
          shortcuts.onToggleAids?.();
        }
        break;
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;