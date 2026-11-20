"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

type SessionExpiredDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function SessionExpiredDialog({
  open,
  onClose,
}: SessionExpiredDialogProps) {
  const t = useTranslations("session_expired");

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-20 items-center justify-center rounded-full bg-muted">
            <Clock className="size-10 text-muted-foreground" strokeWidth={1.5} />
          </div>

          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <Button type="button" className="min-w-32" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
