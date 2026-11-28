import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './success-toast.css';

export function SuccessToast({ title, description, action, dismissLabel = 'Dismiss notification', duration = 10000, onDismiss }: {
  title: string;
  description?: string;
  action?: ReactNode;
  dismissLabel?: string;
  duration?: number | null;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useRef(onDismiss);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => { dismiss.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    const toast = ref.current;
    toast?.showPopover();
    return () => { if (toast?.matches(':popover-open')) toast.hidePopover(); };
  }, []);
  useEffect(() => {
    if (duration === null || hovered || focused) return;
    const timer = window.setTimeout(() => dismiss.current(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, title, hovered, focused]);

  return <div ref={ref} popover="manual" className="ds-success-toast"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <i className="ds-success-toast-symbol" aria-hidden="true"/>
    <div className="ds-success-toast-content">
      <div role="status" aria-live="polite" aria-atomic="true"><strong>{title}</strong>{description && <p>{description}</p>}</div>
      {action && <div className="ds-success-toast-action">{action}</div>}
    </div>
    <button type="button" className="ds-success-toast-dismiss" aria-label={dismissLabel} onClick={onDismiss}><i aria-hidden="true"/></button>
  </div>;
}
