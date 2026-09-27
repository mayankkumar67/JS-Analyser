import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { ControlPanel } from './components/ControlPanel';
import { EventLoopDiagram } from './components/EventLoopDiagram';
import { CallStackView } from './components/CallStackView';
import { WebApisView } from './components/WebApisView';
import { QueueView } from './components/QueueView';
import { ConsoleView } from './components/ConsoleView';
import { VariablesView } from './components/VariablesView';
import { StepExplanation } from './components/StepExplanation';
import { HelpModal } from './components/HelpModal';

import { CODE_PRESETS } from './presets/codeExamples';
import { parseAndGenerateSteps } from './engine/jsInterpreter';

export default function App() {
  const [selectedPresetId, setSelectedPresetId] = useState(CODE_PRESETS[0].id);
  const [code, setCode] = useState(CODE_PRESETS[0].code);

  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [parseError, setParseError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const timerRef = useRef(null);

  // Initialize simulation when code or preset changes
  useEffect(() => {
    runAnalysis(code);
  }, []);

  const runAnalysis = (codeToRun) => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const result = parseAndGenerateSteps(codeToRun);
    if (result.success) {
      setParseError(null);
      setSteps(result.steps);
      setCurrentStepIndex(0);
    } else {
      setParseError(result.error);
      setSteps(result.steps || []);
      setCurrentStepIndex(0);
    }
  };

  const handleSelectPreset = (presetId) => {
    const preset = CODE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setCode(preset.code);
      runAnalysis(preset.code);
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    runAnalysis(newCode);
  };

  // Playback controls
  const handleStepNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (nextIndex === steps.length - 1 && steps[nextIndex]?.type === 'finished') {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleStepPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleTogglePlay = () => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Auto-play timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          if (prevIndex < steps.length - 1) {
            const nextIdx = prevIndex + 1;
            if (nextIdx === steps.length - 1 && steps[nextIdx]?.type === 'finished') {
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
              setIsPlaying(false);
            }
            return nextIdx;
          } else {
            setIsPlaying(false);
            return prevIndex;
          }
        });
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps]);

  const currentStep = steps[currentStepIndex] || null;
  const activeLine = currentStep ? currentStep.line : 1;

  return (
    <div className="app-layout">
      {/* Header Bar */}
      <Header
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenHelp={() => setIsHelpOpen(true)}
        stepCount={steps.length}
        currentStepIndex={currentStepIndex}
        isFinished={currentStep?.type === 'finished'}
      />

      {/* Main Grid Content */}
      <main className="main-container">
        {/* Left Side: Code Editor & Execution Controls */}
        <section className="left-pane">
          <CodeEditor
            code={code}
            onChangeCode={handleCodeChange}
            activeLine={activeLine}
            parseError={parseError}
            onRunSimulation={() => runAnalysis(code)}
            isExecuting={isPlaying}
          />

          <ControlPanel
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStepNext={handleStepNext}
            onStepPrev={handleStepPrev}
            onReset={handleReset}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            speed={speed}
            onChangeSpeed={setSpeed}
            onSeekStep={setCurrentStepIndex}
          />

          <StepExplanation currentStep={currentStep} />
        </section>

        {/* Right Side: Event Loop Visualizer Board */}
        <section className="right-pane">
          {/* Architecture Map & Spinner */}
          <EventLoopDiagram currentStep={currentStep} />

          {/* Grid of Call Stack & Web APIs */}
          <div className="runtime-grid-top">
            <CallStackView
              frames={currentStep ? currentStep.callStack : []}
              activePointer={currentStep ? currentStep.eventLoopState.activePointer : 'none'}
            />
            <WebApisView
              webApis={currentStep ? currentStep.webApis : []}
              activePointer={currentStep ? currentStep.eventLoopState.activePointer : 'none'}
            />
          </div>

          {/* Microtask & Macrotask Queues */}
          <QueueView
            microtaskQueue={currentStep ? currentStep.microtaskQueue : []}
            macrotaskQueue={currentStep ? currentStep.macrotaskQueue : []}
            activePointer={currentStep ? currentStep.eventLoopState.activePointer : 'none'}
            eventLoopPhase={currentStep ? currentStep.eventLoopState.phase : 'IDLE'}
          />

          {/* Console Output & Scope Variables Inspector */}
          <div className="runtime-grid-bottom">
            <ConsoleView
              consoleOutput={currentStep ? currentStep.consoleOutput : []}
              onClearConsole={() => {}}
            />
            <VariablesView
              variables={currentStep ? currentStep.variables : {}}
            />
          </div>
        </section>
      </main>

      {/* Educational Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
