/**
 * Property Service — Barrel Re-Export
 *
 * All existing imports from "@/services/property.service" continue to work
 * without any changes. The actual implementations have been modularized into
 * focused sub-modules under services/property/.
 */

export * from "./property/property-projections";
export * from "./property/property-cache";
export * from "./property/property-helpers";
export * from "./property/property-query.service";
export * from "./property/property-spam-filter";
export * from "./property/property-create.service";
export * from "./property/property-lifecycle.service";
