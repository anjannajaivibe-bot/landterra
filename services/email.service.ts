import { getResendClient, isResendConfigured } from '@/lib/email/client';
import { EmailDeliveryModel } from '@/models/EmailDelivery';
import { connectToDatabase } from '@/lib/db/mongodb';

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
    const data = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true, id: data.data?.id };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown email error';
    console.error('Resend email error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function notifyListingSubmitted(
  sellerEmail: string,
  sellerName: string,
  propertyTitle: string,
  publishingFee: number,
) {
  return sendEmail({
    to: sellerEmail,
    subject: `Listing Published Live: ${propertyTitle} - BhoomiMitra`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #FF9933;">Listing Published Live</h2>
        <p>Dear ${sellerName},</p>
        <p>We have successfully received your listing <strong>${propertyTitle}</strong> and publishing fee of <strong>₹${publishingFee.toLocaleString(
          'en-IN',
        )}</strong>.</p>
        <p>Your property is now <strong>Published &amp; Live</strong> on the BhoomiMitra marketplace for the next 30 days.</p>
        <div style="background: #fff9f0; border-left: 4px solid #FF9933; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #7a3705;">
            <strong>Direct Classifieds Policy:</strong> Buyers can now discover your property, explore satellite map pins, and contact you directly. BhoomiMitra maintains community standards and content moderation for fraudulent or abusive listings.
          </p>
        </div>
        <p>You can check and manage your property from your <a href="${
          process.env.NEXT_PUBLIC_APP_URL || ''
        }/dashboard/seller">Seller Dashboard</a>.</p>
        <p>Best regards,<br/>The BhoomiMitra Team</p>
      </div>
    `,
  });
}

export async function notifyVerificationResult(
  sellerEmail: string,
  sellerName: string,
  propertyTitle: string,
  status: 'VERIFIED' | 'REJECTED' | 'VERIFICATION_REQUIRED',
  reason?: string,
) {
  const isApproved = status === 'VERIFIED';
  return sendEmail({
    to: sellerEmail,
    subject: isApproved
      ? `Listing Approved & Live: ${propertyTitle}`
      : `Listing Moderation Update: ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: ${isApproved ? '#FF9933' : '#e11d48'};">
          ${
            isApproved
              ? 'Listing Approved & Live on Marketplace'
              : 'Listing Moderation Notice'
          }
        </h2>
        <p>Dear ${sellerName},</p>
        <p>Your property listing <strong>${propertyTitle}</strong> moderation status is: <strong>${status}</strong>.</p>
        ${
          reason
            ? `<div style="background: #fef2f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">Moderation Notes:</p>
                <p style="margin: 4px 0 0 0; color: #7f1d1d;">${reason}</p>
              </div>`
            : ''
        }
        <p>You can check and manage your property from your <a href="${
          process.env.NEXT_PUBLIC_APP_URL || ''
        }/dashboard/seller">Seller Dashboard</a>.</p>
        <p>Best regards,<br/>BhoomiMitra Trust & Safety Team</p>
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
  buyerPhone?: string,
  buyerEmail?: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return sendEmail({
    to: sellerEmail,
    subject: `New Inquiry on "${propertyTitle}" from ${buyerName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
        <!-- Header -->
        <div style="background: #0f172a; padding: 24px 28px; text-align: left;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
            Bhoomi<span style="color: #FF9933;">Mitra</span>
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
            Direct Land Classifieds &bull; Buyer Inquiry Notification
          </p>
        </div>

        <div style="padding: 28px;">
          <p style="font-size: 15px; margin: 0 0 16px 0; color: #0f172a;">
            Dear <strong>${sellerName}</strong>,
          </p>
          <p style="font-size: 14px; margin: 0 0 20px 0; line-height: 1.5; color: #334155;">
            A verified buyer, <strong>${buyerName}</strong>, has inquired about your listing <strong>${propertyTitle}</strong> on BhoomiMitra.
          </p>

          <!-- Buyer Message Box -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #FF9933; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #c75e0a; margin-bottom: 6px;">
              Buyer's Inquiry
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; font-style: italic;">
              &ldquo;${message}&rdquo;
            </p>
          </div>

          <!-- Buyer Contact Card -->
          <div style="background: #fff9f0; border: 1px solid #fed7aa; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 800; color: #7a3705; text-transform: uppercase; margin-bottom: 12px;">
              Buyer Contact Details
            </div>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #78350f; font-weight: 600; width: 120px;">Name:</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${buyerName}</td>
              </tr>
              ${
                buyerPhone
                  ? `<tr>
                      <td style="padding: 4px 0; color: #78350f; font-weight: 600;">Mobile Number:</td>
                      <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">
                        <a href="tel:${buyerPhone}" style="color: #c75e0a; text-decoration: none;">+91 ${buyerPhone}</a>
                      </td>
                    </tr>`
                  : ''
              }
              ${
                buyerEmail
                  ? `<tr>
                      <td style="padding: 4px 0; color: #78350f; font-weight: 600;">Email:</td>
                      <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">
                        <a href="mailto:${buyerEmail}" style="color: #c75e0a; text-decoration: none;">${buyerEmail}</a>
                      </td>
                    </tr>`
                  : ''
              }
            </table>
          </div>

          <!-- Action Buttons -->
          <div style="margin: 28px 0 16px 0; text-align: center;">
            ${
              buyerPhone
                ? `<a href="tel:${buyerPhone}" style="display: inline-block; background: #FF9933; color: #ffffff; padding: 12px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; margin: 0 6px 8px 6px;">
                    Call Buyer (+91 ${buyerPhone})
                   </a>`
                : ''
            }
            ${
              buyerEmail
                ? `<a href="mailto:${buyerEmail}?subject=Re: Inquiry regarding ${encodeURIComponent(propertyTitle)}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; margin: 0 6px 8px 6px;">
                    Reply by Email
                   </a>`
                : ''
            }
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
            You can also track and update this inquiry's status from your
            <a href="${appUrl}/dashboard/seller" style="color: #FF9933; font-weight: 600; text-decoration: none;">Seller Dashboard</a>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 11px; color: #94a3b8; text-align: center;">
          BhoomiMitra &bull; India's Direct Land Marketplace &bull; No middleman commission
        </div>
      </div>
    `,
  });
}

