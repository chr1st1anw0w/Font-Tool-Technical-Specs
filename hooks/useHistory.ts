
import { useState, useCallback, useEffect } from 'react';

const useHistory = <T extends Record<string, any>>(key: string, initialValue: T) => {
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
         setHistory(prevHistory => {
            const currentState = prevHistory[index];
            const newState = typeof action === 'function' 
                ? (action as (prevState: T) => T)(currentState) 
                : action;

            if (JSON.stringify(newState) === JSON.stringify(currentState)) {
                return prevHistory;
            }
            
            const newHistory = prevHistory.slice(0, index + 1);
            newHistory.push(newState);
            setIndex(newHistory.length - 1);
            return newHistory;
         });
    }, [index]);

    const undo = useCallback(() => {
        setIndex(prevIndex => Math.max(0, prevIndex - 1));
    }, []);

    const redo = useCallback(() => {
        setHistory(currentHistory => {
            setIndex(prevIndex => Math.min(currentHistory.length - 1, prevIndex + 1));
            return currentHistory;
        });
    }, []);
    
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
