import React, { useState } from 'react';
import { Terminal, Copy, Check, Trash2, ChevronRight } from 'lucide-react';

export function ConsoleView({ consoleOutput, onClearConsole }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = consoleOutput.map(item => item.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="panel-card console-card">
      <div className="panel-header">
        <div className="panel-title text-cyan-300">
          <Terminal size={18} />
          <span>Developer Console Output</span>
        </div>

        <div className="console-actions">
          <button
            onClick={handleCopy}
            className="btn-icon"
            title="Copy Console Output"
            disabled={consoleOutput.length === 0}
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="console-body">
        {consoleOutput.length === 0 ? (
          <div className="empty-console">
            <span className="text-slate-500">// Console output will appear here as statements execute...</span>
          </div>
        ) : (
          <div className="console-lines-list">
            {consoleOutput.map((item, idx) => (
              <div key={item.id || idx} className={`console-line ${item.type === 'error' ? 'log-error' : ''}`}>
                <ChevronRight size={14} className="console-prompt-icon" />
                <span className="log-text">{item.text}</span>
                {item.line && <span className="log-line-ref">Line {item.line}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