/**
 * Reliable Outbox Email Dispatch
 * Ensures emails are idempotent via unique eventKey and retried if transmission fails.
 */
export async function enqueueAndDispatchPaymentEmail({
  eventKey,
  recipientEmail,
  recipientName,
  propertyTitle,
  publishingFee,
  isRenewal = false,
}: {
  eventKey: string;
  recipientEmail: string;
  recipientName: string;
  propertyTitle: string;
  publishingFee: number;
  isRenewal?: boolean;
}): Promise<boolean> {
  if (!recipientEmail) return false;

  await connectToDatabase();

  const delivery = await EmailDeliveryModel.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        eventKey,
        recipientEmail,
        recipientName,
        template: isRenewal ? 'SUBSCRIPTION_RENEWED' : 'LISTING_SUBMITTED',
        payload: { propertyTitle, publishingFee, isRenewal },
        status: 'PENDING',
        attempts: 0,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (!delivery || delivery.status === 'SENT') {
    return true; // Already sent
  }

  // Attempt dispatch
  try {
    delivery.attempts = (delivery.attempts || 0) + 1;
    delivery.lastAttemptAt = new Date();

    const result = await notifyListingSubmitted(
      recipientEmail,
      recipientName,
      propertyTitle,
      publishingFee,
    );

    if (result.success) {
      delivery.status = 'SENT';
      delivery.sentAt = new Date();
      delivery.errorMessage = undefined;
      await delivery.save();
      return true;
    } else {
      delivery.status = 'FAILED';
      delivery.errorMessage = result.error || 'Email dispatch failed';
      await delivery.save();
      return false;
    }
  } catch (err: unknown) {
    delivery.status = 'FAILED';
    delivery.errorMessage =
      err instanceof Error ? err.message : 'Unknown exception';
    await delivery.save();
    return false;
  }
}

export async function notifySupportContactMessage({
  name,
  email,
  phone,
  subject,
  message,
}: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@bhoomimitra.com';
  return sendEmail({
    to: supportEmail,
    subject: `Support Query: ${subject || 'New Contact Request'} - from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #047857;">New Support & Compliance Inquiry</h2>
        <p>A user submitted a message via the BhoomiMitra contact form.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #475569;">Name:</td>
            <td style="padding: 8px 0; color: #0f172a;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          ${
            phone
              ? `<tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td>
            <td style="padding: 8px 0; color: #0f172a;">${phone}</td>
          </tr>`
              : ''
          }
          ${
            subject
              ? `<tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject:</td>
            <td style="padding: 8px 0; color: #0f172a;">${subject}</td>
          </tr>`
              : ''
          }
        </table>

        <div style="background: #f8fafc; border-left: 4px solid #047857; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message Content:</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
          Sent from BhoomiMitra Platform Contact Desk.
        </p>
      </div>
    `,
  });
}

/**
 * Pre-Expiry Renewal Reminder Notification (7-Day & 2-Day alerts)
 */
