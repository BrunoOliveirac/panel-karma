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
import { loginValidator } from "@/lib/validators/login.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const t = useTranslations("login");
  const { changeLocale } = useLocale();
  const authService = new AuthService();
  const [submitting, setSubmitting] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const languages = ["en", "es", , "pt-br", "pt-pt", "ro"] as string[];

  const {
    control,
    handleSubmit,
  }: UseFormReturn<LoginForm, unknown, LoginForm> = useForm({
    resolver: zodResolver(loginValidator(useTranslations())),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  useEffect(() => {
    document.title = `${t("login")} | Kizuna`;
  }, [t]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setSubmitting(true);
      await authService.login(data);
      router.replace("/");
    } catch (error) {
      console.error(error);

      if (error instanceof AxiosError) {
        toast.error(t(error.status === 403 ? "invalid_credentials" : "error"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-6 w-dvw h-dvh">
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
          {t("access_your_account")}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <FieldLabel>{t("password")}</FieldLabel>

                <InputGroup data-invalid={fieldState.invalid}>
                  <InputGroupInput
                    {...field}
                    placeholder={t("enter_password")}
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

          <Field>
            <SpinnerButton
              size="lg"
              type="submit"
              loading={submitting}
              className="max-w-28 mx-auto rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {t("login")}
            </SpinnerButton>
          </Field>
        </form>

        <Link
          href="/register"
          className="flex justify-self-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer py-4"
        >
          {t("dont_have_account")}
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
