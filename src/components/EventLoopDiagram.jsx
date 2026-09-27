import React from 'react';
import { Layers, Globe, Zap, Clock, Activity, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Compass } from 'lucide-react';

export function EventLoopDiagram({ currentStep }) {
  if (!currentStep) return null;

  const { eventLoopState, callStack, webApis, microtaskQueue, macrotaskQueue, type } = currentStep;
  const { phase, activePointer, activePhaseDescription } = eventLoopState;

  // Determine active component states
  const isStackActive = activePointer === 'stack' || callStack.length > 0;
  const isWebApiActive = activePointer === 'webapi' || webApis.length > 0;
  const isMicroActive = activePointer === 'microtask' || phase === 'DRAINING_MICROTASKS';
  const isMacroActive = activePointer === 'macrotask' || phase === 'POPPING_MACROTASK';

  // Calculate physical rotation angle of the Event Loop Compass Pointer
  // Top-Left (Call Stack): -135deg
  // Top-Right (Web APIs): 45deg
  // Bottom-Left (Microtask Queue): -45deg
  // Bottom-Right (Macrotask Queue): 135deg
  let pointerAngle = 0;
  let targetLabel = 'Idle';
  let targetColor = 'text-amber-400';

  if (activePointer === 'stack' || phase === 'CALL_STACK') {
    pointerAngle = -135;
    targetLabel = 'Call Stack';
    targetColor = 'text-cyan-400';
  } else if (activePointer === 'webapi') {
    pointerAngle = 45;
    targetLabel = 'Web APIs Thread';
    targetColor = 'text-emerald-400';
  } else if (activePointer === 'microtask' || phase === 'DRAINING_MICROTASKS') {
    pointerAngle = -45;
    targetLabel = 'Microtask Queue';
    targetColor = 'text-purple-400';
  } else if (activePointer === 'macrotask' || phase === 'POPPING_MACROTASK' || phase === 'CHECKING_MACRO_QUEUE') {
    pointerAngle = 135;
    targetLabel = 'Macrotask Queue';
    targetColor = 'text-amber-400';
  }

  // Active Flow Connectors
  const flowStackToWeb = activePointer === 'webapi';
  const flowWebToMacro = type === 'webapi';
  const flowMicroToStack = activePointer === 'microtask' || phase === 'DRAINING_MICROTASKS';
  const flowMacroToStack = activePointer === 'macrotask' || phase === 'POPPING_MACROTASK';

  return (
    <div className="event-loop-card">
      <div className="card-header">
        <div className="header-title">
          <Activity className="header-icon text-cyan-400" />
          <span>JS Event Loop Architecture Map</span>
        </div>
        
        <div className="pointer-status-pill">
          <Compass className="animate-spin-slow text-amber-400" size={16} />
          <span>Pointer Target: <strong className={targetColor}>{targetLabel}</strong></span>
        </div>
      </div>

      <div className="diagram-grid">
        {/* Row 1, Col 1: Call Stack Box */}
        <div className={`diagram-box box-stack ${isStackActive ? 'glow-cyan active-target' : ''}`}>
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
          {isStackActive && <div className="active-pointer-indicator bg-cyan-500">ACTIVE</div>}
        </div>

        {/* Row 1, Col 2: Flow Arrow Stack -> Web APIs */}
        <div className="flow-connector connector-top">
          <span className="connector-label">Web API Call</span>
          <ArrowRight className={`connector-arrow ${flowStackToWeb ? 'active-flow' : ''}`} />
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
          {activePointer === 'webapi' && <div className="active-pointer-indicator bg-emerald-500">REGISTERING TIMER</div>}
        </div>

        {/* Row 2, Col 1: Microtask Queue Box */}
        <div className={`diagram-box box-microtask ${isMicroActive ? 'glow-purple active-target' : ''}`}>
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
          {isMicroActive && <div className="active-pointer-indicator bg-purple-500">DRAINING MICROTASKS</div>}
        </div>

        {/* Row 2, Col 2: Central Event Loop Wheel & Dynamic Pointer */}
        <div className="event-loop-wheel-container">
          <div
            className={`event-loop-wheel ${phase !== 'IDLE' && phase !== 'FINISHED' ? 'spinning-active' : ''}`}
            style={{ transform: `rotate(${pointerAngle}deg)` }}
          >
            {/* Top Pointer Laser Needle */}
            <div className="wheel-pointer-needle"></div>
            <div className="wheel-inner">
              <Zap size={22} className="text-amber-400" />
            </div>
          </div>
          <div className="wheel-label">EVENT LOOP</div>
          <span className="wheel-sublabel">{activePhaseDescription || phase}</span>
        </div>

        {/* Row 2, Col 3: Macrotask Queue Box */}
        <div className={`diagram-box box-macrotask ${isMacroActive ? 'glow-amber active-target' : ''}`}>
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
          {isMacroActive && <div className="active-pointer-indicator bg-amber-500">POPPING MACROTASK</div>}
        </div>
      </div>
    </div>
  );
}
