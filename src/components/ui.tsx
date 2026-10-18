"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon, XIcon } from "@/components/icons";

/* ---------------- avatars & art ---------------- */

export function Avatar({
  emoji,
  gradient,
  size = 40,
  ring = false,
  className = "",
}: {
  emoji: string;
  gradient: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${ring ? "avatars" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: gradient,
        fontSize: Math.max(13, Math.round(size * 0.46)),
        boxShadow: ring ? undefined : "inset 0 0 0 1px rgba(255,255,255,0.16)",
      }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}

export function GradientArt({
  gradient,
  emoji,
  imageUrl,
  className = "",
  label,
  children,
}: {
  gradient: string;
  emoji: string;
  imageUrl?: string | null;
  className?: string;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`noise relative isolate overflow-hidden ${className}`}
      style={{ backgroundImage: gradient }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={label ?? ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <>
          <span className="pointer-events-none absolute -top-8 -right-6 text-[7rem] opacity-25 blur-[1px]">{emoji}</span>
          <span className="pointer-events-none absolute -bottom-10 left-2 text-[6rem] opacity-20">{emoji}</span>
        </>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
      {children ?? (
        <span className="absolute bottom-3 left-3 text-2xl drop-shadow-lg">{emoji}</span>
      )}
    </div>
  );
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      <div
        className={`animate-pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
        style={{ background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 id={titleId} className="font-display text-lg font-bold">
              {title}
            </h2>
            {subtitle ? <p className="muted mt-0.5 text-xs">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close">
            <XIcon size={16} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- toasts ---------------- */

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ToastContextValue = { push: (message: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastContextValue>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-pop glass pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg"
            style={{
              color: toast.tone === "error" ? "#fb7185" : toast.tone === "info" ? "var(--text)" : "var(--text)",
            }}
            role="status"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
              style={{
                background:
                  toast.tone === "error" ? "rgba(244,63,94,0.18)" : toast.tone === "info" ? "var(--panel-3)" : "var(--accent-soft)",
                color: toast.tone === "error" ? "#fb7185" : "var(--accent)",
              }}
            >
              {toast.tone === "error" ? "!" : toast.tone === "info" ? "i" : <CheckIcon size={12} />}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ---------------- misc ---------------- */

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="text-4xl">{emoji}</span>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="muted max-w-sm text-sm">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          push("Copied to clipboard");
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          push("Could not copy — select the text manually", "error");
        }
      }}
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`progress ${className}`}>
      <span style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState(false);
  return { pending, setPending };
}
