"use client";

import { Button } from "@/components/ui/button";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { cn } from "@/lib/utils/cn";
import { useCallback, useRef, useState } from "react";

const ANIMATION_DURATION_MS = 200;

export interface InlineConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  confirming?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  dataSlot?: string;
  cancelDataSlot?: string;
  confirmDataSlot?: string;
}

export function InlineConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirming = false,
  onConfirm,
  onOpenChange,
  dataSlot,
  cancelDataSlot,
  confirmDataSlot,
}: InlineConfirmDialogProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeFallbackRef = useRef<number | null>(null);
  const hasFinishedCloseRef = useRef(false);

  if (open && isClosing) setIsClosing(false);

  const isDisplayed = open || isClosing;

  /** Cancel the pending close animation timeout, if any. */
  const clearCloseFallback = () => {
    if (closeFallbackRef.current !== null) {
      window.clearTimeout(closeFallbackRef.current);
      closeFallbackRef.current = null;
    }
  };

  /** Complete the close animation and notify the parent. */
  const finishClose = useCallback(() => {
    if (hasFinishedCloseRef.current) return;

    hasFinishedCloseRef.current = true;
    clearCloseFallback();
    onOpenChange(false);
    setIsClosing(false);
    setVisible(false);
  }, [onOpenChange]);

  /** Mount the backdrop and trigger the enter animation on the next frame. */
  const backdropRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    hasFinishedCloseRef.current = false;
    requestAnimationFrame(() => setVisible(true));
  }, []);

  /** Start the close animation when the user cancels the confirmation. */
  const handleCancel = () => {
    if (confirming || isClosing) return;

    hasFinishedCloseRef.current = false;
    setIsClosing(true);
    setVisible(false);

    clearCloseFallback();
    closeFallbackRef.current = window.setTimeout(
      finishClose,
      ANIMATION_DURATION_MS + 50,
    );
  };

  /** Finalize the close when the backdrop opacity transition finishes. */
  const handleBackdropTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (!isClosing || event.propertyName !== "opacity") return;
    if (event.target !== event.currentTarget) return;

    finishClose();
  };

  if (!isDisplayed) return null;

  return (
    <div
      ref={backdropRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={dataSlot ? `${dataSlot}-title` : undefined}
      aria-describedby={dataSlot ? `${dataSlot}-description` : undefined}
      data-slot={dataSlot}
      onTransitionEnd={handleBackdropTransitionEnd}
      style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
      className={cn(
        "absolute -inset-6 z-10 flex items-center justify-center rounded-4xl bg-black/60 p-4 transition-opacity ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
        className={cn(
          "w-full max-w-sm space-y-4 rounded-2xl bg-background p-6 ring-1 ring-foreground/10 transition-all ease-out",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <p
          id={dataSlot ? `${dataSlot}-title` : undefined}
          className="text-lg font-medium"
        >
          {title}
        </p>

        <p
          id={dataSlot ? `${dataSlot}-description` : undefined}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>

        <div className="flex items-center justify-end gap-4 pt-2">
          <Button
            size="lg"
            type="button"
            disabled={confirming || isClosing}
            data-slot={cancelDataSlot}
            onClick={handleCancel}
            className="max-w-28 cursor-pointer rounded bg-transparent text-black hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            {cancelLabel}
          </Button>

          <SpinnerButton
            size="lg"
            type="button"
            loading={confirming}
            onClick={onConfirm}
            dataSlot={confirmDataSlot}
            className="max-w-28 cursor-pointer rounded border border-primary/40 bg-transparent not-hover:text-primary"
          >
            {confirmLabel}
          </SpinnerButton>
        </div>
      </div>
    </div>
  );
}
