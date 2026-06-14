/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  ComponentType,
} from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalOptions {
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  size?: ModalSize;
  className?: string;
}

export type ModalResolve<TResult> = (value: TResult) => void;
export type ModalReject = (reason?: unknown) => void;

export interface ModalInjectedProps<TResult = unknown> {
  closeModal: (result?: TResult) => void;
  dismissModal: (reason?: unknown) => void;
}

interface ModalInstance {
  id: number;
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  options?: ModalOptions;
  resolve: ModalResolve<any>;
  reject: ModalReject;
}

export interface ModalContextType {
  openModal: <
    TProps extends Record<string, unknown> | undefined,
    TResult = unknown,
  >(
    component: ComponentType<TProps & ModalInjectedProps<TResult>>,
    props?: TProps,
    options?: ModalOptions,
  ) => Promise<TResult>;

  closeAll: () => void;
}

/* -------------------------------------------------------------------------- */
/* Context */
/* -------------------------------------------------------------------------- */

const ModalContext = createContext<ModalContextType | null>(null);

/* -------------------------------------------------------------------------- */
/* Size classes */
/* -------------------------------------------------------------------------- */

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] h-[95vh]",
};

/* -------------------------------------------------------------------------- */
/* Provider */
/* -------------------------------------------------------------------------- */

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalInstance[]>([]);

  const closeAll = () => {
    setModals([]);
  };

  const openModal = <TProps extends object, TResult = unknown>(
    component: ComponentType<TProps & ModalInjectedProps<TResult>>,
    props?: Record<string, unknown> | undefined,
    options?: ModalOptions,
  ): Promise<TResult> => {
    return new Promise<TResult>((resolve, reject) => {
      const id = Date.now() + Math.random();

      const modal: ModalInstance = {
        id,
        component,
        props,
        options,
        resolve,
        reject,
      };

      setModals((prev) => [...prev, modal]);
    });
  };

  const closeModal = (id: number, result?: unknown) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);

      if (modal) modal.resolve(result);

      return prev.filter((m) => m.id !== id);
    });
  };

  const dismissModal = (id: number, reason?: unknown) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);

      if (modal) modal.resolve(reason);

      return prev.filter((m) => m.id !== id);
    });
  };

  return (
    <ModalContext.Provider value={{ openModal, closeAll }}>
      {children}

      {modals.map((modal) => {
        const Component = modal.component;
        const sizeClass = SIZE_CLASSES[modal.options?.size ?? "md"];

        return (
          <Dialog
            key={modal.id}
            open
            onOpenChange={(open) => {
              if (!open) dismissModal(modal.id);
            }}
          >
            <DialogContent
              className={`${sizeClass} ${modal.options?.className ?? ""} max-h-[90dvh] overflow-y-auto`}
              onEscapeKeyDown={(e) => {
                if (modal.options?.closeOnEsc === false) {
                  e.preventDefault();
                }
              }}
              onPointerDownOutside={(e) => {
                if (modal.options?.closeOnOverlayClick === false) {
                  e.preventDefault();
                }
              }}
            >
              <VisuallyHidden>
                <DialogTitle>...</DialogTitle>
                <DialogDescription>...</DialogDescription>
              </VisuallyHidden>

              <Component
                {...(modal.props ?? {})}
                closeModal={(result: any) => closeModal(modal.id, result)}
                dismissModal={(reason: any) => dismissModal(modal.id, reason)}
              />
            </DialogContent>
          </Dialog>
        );
      })}
    </ModalContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hook */
/* -------------------------------------------------------------------------- */

export function useModal(): ModalContextType {
  const ctx = useContext(ModalContext);

  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }

  return ctx;
}
