'use client';

import React from 'react';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step6DocumentsProps {
  form: UseSellFormReturn;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function Step6Documents({ form }: Step6DocumentsProps) {
  const { state, actions } = form;
  const { documents, isUploadingDoc } = state;
  const { handleDocumentUpload, handleRemoveDocument } = actions;

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">
          Supporting documents
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Optional. Add title, EC, tax, survey or other supporting records if you have them. You can submit the listing without documents and add them later.
        </p>
      </div>

      <label className="block cursor-pointer">
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleDocumentUpload(e, 'TITLE_DEED')}
          disabled={isUploadingDoc}
          className="hidden"
        />
        <div className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF9933] hover:bg-[#fff9f0] transition-colors p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
            {isUploadingDoc ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>
          <p className="text-sm font-extrabold text-slate-900">
            {isUploadingDoc
              ? 'Uploading document...'
              : 'Add documents'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            PDF, JPG, PNG or WebP. Documents are not required to submit.
          </p>
        </div>
      </label>

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((document, index) => (
            <div
              key={`${document.objectKey}-${index}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {document.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatFileSize(document.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDocument(index)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 cursor-pointer"
                title="Remove document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
