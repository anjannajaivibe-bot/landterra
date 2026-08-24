import { getResendClient, isResendConfigured } from '@/lib/email/client';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'LandTerra <onboarding@resend.dev>';

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
    return { success: false, error: 'Email service client failed to initialize.' };
  }

  try {
    const data = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true, id: data.data?.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown email error';
    console.error('Resend email error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function notifyListingSubmitted(
  sellerEmail: string,
  sellerName: string,
  propertyTitle: string,
  publishingFee: number
) {
  return sendEmail({
    to: sellerEmail,
    subject: `Listing Received: ${propertyTitle} - LandTerra`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #047857;">Listing Payment Received</h2>
        <p>Dear ${sellerName},</p>
        <p>We have successfully received your listing <strong>${propertyTitle}</strong> and publishing fee of <strong>₹${publishingFee.toLocaleString('en-IN')}</strong>.</p>
        <p>Your property is now in <strong>Verification Pending</strong> status. Our admin team will inspect your uploaded title deed and government land registration ID.</p>
        <div style="background: #f8fafc; border-left: 4px solid #047857; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #475569;">
            <strong>Verification Policy:</strong> Payment covers listing processing and administrative review. Listings are approved only after document and registration validity confirmation.
          </p>
        </div>
        <p>Best regards,<br/>The LandTerra Verification Team</p>
      </div>
    `,
  });
}

export async function notifyVerificationResult(
  sellerEmail: string,
  sellerName: string,
  propertyTitle: string,
  status: 'VERIFIED' | 'REJECTED' | 'VERIFICATION_REQUIRED',
  reason?: string
) {
  const isApproved = status === 'VERIFIED';
  return sendEmail({
    to: sellerEmail,
    subject: isApproved
      ? `Property Verified & Published: ${propertyTitle}`
      : `Property Verification Update: ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: ${isApproved ? '#047857' : '#e11d48'};">
          ${isApproved ? 'Property Verified & Live on Marketplace' : 'Property Verification Update'}
        </h2>
        <p>Dear ${sellerName},</p>
        <p>Your property listing <strong>${propertyTitle}</strong> has been updated to: <strong>${status}</strong>.</p>
        ${
          reason
            ? `<div style="background: #fef2f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">Review Notes:</p>
                <p style="margin: 4px 0 0 0; color: #7f1d1d;">${reason}</p>
              </div>`
            : ''
        }
        <p>You can check and manage your property from your <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/seller">Seller Dashboard</a>.</p>
        <p>Best regards,<br/>LandTerra Compliance Team</p>
      </div>
    `,
  });
}

export async function notifySellerInquiry(
  sellerEmail: string,
  sellerName: string,
  buyerName: string,
  propertyTitle: string,
  message: string,
  buyerPhone?: string
) {
  return sendEmail({
    to: sellerEmail,
    subject: `New Buyer Inquiry on ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #0284c7;">New Buyer Inquiry</h2>
        <p>Dear ${sellerName},</p>
        <p>A prospective buyer, <strong>${buyerName}</strong>, has inquired about your property <strong>${propertyTitle}</strong>.</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
          ${buyerPhone ? `<p style="margin: 10px 0 0 0; font-weight: bold; color: #0f172a;">Buyer Contact Number: ${buyerPhone}</p>` : ''}
        </div>
        <p>View all inquiries in your <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/seller">Seller Dashboard</a>.</p>
      </div>
    `,
  });
}
