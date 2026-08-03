"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { MemberService } from "@/lib/services/member.service";
import { SupportService } from "@/lib/services/support.service";
import { changePasswordValidator } from "@/lib/validators/change-password.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm, UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";

export type ChangePasswordUserType = "member" | "support";

interface ChangePasswordForm {
  password: string;
  confirmPassword: string;
}

export type ChangePasswordProps = {
  userId: string;
  type: ChangePasswordUserType;
  name: string;
};

export default function ChangePassword({
  userId,
  type,
  name,
  closeModal,
  dismissModal,
}: ChangePasswordProps & ModalInjectedProps<boolean>) {
  const t = useTranslations("change_password");
  const sharedT = useTranslations("shared");
  const validationT = useTranslations("validation");
  const registerT = useTranslations("register");
  const [submitting, setSubmitting] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);
  const memberService = useMemo(() => new MemberService(), []);
  const supportService = useMemo(() => new SupportService(), []);

  const {
    control,
    handleSubmit,
  }: UseFormReturn<ChangePasswordForm, unknown, ChangePasswordForm> = useForm({
    resolver: zodResolver(changePasswordValidator(useTranslations())),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const validations = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      setSubmitting(true);

      if (type === "member") {
        await memberService.updatePassword(userId, data.password);
      } else {
        await supportService.updatePassword(userId, data.password);
      }

      toast.success(t("password_updated"));
      dismissModal(true);
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_update"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section data-slot="change-password-modal">
      <p className="text-xl font-medium mb-1">{t("change_password")}</p>
      <p className="text-sm text-muted-foreground mb-8">{name}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{registerT("password")}</FieldLabel>

              <InputGroup data-invalid={fieldState.invalid}>
                <InputGroupInput
                  {...field}
                  dataSlot="change-password"
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
                  dataSlot="change-password-confirm"
                  placeholder={registerT("enter_password")}
                  type={seeConfirmPassword ? "text" : "password"}
                />

                <InputGroupAddon align="inline-end">
                  <EyeOffIcon
                    className="cursor-pointer"
                    onClick={() => setSeeConfirmPassword(!seeConfirmPassword)}
                  />
                </InputGroupAddon>
              </InputGroup>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <ul className="text-sm px-6 list-disc space-y-1">
          <li
            className={validations.length ? "text-green-600" : "text-red-700"}
          >
            {validationT("password_min")}
          </li>

          <li className={validations.upper ? "text-green-600" : "text-red-700"}>
            {validationT("password_upper")}
          </li>

          <li className={validations.lower ? "text-green-600" : "text-red-700"}>
            {validationT("password_lower")}
          </li>

          <li
            className={validations.number ? "text-green-600" : "text-red-700"}
          >
            {validationT("password_number")}
          </li>

          <li
            className={validations.special ? "text-green-600" : "text-red-700"}
          >
            {validationT("password_special")}
          </li>
        </ul>

        <div className="flex justify-end items-center gap-6 mt-8">
          <Field className="w-fit">
            <Button
              size="lg"
              type="button"
              disabled={submitting}
              onClick={() => closeModal()}
              data-slot="change-password-cancel"
              className="max-w-28 rounded bg-transparent text-black dark:text-white cursor-pointer hover:text-white dark:hover:text-black hover:bg-black dark:hover:bg-white"
            >
              {sharedT("cancel")}
            </Button>
          </Field>

          <Field className="w-fit">
            <SpinnerButton
              size="lg"
              type="submit"
              loading={submitting}
              dataSlot="change-password-save"
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
