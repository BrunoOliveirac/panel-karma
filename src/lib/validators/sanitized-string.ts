import * as z from "zod";

import { stripHtml } from "@/lib/utils/sanitize-html";

/** Zod string that strips HTML tags before further validation. */
export const sanitizedString = () =>
  z.string().transform((value) => stripHtml(value));
