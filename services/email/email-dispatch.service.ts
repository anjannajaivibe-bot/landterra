import { getResendClient, isResendConfigured } from "@/lib/email/client";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  'BhoomiMitra <onboarding@resend.dev>';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isResendConfigured()) {
    return {
      success: false,
      error: 'Email service is not configured (RESEND_API_KEY is not set).',
    };
  }

  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      error: 'Email service client failed to initialize.',
    };
  }

  // Gracefully skip mock or example domains used in test data
  if (to.includes('@example.com') || to.endsWith('.example')) {
    console.log(`[Email Service]: Skipped dispatch for mock domain: ${to}`);
    return { success: true, id: 'mock_delivered' };
  }

  try {
    let result = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    // If custom domain is unverified, gracefully retry with Resend sandbox testing sender
    if (
      result.error &&
      (result.error.message.includes('not verified') ||
        result.error.message.includes('domain on https://resend.com/domains'))
    ) {
      console.warn(
        `[Email Service]: Domain in "${FROM_EMAIL}" is unverified on Resend. Falling back to onboarding@resend.dev for testing...`
      );
      result = await client.emails.send({
        from: 'BhoomiMitra <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
    }

    if (result.error) {
      console.error(
        `[Email Service Error]: Resend rejected delivery to ${to}:`,
        result.error.message
      );
      return { success: false, error: result.error.message };
    }

    console.log(
      `[Email Service]: Email dispatched successfully to ${to} (Message ID: ${result.data?.id})`
    );
    return { success: true, id: result.data?.id };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email Service Error]:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
