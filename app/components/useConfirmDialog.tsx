"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog, type ConfirmTone } from "./ConfirmDialog";

type AskOptions = {
  description?: string;
  confirmLabel?: string;
  tone?: ConfirmTone;
};

type DialogState = AskOptions & {
  open: boolean;
  title: string;
  action: (() => void) | null;
};

/**
 * Small helper so pages can ask for confirmation without each one owning
 * dialog state. Returns props to spread onto <ConfirmDialog />.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: "",
    action: null,
  });

  const ask = useCallback((title: string, action: () => void, options: AskOptions = {}) => {
    setState({ open: true, title, action, ...options });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const confirm = useCallback(() => {
    state.action?.();
    setState((s) => ({ ...s, open: false }));
  }, [state]);

  const dialogProps = {
    open: state.open,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    tone: state.tone,
    onConfirm: confirm,
    onClose: close,
  };

  return { dialogProps, ask };
}
