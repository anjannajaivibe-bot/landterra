'use client';

import React from 'react';
import { Home, CheckCircle2 } from 'lucide-react';
import { IProperty } from '@/types/property';

interface PropertySpecificationsProps {
  property: IProperty;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

export function PropertySpecifications({ property }: PropertySpecificationsProps) {
  const hasSpecs =
    property.bhk ||
    property.facing ||
    property.bathrooms ||
    property.balconies !== undefined ||
    property.superBuiltUpAreaSqFt ||
    property.carpetAreaSqFt ||
    property.propertyAttributes?.villaType ||
    property.propertyAttributes?.villaFloors ||
    property.propertyAttributes?.vastuCompliant ||
    (Array.isArray(property.propertyAttributes?.additionalRooms) &&
      property.propertyAttributes.additionalRooms.length > 0) ||
    (Array.isArray(property.propertyAttributes?.villaPrivateFeatures) &&
      property.propertyAttributes.villaPrivateFeatures.length > 0) ||
    (Array.isArray(property.propertyAttributes?.furnishingDetails) &&
      property.propertyAttributes.furnishingDetails.length > 0) ||
    (Array.isArray(property.amenities) && property.amenities.length > 0);

  if (!hasSpecs) return null;

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#c75e0a]">
              <Home className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-black text-slate-950">
              Property Specifications &amp; Highlights
            </h2>
          </div>
          <span className="text-[10px] font-bold text-[#c75e0a] bg-[#fff1dc] px-2.5 py-1 rounded-full">
            Listing Reviewed
          </span>
        </div>

        {/* Grid of Key Structural Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {property.bhk && property.bhk !== 'NOT_SPECIFIED' && (
            <Fact label="Configuration" value={property.bhk} />
          )}

          {property.propertyAttributes?.villaType &&
            property.propertyAttributes.villaType !== 'NOT_SPECIFIED' && (
              <Fact
                label="Home Type"
                value={
                  property.propertyAttributes.villaType === 'GATED_VILLA'
                    ? 'Gated Community Villa'
                    : property.propertyAttributes.villaType === 'INDEPENDENT_HOUSE'
                    ? 'Independent House / Bungalow'
                    : property.propertyAttributes.villaType === 'DUPLEX_VILLA'
                    ? 'Duplex Villa'
                    : property.propertyAttributes.villaType === 'TRIPLEX_VILLA'
                    ? 'Triplex Villa'
                    : property.propertyAttributes.villaType === 'ROW_HOUSE'
                    ? 'Row House / Townhouse'
                    : property.propertyAttributes.villaType === 'FARMHOUSE_VILLA'
                    ? 'Farmhouse'
                    : property.propertyAttributes.villaType.replace(/_/g, ' ')
                }
              />
            )}

          {property.propertyAttributes?.villaFloors &&
            property.propertyAttributes.villaFloors !== 'NOT_SPECIFIED' && (
              <Fact
                label="Structure Levels"
                value={
                  property.propertyAttributes.villaFloors === 'G'
                    ? 'Ground Only (G)'
                    : property.propertyAttributes.villaFloors === 'G_PLUS_1'
                    ? 'G + 1 Floor (Duplex)'
                    : property.propertyAttributes.villaFloors === 'G_PLUS_2'
                    ? 'G + 2 Floors (Triplex)'
                    : property.propertyAttributes.villaFloors === 'G_PLUS_3'
                    ? 'G + 3 Floors'
                    : property.propertyAttributes.villaFloors.replace(/_/g, ' ')
                }
              />
            )}

          {property.facing && property.facing !== 'NOT_SPECIFIED' && (
            <Fact label="Main Facing" value={`${property.facing.replace(/_/g, ' ')} Facing`} />
          )}

          {property.bathrooms && property.bathrooms > 0 ? (
            <Fact label="Bathrooms" value={`${property.bathrooms} Baths`} />
          ) : null}

          {property.balconies !== undefined && property.balconies >= 0 ? (
            <Fact label="Balconies / Sit-outs" value={`${property.balconies} Balconies`} />
          ) : null}

          {property.superBuiltUpAreaSqFt ? (
            <Fact
              label="Built-up Area"
              value={`${property.superBuiltUpAreaSqFt.toLocaleString('en-IN')} sq. ft`}
            />
          ) : null}

          {property.carpetAreaSqFt ? (
            <Fact
              label="Carpet Area"
              value={`${property.carpetAreaSqFt.toLocaleString('en-IN')} sq. ft`}
            />
          ) : null}

          {property.furnishingStatus && property.furnishingStatus !== 'NOT_SPECIFIED' && (
            <Fact label="Furnishing" value={property.furnishingStatus.replace(/_/g, ' ')} />
          )}

          {property.propertyAttributes?.parkingSlots &&
            property.propertyAttributes.parkingSlots !== 'NOT_SPECIFIED' && (
              <Fact
                label="Car Parking"
                value={
                  property.propertyAttributes.parkingSlots === '1_COVERED'
                    ? '1 Covered Porch'
                    : property.propertyAttributes.parkingSlots === '2_COVERED'
                    ? '2 Covered Porch'
                    : property.propertyAttributes.parkingSlots === '3_PLUS_COVERED'
                    ? '3+ Covered Porch'
                    : property.propertyAttributes.parkingSlots === 'OPEN'
                    ? 'Open Driveway'
                    : property.propertyAttributes.parkingSlots.replace(/_/g, ' ')
                }
              />
            )}

          {property.propertyAttributes?.possessionStatus &&
            property.propertyAttributes.possessionStatus !== 'NOT_SPECIFIED' && (
              <Fact
                label="Possession Status"
                value={property.propertyAttributes.possessionStatus.replace(/_/g, ' ')}
              />
            )}

          {property.propertyAttributes?.ageOfProperty &&
            property.propertyAttributes.ageOfProperty !== 'NOT_SPECIFIED' && (
              <Fact
                label="Property Age"
                value={
                  property.propertyAttributes.ageOfProperty === 'NEW'
                    ? 'Brand New (0-1 yr)'
                    : property.propertyAttributes.ageOfProperty.replace(/_/g, ' ')
                }
              />
            )}
        </div>

        {/* 100% Vastu Badge */}
        {property.propertyAttributes?.vastuCompliant && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Vastu Compliant Architecture (Entrance, Kitchen, Master Bedroom &amp; Pooja aligned)</span>
          </div>
        )}

