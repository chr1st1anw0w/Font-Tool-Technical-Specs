
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityIcon } from './icons';

interface PerformanceStats {
  fps: number;
  memory: number;
  renderTime: number;
}

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({ fps: 0, memory: 0, renderTime: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updateStats = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const memory = (performance as any).memory 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0;
        const renderTime = Math.round(currentTime - lastTime);

        setStats({ fps, memory, renderTime });
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updateStats);
    };

    updateStats();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // 開發環境下才顯示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* 切換按鈕 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 w-10 h-10 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--button-secondary-hover-bg)] transition-colors z-50 shadow"
        title="效能監控"
      >
        <ActivityIcon className="w-5 h-5" />
      </button>

      {/* 效能面板 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed bottom-16 left-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg p-3 text-xs text-[var(--text-primary)] font-mono z-50 shadow-lg"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">FPS:</span>
                <span className={stats.fps < 30 ? 'text-red-500' : stats.fps < 50 ? 'text-yellow-500' : 'text-green-500'}>
                  {stats.fps}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">記憶體:</span>
                <span>{stats.memory}MB</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">渲染:</span>
                <span>{stats.renderTime}ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PerformanceMonitor;
