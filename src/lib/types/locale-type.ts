export const LocaleOptions = ["en", "es", "pt-br", "pt-pt", "ro"] as const;

export type LocaleType = (typeof LocaleOptions)[number];
