"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { useLocale } from "@/lib/hooks/use-locale";
import { AuthService } from "@/lib/services/auth.service";
import { registerValidator } from "@/lib/validators/register.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Login() {
  const router = useRouter();
  const { changeLocale } = useLocale();
  const authService = new AuthService();
  const registerT = useTranslations("register");
  const validationT = useTranslations("validation");
  const [submitting, setSubmitting] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const languages = ["en", "es", "pt-br", "pt-pt", "ro"] as string[];

  const {
    control,
    handleSubmit,
  }: UseFormReturn<RegisterForm, unknown, RegisterForm> = useForm({
    resolver: zodResolver(registerValidator(useTranslations())),
    defaultValues: { email: "", name: "", password: "", confirmPassword: "" },
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

  const onSubmit = async (data: Omit<RegisterForm, "confirmPassword">) => {
    try {
      setSubmitting(true);
      await authService.register(data);
      toast.success(registerT("success"));
      router.replace("/");
    } catch (error) {
      console.error(error);
      toast.error(registerT("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-6 w-dvw min-h-dvh h-full">
      <div className="bg-[#111] border border-primary/40 max-w-md w-full rounded-xl p-6">
        <Image
          width={150}
          height={90}
          loading="eager"
          alt="Auth Image"
          className="mx-auto"
          src="/images/logo.svg"
        />

        <h2 className="text-center text-xl font-medium mt-4 mb-8">
          {registerT("create_your_account")}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>{registerT("name")}</FieldLabel>
                <Input
                  {...field}
                  placeholder={registerT("enter_name")}
                  data-invalid={fieldState.invalid}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>{registerT("email")}</FieldLabel>
                <Input
                  {...field}
                  type="email"
                  placeholder={registerT("enter_email")}
                  data-invalid={fieldState.invalid}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>{registerT("password")}</FieldLabel>

                <InputGroup data-invalid={fieldState.invalid}>
                  <InputGroupInput
                    {...field}
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

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Visual validations */}

          <ul className="text-sm px-6 list-disc space-y-1">
            <li
              className={validations.length ? "text-green-600" : "text-red-700"}
            >
              {validationT("password_min")}
            </li>

            <li
              className={validations.upper ? "text-green-600" : "text-red-700"}
            >
              {validationT("password_upper")}
            </li>

            <li
              className={validations.lower ? "text-green-600" : "text-red-700"}
            >
              {validationT("password_lower")}
            </li>

            <li
              className={validations.number ? "text-green-600" : "text-red-700"}
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

          <Field>
            <SpinnerButton
              size="lg"
              type="submit"
              loading={submitting}
              className="max-w-28 mx-auto rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {registerT("register")}
            </SpinnerButton>
          </Field>
        </form>

        <Link
          href="/login"
          className="flex justify-self-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer py-4"
        >
          {registerT("login")}
        </Link>

        <div className="flex justify-center gap-4">
          {languages.map((language) => (
            <button
              key={language}
              className="cursor-pointer"
              onClick={() => changeLocale(language)}
            >
              <Image
                width={30}
                height={20}
                alt={`${language} flag`}
                src={`/images/flags/${language}.svg`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
