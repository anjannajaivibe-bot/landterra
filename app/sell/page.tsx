'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GoogleMapPicker } from '@/components/maps/GoogleMapPicker';
import { RazorpayCheckoutModal } from '@/components/payments/RazorpayCheckoutModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { LAND_TYPES, INDIAN_STATES } from '@/config/constants';
import { LandType, IProperty } from '@/types/property';
import { SellerType, IUser } from '@/types/user';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  CreditCard,
  MapPin,
  AlertCircle,
  IndianRupee,
  Trash2,
  Sparkles,
  Phone,
  Compass,
  ImageIcon,
  RefreshCw,
  Ruler,
} from 'lucide-react';

interface UploadedImagePreview {
  secureUrl: string;
  isPrimary: boolean;
  objectKey: string;
  fileName: string;
  size: number;
  mimeType: string;
}

interface UploadedDocPreview {
  documentType:
  | 'TITLE_DEED'
  | 'KHATA_7_12_CERTIFICATE'
  | 'ENCUMBRANCE_CERTIFICATE'
  | 'TAX_RECEIPT'
  | 'GOVT_SURVEY_RECORD'
  | 'POA_OR_OTHER';
  fileName: string;
  objectKey: string;
  size: number;
}

type LandAreaUnit =
  | 'SQUARE_YARDS'
  | 'GUNTAS'
  | 'CENTS'
  | 'ACRES'
  | 'HECTARES';

const LAND_AREA_CONVERSIONS: Record<LandAreaUnit, number> = {
  SQUARE_YARDS: 1,
  GUNTAS: 121,
  CENTS: 48.4,
  ACRES: 4840,
  HECTARES: 11959.9004,
};

const LAND_AREA_UNIT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'Square Yards',
  GUNTAS: 'Guntas',
  CENTS: 'Cents',
  ACRES: 'Acres',
  HECTARES: 'Hectares',
};

const LAND_AREA_UNIT_SHORT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'sq. yd',
  GUNTAS: 'guntas',
  CENTS: 'cents',
  ACRES: 'acres',
  HECTARES: 'hectares',
};

