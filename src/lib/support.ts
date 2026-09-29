import { z } from "zod";

export const SUPPORT_INBOX = "support@pamiac.com";
export const SUPPORT_SUBJECT = "Pamiac support request";
export const MAX_SUPPORT_MESSAGE = 4000;

export const supportRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter the email you use to sign in")
    .email("Enter a valid email"),
  message: z
    .string()
    .trim()
    .min(1, "Enter a message")
    .max(MAX_SUPPORT_MESSAGE, "Keep the message under 4000 characters"),
});

export type SupportRequest = z.infer<typeof supportRequestSchema>;
