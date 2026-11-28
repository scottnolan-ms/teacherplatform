import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export default function CreationDialog({ children, label, kind = 'builder', onClose }: {
  children: ReactNode;
  label: string;
  kind?: 'builder' | 'drawer';
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialog} className={`tc-create-dialog tc-create-${kind}`} aria-label={label}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    {children}
  </dialog>, document.body);
}
