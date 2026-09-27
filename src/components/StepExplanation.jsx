import React from 'react';
import { Info, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

export function StepExplanation({ currentStep }) {
  if (!currentStep) return null;

  const { description, detailedExplanation, type, line, eventLoopState } = currentStep;

  const typeColorMap = {
    sync: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
    webapi: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
    microtask: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
    macrotask: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
    eventloop_check: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300',
    finished: 'border-emerald-500/50 bg-emerald-900/30 text-emerald-200'
  };

  const cardStyle = typeColorMap[type] || 'border-slate-700 bg-slate-900/50 text-slate-300';

  return (
    <div className={`explanation-card ${cardStyle}`}>
      <div className="explanation-header">
        <div className="title-group">
          <Sparkles className="sparkle-icon" size={18} />
          <strong>Step Explanation</strong>
          <span className="line-pill">Line {line}</span>
        </div>
        <span className="type-badge">{type.toUpperCase()} PHASE</span>
      </div>

      <div className="explanation-body">
        <h4 className="step-summary-title">{description}</h4>
        <p className="step-detail-p">{detailedExplanation}</p>
      </div>

      {eventLoopState && eventLoopState.activePhaseDescription && (
        <div className="explanation-footer">
          <Lightbulb size={15} className="tip-icon text-amber-400" />
          <span><strong>Event Loop State:</strong> {eventLoopState.activePhaseDescription}</span>
        </div>
      )}
    </div>
  );
}
