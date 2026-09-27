import React, { useState, useEffect, useRef } from 'react';
import { Play, Copy, Trash2, Check, AlertCircle, FileCode, Wand2 } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';

export function CodeEditor({
  code,
  onChangeCode,
  activeLine,
  parseError,
  onRunSimulation,
  isExecuting
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  const lines = code.split('\n');

  // Sync scrolling between textarea and highlighted code view
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    onChangeCode('// Paste or write your JavaScript code here\nconsole.log("Hello Event Loop!");\n');
  };

  return (
    <div className="code-editor-card">
      <div className="editor-toolbar">
        <div className="editor-title">
          <FileCode size={18} className="text-cyan-400" />
          <span>JS Code Input</span>
        </div>

        <div className="editor-actions">
          <button
            onClick={handleClear}
            className="btn-icon"
            title="Clear Code"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={handleCopy}
            className="btn-icon"
            title="Copy Code"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
          <button
            onClick={onRunSimulation}
            className="btn-run-sim"
          >
            <Wand2 size={16} />
            <span>Analyze Execution</span>
          </button>
        </div>
      </div>

      {parseError && (
        <div className="error-banner">
          <AlertCircle size={18} className="error-icon" />
          <div className="error-text">
            <strong>Syntax Error at line {parseError.line}:</strong> {parseError.message}
          </div>
        </div>
      )}

      <div className="editor-container">
        {/* Line Numbers Column with Active Line Indicator */}
        <div className="line-numbers">
          {lines.map((_, index) => {
            const lineNum = index + 1;
            const isActive = activeLine === lineNum;
            return (
              <div
                key={lineNum}
                className={`line-number ${isActive ? 'active-line-num' : ''}`}
              >
                {isActive && <div className="active-line-arrow">▶</div>}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Highlighted Code Display & Interactive Textarea */}
        <div className="editor-wrapper">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            onScroll={handleScroll}
            className="code-textarea"
            placeholder="Paste your JS code here..."
            spellCheck="false"
          />

          <div
            ref={preRef}
            className="code-highlight-overlay"
          >
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isActive = activeLine === lineNum;
              return (
                <div
                  key={idx}
                  className={`code-line-row ${isActive ? 'active-code-line' : ''}`}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: Prism.highlight(
                        lineText || ' ',
                        Prism.languages.javascript,
                        'javascript'
                      )
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
