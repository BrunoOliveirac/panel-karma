"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { Switch } from "@/components/ui/switch";
import { Sector } from "@/lib/models/sector";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { SectorService } from "@/lib/services/sector.service";
import { upserSectorValidator } from "@/lib/validators/upsert-sector.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface UpsertForm {
  name: string;
  active: boolean;
}

export default function UpsertSector({
  sector,
  closeModal,
  dismissModal,
}: { sector?: Sector } & ModalInjectedProps<boolean>) {
  const sectorService = new SectorService();
  const sharedT = useTranslations("shared");
  const t = useTranslations("upsert_sector");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    setValue,
    handleSubmit,
  }: UseFormReturn<UpsertForm, unknown, UpsertForm> = useForm({
    resolver: zodResolver(upserSectorValidator(useTranslations())),
    defaultValues: { name: "", active: true },
    mode: "onChange",
  });

  useEffect(() => {
    if (sector) {
      setValue("name", sector.name);
      setValue("active", sector.active);
    }

    setLoading(false);
  }, [sector, setValue]);

  /**
   * Submit the form and create or update the sector.
   * @param data The form data.
   */
  const onSubmit = async (data: UpsertForm) => {
    try {
      setSubmitting(true);
      const newSector = { ...sector, ...data, id: sector?.id } as Sector;
      newSector.id = await sectorService.upsertSector(newSector);

      if (!sector) newSector.createdAt = new Date();

      toast.success(t(`sector_${sector ? "updated" : "created"}`));
      dismissModal(newSector);
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_create"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <section data-slot="upsert-sector-modal">
      <p className="text-xl font-medium mb-8">{t("sector_details")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{sharedT("name")}</FieldLabel>

              <Input
                {...field}
                data-slot="upsert-sector-name"
                data-invalid={fieldState.invalid}
                placeholder={sharedT("enter_name")}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-slot="upsert-sector-active"
              />

              <FieldLabel>{t("status")}</FieldLabel>
            </Field>
          )}
        />

        <div className="flex justify-end items-center gap-6 mt-8">
          <Field className="w-fit">
            <Button
              size="lg"
              type="button"
              disabled={submitting}
              onClick={() => closeModal()}
              data-slot="upsert-sector-cancel"
              className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {sharedT("cancel")}
            </Button>
          </Field>

          <Field className="w-fit">
            <SpinnerButton
              size="lg"
              type="submit"
              loading={submitting}
              dataSlot="upsert-sector-save"
              className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {sharedT("save")}
            </SpinnerButton>
          </Field>
        </div>
      </form>
    </section>
  );
}
