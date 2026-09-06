'use client';

import React from 'react';
import Image from 'next/image';
import {
  Camera,
  Video,
  RefreshCw,
  Sparkles,
  Film,
  Play,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { UseSellFormReturn } from '@/types/sell-form';

interface Step5MediaUploadProps {
  form: UseSellFormReturn;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function Step5MediaUpload({ form }: Step5MediaUploadProps) {
  const { state, actions } = form;
  const {
    images,
    isUploadingImage,
    imageCompressionMessage,
    video,
    isUploadingVideo,
    videoUploadMessage,
  } = state;

  const {
    handleImageUpload,
    handleRemoveImage,
    handleSetPrimaryImage,
    handleVideoUpload,
    handleRemoveVideo,
  } = actions;

  // Unified file selector handler (handles images and videos)
  const handleUniversalMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const hasImages = Array.from(files).some((f) =>
      f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name)
    );
    const hasVideo = Array.from(files).some((f) =>
      f.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(f.name)
    );

    if (hasImages) {
      handleImageUpload(e);
    }
    if (hasVideo) {
      handleVideoUpload(e);
    }
  };

  return (
    <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <span>Property Photos &amp; Video</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload clear photographs of the land and an optional drone/walkaround video.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Min 1 Photo Required
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            Video Optional
          </span>
        </div>
      </div>

      {/* Universal Drag & Drop Upload Zone */}
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/webm,video/x-matroska,video/avi"
          multiple
          onChange={handleUniversalMediaSelect}
          disabled={isUploadingImage || isUploadingVideo}
          className="hidden"
        />
        <div className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF9933] hover:bg-[#fff9f0] transition-all p-7 text-center group">
          <div className="w-14 h-14 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto mb-3 shadow-xs group-hover:scale-105 transition-transform">
            {isUploadingImage || isUploadingVideo ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center -space-x-1.5">
                <Camera className="w-5 h-5" />
                <Video className="w-5 h-5" />
              </div>
            )}
          </div>
          <p className="text-sm font-extrabold text-slate-900">
            {isUploadingImage
              ? 'Optimizing & uploading photos...'
              : isUploadingVideo
              ? 'Uploading video to cloud storage...'
              : 'Upload property photos & video tour'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Select JPG, PNG, WebP images and/or MP4, MOV, WebM video (up to 50 MB) • Multiple files supported
          </p>
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] text-slate-700 font-semibold shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#FF9933]" />
              Photos auto-compressed below 850 KB (WebP)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1dc]/60 border border-[#FF9933]/30 text-[10px] text-[#c75e0a] font-semibold">
              <Film className="w-3 h-3" />
              Direct high-speed cloud video streaming
            </span>
          </div>
        </div>
      </label>

      {/* Live Status Messages */}
      {(imageCompressionMessage || videoUploadMessage) && (
        <div className="space-y-2">
          {imageCompressionMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px] font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{imageCompressionMessage}</span>
            </div>
          )}
          {videoUploadMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
              {isUploadingVideo && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
              <span>{videoUploadMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Media Showcase (Unified Photos & Video Section) */}
      {(images.length > 0 || video || isUploadingVideo) && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-slate-900">
                Uploaded Media ({images.length + (video ? 1 : 0)})
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">
                ({images.length} {images.length === 1 ? 'photo' : 'photos'}{video ? ', 1 video' : ''})
              </span>
            </div>
            <span className="text-[10px] text-[#FF9933] font-semibold">
              Optimized &amp; Ready
            </span>
          </div>

          {/* Video Card (if present) */}
          {video && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF9933] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                    <Play className="w-3 h-3 fill-current" />
                    Video Walkthrough
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    WebM Compressed {typeof video.compressionRatio === 'number' && video.compressionRatio > 0 ? `(${video.compressionRatio}% smaller)` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors shadow-xs">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/avi"
                      onChange={handleVideoUpload}
                      disabled={isUploadingVideo}
                      className="hidden"
                    />
                    {isUploadingVideo ? 'Uploading...' : 'Replace Video'}
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Remove Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center border border-slate-200">
                <video
                  src={video.secureUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full max-h-72 object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 pt-1">
                <span className="truncate max-w-[240px] font-bold text-slate-900">
                  {video.fileName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Size: {formatFileSize(video.size)}</span>
                  {video.originalSize && video.originalSize > video.size && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Saved {formatFileSize(video.originalSize - video.size)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Video Uploading Placeholder Card */}
          {isUploadingVideo && !video && (
            <div className="rounded-2xl border-2 border-dashed border-[#FF9933]/50 bg-[#fff9f0] p-6 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#c75e0a] mx-auto" />
              <p className="text-xs font-black text-slate-900">
                {videoUploadMessage || 'Uploading & optimizing video...'}
              </p>
              <p className="text-[10px] text-slate-500">
                Bypasses server payload limits and automatically compresses to lightweight WebM.
              </p>
            </div>
          )}

          {/* Photo Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image, index) => (
                <div
                  key={image.objectKey || `${image.fileName}-${index}`}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                >
                  <Image
                    src={image.secureUrl}
                    alt={image.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover"
                  />
                  {image.isPrimary && (
                    <div className="absolute left-2 top-2 px-2 py-1 rounded-md bg-[#FF9933] text-white text-[9px] font-black shadow-xs">
                      Primary Photo
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/65 text-white text-[9px] font-semibold backdrop-blur-xs">
                    {formatFileSize(image.size)} WebP
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(index)}
                      className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-white/95 text-slate-800 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF9933] hover:text-white cursor-pointer shadow-xs"
                    >
                      Make Primary
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800 mb-0.5">
              Automatic media compression &amp; acceleration
            </p>
            <p>
              Photographs are converted in your browser to lightweight WebP files (&lt;850 KB), and videos are transcoded on our backend to high-efficiency WebM for lightning-fast playback on any mobile device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
