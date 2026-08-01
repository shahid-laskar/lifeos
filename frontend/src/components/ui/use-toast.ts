import { useState, useCallback } from "react";

export type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);

  const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
    const id = ++toastCount;
    const newToast = { id, title, description, variant };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 10 seconds (per design policy for undo toasts)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 10000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}
