import { z } from "zod";

export const emailValidator = z.string().email();

