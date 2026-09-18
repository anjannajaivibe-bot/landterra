/**
 * Email Service — Barrel Re-Export
 *
 * All existing imports from "@/services/email.service" continue to work
 * without any changes. The actual implementations have been modularized into
 * focused sub-modules under services/email/.
 */

export * from "./email/email-dispatch.service";
export * from "./email/email-templates.service";
export * from "./email/email-delivery.service";
