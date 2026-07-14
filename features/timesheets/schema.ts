import { z } from "zod";

export const TimesheetCorrectionSchema = z
  .object({
    timesheet_id: z.string().uuid(),
    requested_clock_out: z.string().datetime(),
    reason: z.string().min(1),
    original_clock_in: z.string().datetime(),
  })
  .refine(
    (data) => {
      const clockIn = new Date(data.original_clock_in);
      const clockOut = new Date(data.requested_clock_out);
      return clockOut > clockIn;
    },
    {
      message: "Negative duration rejected: clock_out must be after clock_in",
      path: ["requested_clock_out"],
    },
  )
  .refine(
    (data) => {
      const clockIn = new Date(data.original_clock_in);
      const clockOut = new Date(data.requested_clock_out);
      const diffMinutes =
        (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
      return diffMinutes >= 1; // at least 1 minute
    },
    {
      message: "Zero-minute shift rejected: shift must be at least 1 minute",
      path: ["requested_clock_out"],
    },
  );
