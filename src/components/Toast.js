import React, { useState, useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      padding: '12px 18px',
      background: 'var(--ink)',
      color: 'var(--paper)',
      borderRadius: '3px',
      borderLeft: `3px solid ${type === 'success' ? 'var(--jade-lt)' : type === 'error' ? 'var(--crimson-lt)' : type === 'info' ? 'var(--sky-lt)' : 'var(--gold)'}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      animation: 'toastIn 0.25s ease',
      maxWidth: '340px'
    }}>
      {message}
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999
    }}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
export default ToastContainer;