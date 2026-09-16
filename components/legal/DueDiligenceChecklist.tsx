import React from 'react';
import {
  FileCheck,
  FileText,
  Layers,
  Compass,
  Scale,
  ShieldAlert,
} from 'lucide-react';

interface DueDiligenceChecklistProps {
  compact?: boolean;
  className?: string;
}

export const DUE_DILIGENCE_ITEMS = [
  {
    step: 1,
    title: 'Registered Sale Deed & 30-Year Chain',
    description:
      'Inspect the flow of registered title conveyances, parent documents, and succession records covering a continuous 30-year period.',
    detail:
      'Examine prior conveyances, gift deeds, partition deeds, and succession links with a qualified advocate to verify unbroken chain of title.',
    icon: FileText,
  },
  {
    step: 2,
    title: 'Encumbrance Certificate (EC Form 15)',
    description:
      'Issued by the Sub-Registrar Office reflecting registered transactions, mortgages, and recorded encumbrances on the property.',
    detail:
      'Obtain certified EC for the entire 30-year period up to the current date. Form 15 reflects registered encumbrances; Form 16 indicates nil registered entries.',
    icon: FileCheck,
  },
  {
    step: 3,
    title: 'Pahani / 7-12 Extract / ROR 1-B',
    description:
      'Official Revenue Department record confirming agricultural possession, extent, soil type, and crop status (applicable per state).',
    detail:
      'Cross-check Pattadar Passbook entries, mutation proceedings, and verify revenue records on state land portals (Dharani, Bhulekh, Kaveri, etc.).',
    icon: Layers,
  },
  {
    step: 4,
    title: 'Survey Number & FMB Map Sketch',
    description:
      'Field Measurement Book (FMB) or revenue sketch validating physical boundaries, survey sub-division, and access road easements.',
    detail:
      'Conduct an on-site physical inspection with a licensed surveyor to verify physical boundary demarcation matches the official revenue sketch.',
    icon: Compass,
  },
];

export function DueDiligenceChecklist({
  compact = false,
  className = '',
}: DueDiligenceChecklistProps) {
  if (compact) {
    return (
      <div
        className={`rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4 sm:p-5 space-y-3.5 ${className}`}
      >
        <div className="flex items-center gap-2 text-[#c75e0a]">
          <Scale className="w-5 h-5 text-[#FF9933] shrink-0" />
          <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wide">
            Land Buyer&apos;s Due Diligence Checklist
          </h3>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Examples of essential documents buyers should independently inspect before transferring advances or signing agreements:
        </p>

        <div className="space-y-2">
          {DUE_DILIGENCE_ITEMS.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-2.5 rounded-xl bg-white p-2.5 border border-[#FF9933]/20 shadow-2xs"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF9933] text-[10px] font-black text-white">
                {item.step}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 leading-snug">
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[#FF9933]/20 text-[10px] text-[#7a3705] flex items-start gap-1.5 leading-relaxed">
          <ShieldAlert className="w-3.5 h-3.5 text-[#FF9933] shrink-0 mt-0.5" />
          <span>
            <strong>Advisory Notice:</strong> Requirements vary by property type, location, and applicable state law. BhoomiMitra does not verify title. Always consult an independent property advocate and revenue authorities.
          </span>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1dc] border border-[#FF9933]/30 px-3 py-1 text-[10px] font-black text-[#c75e0a] mb-2 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-[#FF9933]" />
            Buyer Due Diligence Advisory
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Land Buyer&apos;s Due Diligence Checklist
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examples of documents buyers should independently inspect before entering into transactions
          </p>
        </div>
      </div>

      {/* 4 Essential Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {DUE_DILIGENCE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative rounded-2xl border border-slate-200/90 bg-[#fffdfa] p-5 hover:border-[#FF9933]/40 transition-all shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1dc] text-[#c75e0a] font-black text-sm">
                    {item.step}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#FF9933]">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Recommended Check
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-[#c75e0a]">Inspection Guidance: </span>
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Marketplace Due Diligence Advisory Notice */}
      <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-[#FF9933] shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs leading-relaxed text-[#7a3705]">
          <p className="font-black text-slate-950">
            Marketplace Notice &amp; Due Diligence Advisory
          </p>
          <p className="text-[#9c4c0b]">
            Examples of documents buyers should independently inspect. Requirements vary by property type, location, and applicable state law. Consult an independent property lawyer and appropriate government/revenue/survey authorities.
          </p>
          <p className="text-xs text-[#7a3705]/90 leading-relaxed">
            BhoomiMitra operates as an online classifieds marketplace platform. BhoomiMitra does not provide title verification, legal verification, survey certification, or government-authority certification of property listings. Users are responsible for complying with applicable laws and conducting their own due diligence before entering transactions.
          </p>
        </div>
      </div>
    </section>
  );
}
