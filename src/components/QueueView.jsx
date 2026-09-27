import React from 'react';
import { Zap, Clock } from 'lucide-react';

export function QueueView({
  microtaskQueue,
  macrotaskQueue,
  activePointer,
  eventLoopPhase
}) {
  const isMicroActive = activePointer === 'microtask' || eventLoopPhase === 'DRAINING_MICROTASKS';
  const isMacroActive = activePointer === 'macrotask' || eventLoopPhase === 'POPPING_MACROTASK';

  return (
    <div className="queues-wrapper-grid">
      {/* Microtask Queue Box (Higher Priority) */}
      <div className={`panel-card queue-card-micro ${isMicroActive ? 'active-border-purple' : ''}`}>
        <div className="panel-header">
          <div className="panel-title text-purple-400">
            <Zap size={18} />
            <span>Microtask Queue (process.nextTick & Promises)</span>
          </div>
          <div className="queue-tags">
            <span className="priority-pill-high">P1 High Priority</span>
            <span className="panel-count-badge bg-purple-500/20 text-purple-300">
              {microtaskQueue.length}
            </span>
          </div>
        </div>

        <div className="queue-content">
          {microtaskQueue.length === 0 ? (
            <div className="empty-panel-state">
              <span>(Microtask Queue is Empty)</span>
            </div>
          ) : (
            <div className="queue-items-list">
              {microtaskQueue.map((item, idx) => {
                const isNextTick = item.type === 'process.nextTick';
                return (
                  <div
                    key={item.id || idx}
                    className={`queue-item-card micro-item ${idx === 0 ? 'head-item' : ''}`}
                  >
                    <div className="queue-item-header">
                      <span className={`item-badge ${isNextTick ? 'bg-pink-500/40 text-pink-200 border border-pink-500/50' : 'micro-badge'}`}>
                        {isNextTick ? '⚡ NEXT TICK (TOP)' : idx === 0 ? '▶ NEXT MICRO' : `#${idx + 1}`}
                      </span>
                      <strong className="item-label text-purple-200">{item.label}</strong>
                    </div>
                    {item.code && (
                      <div className="queue-item-code text-purple-300/80">
                        {item.code}
                      </div>
                    )}
                    <div className="queue-item-meta">
                      <span>Origin: Line {item.sourceLine || 1}</span>
                      <span className="type-tag">{item.type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Macrotask Queue Box (Task Queue) */}
      <div className={`panel-card queue-card-macro ${isMacroActive ? 'active-border-amber' : ''}`}>
        <div className="panel-header">
          <div className="panel-title text-amber-400">
            <Clock size={18} />
            <span>Macrotask Queue (setTimeout & setImmediate)</span>
          </div>
          <div className="queue-tags">
            <span className="priority-pill-normal">P2 Callback Queue</span>
            <span className="panel-count-badge bg-amber-500/20 text-amber-300">
              {macrotaskQueue.length}
            </span>
          </div>
        </div>

        <div className="queue-content">
          {macrotaskQueue.length === 0 ? (
            <div className="empty-panel-state">
              <span>(Macrotask Queue is Empty)</span>
            </div>
          ) : (
            <div className="queue-items-list">
              {macrotaskQueue.map((item, idx) => {
                const isImmediate = item.type === 'setImmediate';
                return (
                  <div
                    key={item.id || idx}
                    className={`queue-item-card macro-item ${idx === 0 ? 'head-item' : ''}`}
                  >
                    <div className="queue-item-header">
                      <span className={`item-badge ${isImmediate ? 'bg-orange-500/40 text-orange-200 border border-orange-500/50' : 'macro-badge'}`}>
                        {isImmediate ? '⏰ SET IMMEDIATE' : idx === 0 ? '▶ NEXT MACRO' : `#${idx + 1}`}
                      </span>
                      <strong className="item-label text-amber-200">{item.label}</strong>
                    </div>
                    {item.code && (
                      <div className="queue-item-code text-amber-300/80">
                        {item.code}
                      </div>
                    )}
                    <div className="queue-item-meta">
                      <span>Origin: Line {item.sourceLine || 1}</span>
                      <span className="type-tag">{item.type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
