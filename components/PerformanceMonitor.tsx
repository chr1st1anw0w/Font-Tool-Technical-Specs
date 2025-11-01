import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        className="fixed bottom-4 right-4 w-10 h-10 bg-[var(--neutral-gray-800)] border border-[var(--neutral-gray-600)] rounded-full flex items-center justify-center text-xs text-[var(--neutral-gray-400)] hover:bg-[var(--neutral-gray-700)] transition-colors z-50"
        title="效能監控"
      >
        📊
      </button>

      {/* 效能面板 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed bottom-16 right-4 bg-[var(--neutral-gray-800)] border border-[var(--neutral-gray-600)] rounded-lg p-3 text-xs text-[var(--neutral-gray-300)] font-mono z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span>FPS:</span>
                <span className={stats.fps < 30 ? 'text-red-400' : stats.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
                  {stats.fps}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>記憶體:</span>
                <span>{stats.memory}MB</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>渲染時間:</span>
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