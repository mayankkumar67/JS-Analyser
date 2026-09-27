import React from 'react';
import { Layers, ChevronRight, CornerDownRight } from 'lucide-react';

export function CallStackView({ frames, activePointer }) {
  const isStackActive = activePointer === 'stack';

  return (
    <div className={`panel-card ${isStackActive ? 'active-border-cyan' : ''}`}>
      <div className="panel-header">
        <div className="panel-title text-cyan-400">
          <Layers size={18} />
          <span>Call Stack</span>
        </div>
        <span className="panel-count-badge">{frames.length} Frame{frames.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="stack-container">
        {frames.length === 0 ? (
          <div className="empty-panel-state">
            <span>(Call Stack is Empty)</span>
          </div>
        ) : (
          <div className="stack-frames-list">
            {/* Displaying frames top of stack first (LIFO order) */}
            {[...frames].reverse().map((frame, index) => {
              const isTop = index === 0;
              return (
                <div
                  key={frame.id || index}
                  className={`stack-frame-card ${isTop ? 'top-frame' : ''}`}
                >
                  <div className="frame-meta">
                    <div className="frame-name">
                      {isTop ? <ChevronRight className="top-indicator animate-pulse text-cyan-400" size={16} /> : <CornerDownRight size={14} className="text-slate-500" />}
                      <strong>{frame.name}</strong>
                    </div>
                    {frame.line && <span className="frame-line-badge">Line {frame.line}</span>}
                  </div>
                  {frame.code && (
                    <div className="frame-code-snippet">
                      {frame.code}
                    </div>
                  )}
                  {isTop && <span className="top-stack-label">ACTIVE EXECUTING FRAME</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
