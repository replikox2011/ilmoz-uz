import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_xtzd82m";
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_otp";
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "";

export interface SendEmailOtpParams {
  toEmail: string;
  toName: string;
  otpCode: string;
}

/**
 * Sends a 6-digit OTP code to the target email via EmailJS.
 */
export async function sendEmailOtp({ toEmail, toName, otpCode }: SendEmailOtpParams): Promise<boolean> {
  // Always log for local development and debugging
  console.log(`[EmailOTP] Generated 6-digit code for ${toEmail}: ${otpCode}`);

  if (!PUBLIC_KEY || PUBLIC_KEY === "YOUR_EMAILJS_PUBLIC_KEY") {
    console.warn("[EmailJS] Public Key is not set in environment variables. OTP code printed to console above.");
    return true; // Treat as simulated success in dev mode
  }

  try {
    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      otp_code: otpCode,
      app_name: "Ilmoz EOS",
      reply_to: "support@ilmoz.uz",
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("[EmailJS] Email sent successfully:", response.status, response.text);
    return true;
  } catch (error: any) {
    console.error("[EmailJS] Failed to send email OTP:", error);
    // Fallback: don't block user if EmailJS service is temporarily unreachable or misconfigured
    return false;
  }
}
