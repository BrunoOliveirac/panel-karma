"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { Support } from "@/lib/models/support";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { SupportService } from "@/lib/services/support.service";
import {
  UpsertSupportForm,
  upsertSupportValidator,
} from "@/lib/validators/upsert-support.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";

export default function UpsertSupport({
  support,
  closeModal,
  dismissModal,
}: { support?: Support } & ModalInjectedProps<boolean>) {
  const isEdit = !!support?.id;
  const sharedT = useTranslations("shared");
  const t = useTranslations("upsert_support");
  const registerT = useTranslations("register");
  const validationT = useTranslations("validation");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);
  const supportService = useMemo(() => new SupportService(), []);

  const {
    control,
    setValue,
    handleSubmit,
  }: UseFormReturn<UpsertSupportForm, unknown, UpsertSupportForm> = useForm({
    resolver: zodResolver(upsertSupportValidator(useTranslations(), isEdit)),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const validations = {
    length: (password ?? "").length >= 8,
    upper: /[A-Z]/.test(password ?? ""),
    lower: /[a-z]/.test(password ?? ""),
    number: /[0-9]/.test(password ?? ""),
    special: /[^A-Za-z0-9]/.test(password ?? ""),
  };

  useEffect(() => {
    if (support) {
      setValue("name", support.name);
      setValue("email", support.email);
    }

    setLoading(false);
  }, [support, setValue]);

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      if (!email) return false;
      const isValidEmail = /.+@.+\..+/.test(email);

      if (!isValidEmail) {
        toast.error(t("format_is_not_valid"));
        return false;
      }

      const formattedEmail = email.trim().toLowerCase();
      if (support?.id && formattedEmail === support.email) return true;

      const isValid = await supportService.checkEmail(
        formattedEmail,
        support?.id,
      );

      if (!isValid) toast.error(t("email_in_use"));

      return isValid;
    } catch (error) {
      console.error(error);
      toast.error(t("format_is_not_valid"));
      return false;
    }
  };

  const onSubmit = async (data: UpsertSupportForm) => {
    try {
      setSubmitting(true);
      const emailIsValid = await validateEmail(data.email);
      if (!emailIsValid) return;

      const payload: Partial<Support> & { password?: string } = {
        id: support?.id,
        name: data.name,
        email: data.email.trim().toLowerCase(),
        active: support?.active ?? true,
      };

      if (!isEdit && data.password) {
        payload.password = data.password;
      }

      const supportId = await supportService.upsertSupport(payload);
      const newSupport = {
        ...support,
        ...payload,
        id: supportId,
        createdAt: support?.createdAt ?? new Date(),
      } as Support;

      toast.success(t(`support_${support ? "updated" : "created"}`));
      dismissModal(newSupport);
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${support ? "update" : "create"}`));
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
    <section data-slot="upsert-support-modal">
      <p className="text-xl font-medium mb-8">{t("support_details")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{sharedT("name")}</FieldLabel>

              <Input
                {...field}
                data-slot="upsert-support-name"
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
                data-slot="upsert-support-email"
                data-invalid={fieldState.invalid}
                placeholder={t("enter_email")}
                onBlur={(e) => validateEmail(e.target.value)}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {!isEdit && (
          <>
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>{registerT("password")}</FieldLabel>

                  <InputGroup data-invalid={fieldState.invalid}>
                    <InputGroupInput
                      {...field}
                      dataSlot="upsert-support-password"
                      placeholder={registerT("enter_password")}
                      type={seePassword ? "text" : "password"}
                    />

                    <InputGroupAddon align="inline-end">
                      <EyeOffIcon
                        className="cursor-pointer"
                        onClick={() => setSeePassword(!seePassword)}
                      />
                    </InputGroupAddon>
                  </InputGroup>

                  {fieldState.error?.message?.includes("required") && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>{registerT("confirm_password")}</FieldLabel>

                  <InputGroup data-invalid={fieldState.invalid}>
                    <InputGroupInput
                      {...field}
                      dataSlot="upsert-support-confirm-password"
                      placeholder={registerT("enter_password")}
                      type={seeConfirmPassword ? "text" : "password"}
                    />

                    <InputGroupAddon align="inline-end">
                      <EyeOffIcon
                        className="cursor-pointer"
                        onClick={() =>
                          setSeeConfirmPassword(!seeConfirmPassword)
                        }
                      />
                    </InputGroupAddon>
                  </InputGroup>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <ul className="text-sm px-6 list-disc space-y-1">
              <li
                className={
                  validations.length ? "text-green-600" : "text-red-700"
                }
              >
                {validationT("password_min")}
              </li>

              <li
                className={
                  validations.upper ? "text-green-600" : "text-red-700"
                }
              >
                {validationT("password_upper")}
              </li>

              <li
                className={
                  validations.lower ? "text-green-600" : "text-red-700"
                }
              >
                {validationT("password_lower")}
              </li>

              <li
                className={
                  validations.number ? "text-green-600" : "text-red-700"
                }
              >
                {validationT("password_number")}
              </li>

              <li
                className={
                  validations.special ? "text-green-600" : "text-red-700"
                }
              >
                {validationT("password_special")}
              </li>
            </ul>
          </>
        )}

        <div className="flex justify-end items-center gap-6 mt-8">
          <Field className="w-fit">
            <Button
              size="lg"
              type="button"
              disabled={submitting}
              onClick={() => closeModal()}
              data-slot="upsert-support-cancel"
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
              dataSlot="upsert-support-save"
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
