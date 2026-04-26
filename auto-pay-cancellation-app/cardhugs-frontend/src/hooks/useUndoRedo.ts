import { useState, useCallback } from 'react';

export interface UndoRedoState<T> {
  state: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  setState: (newState: T | ((prevState: T) => T)) => void;
  reset: (initialState: T) => void;
}

/**
 * Hook for undo/redo functionality
 * Usage:
 *   const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialState);
 *   onClick handlers should call setState() instead of direct state updates
 *   Keyboard shortcuts: Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo
 */
export function useUndoRedo<T>(initialState: T): UndoRedoState<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setHistory((prevHistory) => {
      // Remove any "future" states after current index (branching)
      const newHistory = prevHistory.slice(0, index + 1);
      
      // Calculate new state
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(newHistory[index])
        : newState;
      
      // Add to history
      return [...newHistory, resolvedState];
    });
    
    setIndex((prevIndex) => prevIndex + 1);
  }, [index]);

  const undo = useCallback(() => {
    setIndex((prevIndex) => Math.max(0, prevIndex - 1));
  }, []);

  const redo = useCallback(() => {
    setIndex((prevIndex) => Math.min(history.length - 1, prevIndex + 1));
  }, [history.length]);

  const reset = useCallback((newInitialState: T) => {
    setHistory([newInitialState]);
    setIndex(0);
  }, []);

  return {
    state: history[index],
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    undo,
    redo,
    setState,
    reset,
  };
}
