import React from 'react';
import { WifiOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { FriendlyError } from '../../utils/errorHandler';

interface FriendlyNoticeProps {
  error?: FriendlyError | null;
  type?: 'offline' | 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const FriendlyNotice: React.FC<FriendlyNoticeProps> = ({
  error,
  type = 'info',
  title,
  message,
  actionText,
  onAction,
  className = ''
}) => {
  const finalType = error?.isOfflineRelated ? 'offline' : (error ? 'error' : type);
  const finalTitle = error?.title || title;
  const finalMessage = error?.message || message;
  const finalActionText = error?.actionText || actionText;

  if (!finalMessage) return null;

  const renderIcon = () => {
    switch (finalType) {
      case 'offline':
        return <WifiOff size={20} className="notice-icon text-slate-400" />;
      case 'error':
        return <AlertCircle size={20} className="notice-icon text-rose-400" />;
      case 'success':
        return <CheckCircle size={20} className="notice-icon text-emerald-400" />;
      default:
        return <Info size={20} className="notice-icon text-blue-400" />;
    }
  };

  return (
    <div className={`notice notice-${finalType} ${className}`}>
      {renderIcon()}
      <div style={{ flex: 1 }}>
        {finalTitle && <div style={{ fontWeight: 700, marginBottom: '2px' }}>{finalTitle}</div>}
        <div>{finalMessage}</div>
      </div>
      {finalActionText && onAction && (
        <button
          onClick={onAction}
          className="btn btn-secondary btn-sm"
          style={{ alignSelf: 'center', marginLeft: 'var(--space-2)' }}
        >
          {finalActionText}
        </button>
      )}
    </div>
  );
};
