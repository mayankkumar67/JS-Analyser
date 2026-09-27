import React from 'react';
import { Play, Sparkles, HelpCircle, Code2, RotateCcw, Flame } from 'lucide-react';
import { CODE_PRESETS } from '../presets/codeExamples';

export function Header({
  selectedPresetId,
  onSelectPreset,
  onReset,
  onOpenHelp,
  stepCount,
  currentStepIndex,
  isFinished
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-badge">
          <Flame className="logo-icon text-cyan-400" />
          <span className="logo-title">JS Event Loop <span className="highlight-text">Visualizer</span></span>
        </div>
        <span className="version-pill">v2.0 • Interactive AST Stepper</span>
      </div>

      <div className="header-center">
        <div className="preset-selector-container">
          <Code2 className="preset-icon" />
          <select
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="preset-dropdown"
          >
            <option value="" disabled>-- Select JS Presets --</option>
            {CODE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title} ({preset.difficulty})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-right">
        {stepCount > 0 && (
          <div className="step-counter-badge">
            <span className="step-dot animate-pulse"></span>
            Step <strong className="step-num">{currentStepIndex + 1}</strong> of <strong>{stepCount}</strong>
          </div>
        )}

        <button
          onClick={onReset}
          className="btn-header-secondary"
          title="Reset Simulation"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="btn-header-primary"
          title="How Event Loop Works"
        >
          <HelpCircle size={16} />
          <span>Guide</span>
        </button>
      </div>
    </header>
  );
}
