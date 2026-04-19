"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputCurrency } from "@/components/ui/input-currency";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { Client } from "@/lib/models/client";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { ClientService } from "@/lib/services/client.service";
import { upsertClientValidator } from "@/lib/validators/upsert-client.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import { toast } from "sonner";

interface UpsertForm {
  name: string;
  email: string;
  phone: string;
  budget: number;
}

export default function UpsertClient({
  client,
  closeModal,
  dismissModal,
}: { client?: Client } & ModalInjectedProps<boolean>) {
  const clientService = new ClientService();
  const t = useTranslations("upsert_client");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    setValue,
    handleSubmit,
  }: UseFormReturn<UpsertForm, unknown, UpsertForm> = useForm({
    resolver: zodResolver(upsertClientValidator(useTranslations())),
    defaultValues: { name: "", email: "", phone: "", budget: 0 },
    mode: "onChange",
  });

  useEffect(() => {
    if (client) {
      setValue("name", client.name);
      setValue("email", client.email);
      setValue("phone", client.phone);
      setValue("budget", client.budget);
    }

    setLoading(false);
  }, [client, setValue]);

  /**
   * Submit the form and create or update the client.
   * @param data The form data.
   */
  const onSubmit = async (data: UpsertForm) => {
    try {
      setSubmitting(true);
      const emailIsValid = await validateEmail(data.email);
      if (!emailIsValid) return;

      const newClient = { ...data, id: client?.id } as Client;
      newClient.id = await clientService.upsertClient(newClient);

      toast.success(t(`client_${client ? "updated" : "created"}`));
      dismissModal(newClient);
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_create"));
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
              <FieldLabel>{t("name")}</FieldLabel>

              <Input
                {...field}
                placeholder={t("enter_name")}
                data-slot="upsert-client-name"
                data-invalid={fieldState.invalid}
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
                data-invalid={fieldState.invalid}
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
              className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {t("cancel")}
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
              {t("save")}
            </SpinnerButton>
          </Field>
        </div>
      </form>
    </section>
  );
}
