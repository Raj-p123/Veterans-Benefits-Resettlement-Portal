import React from 'react';
import { Check, Circle, Dot } from 'lucide-react';
import './Timeline.css';

/**
 * Compact SaaS Application Status Timeline Component
 * steps: Array of { label: string, status: 'completed' | 'current' | 'upcoming' | 'rejected', date?: string }
 */
export const Timeline = ({ steps = [], currentStepIndex = 1, isRejected = false }) => {
  return (
    <div className="compact-timeline">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex && !isRejected;
        const isCurrent = idx === currentStepIndex && !isRejected;
        const isUpcoming = idx > currentStepIndex;
        const isFailed = isRejected && idx === currentStepIndex;

        let nodeClass = 'timeline-node-upcoming';
        if (isCompleted) nodeClass = 'timeline-node-completed';
        if (isCurrent) nodeClass = 'timeline-node-current';
        if (isFailed) nodeClass = 'timeline-node-failed';

        return (
          <div key={idx} className="timeline-step">
            <div className="timeline-step-indicator">
              <div className={`timeline-node ${nodeClass}`}>
                {isCompleted && <Check size={12} strokeWidth={3} />}
                {isCurrent && <div className="timeline-pulse-dot" />}
                {isUpcoming && <div className="timeline-empty-dot" />}
                {isFailed && <span style={{ fontSize: '10px', fontWeight: 800 }}>✕</span>}
              </div>
              {idx < steps.length - 1 && (
                <div className={`timeline-connector ${idx < currentStepIndex ? 'connector-active' : ''}`} />
              )}
            </div>
            <div className="timeline-step-label-group">
              <span className={`timeline-step-label ${isCurrent ? 'label-current' : isCompleted ? 'label-completed' : ''}`}>
                {step.label}
              </span>
              {step.date && <span className="timeline-step-date">{step.date}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