export async function notifyExpiringSoon(
  sellerEmail: string,
  sellerName: string,
  propertyTitle: string,
  daysRemaining: number,
  propertyId: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bhoomimitra.com';
  const renewUrl = `${appUrl}/dashboard/seller?renew=${encodeURIComponent(propertyId)}`;
  const isUrgent = daysRemaining <= 2;

  return sendEmail({
    to: sellerEmail,
    subject: isUrgent
      ? `[URGENT] Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left: Renew "${propertyTitle}" on BhoomiMitra`
      : `Action Required: Your listing "${propertyTitle}" expires in ${daysRemaining} days`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <!-- Header -->
        <div style="background: #0f172a; padding: 24px 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
            Bhoomi<span style="color: #FF9933;">Mitra</span>
          </h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">India's Direct Classified Land Marketplace</p>
        </div>

        <!-- Body Content -->
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="display: inline-block; background: ${isUrgent ? '#fee2e2' : '#fff1dc'}; color: ${isUrgent ? '#991b1b' : '#c75e0a'}; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid ${isUrgent ? '#fca5a5' : '#fed7aa'};">
            ${isUrgent ? 'URGENT NOTICE' : 'SUBSCRIPTION EXPIRING SOON'}
          </div>

          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 1.4;">
            Your land listing expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}
          </h2>

          <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
            Dear <strong>${sellerName}</strong>,<br/>
            Your 30-day listing subscription for <strong>"${propertyTitle}"</strong> is set to expire soon.
          </p>

          <div style="background: #f8fafc; border-left: 4px solid ${isUrgent ? '#ef4444' : '#FF9933'}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #334155;">
              <strong>What happens upon expiry?</strong><br/>
              Once expired, prospective buyers will no longer be able to find your land parcel in search results or view your contact details. Any pending buyer inquiries will also be paused.
            </p>
          </div>

          <!-- 1-Click Renewal CTA -->
          <div style="margin: 32px 0; text-align: center;">
            <a
              href="${renewUrl}"
              style="display: inline-block; background: #FF9933; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(255, 153, 51, 0.3);"
            >
              Renew Listing for ₹10 (1-Click) &rarr;
            </a>
            <p style="font-size: 11px; color: #94a3b8; margin: 10px 0 0 0;">
              Extends your active live listing for another 30 full days instantly.
            </p>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
            You can also manage all your active and draft listings from your
            <a href="${appUrl}/dashboard/seller" style="color: #FF9933; font-weight: 600; text-decoration: none;">Seller Dashboard</a>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 16px 28px; font-size: 11px; color: #94a3b8; text-align: center;">
          BhoomiMitra &bull; Zero Brokerage &bull; Direct Landowner Classifieds
        </div>
      </div>
    `,
  });
}

/**
 * Idempotent Dispatcher for Expiring Soon Alert Emails
 * Keyed by eventKey to guarantee at most 1 email per alert threshold (e.g. 7d or 2d).
 */
export async function enqueueAndDispatchExpiringSoonEmail({
  eventKey,
  recipientEmail,
  recipientName,
  propertyTitle,
  daysRemaining,
  propertyId,
}: {
  eventKey: string;
  recipientEmail: string;
  recipientName: string;
  propertyTitle: string;
  daysRemaining: number;
  propertyId: string;
}): Promise<boolean> {
  if (!recipientEmail) return false;

  await connectToDatabase();

  const delivery = await EmailDeliveryModel.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        eventKey,
        recipientEmail,
        recipientName,
        template: 'EXPIRING_SOON_REMINDER',
        payload: { propertyTitle, daysRemaining, propertyId },
        status: 'PENDING',
        attempts: 0,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (!delivery || delivery.status === 'SENT') {
    return true; // Already successfully dispatched
  }

  try {
    delivery.attempts = (delivery.attempts || 0) + 1;
    delivery.lastAttemptAt = new Date();

    const result = await notifyExpiringSoon(
      recipientEmail,
      recipientName,
      propertyTitle,
      daysRemaining,
      propertyId
    );

    if (result.success) {
      delivery.status = 'SENT';
      delivery.sentAt = new Date();
      delivery.errorMessage = undefined;
      await delivery.save();
      return true;
    } else {
      delivery.status = 'FAILED';
      delivery.errorMessage = result.error || 'Email dispatch failed';
      await delivery.save();
      return false;
    }
  } catch (err: unknown) {
    delivery.status = 'FAILED';
    delivery.errorMessage = err instanceof Error ? err.message : 'Unknown exception';
    await delivery.save();
    return false;
  }
}

