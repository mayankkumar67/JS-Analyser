import React from 'react';
import { Database, Binary, Variable } from 'lucide-react';

export function VariablesView({ variables }) {
  const keys = Object.keys(variables || {});

  return (
    <div className="panel-card variables-card">
      <div className="panel-header">
        <div className="panel-title text-indigo-400">
          <Database size={18} />
          <span>Scope & Memory Heap Inspector</span>
        </div>
        <span className="panel-count-badge bg-indigo-500/20 text-indigo-300">
          {keys.length} Symbol{keys.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="variables-body">
        {keys.length === 0 ? (
          <div className="empty-panel-state">
            <span>(No variables declared in current scope)</span>
          </div>
        ) : (
          <div className="variables-table">
            <div className="table-header">
              <span>Identifier</span>
              <span>Value State</span>
            </div>
            <div className="table-rows">
              {keys.map((key) => {
                const val = variables[key];
                const isFunc = typeof val === 'string' && val.startsWith('<function');
                return (
                  <div key={key} className="var-row">
                    <div className="var-name">
                      <span className="var-icon">{isFunc ? 'ƒ' : 'var'}</span>
                      <strong>{key}</strong>
                    </div>
                    <div className="var-value">
                      {isFunc ? (
                        <span className="val-func">{val}</span>
                      ) : (
                        <span className="val-primitive">{JSON.stringify(val)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
