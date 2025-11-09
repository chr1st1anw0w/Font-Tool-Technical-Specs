
import { useState, useCallback, useEffect } from 'react';

const useHistory = <T extends object>(key: string, initialValue: T) => {
    const [history, setHistory] = useState<T[]>(() => {
        try {
            const item = window.localStorage.getItem(key);
            const savedHistory = item ? JSON.parse(item) : null;
            return Array.isArray(savedHistory) && savedHistory.length > 0 ? savedHistory : [initialValue];
        } catch (error) {
            console.warn(`Error reading localStorage history key "${key}":`, error);
            return [initialValue];
        }
    });
    
    const [index, setIndex] = useState(() => history.length - 1);

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(history));
        } catch (error) {
             console.warn(`Error setting localStorage history key "${key}":`, error);
        }
    }, [history, key]);

    const setState = useCallback((action: T | ((prevState: T) => T)) => {
        const newState = typeof action === 'function' 
            ? (action as (prevState: T) => T)(history[index]) 
            : action;
        
        if (JSON.stringify(newState) === JSON.stringify(history[index])) {
            return;
        }

        const newHistory = history.slice(0, index + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setIndex(newHistory.length - 1);
    }, [history, index]);

    const undo = useCallback(() => {
        if (index > 0) {
            setIndex(prevIndex => prevIndex - 1);
        }
    }, [index]);

    const redo = useCallback(() => {
        if (index < history.length - 1) {
            setIndex(prevIndex => prevIndex + 1);
        }
    }, [index, history.length]);
    
    return {
        state: history[index],
        set: setState,
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1,
    };
};

export default useHistory;
