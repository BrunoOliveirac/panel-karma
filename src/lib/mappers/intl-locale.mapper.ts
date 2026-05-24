interface IntlLocale {
  locale: string;
  currency: string;
}

export const IntlLocaleMap = new Map<string, IntlLocale>([
  ["en", { locale: "en-US", currency: "USD" }],
  ["es", { locale: "es-ES", currency: "EUR" }],
  ["pt-br", { locale: "pt-BR", currency: "BRL" }],
  ["pt-pt", { locale: "pt-PT", currency: "EUR" }],
  ["ro", { locale: "ro-RO", currency: "RON" }],
]);
