import { useLocale } from "@/lib/hooks/use-locale";
import { LocaleOptions } from "@/lib/types/locale-type";
import Image from "next/image";

export default function SelectLanguage() {
  const languages = LocaleOptions;
  const { changeLocale } = useLocale();

  return (
    <div className="flex justify-center gap-4">
      {languages.map((language) => (
        <button
          key={language}
          className="cursor-pointer"
          onClick={() => changeLocale(language)}
          data-slot={language + "-locale-select"}
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
  );
}