const MAX_IMAGE_UPLOAD_BYTES = 850 * 1024;
const MAX_IMAGE_DIMENSION = 2048;
const INITIAL_IMAGE_QUALITY = 0.82;
const MIN_IMAGE_QUALITY = 0.45;

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatArea(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';

  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function convertToSquareYards(
  value: number,
  unit: LandAreaUnit,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;

  return value * LAND_AREA_CONVERSIONS[unit];
}

function convertFromSquareYards(
  squareYards: number,
  unit: LandAreaUnit,
): number {
  if (!Number.isFinite(squareYards) || squareYards <= 0) return 0;

  return squareYards / LAND_AREA_CONVERSIONS[unit];
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not a supported image.`);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new window.Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error(`Unable to read image: ${file.name}`));
      image.src = objectUrl;
    });

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (!width || !height) {
      throw new Error(`Invalid image dimensions: ${file.name}`);
    }

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const scale = Math.min(
        MAX_IMAGE_DIMENSION / width,
        MAX_IMAGE_DIMENSION / height,
      );

      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Browser image processing is unavailable.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.drawImage(image, 0, 0, width, height);

    const outputMimeType = 'image/webp';

    const canvasToBlob = (
      quality: number,
    ): Promise<Blob> =>
      new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Unable to compress image.'));
              return;
            }

            resolve(blob);
          },
          outputMimeType,
          quality,
        );
      });

    let quality = INITIAL_IMAGE_QUALITY;
    let blob = await canvasToBlob(quality);

    while (
      blob.size > MAX_IMAGE_UPLOAD_BYTES &&
      quality > MIN_IMAGE_QUALITY
    ) {
      quality = Math.max(
        MIN_IMAGE_QUALITY,
        quality - 0.07,
      );

      blob = await canvasToBlob(quality);
    }

    let attempts = 0;

    while (
      blob.size > MAX_IMAGE_UPLOAD_BYTES &&
      attempts < 5
    ) {
      attempts += 1;

      width = Math.max(
        800,
        Math.round(width * 0.85),
      );

      height = Math.max(
        600,
        Math.round(height * 0.85),
      );

      canvas.width = width;
      canvas.height = height;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      context.drawImage(
        image,
        0,
        0,
        width,
        height,
      );

      quality = Math.max(
        MIN_IMAGE_QUALITY,
        quality - 0.04,
      );

      blob = await canvasToBlob(quality);
    }

    if (blob.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error(
        `Unable to optimize ${file.name} below 850 KB. Please choose another image.`,
      );
    }

    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 80);

    return new File(
      [blob],
      `${baseName || 'land-photo'}.webp`,
      {
        type: outputMimeType,
        lastModified: Date.now(),
      },
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function SellPageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyIdParam =
    searchParams.get('propertyId') ||
    searchParams.get('edit');

  const [currentUser, setCurrentUser] =
    useState<Partial<IUser> | null>(null);

  const [existingPropertyId, setExistingPropertyId] =
    useState<string | null>(null);

  const [existingPaymentStatus, setExistingPaymentStatus] =
    useState<string | null>(null);

  const [isUpdateSuccess, setIsUpdateSuccess] =
    useState<boolean>(false);

  // Settings
  const [requireGoogleLogin, setRequireGoogleLogin] =
    useState<boolean>(true);

  const [requirePhoneOtp, setRequirePhoneOtp] =
    useState<boolean>(true);

  const [listingFeeAmount, setListingFeeAmount] =
    useState<number>(10);

  const [listingDurationDays, setListingDurationDays] =
    useState<number>(30);

  const [pageLoading, setPageLoading] =
    useState<boolean>(true);

  // Auth / OTP
  const [authModalOpen, setAuthModalOpen] =
    useState<boolean>(false);

  const [phoneInput, setPhoneInput] =
    useState<string>('');

  const [otpSent, setOtpSent] =
    useState<boolean>(false);

  const [otpCode, setOtpCode] =
    useState<string>('');

  const [otpLoading, setOtpLoading] =
    useState<boolean>(false);

  const [otpMessage, setOtpMessage] =
    useState<{
      type: 'success' | 'error';
      text: string;
    } | null>(null);

  const [testOtpNotice, setTestOtpNotice] =
    useState<string | null>(null);

  // Wizard
  const [currentStep, setCurrentStep] =
    useState<number>(1);

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string>('');

  // Step 1: Specs & Pricing
  const [title, setTitle] =
    useState<string>('');

  const [description, setDescription] =
    useState<string>('');

  const [landAreaYards, setLandAreaYards] =
    useState<number>(300);

  const [landAreaInput, setLandAreaInput] =
    useState<string>('300');

  const [landAreaUnit, setLandAreaUnit] =
    useState<LandAreaUnit>('SQUARE_YARDS');

  const [pricePerYard, setPricePerYard] =
    useState<number>(25000);

  const [priceNegotiable, setPriceNegotiable] =
    useState<boolean>(true);

  const [landType, setLandType] =
    useState<LandType>('RESIDENTIAL_PLOT');

  const [roadAccess, setRoadAccess] =
    useState<string>('30_FT_PLUS');

  const [landmarks, setLandmarks] =
    useState<string>('');

  // Step 2: Location
  const [googleMapsShareLink, setGoogleMapsShareLink] =
    useState<string>('');

  const [latitude, setLatitude] =
    useState<number>(17.4123);

  const [longitude, setLongitude] =
    useState<number>(78.3512);

  const [address, setAddress] =
    useState<string>('');

  const [city, setCity] =
    useState<string>('');

  const [state, setState] =
    useState<string>('Telangana');

  const [pincode, setPincode] =
    useState<string>('');

  const [approximateLocation, setApproximateLocation] =
    useState<boolean>(false);

  // Step 3: Seller
  const [sellerName, setSellerName] =
    useState<string>('');

  const [sellerPhone, setSellerPhone] =
    useState<string>('');

  const [sellerEmail, setSellerEmail] =
    useState<string>('');

  const [sellerType, setSellerType] =
    useState<SellerType>('INDIVIDUAL');

  const [sellerAddress, setSellerAddress] =
    useState<string>('');

  // Step 4: Govt ID
  const [governmentRegistrationId, setGovernmentRegistrationId] =
    useState<string>('');

  // Step 5: Images
  const [images, setImages] =
    useState<UploadedImagePreview[]>([]);

  const [isUploadingImage, setIsUploadingImage] =
    useState<boolean>(false);

  const [imageCompressionMessage, setImageCompressionMessage] =
    useState<string>('');

  // Step 6: Documents
  const [documents, setDocuments] =
    useState<UploadedDocPreview[]>([]);

  const [isUploadingDoc, setIsUploadingDoc] =
    useState<boolean>(false);

  // Step 7: Terms & Payment
  const [termsAccepted, setTermsAccepted] =
    useState<boolean>(true);

  const [createdProperty, setCreatedProperty] =
    useState<IProperty | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] =
    useState<boolean>(false);

  // Area conversions
  const areaConversions = useMemo(() => {
    return {
      squareYards: landAreaYards,
      guntas: convertFromSquareYards(landAreaYards, 'GUNTAS'),
      cents: convertFromSquareYards(landAreaYards, 'CENTS'),
      acres: convertFromSquareYards(landAreaYards, 'ACRES'),
      hectares: convertFromSquareYards(landAreaYards, 'HECTARES'),
    };
  }, [landAreaYards]);

  const totalValuation = landAreaYards * pricePerYard;

  const handleLandAreaUnitChange = (nextUnit: LandAreaUnit) => {
    setLandAreaUnit(nextUnit);
    const converted = convertFromSquareYards(landAreaYards, nextUnit);
    setLandAreaInput(
      converted > 0 ? String(Number(converted.toFixed(6))) : '',
    );
  };

  const handleLandAreaInputChange = (value: string) => {
    const sanitized = value
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    setLandAreaInput(sanitized);
    const numericValue = Number(sanitized);

    if (!sanitized || !Number.isFinite(numericValue) || numericValue <= 0) {
      setLandAreaYards(0);
      return;
    }

    const squareYards = convertToSquareYards(numericValue, landAreaUnit);
    setLandAreaYards(Number(squareYards.toFixed(4)));
  };

  // Initialization
  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, settingsRes] = await Promise.all([
          fetch('/api/auth/session').catch(() => null),
          fetch('/api/settings/public').catch(() => null),
        ]);

        if (settingsRes?.ok) {
          const settings = await settingsRes.json();
          if (typeof settings.requireGoogleLogin === 'boolean') {
            setRequireGoogleLogin(settings.requireGoogleLogin);
          }
          if (typeof settings.requirePhoneOtp === 'boolean') {
            setRequirePhoneOtp(settings.requirePhoneOtp);
          }
          if (typeof settings.listingFeeAmount === 'number') {
            setListingFeeAmount(settings.listingFeeAmount);
          }
          if (typeof settings.listingFeeDurationDays === 'number') {
            setListingDurationDays(settings.listingFeeDurationDays);
          }
        }

        if (sessionRes?.ok) {
          const data = await sessionRes.json();
          if (data?.session?.user) {
            const user = data.session.user;
            setCurrentUser(user);
            setSellerName(user.name || '');
            setSellerEmail(user.email || '');
            if (user.phone) {
              setSellerPhone(user.phone);
              setPhoneInput(user.phone);
            }
          }
        }

        // Resume existing draft
        if (propertyIdParam) {
          const propertyResponse = await fetch(
            `/api/properties/${propertyIdParam}`,
          ).catch(() => null);

          if (propertyResponse?.ok) {
            const propertyData = await propertyResponse.json();
            if (
              propertyData?.property &&
              (propertyData.isOwner || propertyData.isAdmin)
            ) {
              const property = propertyData.property;
              setExistingPropertyId(property._id);
              if (property.paymentStatus) {
                setExistingPaymentStatus(property.paymentStatus);
              }

              if (property.title) setTitle(property.title);
              if (property.description) setDescription(property.description);

              if (typeof property.landAreaYards === 'number') {
                const canonicalArea = property.landAreaYards;
                setLandAreaYards(canonicalArea);
                setLandAreaUnit('SQUARE_YARDS');
                setLandAreaInput(String(Number(canonicalArea.toFixed(4))));
              }

              if (typeof property.pricePerYard === 'number') {
                setPricePerYard(property.pricePerYard);
              }
              if (typeof property.priceNegotiable === 'boolean') {
                setPriceNegotiable(property.priceNegotiable);
              }
              if (property.landType) setLandType(property.landType);
              if (property.roadAccess) setRoadAccess(property.roadAccess);
              if (Array.isArray(property.nearbyLandmarks)) {
                setLandmarks(property.nearbyLandmarks.join(', '));
              }

              if (property.location) {
                if (property.location.address) setAddress(property.location.address);
                if (property.location.city) setCity(property.location.city);
                if (property.location.state) setState(property.location.state);
                if (property.location.pincode) setPincode(property.location.pincode);
              }

              if (property.googleMapsShareLink) {
                setGoogleMapsShareLink(property.googleMapsShareLink);
              }
              if (typeof property.latitude === 'number') setLatitude(property.latitude);
              if (typeof property.longitude === 'number') setLongitude(property.longitude);
              if (typeof property.approximateLocation === 'boolean') {
                setApproximateLocation(property.approximateLocation);
              }
              if (property.governmentRegistrationId) {
                setGovernmentRegistrationId(property.governmentRegistrationId);
              }
              if (property.sellerType) setSellerType(property.sellerType);

              if (Array.isArray(property.images) && property.images.length > 0) {
                setImages(
                  property.images.map((img: any) => ({
                    secureUrl: img.secureUrl,
                    isPrimary: Boolean(img.isPrimary),
                    objectKey: img.objectKey,
                    fileName: img.fileName || 'image.webp',
                    size: typeof img.size === 'number' ? img.size : 0,
                    mimeType: img.mimeType || 'image/webp',
                  })),
                );
              }

              if (Array.isArray(property.documents) && property.documents.length > 0) {
                setDocuments(
                  property.documents.map((doc: any) => ({
                    documentType: doc.documentType,
                    fileName: doc.fileName || 'document.pdf',
                    objectKey: doc.objectKey,
                    size: typeof doc.size === 'number' ? doc.size : 0,
                  })),
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Init error on sell page:', err);
      } finally {
        setPageLoading(false);
      }
    }

    init();
  }, [propertyIdParam]);

  // Phone OTP handlers
  const handleSendOtp = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      setOtpMessage({
        type: 'error',
        text: 'Please enter a valid 10-digit Indian mobile number',
      });
      return;
    }

    setOtpLoading(true);
    setOtpMessage(null);
    setTestOtpNotice(null);

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpMessage({
          type: 'success',
          text: data.message || 'OTP sent successfully!',
        });
        if (data.testOtpPreview) {
          setTestOtpNotice(data.testOtpPreview);
        }
      } else {
        setOtpMessage({
          type: 'error',
          text: data.message || 'Failed to send OTP',
        });
      }
    } catch {
      setOtpMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage({
        type: 'error',
        text: 'Please enter the 6-digit OTP code',
      });
      return;
    }

    setOtpLoading(true);
    setOtpMessage(null);

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpMessage({
          type: 'success',
          text: 'Mobile number verified successfully!',
        });
        setCurrentUser((prev) =>
          prev ? { ...prev, phone: data.phone, isPhoneVerified: true } : null,
        );
        setSellerPhone(data.phone);
        setOtpSent(false);
        setOtpCode('');
        setTestOtpNotice(null);
      } else {
        setOtpMessage({
          type: 'error',
          text: data.message || 'Invalid OTP. Please check and try again.',
        });
      }
    } catch {
      setOtpMessage({
        type: 'error',
        text: 'Verification error. Please try again.',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage('');

    if (step === 1) {
      if (!title.trim() || title.length < 6) {
        setErrorMessage('Property title must be at least 6 characters long.');
        return false;
      }
      if (!Number.isFinite(landAreaYards) || landAreaYards <= 0) {
        setErrorMessage('Land area must be greater than zero.');
        return false;
      }
      if (!Number.isFinite(pricePerYard) || pricePerYard <= 0) {
        setErrorMessage('Price per sq. yard must be greater than zero.');
        return false;
      }
    }

    if (step === 2) {
      if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        setErrorMessage(
          'Please complete all mandatory location fields (Address, City, State, Pincode).',
        );
        return false;
      }
    }

    if (step === 3) {
      if (!sellerName.trim() || !sellerPhone.trim() || !sellerEmail.trim()) {
        setErrorMessage('Please provide your full seller profile information.');
        return false;
      }
    }

    if (step === 5) {
      if (images.length === 0) {
        setErrorMessage('Please upload at least 1 photo of the land parcel.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Image Upload with Client-Side Compression
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setErrorMessage('');
    setImageCompressionMessage('');

    try {
      for (let index = 0; index < files.length; index += 1) {
        const originalFile = files[index];

        if (!originalFile.type.startsWith('image/')) {
          setErrorMessage(`${originalFile.name} is not a supported image file.`);
          continue;
        }

        try {
          setImageCompressionMessage(`Optimizing ${originalFile.name}...`);
          const compressedFile = await compressImage(originalFile);

          setImageCompressionMessage(
            `${originalFile.name}: ${formatFileSize(originalFile.size)} → ${formatFileSize(compressedFile.size)}`,
          );

          const formData = new FormData();
          formData.append('file', compressedFile);
          formData.append('isPrivate', 'false');
          formData.append('folder', 'properties');

          const response = await fetch('/api/uploads/direct', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (response.ok && data.file) {
            setImages((prev) => [
              ...prev,
              {
                secureUrl: data.file.secureUrl,
                isPrimary: prev.length === 0,
                objectKey: data.file.objectKey,
                fileName: compressedFile.name,
                size: compressedFile.size,
                mimeType: compressedFile.type,
              },
            ]);
          } else {
            setErrorMessage(
              data.error || `Failed to upload ${originalFile.name}`,
            );
          }
        } catch (imageError) {
          console.error('Image optimization/upload error:', imageError);
          const message =
            imageError instanceof Error
              ? imageError.message
              : `Failed to process ${originalFile.name}`;
          setErrorMessage(message);
        }
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setErrorMessage('Image upload error occurred. Please try again.');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
      window.setTimeout(() => {
        setImageCompressionMessage('');
      }, 4000);
    }
  };

  // Document Upload
  const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    setErrorMessage('');

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPrivate', 'true');
        formData.append('folder', 'properties');

        const response = await fetch('/api/uploads/direct', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.file) {
          setDocuments((prev) => [
            ...prev,
            {
              documentType: 'TITLE_DEED',
              fileName: file.name,
              objectKey: data.file.objectKey,
              size: file.size,
            },
          ]);
        } else {
          setErrorMessage(data.error || 'Failed to upload document');
        }
      }
    } catch (error) {
      console.error('Doc upload failed:', error);
      setErrorMessage('Document upload error occurred');
    } finally {
      setIsUploadingDoc(false);
      event.target.value = '';
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!termsAccepted) {
      setErrorMessage('You must accept the listing terms and publishing declaration.');
      return;
    }

    if (!Number.isFinite(landAreaYards) || landAreaYards <= 0) {
      setErrorMessage('Please enter a valid land area.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title,
        description,
        landAreaYards: Number(landAreaYards.toFixed(4)),
        pricePerYard: Number(pricePerYard),
        priceNegotiable,
        landType,
        roadAccess,
        nearbyLandmarks: landmarks
          ? landmarks
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean)
          : [],
        location: {
          address,
          city,
          state,
          pincode,
        },
        googleMapsShareLink,
        latitude,
        longitude,
        approximateLocation,
        governmentRegistrationId,
        sellerName,
        sellerPhone: (sellerPhone || phoneInput || '')
          .replace(/^\+91/, '')
          .replace(/\D/g, '')
          .slice(-10),
        sellerEmail,
        sellerType,
        sellerDeclarationAccepted: Boolean(termsAccepted),
        images: images.map((image, index) => ({
          objectKey: image.objectKey,
          secureUrl: image.secureUrl,
          fileName: image.fileName,
          mimeType: image.mimeType,
          size: image.size,
          isPrimary: image.isPrimary,
          sortOrder: index,
        })),
        documents: documents.map((document) => ({
          documentType: document.documentType,
          objectKey: document.objectKey,
          fileName: document.fileName,
          mimeType: 'application/pdf',
          size: document.size,
        })),
      };

      let response: Response;

      if (existingPropertyId) {
        response = await fetch(`/api/properties/${existingPropertyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PHONE_VERIFICATION_REQUIRED') {
          setErrorMessage(
            'Phone verification is required before listing. Please verify your phone number.',
          );
        } else {
          throw new Error(data.error || 'Failed to submit listing draft');
        }
        setIsSubmitting(false);
        return;
      }

      const savedProperty =
        data.property ||
        (existingPropertyId ? { ...payload, _id: existingPropertyId } : null);

      if (existingPropertyId && existingPaymentStatus === 'PAID') {
        setIsUpdateSuccess(true);
        window.setTimeout(() => {
          router.push('/dashboard/seller');
        }, 1200);
        return;
      }

      setCreatedProperty(savedProperty);
      setPaymentModalOpen(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error submitting listing';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-20 px-4 text-center flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933]" />
        </div>
        <Footer />
      </div>
    );
  }

  // Auth Gate
  if (requireGoogleLogin && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to List Your Land
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                BhoomiMitra connects land owners directly with serious buyers across India with zero broker commissions. Sign in with Google to begin your listing.
              </p>
            </div>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#FF9933]" />
              <span>100% Direct Seller-to-Buyer Contact</span>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Sign in to Sell Your Land"
          description="Authenticate with Google to create your land listing, manage inquiries, and track monthly subscriptions."
        />

        <Footer />
      </div>
    );
  }

  // Phone OTP Verification Gate
  if (requirePhoneOtp && currentUser && !currentUser.isPhoneVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
              <Phone className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Verify Your Mobile Number
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                To prevent fraud and spam listings, all land sellers must verify their mobile phone number via OTP before listing parcels.
              </p>
            </div>

            {otpMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${otpMessage.type === 'success'
                    ? 'bg-[#fff9f0] text-[#c75e0a] border border-[#FF9933]/30'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
              >
                {otpMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FF9933]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{otpMessage.text}</span>
              </div>
            )}

            {testOtpNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Development OTP Code:</span>
                </p>
                <p className="font-mono text-base font-black tracking-widest text-amber-950">
                  {testOtpNotice}
                </p>
                <p className="text-[10px] text-amber-700">
                  (Shown only outside production for convenient workflow testing)
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10-Digit Mobile Number
                </label>

                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                    +91
                  </div>

                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phoneInput}
                    onChange={(event) =>
                      setPhoneInput(event.target.value.replace(/\D/g, ''))
                    }
                    disabled={otpSent || otpLoading}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-[#FF9933]"
                  />

                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || phoneInput.length < 10}
                      className="px-4 py-2.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {otpLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter 6-Digit Verification Code
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(event.target.value.replace(/\D/g, ''))
                      }
                      className="w-full text-center tracking-widest text-lg font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-[#FF9933]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <span>{otpLoading ? 'Verifying...' : 'Verify Phone & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Change phone number
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  const progressPercent = (currentStep / 7) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#FF9933] mb-1">
                  {existingPropertyId ? 'Continue Your Listing Draft' : 'Seller Listing'}
                </p>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                  {existingPropertyId ? 'Complete Your Land Listing' : 'List Your Land'}
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Add your property details, upload supporting documents, and publish after flat-fee payment.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#FF9933]" />
                <span className="text-[11px] font-semibold text-slate-600">
                  Direct Seller Listing
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF9933] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-7 gap-1.5 mb-8 overflow-x-auto">
            {[
              'Details',
              'Location',
              'Seller',
              'Records',
              'Photos',
              'Documents',
              'Payment',
            ].map((label, index) => {
              const step = index + 1;
              const active = currentStep === step;
              const completed = currentStep > step;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (completed) {
                      setCurrentStep(step);
                      setErrorMessage('');
                    }
                  }}
                  disabled={!completed && !active}
                  className={`min-w-0 rounded-lg px-1.5 py-2 text-center transition-colors ${active
                      ? 'bg-[#FF9933] text-white shadow-sm'
                      : completed
                        ? 'bg-[#fff9f0] text-[#c75e0a] border border-[#FF9933]/30 cursor-pointer'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                >
                  <div className="text-[9px] sm:text-[10px] font-bold">
                    {completed ? '✓' : step}
                  </div>
                  <div className="hidden sm:block text-[9px] font-semibold truncate mt-0.5">
                    {label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-0.5">Please check the following</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* STEP 1: Property Details & Multi-Unit Land Area */}
            {currentStep === 1 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Property Details & Pricing
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide land specifications, pricing, and measurements.
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: 300 Sq. Yards Residential Plot Near Financial District"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-slate-400">
                      Make the location and property type clear.
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {title.length}/120
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Property Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    maxLength={3000}
                    placeholder="Describe road access, surroundings, development status, nearby facilities, ownership details, and anything else a genuine buyer should know."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                  />
                  <div className="text-right text-[10px] text-slate-400 mt-1">
                    {description.length}/3000
                  </div>
                </div>

                {/* Multi-Unit Land Area Section */}
                <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4 sm:p-5">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Land Area
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Enter the measurement in the unit you normally use. BhoomiMitra automatically converts it into square yards.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3">
                    {/* Area Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Land Area Value
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={landAreaInput}
                          onChange={(event) =>
                            handleLandAreaInputChange(event.target.value)
                          }
                          placeholder="Enter land area"
                          className="w-full px-4 py-3 pr-20 rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          {LAND_AREA_UNIT_SHORT_LABELS[landAreaUnit]}
                        </span>
                      </div>
                    </div>

                    {/* Unit Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Unit
                      </label>
                      <select
                        value={landAreaUnit}
                        onChange={(event) =>
                          handleLandAreaUnitChange(
                            event.target.value as LandAreaUnit,
                          )
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                      >
                        {(
                          Object.keys(LAND_AREA_UNIT_LABELS) as LandAreaUnit[]
                        ).map((unit) => (
                          <option key={unit} value={unit}>
                            {LAND_AREA_UNIT_LABELS[unit]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Conversion Multi-View Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
                        Sq. Yards
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatArea(areaConversions.squareYards, 2)}
                      </p>
                    </div>

                    <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
                        Guntas
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatArea(areaConversions.guntas, 2)}
                      </p>
                    </div>

                    <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
                        Cents
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatArea(areaConversions.cents, 2)}
                      </p>
                    </div>

                    <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
                        Acres
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatArea(areaConversions.acres, 4)}
                      </p>
                    </div>

                    <div className="bg-white border border-[#FF9933]/30 rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-wide font-bold text-slate-400">
                        Hectares
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatArea(areaConversions.hectares, 4)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-[10px] text-[#c75e0a]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>
                      Your entered measurement is automatically converted to{' '}
                      <strong>{formatArea(landAreaYards, 2)} square yards</strong> for BhoomiMitra&apos;s property records.
                    </p>
                  </div>
                </div>

                {/* Price & Valuation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Price per Square Yard *
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min={1}
                        value={pricePerYard || ''}
                        onChange={(event) =>
                          setPricePerYard(Number(event.target.value))
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Estimated Property Value
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">
                      ₹{Number(totalValuation || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatArea(landAreaYards, 2)} sq. yards × ₹
                      {Number(pricePerYard || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Negotiable */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceNegotiable}
                    onChange={(event) =>
                      setPriceNegotiable(event.target.checked)
                    }
                    className="w-4 h-4 accent-[#FF9933]"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Price is negotiable with serious buyers
                  </span>
                </label>

                {/* Land type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Land Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LAND_TYPES.map((type: any) => {
                      const value = type.value || type.id || type;
                      const label = type.label || type.name || value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLandType(value as LandType)}
                          className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${landType === value
                              ? 'border-[#FF9933] bg-[#fff9f0] text-[#7a3705] font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                            }`}
                        >
                          <span className="text-[11px]">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Road Access */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Road Access
                  </label>
                  <select
                    value={roadAccess}
                    onChange={(event) => setRoadAccess(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                  >
                    <option value="30_FT_PLUS">30 ft or wider road</option>
                    <option value="20_TO_30_FT">20–30 ft road</option>
                    <option value="10_TO_20_FT">10–20 ft road</option>
                    <option value="LESS_THAN_10_FT">Less than 10 ft road</option>
                    <option value="NO_ROAD_ACCESS">No direct road access</option>
                  </select>
                </div>

                {/* Landmarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nearby Landmarks
                  </label>
                  <input
                    type="text"
                    value={landmarks}
                    onChange={(event) => setLandmarks(event.target.value)}
                    placeholder="Example: Metro Station, ORR, School, Hospital"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Separate multiple landmarks with commas.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Maps */}
            {currentStep === 2 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Property Location & Map Coordinates
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Help buyers locate the property accurately.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Google Maps Share Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={googleMapsShareLink}
                    onChange={(event) =>
                      setGoogleMapsShareLink(event.target.value)
                    }
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can paste the location link copied directly from Google Maps.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <GoogleMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    address={address}
                    city={city}
                    state={state}
                    pincode={pincode}
                    approximateLocation={approximateLocation}
                    onChange={(data) => {
                      setLatitude(data.latitude);
                      setLongitude(data.longitude);
                      if (data.address) setAddress(data.address);
                      if (data.city) setCity(data.city);
                      if (data.state) setState(data.state);
                      if (data.pincode) setPincode(data.pincode);
                      setApproximateLocation(data.approximateLocation);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Address / Site Details *
                    </label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Plot number, survey location, layout name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="City"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          State *
                        </label>
                        <select
                          value={state}
                          onChange={(event) => setState(event.target.value)}
                          className="w-full px-3 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          {INDIAN_STATES.map((item: any) => {
                            const value = item.value || item;
                            const label = item.label || item.name || item;
                            return (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(event) =>
                            setPincode(event.target.value.replace(/\D/g, ''))
                          }
                          placeholder="500001"
                          className="w-full px-3 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approximateLocation}
                    onChange={(event) =>
                      setApproximateLocation(event.target.checked)
                    }
                    className="mt-0.5 w-4 h-4 accent-amber-700"
                  />
                  <span>
                    <span className="block text-xs font-bold text-amber-900">
                      Show approximate location publicly
                    </span>
                    <span className="block text-[10px] text-amber-800 mt-1 leading-relaxed">
                      Your exact coordinates can remain private while buyers see an approximate 500m area on the public map.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {/* STEP 3: Seller Profile */}
            {currentStep === 3 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Seller Profile & Ownership
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    This contact information is used for buyer inquiries and document verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(event) => setSellerName(event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={sellerEmail}
                      onChange={(event) => setSellerEmail(event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={sellerPhone}
                      readOnly={Boolean(currentUser?.isPhoneVerified)}
                      onChange={(event) =>
                        setSellerPhone(event.target.value.replace(/\D/g, ''))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-slate-50 font-semibold text-slate-800"
                    />
                    {currentUser?.isPhoneVerified && (
                      <p className="flex items-center gap-1 text-[10px] text-[#FF9933] font-semibold mt-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Phone verified
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Seller Type *
                    </label>
                    <select
                      value={sellerType}
                      onChange={(event) =>
                        setSellerType(event.target.value as SellerType)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                    >
                      <option value="INDIVIDUAL">Individual Owner</option>
                      <option value="COMPANY">Company / Builder</option>
                      <option value="AGENT">Authorized Agent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Seller Correspondence Address
                  </label>
                  <textarea
                    rows={3}
                    value={sellerAddress}
                    onChange={(event) => setSellerAddress(event.target.value)}
                    placeholder="Your correspondence or office address"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Govt Records */}
            {currentStep === 4 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Government / Survey Identifier
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide the survey or registration number that helps our team verify the land parcel.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Government Registration / Survey ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={governmentRegistrationId}
                    onChange={(event) =>
                      setGovernmentRegistrationId(event.target.value)
                    }
                    placeholder="Example: Survey No. 123/4A"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter the survey number, registration number, khata number, or other official identifier.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff9f0] border border-[#FF9933]/30 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#FF9933] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-extrabold text-[#7a3705]">
                        Instant Direct Classifieds Publishing
                      </h3>
                      <p className="text-xs text-[#9c4c0b] mt-1 leading-relaxed">
                        Your land advertisement will be published immediately upon flat-fee payment without administrative delays. You are solely responsible for ensuring the survey numbers and ownership details you provide are accurate and lawful.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Photos with In-Browser Compression */}
            {currentStep === 5 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Property Photos
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload clear photographs of the land, road frontage, boundaries, and surroundings.
                  </p>
                </div>

                {/* Upload Zone */}
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF9933] hover:bg-[#fff9f0] transition-colors p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto mb-3">
                      {isUploadingImage ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-sm font-extrabold text-slate-900">
                      {isUploadingImage
                        ? 'Optimizing & uploading...'
                        : 'Upload property photos'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      JPG, PNG or WebP • Multiple images supported
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fff9f0] border border-[#FF9933]/30 text-[10px] text-[#c75e0a] font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Automatically compressed below 850 KB
                    </div>
                  </div>
                </label>

                {/* Compression Status Message */}
                {imageCompressionMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px] font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>{imageCompressionMessage}</span>
                  </div>
                )}

                {/* Uploaded Image Previews */}
                {images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-900">
                        Uploaded Photos ({images.length})
                      </h3>
                      <span className="text-[10px] text-[#FF9933] font-semibold">
                        Optimized & Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {images.map((image, index) => (
                        <div
                          key={image.objectKey || `${image.fileName}-${index}`}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square"
                        >
                          <Image
                            src={image.secureUrl}
                            alt={image.fileName}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="object-cover"
                          />
                          {image.isPrimary && (
                            <div className="absolute left-2 top-2 px-2 py-1 rounded-md bg-[#FF9933] text-white text-[9px] font-bold">
                              Primary
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/65 text-white text-[9px] font-semibold">
                            {formatFileSize(image.size)}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setImages((prev) => {
                                const remaining = prev.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                );
                                if (
                                  remaining.length > 0 &&
                                  !remaining.some((item) => item.isPrimary)
                                ) {
                                  remaining[0] = {
                                    ...remaining[0],
                                    isPrimary: true,
                                  };
                                }
                                return remaining;
                              })
                            }
                            className="absolute right-2 top-2 w-8 h-8 rounded-full bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                            aria-label="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {!image.isPrimary && (
                            <button
                              type="button"
                              onClick={() =>
                                setImages((prev) =>
                                  prev.map((item, itemIndex) => ({
                                    ...item,
                                    isPrimary: itemIndex === index,
                                  })),
                                )
                              }
                              className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-white/90 text-slate-700 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              Make Primary
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <ImageIcon className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600 leading-relaxed">
                      <p className="font-bold text-slate-800 mb-1">
                        Automatic image optimization
                      </p>
                      <p>
                        Photographs are optimized and converted to lightweight WebP files in your browser before upload, ensuring lightning-fast listing page load times for buyers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Documents */}
            {currentStep === 6 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Title & Supporting Documents (Optional)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload documents to assist prospective buyers during their independent due diligence (Sale deed scan, EC Form 15, Pahani / 7-12 extract, or FMB sketch). Document upload is optional.
                  </p>
                </div>

                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleDocUpload}
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
                        : 'Upload title documents'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PDF, JPG, PNG or WebP
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
                          onClick={() =>
                            setDocuments((prev) =>
                              prev.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: Review & Flat Publishing Fee */}
            {currentStep === 7 && (
              <div className="p-5 sm:p-8 space-y-7 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Review & Publish
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Review your listing details before completing publishing fee payment.
                  </p>
                </div>

                {/* Property Summary */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Listing Summary
                    </h3>
                  </div>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Property Title
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {title || 'Untitled property'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Location
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {city || '—'}, {state || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Land Area
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {formatArea(landAreaYards, 2)} sq. yards
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {formatArea(areaConversions.acres, 4)} acres •{' '}
                        {formatArea(areaConversions.guntas, 2)} guntas
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Total Valuation
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        ₹{Number(totalValuation || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flat Publishing Fee Card / Active Status */}
                {existingPropertyId && existingPaymentStatus === 'PAID' ? (
                  <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-5 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-950">
                          Listing Publishing Fee Paid & Active
                        </h3>
                        <p className="text-[11px] text-[#7a3705] mt-0.5 leading-relaxed">
                          Your listing subscription is active. Saving your changes will update the property details immediately without requiring another publishing fee.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] overflow-hidden">
                    <div className="p-5 border-b border-[#FF9933]/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-950">
                            Listing Publishing Fee
                          </h3>
                          <p className="text-[11px] text-[#7a3705] mt-1">
                            Universal flat fee for the full {listingDurationDays}-day subscription period.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Listing validity</span>
                        <span className="font-bold text-slate-900">
                          {listingDurationDays} days
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Publishing fee</span>
                        <span className="font-bold text-slate-900">
                          ₹{listingFeeAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-[#FF9933]/30 flex justify-between items-center">
                        <span className="text-sm font-extrabold text-slate-950">
                          Amount Payable
                        </span>
                        <span className="text-xl font-black text-[#c75e0a]">
                          ₹{listingFeeAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seller Declaration & Marketplace Undertaking Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#FF9933]" />
                    <h3 className="text-sm font-extrabold text-slate-950">
                      Seller Declaration &amp; Publishing Undertaking
                    </h3>
                  </div>

                  <ul className="space-y-2 text-[11px] text-slate-600 leading-relaxed list-disc pl-4">
                    <li>
                      <strong>Authorization:</strong> I represent that I am the owner of this property or am otherwise lawfully authorized to advertise this listing.
                    </li>
                    <li>
                      <strong>Accuracy:</strong> The land extent, pricing, boundaries, and descriptions submitted are accurate and my sole responsibility.
                    </li>
                    <li>
                      <strong>Lawful Content:</strong> I undertake not to upload unlawful, fraudulent, misleading, or infringing content, or prohibited/disputed land parcels.
                    </li>
                    <li>
                      <strong>Marketplace Role:</strong> I understand that BhoomiMitra operates as an online classifieds marketplace and does not certify ownership, inspect titles, or guarantee properties.
                    </li>
                    <li>
                      <strong>Buyer Due Diligence:</strong> I acknowledge that prospective buyers must independently inspect revenue records, title deeds, and physical boundaries prior to transactions.
                    </li>
                    <li>
                      <strong>Statutory Compliance:</strong> I agree to comply with applicable laws, terms of service, and platform listing rules.
                    </li>
                  </ul>

                  <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-slate-200">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(event) =>
                        setTermsAccepted(event.target.checked)
                      }
                      className="w-4 h-4 mt-0.5 accent-[#FF9933]"
                    />
                    <span className="text-xs font-semibold text-slate-900 leading-snug">
                      I have read, understood, and accept the above Seller Declaration, Marketplace Listing Rules, and Terms of Service.
                    </span>
                  </label>
                </div>

                {/* Draft Preservation Notice */}
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-950">
                        Your listing draft is permanently saved
                      </p>
                      <p className="text-[10px] text-blue-900/80 mt-1 leading-relaxed">
                        If you close the payment modal or payment fails, your property details, photographs, and documents remain safely saved as a draft. You can resume anytime from your Seller Dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="px-5 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={
                  currentStep === 1
                    ? () => router.push('/dashboard/seller')
                    : handlePrev
                }
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentStep === 1 ? 'Exit' : 'Back'}</span>
              </button>

              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isSubmitting || isUploadingImage || isUploadingDoc
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={
                    isSubmitting ||
                    !termsAccepted ||
                    isUploadingImage ||
                    isUploadingDoc
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {existingPropertyId && existingPaymentStatus === 'PAID' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Saving Changes...'
                      : isUpdateSuccess
                        ? 'Listing Updated Successfully!'
                        : existingPropertyId && existingPaymentStatus === 'PAID'
                          ? 'Save & Update Property'
                          : `Proceed to Pay ₹${listingFeeAmount.toLocaleString(
                            'en-IN',
                          )}`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure seller authentication
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              GPS Location Pinning
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Direct buyer connection
            </span>
          </div>
        </div>
      </main>

      <Footer />

      {/* Razorpay Checkout Modal */}
      {createdProperty && (
        <RazorpayCheckoutModal
          property={createdProperty}
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
          }}
          onSuccess={() => {
            setPaymentModalOpen(false);
            router.push('/dashboard/seller');
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to Sell Your Land"
        description="Authenticate with Google to create and manage your land listing."
      />
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933]" />
          </div>
          <Footer />
        </div>
      }
    >
      <SellPageForm />
    </Suspense>
  );
}