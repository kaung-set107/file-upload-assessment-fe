import { z } from "zod";

export const fileDescriptionSchema = z.object({
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .default(""),
});

export type FileDescriptionFormData = z.infer<typeof fileDescriptionSchema>;
