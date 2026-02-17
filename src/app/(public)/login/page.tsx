"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useLocale } from "@/lib/hooks/use-locale";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Login() {
  const t = useTranslations("login");
  const { changeLocale } = useLocale();
  const [seePassword, setSeePassword] = useState(false);
  const languages = ["en", "es", , "pt-br", "pt-pt", "ro"] as string[];

  useEffect(() => {
    document.title = `${t("login")} | Kizuna`;
  }, [t]);

  return (
    <div className="flex justify-center items-center p-6 w-dvw h-dvh">
      <div className="bg-[#111] border border-primary/40 max-w-md w-full rounded-xl p-6">
        <Image
          width={150}
          height={75}
          loading="eager"
          alt="Auth Image"
          className="mx-auto"
          src="/images/logo.svg"
        />

        <h2 className="text-center text-xl font-medium mt-4 mb-8">
          {t("access_your_account")}
        </h2>

        <form className="space-y-6">
          <Field>
            <FieldLabel>{t("email")}</FieldLabel>
            <Input required type="email" placeholder={t("enter_email")} />
          </Field>

          <Field>
            <FieldLabel>{t("password")}</FieldLabel>

            <InputGroup>
              <InputGroupInput
                id="inline-end-input"
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
          </Field>

          <Field>
            <Button
              size="lg"
              type="submit"
              className="max-w-28 mx-auto rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {t("login")}
            </Button>
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
