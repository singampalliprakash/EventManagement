import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

export const EVENT_ICONS = {
  birthday: '🎂',
  wedding: '💒',
  engagement: '💍',
  baby_shower: '👶',
  anniversary: '❤️',
  housewarming: '🏠',
  corporate: '💼',
  other: '🎉',
};

export const EVENT_LABELS = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  engagement: 'Engagement',
  baby_shower: 'Baby Shower',
  anniversary: 'Anniversary',
  housewarming: 'Housewarming',
  corporate: 'Corporate',
  other: 'Other',
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
