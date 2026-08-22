import emailjs from "@emailjs/browser";

const SERVICE_ID = (process.env.REACT_APP_EMAILJS_SERVICE_ID && process.env.REACT_APP_EMAILJS_SERVICE_ID !== "YOUR_EMAILJS_SERVICE_ID")
  ? process.env.REACT_APP_EMAILJS_SERVICE_ID
  : "service_xtzd82m";

const TEMPLATE_ID = (process.env.REACT_APP_EMAILJS_TEMPLATE_ID && process.env.REACT_APP_EMAILJS_TEMPLATE_ID !== "template_otp")
  ? process.env.REACT_APP_EMAILJS_TEMPLATE_ID
  : "template_zihznvd";

const PUBLIC_KEY = (process.env.REACT_APP_EMAILJS_PUBLIC_KEY && process.env.REACT_APP_EMAILJS_PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY")
  ? process.env.REACT_APP_EMAILJS_PUBLIC_KEY
  : "Nxp7_kw7MTbscVVuW";

export interface SendEmailOtpParams {
  toEmail: string;
  toName: string;
  otpCode: string;
}

/**
 * Sends a 6-digit OTP code to the target email via EmailJS.
 */
export async function sendEmailOtp({ toEmail, toName, otpCode }: SendEmailOtpParams): Promise<boolean> {

  if (!PUBLIC_KEY || PUBLIC_KEY === "YOUR_EMAILJS_PUBLIC_KEY") {
    console.warn("[EmailJS] Public Key is not set in environment variables. OTP code printed to console above.");
    return true; // Treat as simulated success in dev mode
  }

  try {
    emailjs.init({ publicKey: PUBLIC_KEY });

    const templateParams = {
      email: toEmail,
      to_email: toEmail,
      passcode: otpCode,
      otp_code: otpCode,
      time: "10 daqiqa",
      to_name: toName,
      from_name: "Ilmoz EOS",
      app_name: "Ilmoz EOS",
      reply_to: "ilmozeos@gmail.com",
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
      publicKey: PUBLIC_KEY,
    });
    console.log("[EmailJS] Email sent successfully:", response.status, response.text);
    return true;
  } catch (error: any) {
    console.error("[EmailJS] Failed to send email OTP:", error?.status, error?.text || error);
    // Fallback: don't block user if EmailJS service is temporarily unreachable or misconfigured
    return false;
  }
}
