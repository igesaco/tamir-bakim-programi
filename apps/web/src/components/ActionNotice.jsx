import { useEffect, useState } from 'react';

function Notice({ text, error }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (error) return undefined;
    const timer = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(timer);
  }, [error]);

  if (!visible) return null;

  return (
    <div className={`action-notice ${error ? 'action-notice-error' : 'action-notice-success'}`}
      role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'}>
      <span aria-hidden="true" className="action-notice-icon">{error ? '!' : '✓'}</span>
      <div><strong>{error ? 'İşlem tamamlanamadı' : 'İşlem başarılı'}</strong><span>{text}</span></div>
      <button type="button" aria-label="Bildirimi kapat" onClick={() => setVisible(false)}>×</button>
    </div>
  );
}

export default function ActionNotice({ message, error }) {
  const text = error || message;
  return text ? <Notice key={`${error ? 'error' : 'success'}:${text}`} text={text} error={Boolean(error)} /> : null;
}
