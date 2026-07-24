import { Resend } from "resend";
import { logger } from "./logger";

// Initialize with a dummy key if not present in env
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!process.env.RESEND_API_KEY) {
    logger.info({ to, subject }, "Skipping actual email send (No RESEND_API_KEY provided)");
    return { success: true, dummy: true };
  }

  try {
    const data = await resend.emails.send({
      from: "ScholarMe <onboarding@resend.dev>", // Use default resend dev domain
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    logger.error({ error, to, subject }, "Email send failed");
    return { success: false, error };
  }
};
