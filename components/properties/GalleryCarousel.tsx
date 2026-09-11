'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LandPlot,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import { IProperty, IPropertyImage } from '@/types/property';

const SHIMMER_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNmMmY0ZjciIC8+PC9zdmc+';

interface GalleryCarouselProps {
  property: IProperty;
}

export function GalleryCarousel({ property }: GalleryCarouselProps) {
  const images: IPropertyImage[] = Array.isArray(property.images) ? property.images : [];
  const primaryIndex = images.findIndex((img) => img.isPrimary);

  const [activeMediaTab, setActiveMediaTab] = useState<'PHOTOS' | 'VIDEO'>('PHOTOS');
  const [activeImageIndex, setActiveImageIndex] = useState(() => (primaryIndex >= 0 ? primaryIndex : 0));
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);

  const activeImage =
    images[activeImageIndex] ||
    (primaryIndex >= 0 ? images[primaryIndex] : images[0]);

  useEffect(() => {
    const list: IPropertyImage[] = Array.isArray(property.images) ? property.images : [];
    const idx = list.findIndex((img) => img.isPrimary);
    if (idx >= 0) {
      setActiveImageIndex(idx);
    }
  }, [property._id, property.images]);

  const handlePrevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxScale(1);
      } else if (e.key === 'ArrowLeft' && activeMediaTab === 'PHOTOS') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight' && activeMediaTab === 'PHOTOS') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeMediaTab, handlePrevImage, handleNextImage]);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-900 sm:aspect-[16/10]">
          {/* Media Switcher Tab (Photos vs Video Tour) */}
          {property.video?.secureUrl && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-xl bg-black/70 p-1 backdrop-blur-md text-white text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveMediaTab('PHOTOS')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeMediaTab === 'PHOTOS'
                    ? 'bg-[#FF9933] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos ({images.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('VIDEO')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeMediaTab === 'VIDEO'
                    ? 'bg-[#FF9933] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Video Tour</span>
              </button>
            </div>
          )}

          {activeMediaTab === 'VIDEO' && property.video?.secureUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                src={property.video.secureUrl}
                controls
                playsInline
                autoPlay
                preload="metadata"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105"
                title="Expand video to fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Maximize</span>
              </button>
            </div>
          ) : activeImage?.secureUrl ? (
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full h-full cursor-zoom-in group"
              title="Click to maximize image"
            >
              <Image
                src={activeImage.secureUrl}
                alt={activeImage.fileName || property.title}
                fill
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105"
                title="Click to maximize image"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Click to Maximize</span>
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100">
              <div className="text-center">
                <LandPlot className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-xs font-semibold text-slate-400">
                  No property images available
                </p>
              </div>
            </div>
          )}

          {/* Image count */}
          {activeMediaTab === 'PHOTOS' && images.length > 0 && (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
              {activeImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Navigation arrows (Only on photos) */}
          {activeMediaTab === 'PHOTOS' && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous property image"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next property image"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails strip */}
        {(images.length > 1 || Boolean(property.video?.secureUrl)) && (
          <div className="flex gap-2 overflow-x-auto p-3 items-center">
            {images.map((image, index) => (
              <button
                type="button"
                key={image._id || image.objectKey || index}
                onClick={() => {
                  setActiveImageIndex(index);
                  setActiveMediaTab('PHOTOS');
                }}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${
                  activeMediaTab === 'PHOTOS' && activeImageIndex === index
                    ? 'border-[#FF9933]'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.secureUrl}
                  alt=""
                  fill
                  placeholder="blur"
                  blurDataURL={SHIMMER_BLUR_DATA_URL}
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}

            {/* Video Thumbnail Button */}
            {property.video?.secureUrl && (
              <button
                type="button"
                onClick={() => setActiveMediaTab('VIDEO')}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-950 flex flex-col items-center justify-center text-white transition-all cursor-pointer ${
                  activeMediaTab === 'VIDEO'
                    ? 'border-[#FF9933] shadow-sm'
                    : 'border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-700'
                }`}
                title="Watch Video Tour"
              >
                <div className="w-7 h-7 rounded-full bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mb-0.5">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="text-[9px] font-black text-white uppercase tracking-wider">Video</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Lightbox Controls Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">
                {activeMediaTab === 'VIDEO'
                  ? 'Video Tour'
                  : `Photo ${activeImageIndex + 1} of ${images.length}`}
              </span>
              {activeMediaTab === 'PHOTOS' && (
                <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setLightboxScale((s) => Math.min(s + 0.25, 3))}
                    className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxScale((s) => Math.max(s - 0.25, 0.75))}
                    className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxScale(1)}
                    className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLightboxOpen(false);
                setLightboxScale(1);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Stage */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden my-4">
            {activeMediaTab === 'VIDEO' && property.video?.secureUrl ? (
              <video
                src={property.video.secureUrl}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : activeImage?.secureUrl ? (
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
                style={{ transform: `scale(${lightboxScale})` }}
              >
                <Image
                  src={activeImage.secureUrl}
                  alt={activeImage.fileName || property.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            ) : null}

            {/* Previous / Next buttons */}
            {activeMediaTab === 'PHOTOS' && images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur transition-all cursor-pointer"
                  title="Previous Photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur transition-all cursor-pointer"
                  title="Next Photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Bar in Lightbox */}
          {images.length > 1 && activeMediaTab === 'PHOTOS' && (
            <div className="flex gap-2 overflow-x-auto justify-center pt-2 border-t border-white/10 shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img._id || idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setLightboxScale(1);
                  }}
                  className={`relative h-12 w-16 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#FF9933] scale-105 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img.secureUrl} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
