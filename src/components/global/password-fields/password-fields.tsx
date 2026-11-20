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
  PathValue,
  useWatch,
} from "react-hook-form";

interface PasswordFieldsProps<T extends FieldValues> {
  control: Control<T>;
  optional?: boolean;
  passwordName?: FieldPath<T>;
  confirmPasswordName?: FieldPath<T>;
  passwordDataSlot?: string;
  confirmPasswordDataSlot?: string;
}

export default function PasswordFields<T extends FieldValues>({
  control,
  optional = false,
  passwordName = "password" as FieldPath<T>,
  confirmPasswordName = "confirmPassword" as FieldPath<T>,
  passwordDataSlot = "password",
  confirmPasswordDataSlot = "confirm-password",
}: PasswordFieldsProps<T>) {
  const registerT = useTranslations("register");
  const validationT = useTranslations("validation");
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);
  const password = useWatch<T, FieldPath<T>>({
    control,
    name: passwordName,
    defaultValue: "" as PathValue<T, FieldPath<T>>,
  });
  const passwordValue = String(password ?? "");
  const hasPasswordInput = passwordValue.length > 0;
  const showRequirementState = !optional || hasPasswordInput;

  const validations = {
    length: passwordValue.length >= 8,
    upper: /[A-Z]/.test(passwordValue),
    lower: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[^A-Za-z0-9]/.test(passwordValue),
  };

  const requirementClass = (valid: boolean) => {
    if (!showRequirementState) return "text-muted-foreground";
    return valid ? "text-green-600" : "text-red-700";
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
        <li className={requirementClass(validations.length)}>
          {validationT("password_min")}
        </li>

        <li className={requirementClass(validations.upper)}>
          {validationT("password_upper")}
        </li>

        <li className={requirementClass(validations.lower)}>
          {validationT("password_lower")}
        </li>

        <li className={requirementClass(validations.number)}>
          {validationT("password_number")}
        </li>

        <li className={requirementClass(validations.special)}>
          {validationT("password_special")}
        </li>
      </ul>
    </>
  );
}
