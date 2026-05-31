"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputCurrency } from "@/components/ui/input-currency";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/lib/models/client";
import { Sector } from "@/lib/models/sector";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { ClientService } from "@/lib/services/client.service";
import { SectorService } from "@/lib/services/sector.service";
import { upsertClientValidator } from "@/lib/validators/upsert-client.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import { toast } from "sonner";

interface UpsertForm {
  name: string;
  email: string;
  phone: string;
  budget: number;
  notes?: string;
  sectorId?: string;
}

export default function UpsertClient({
  client,
  closeModal,
  dismissModal,
}: { client?: Client } & ModalInjectedProps<boolean>) {
  const sharedT = useTranslations("shared");
  const t = useTranslations("upsert_client");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const clientService = useMemo(() => new ClientService(), []);
  const sectorService = useMemo(() => new SectorService(), []);

  const {
    control,
    setValue,
    handleSubmit,
  }: UseFormReturn<UpsertForm, unknown, UpsertForm> = useForm({
    resolver: zodResolver(upsertClientValidator(useTranslations())),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      budget: 0,
      notes: "",
      sectorId: "",
    },
  });

  useEffect(() => {
    const loadSectors = async () => {
      try {
        const sectors = await sectorService.getAllActiveSectors();
        setSectors(sectors);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (client) {
      setValue("name", client.name);
      setValue("email", client.email);
      setValue("phone", client.phone);
      setValue("budget", client.budget);

      if (client.sector) setValue("sectorId", client.sector.id);
      if (client.notes) setValue("notes", client.notes);
    }

    loadSectors();
  }, [client, sectorService, setValue]);

  /**
   * Submit the form and create or update the client.
   * @param data The form data.
   */
  const onSubmit = async (data: UpsertForm) => {
    try {
      setSubmitting(true);
      const emailIsValid = await validateEmail(data.email);
      if (!emailIsValid) return;

      const { sectorId, ...formValue } = data;

      const clientId = await clientService.upsertClient({
        ...formValue,
        sectorId,
        id: client?.id,
      });

      toast.success(t(`client_${client ? "updated" : "created"}`));

      dismissModal({
        id: clientId,
        ...formValue,
        sector: sectorId ? sectors.find((s) => s.id === sectorId) : null,
      } as Client);
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${client ? "update" : "create"}`));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Validate the email and return true if it is valid.
   * @param email The email to validate.
   * @returns True if the email is valid, false otherwise.
   */
  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      if (!email) return false;
      const isValidEmail = /.+@.+\..+/.test(email);

      if (!isValidEmail) {
        toast.error(t("format_is_not_valid"));
        return false;
      }

      const formattedEmail = email.trim().toLowerCase();
      if (client?.id && formattedEmail === client?.email) return true;

      const isValid = await clientService.checkEmail(formattedEmail);
      if (!isValid) toast.error(t("email_in_use"));

      return isValid;
    } catch (error) {
      console.error(error);
      toast.error(t("invalid_email"));
      return false;
    }
  };

  /**
   * Copy the current url to the clipboard.
   */
  const onCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("link_copied"));
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <section data-slot="upsert-client-modal">
      <div className="w-full h-20 bg-[#767676] dark:bg-[#858585]"></div>

      <div className="flex justify-between gap-4 mt-4 mx-4">
        <div className="w-20 h-20 border-2 bg-primary border-primary rounded-full -mt-14"></div>

        {client?.id && (
          <Button data-slot="copy-link" onClick={onCopy}>
            {t("copy_link")}
          </Button>
        )}
      </div>

      <p className="text-xl font-medium mt-2 mb-8">{t("client_details")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{sharedT("name")}</FieldLabel>

              <Input
                {...field}
                data-slot="upsert-client-name"
                data-invalid={fieldState.invalid}
                placeholder={sharedT("enter_name")}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{t("email")}</FieldLabel>

              <Input
                {...field}
                type="email"
                placeholder={t("enter_email")}
                data-slot="upsert-client-email"
                data-invalid={fieldState.invalid}
                onBlur={(e) => {
                  field.onBlur();
                  validateEmail(e.target.value);
                }}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{t("phone")}</FieldLabel>

              <PhoneInput
                {...field}
                placeholder={t("enter_phone")}
                inputClass={
                  fieldState.invalid ? "border-red-900! ring-red-900!" : ""
                }
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="budget"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{t("budget")}</FieldLabel>

              <InputCurrency
                {...field}
                dataSlot="upsert-client-budget"
                dataInvalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="sectorId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("sector")}</FieldLabel>

              <Select
                field={field}
                bindValue="id"
                items={sectors}
                bindLabel="name"
                placeholder={t("select_sector")}
              />
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{t("notes")}</FieldLabel>

              <Textarea
                {...field}
                placeholder={t("enter_notes")}
                data-slot="upsert-client-notes"
                data-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              data-slot="upsert-client-cancel"
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
              dataSlot="upsert-client-save"
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
