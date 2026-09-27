import React from 'react';
import { X, Layers, Globe, Zap, Clock, Activity, CheckCircle } from 'lucide-react';

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Activity className="text-cyan-400" size={20} />
            <h2>Understanding the JavaScript Event Loop</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="help-section">
            <h3>🔑 The Core Rule of Event Loop</h3>
            <p>JavaScript is a single-threaded runtime. To handle asynchronous operations without blocking the main thread, V8 and browser engines rely on the Event Loop mechanism.</p>
          </div>

          <div className="concepts-grid">
            <div className="concept-card border-cyan-500/30">
              <div className="concept-title text-cyan-400">
                <Layers size={18} />
                <span>1. Call Stack</span>
              </div>
              <p>LIFO (Last In, First Out) stack. Executes synchronous code line-by-line. Functions must finish and pop off before anything else can execute.</p>
            </div>

            <div className="concept-card border-emerald-500/30">
              <div className="concept-title text-emerald-400">
                <Globe size={18} />
                <span>2. Web APIs</span>
              </div>
              <p>Background threads provided by the browser (e.g., <code>setTimeout</code> timers, <code>fetch</code>, DOM event listeners). They run outside the JS thread.</p>
            </div>

            <div className="concept-card border-purple-500/30">
              <div className="concept-title text-purple-400">
                <Zap size={18} />
                <span>3. Microtask Queue (High Priority)</span>
              </div>
              <p>Contains <code>Promise.then()</code> callbacks, <code>async/await</code> continuations, and <code>queueMicrotask()</code>. Handled immediately after call stack empties!</p>
            </div>

            <div className="concept-card border-amber-500/30">
              <div className="concept-title text-amber-400">
                <Clock size={18} />
                <span>4. Macrotask Queue (Task Queue)</span>
              </div>
              <p>Contains <code>setTimeout</code> and <code>setInterval</code> callbacks. The Event Loop processes only <strong>ONE</strong> macrotask per tick, then re-checks Microtasks!</p>
            </div>
          </div>

          <div className="execution-order-box">
            <h4>🔄 Event Loop Order Algorithm:</h4>
            <ol className="algorithm-list">
              <li>
                <CheckCircle size={16} className="text-cyan-400 inline mr-2" />
                <strong>Step 1:</strong> Execute all synchronous code in Call Stack until empty.
              </li>
              <li>
                <CheckCircle size={16} className="text-purple-400 inline mr-2" />
                <strong>Step 2:</strong> Check Microtask Queue. Drain <strong>ALL</strong> microtasks completely!
              </li>
              <li>
                <CheckCircle size={16} className="text-emerald-400 inline mr-2" />
                <strong>Step 3:</strong> Perform Browser Render Update (if DOM repainting is needed).
              </li>
              <li>
                <CheckCircle size={16} className="text-amber-400 inline mr-2" />
                <strong>Step 4:</strong> Pop <strong>ONE</strong> callback from Macrotask Queue to Call Stack.
              </li>
              <li>
                <CheckCircle size={16} className="text-indigo-400 inline mr-2" />
                <strong>Step 5:</strong> Repeat process continuous loop!
              </li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-modal-close">
            Got it, Let's Visualize!
          </button>
        </div>
      </div>
    </div>
  );
}
