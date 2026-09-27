import React from 'react';
import { Globe, Clock, Timer } from 'lucide-react';

export function WebApisView({ webApis, activePointer }) {
  const isActive = activePointer === 'webapi';

  return (
    <div className={`panel-card ${isActive ? 'active-border-emerald' : ''}`}>
      <div className="panel-header">
        <div className="panel-title text-emerald-400">
          <Globe size={18} />
          <span>Web APIs (Browser Background Threads)</span>
        </div>
        <span className="panel-count-badge bg-emerald-500/20 text-emerald-300">
          {webApis.length} Timer{webApis.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="webapi-container">
        {webApis.length === 0 ? (
          <div className="empty-panel-state">
            <span>(No Web API timers or background ops active)</span>
          </div>
        ) : (
          <div className="webapi-list">
            {webApis.map((item) => (
              <div key={item.id} className="webapi-card glow-emerald-subtle">
                <div className="webapi-header">
                  <div className="webapi-label text-emerald-300">
                    <Timer size={16} className="animate-spin-slow" />
                    <strong>{item.label}</strong>
                  </div>
                  <span className="delay-badge">{item.delay}ms Delay</span>
                </div>
                {item.codeStr && (
                  <div className="webapi-code">
                    {item.codeStr}
                  </div>
                )}
                <div className="webapi-footer">
                  <span>Thread: Browser Web API</span>
                  <span className="line-ref">Line {item.line}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
