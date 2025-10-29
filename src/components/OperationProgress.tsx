import React, { useState } from 'react';
import { X } from 'lucide-react';
import '../styles/operation-progress.css';

interface OperationProgressProps {
  isVisible: boolean;
  message: string;
  progress?: number; // 0-100, undefined means indeterminate
  canCancel?: boolean;
  onCancel?: () => void;
  subMessage?: string;
}

/**
 * OperationProgress Component
 * Displays a modal with progress information for long-running operations
 * like FFmpeg export, import, or encoding tasks
 */
export const OperationProgress: React.FC<OperationProgressProps> = ({
  isVisible,
  message,
  progress,
  canCancel = true,
  onCancel,
  subMessage,
}) => {
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = () => {
    if (canCancel && onCancel && !isCanceling) {
      setIsCanceling(true);
      onCancel();
      // Reset after operation completes
      setTimeout(() => setIsCanceling(false), 500);
    }
  };

  if (!isVisible) {
    return null;
  }

  const isDeterminate = progress !== undefined;
  const displayProgress = Math.min(100, Math.max(0, progress ?? 0));

  return (
    <div className="operation-progress-overlay">
      <div className="operation-progress-container">
        {/* Header */}
        <div className="operation-progress-header">
          <h3>{message}</h3>
          {canCancel && (
            <button
              className="operation-progress-close"
              onClick={handleCancel}
              disabled={isCanceling}
              aria-label="Cancel operation"
              title="Cancel"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="operation-progress-content">
          {/* Progress Bar */}
          <div className="operation-progress-bar-container">
            {isDeterminate ? (
              <>
                <div className="operation-progress-bar">
                  <div
                    className="operation-progress-fill"
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>
                <div className="operation-progress-percentage">
                  {Math.round(displayProgress)}%
                </div>
              </>
            ) : (
              <div className="operation-progress-indeterminate">
                <div className="operation-progress-animated-bar" />
              </div>
            )}
          </div>

          {/* Sub Message */}
          {subMessage && (
            <p className="operation-progress-submessage">{subMessage}</p>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <button
              className="operation-progress-cancel-btn"
              onClick={handleCancel}
              disabled={isCanceling}
            >
              {isCanceling ? 'Canceling...' : 'Cancel Operation'}
            </button>
          )}
        </div>

        {/* Status Text */}
        <div className="operation-progress-status">
          {isCanceling && <span className="status-canceling">Canceling...</span>}
          {!isCanceling && isDeterminate && (
            <span className="status-processing">Processing...</span>
          )}
          {!isCanceling && !isDeterminate && (
            <span className="status-indeterminate">In Progress</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationProgress;
