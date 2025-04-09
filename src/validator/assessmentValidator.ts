import { z } from "zod";

export const saveAssessmentValidator = z.object({
  name: z.string(),
  duration: z.string(),
  score: z.string(),
  format: z.string(),
});
