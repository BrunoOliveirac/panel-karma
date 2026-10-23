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
import { SpinnerButton } from "@/components/ui/spinner-button";
import { cropImageToDataUrl } from "@/lib/utils/compress-image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";

export type ImageCropShape = "round" | "square" | "rect";

export interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  /** Crop mask shape. Defaults to `"square"`. */
  shape?: ImageCropShape;
  /**
   * Crop aspect ratio (width / height).
   * Defaults to `1` for round/square and `16 / 9` for rect.
   */
  aspect?: number;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Maximum output width or height in pixels. Defaults to `256`. */
  maxSize?: number;
  onOpenChange: (open: boolean) => void;
  /** Called with the cropped JPEG data URL after the user confirms. */
  onConfirm: (dataUrl: string) => void | Promise<void>;
  dataSlot?: string;
  cancelDataSlot?: string;
  confirmDataSlot?: string;
  zoomDataSlot?: string;
}

/**
 * Resolve cropper props from the high-level shape API.
 */
function resolveCropConfig(
  shape: ImageCropShape,
  aspect?: number,
): { cropShape: "round" | "rect"; aspect: number; showGrid: boolean } {
  if (shape === "round") {
    return { cropShape: "round", aspect: aspect ?? 1, showGrid: false };
  }

  if (shape === "square") {
    return { cropShape: "rect", aspect: aspect ?? 1, showGrid: true };
  }

  return { cropShape: "rect", aspect: aspect ?? 16 / 9, showGrid: true };
}

export function ImageCropDialog({
  open,
  imageSrc,
  shape = "square",
  aspect,
  title,
  description,
  confirmLabel,
  cancelLabel,
  maxSize = 256,
  onOpenChange,
  onConfirm,
  dataSlot = "image-crop-dialog",
  cancelDataSlot,
  confirmDataSlot,
  zoomDataSlot,
}: ImageCropDialogProps) {
  const t = useTranslations("shared");
  const zoomId = useId();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const cropConfig = resolveCropConfig(shape, aspect);

  useEffect(() => {
    if (!open) return;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, imageSrc]);

  /**
   * Close the dialog unless a save is in progress.
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && saving) return;
    onOpenChange(nextOpen);
  };

  /**
   * Crop the image and forward the result to the consumer.
   */
  const handleConfirm = async (): Promise<void> => {
    if (!imageSrc || !croppedAreaPixels || saving) return;

    try {
      setSaving(true);
      const dataUrl = await cropImageToDataUrl(
        imageSrc,
        croppedAreaPixels,
        maxSize,
      );
      await onConfirm(dataUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open && !!imageSrc} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-lg"
        data-slot={dataSlot}
      >
        <DialogHeader>
          <DialogTitle>{title ?? t("crop_image")}</DialogTitle>
          <DialogDescription>
            {description ?? t("crop_image_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-black/90">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropConfig.aspect}
                cropShape={cropConfig.cropShape}
                showGrid={cropConfig.showGrid}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) =>
                  setCroppedAreaPixels(pixels)
                }
              />
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor={zoomId} className="text-sm font-medium">
              {t("zoom")}
            </label>
            <input
              id={zoomId}
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              data-slot={zoomDataSlot}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            data-slot={cancelDataSlot}
            onClick={() => handleOpenChange(false)}
          >
            {cancelLabel ?? t("cancel")}
          </Button>

          <SpinnerButton
            type="button"
            loading={saving}
            disabled={!croppedAreaPixels}
            dataSlot={confirmDataSlot}
            onClick={handleConfirm}
          >
            {confirmLabel ?? t("save")}
          </SpinnerButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
