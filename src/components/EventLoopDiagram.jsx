import React from 'react';
import { Layers, Globe, Zap, Clock, Activity, ArrowRight } from 'lucide-react';

export function EventLoopDiagram({ currentStep }) {
  if (!currentStep) return null;

  const { eventLoopState, callStack, webApis, microtaskQueue, macrotaskQueue } = currentStep;
  const { phase, activePointer, activePhaseDescription } = eventLoopState;

  const isStackActive = activePointer === 'stack' || callStack.length > 0;
  const isWebApiActive = activePointer === 'webapi' || webApis.length > 0;
  const isMicroActive = activePointer === 'microtask' || phase === 'DRAINING_MICROTASKS';
  const isMacroActive = activePointer === 'macrotask' || phase === 'POPPING_MACROTASK';

  return (
    <div className="event-loop-card">
      <div className="card-header">
        <div className="header-title">
          <Activity className="header-icon text-cyan-400" />
          <span>JS Event Loop Architecture Map</span>
        </div>
        <div className={`status-pill phase-${phase.toLowerCase()}`}>
          <span className="pulse-dot"></span>
          <span>{activePhaseDescription || phase}</span>
        </div>
      </div>

      <div className="diagram-grid">
        {/* Row 1, Col 1: Call Stack Box */}
        <div className={`diagram-box box-stack ${isStackActive ? 'glow-cyan' : ''}`}>
          <div className="box-title text-cyan-400">
            <div className="title-left">
              <Layers size={16} />
              <span>Call Stack</span>
            </div>
            <span className="box-badge">{callStack.length}</span>
          </div>
          <div className="box-preview">
            {callStack.length === 0 ? (
              <span className="empty-hint">Stack is Empty</span>
            ) : (
              <div className="preview-top-frame">
                ▶ {callStack[callStack.length - 1].name}
              </div>
            )}
          </div>
        </div>

        {/* Row 1, Col 2: Arrow Stack -> Web APIs */}
        <div className="flow-connector connector-top">
          <span className="connector-label">Web API Call</span>
          <ArrowRight className={`connector-arrow ${activePointer === 'webapi' ? 'active-flow' : ''}`} />
        </div>

        {/* Row 1, Col 3: Web APIs Box */}
        <div className={`diagram-box box-webapi ${isWebApiActive ? 'glow-emerald' : ''}`}>
          <div className="box-title text-emerald-400">
            <div className="title-left">
              <Globe size={16} />
              <span>Web APIs</span>
            </div>
            <span className="box-badge bg-emerald-500/20 text-emerald-400">{webApis.length}</span>
          </div>
          <div className="box-preview">
            {webApis.length === 0 ? (
              <span className="empty-hint">No active timers</span>
            ) : (
              <div className="preview-item text-emerald-300">
                ⏳ {webApis[0].label}
              </div>
            )}
          </div>
        </div>

        {/* Row 2, Col 1: Microtask Queue Box */}
        <div className={`diagram-box box-microtask ${isMicroActive ? 'glow-purple' : ''}`}>
          <div className="box-title text-purple-400">
            <div className="title-left">
              <Zap size={16} />
              <span>Microtask Queue</span>
            </div>
            <span className="box-badge bg-purple-500/20 text-purple-400">{microtaskQueue.length}</span>
          </div>
          <div className="queue-priority-tag">High Priority (Job Queue)</div>
          <div className="box-preview">
            {microtaskQueue.length === 0 ? (
              <span className="empty-hint">Empty Queue</span>
            ) : (
              <div className="preview-item text-purple-300">
                ⚡ {microtaskQueue[0].label}
              </div>
            )}
          </div>
        </div>

        {/* Row 2, Col 2: Central Event Loop Spinner */}
        <div className="event-loop-wheel-container">
          <div className={`event-loop-wheel ${phase !== 'IDLE' && phase !== 'FINISHED' ? 'spinning' : ''}`}>
            <div className="wheel-inner">
              <Zap size={22} className="text-amber-400" />
            </div>
          </div>
          <div className="wheel-label">EVENT LOOP</div>
        </div>

        {/* Row 2, Col 3: Macrotask Queue Box */}
        <div className={`diagram-box box-macrotask ${isMacroActive ? 'glow-amber' : ''}`}>
          <div className="box-title text-amber-400">
            <div className="title-left">
              <Clock size={16} />
              <span>Macrotask Queue</span>
            </div>
            <span className="box-badge bg-amber-500/20 text-amber-400">{macrotaskQueue.length}</span>
          </div>
          <div className="queue-priority-tag amber-tag">Task Queue</div>
          <div className="box-preview">
            {macrotaskQueue.length === 0 ? (
              <span className="empty-hint">Empty Queue</span>
            ) : (
              <div className="preview-item text-amber-300">
                ⏰ {macrotaskQueue[0].label}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
