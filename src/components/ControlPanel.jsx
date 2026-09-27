import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, Zap } from 'lucide-react';

export function ControlPanel({
  isPlaying,
  onTogglePlay,
  onStepNext,
  onStepPrev,
  onReset,
  currentStepIndex,
  totalSteps,
  speed,
  onChangeSpeed,
  onSeekStep
}) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const speeds = [
    { label: '0.25x', value: 2000 },
    { label: '0.5x', value: 1200 },
    { label: '1x', value: 750 },
    { label: '2x', value: 400 },
    { label: '4x', value: 150 }
  ];

  return (
    <div className="control-panel-card">
      <div className="controls-row">
        {/* Playback Action Buttons */}
        <div className="playback-buttons">
          <button
            onClick={onReset}
            className="btn-ctrl btn-ctrl-secondary"
            title="Reset to Step 1"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={onStepPrev}
            disabled={isFirstStep}
            className="btn-ctrl btn-ctrl-secondary"
            title="Previous Step"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={onTogglePlay}
            className={`btn-ctrl btn-ctrl-play ${isPlaying ? 'playing' : ''}`}
            title={isPlaying ? 'Pause Playback' : 'Auto-Play Simulation'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>

          <button
            onClick={onStepNext}
            disabled={isLastStep}
            className="btn-ctrl btn-ctrl-secondary"
            title="Next Step"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="scrubber-container">
          <div className="scrubber-header">
            <span className="scrubber-label">Timeline Scrubber</span>
            <span className="scrubber-val">
              Step {totalSteps > 0 ? currentStepIndex + 1 : 0} / {totalSteps}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={(e) => onSeekStep(Number(e.target.value))}
            className="timeline-slider"
          />
        </div>

        {/* Speed Selector */}
        <div className="speed-selector-group">
          <div className="speed-title">
            <Gauge size={15} className="text-cyan-400" />
            <span>Speed:</span>
          </div>
          <div className="speed-buttons">
            {speeds.map((s) => (
              <button
                key={s.label}
                onClick={() => onChangeSpeed(s.value)}
                className={`btn-speed ${speed === s.value ? 'active-speed' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
