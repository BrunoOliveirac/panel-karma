"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  useWatch,
} from "react-hook-form";

interface PasswordFieldsProps<T extends FieldValues> {
  control: Control<T>;
  passwordName?: FieldPath<T>;
  confirmPasswordName?: FieldPath<T>;
  passwordDataSlot?: string;
  confirmPasswordDataSlot?: string;
}

export default function PasswordFields<T extends FieldValues>({
  control,
  passwordName = "password" as FieldPath<T>,
  confirmPasswordName = "confirmPassword" as FieldPath<T>,
  passwordDataSlot = "password",
  confirmPasswordDataSlot = "confirm-password",
}: PasswordFieldsProps<T>) {
  const registerT = useTranslations("register");
  const validationT = useTranslations("validation");
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);
  const password = useWatch({ control, name: passwordName, defaultValue: "" });

  const validations = {
    length: (password ?? "").length >= 8,
    upper: /[A-Z]/.test(password ?? ""),
    lower: /[a-z]/.test(password ?? ""),
    number: /[0-9]/.test(password ?? ""),
    special: /[^A-Za-z0-9]/.test(password ?? ""),
  };

  return (
    <>
      <Controller
        name={passwordName}
        control={control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>{registerT("password")}</FieldLabel>

            <InputGroup data-invalid={fieldState.invalid}>
              <InputGroupInput
                {...field}
                dataSlot={passwordDataSlot}
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
        name={confirmPasswordName}
        control={control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>{registerT("confirm_password")}</FieldLabel>

            <InputGroup data-invalid={fieldState.invalid}>
              <InputGroupInput
                {...field}
                dataSlot={confirmPasswordDataSlot}
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

        <li className={validations.number ? "text-green-600" : "text-red-700"}>
          {validationT("password_number")}
        </li>

        <li
          className={validations.special ? "text-green-600" : "text-red-700"}
        >
          {validationT("password_special")}
        </li>
      </ul>
    </>
  );
}