        {/* Dedicated Additional Rooms */}
        {Array.isArray(property.propertyAttributes?.additionalRooms) &&
          property.propertyAttributes.additionalRooms.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Dedicated Additional Rooms ({property.propertyAttributes.additionalRooms.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {property.propertyAttributes.additionalRooms.map((room: string) => (
                  <span
                    key={room}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold"
                  >
                    ✓ {room}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Exclusive Private Villa Grounds & Features */}
        {Array.isArray(property.propertyAttributes?.villaPrivateFeatures) &&
          property.propertyAttributes.villaPrivateFeatures.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Exclusive Private Grounds &amp; Features (
                {property.propertyAttributes.villaPrivateFeatures.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {property.propertyAttributes.villaPrivateFeatures.map((feat: string) => (
                  <span
                    key={feat}
                    className="px-3 py-1.5 rounded-xl bg-[#fff9f0] border border-[#FF9933]/40 text-[#7a3705] text-xs font-bold shadow-xs"
                  >
                    ★ {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Included Furnishings & Inclusions */}
        {Array.isArray(property.propertyAttributes?.furnishingDetails) &&
          property.propertyAttributes.furnishingDetails.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fittings &amp; Interior Inclusions ({property.propertyAttributes.furnishingDetails.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {property.propertyAttributes.furnishingDetails.map((inc: string) => (
                  <span
                    key={inc}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    + {inc}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Society / Community Amenities */}
        {Array.isArray(property.amenities) && property.amenities.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Community Amenities &amp; Infrastructure ({property.amenities.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold"
                >
                  ✓ {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
