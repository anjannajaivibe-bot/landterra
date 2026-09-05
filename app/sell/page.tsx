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
  Building2,
  Home,
  Maximize2,
  Briefcase,
  Trees,
  Palmtree,
  BadgeIndianRupee,
  Check,
  X,
  SlidersHorizontal,
  Loader2,
  Navigation,
  Video,
  Film,
  Play,
  Camera,
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
  | 'SQUARE_FEET'
  | 'GUNTAS'
  | 'CENTS'
  | 'ACRES'
  | 'HECTARES';

const LAND_AREA_CONVERSIONS: Record<LandAreaUnit, number> = {
  SQUARE_YARDS: 1,
  SQUARE_FEET: 1 / 9,
  GUNTAS: 121,
  CENTS: 48.4,
  ACRES: 4840,
  HECTARES: 11959.9004,
};

const LAND_AREA_UNIT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'Square Yards',
  SQUARE_FEET: 'Square Feet (sq. ft)',
  GUNTAS: 'Guntas',
  CENTS: 'Cents',
  ACRES: 'Acres',
  HECTARES: 'Hectares',
};

const LAND_AREA_UNIT_SHORT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_YARDS: 'sq. yd',
  SQUARE_FEET: 'sq. ft',
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

  // Context-Specific Property Attributes
  // Residential: Flat / Apartment & Villa
  const [bhk, setBhk] = useState<string>('3 BHK');
  const [floorNumber, setFloorNumber] = useState<string>('');
  const [totalFloors, setTotalFloors] = useState<string>('');
  const [furnishingStatus, setFurnishingStatus] = useState<string>('SEMI_FURNISHED');
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<string>('');
  const [superBuiltUpAreaSqFt, setSuperBuiltUpAreaSqFt] = useState<string>('');
  const [parkingSlots, setParkingSlots] = useState<string>('1_COVERED');

  // Facing, Dimensions & Boundaries (Plots, Villas & Land)
  const [facing, setFacing] = useState<string>('EAST');
  const [plotLengthFt, setPlotLengthFt] = useState<string>('');
  const [plotWidthFt, setPlotWidthFt] = useState<string>('');
  const [boundaryWall, setBoundaryWall] = useState<string>('FULL_WALL');
  const [cornerPlot, setCornerPlot] = useState<boolean>(false);
  const [gatedCommunity, setGatedCommunity] = useState<boolean>(true);
  const [approvals, setApprovals] = useState<string[]>(['HMDA Approved']);

  // Villa Specific
  const [villaType, setVillaType] = useState<string>('INDEPENDENT_HOUSE');
  const [villaFloors, setVillaFloors] = useState<string>('G_PLUS_1');
  const [vastuCompliant, setVastuCompliant] = useState<boolean>(true);
  const [additionalRooms, setAdditionalRooms] = useState<string[]>([]);
  const [villaPrivateFeatures, setVillaPrivateFeatures] = useState<string[]>([
    'Private Garden / Lawn',
    'Covered Car Porch (2+ Cars)',
    'Private Terrace / Roof Rights',
  ]);
  const [furnishingDetails, setFurnishingDetails] = useState<string[]>([]);
  const [possessionStatus, setPossessionStatus] = useState<string>('READY_TO_MOVE');
  const [ageOfProperty, setAgeOfProperty] = useState<string>('NEW');
  const [skipOptionalFeatures, setSkipOptionalFeatures] = useState<boolean>(false);

  // Commercial Specific
  const [commercialFitout, setCommercialFitout] = useState<string>('WARM_SHELL');
  const [commercialWashrooms, setCommercialWashrooms] = useState<string>('PRIVATE');
  const [powerLoadKva, setPowerLoadKva] = useState<string>('');
  const [suitableBusinesses, setSuitableBusinesses] = useState<string[]>([
    'IT / Software Company',
    'Corporate Office',
  ]);

  // Farmland Specific
  const [soilType, setSoilType] = useState<string>('RED_SOIL');
  const [waterSources, setWaterSources] = useState<string[]>(['Dedicated Borewell']);
  const [electricityPhase, setElectricityPhase] = useState<string>('3_PHASE');
  const [farmFencing, setFarmFencing] = useState<string>('CHAINLINK');
  const [plantations, setPlantations] = useState<string>('');
  // Hospitality & Leisure Specific
  const [totalRooms, setTotalRooms] = useState<string>('20 Rooms');
  const [eventLawnCapacity, setEventLawnCapacity] = useState<string>('500 Guests');
  const [hospitalityFeatures, setHospitalityFeatures] = useState<string[]>([
    'Swimming Pool',
    'Restaurant / Kitchen Setup',
    'Banquet / Event Lawn',
    'Guest Parking',
  ]);

  // Income-Generating & Rentals Specific
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [securityDepositMonths, setSecurityDepositMonths] = useState<string>('2 Months');
  const [leaseLockInPeriod, setLeaseLockInPeriod] = useState<string>('11 Months');
  const [maintenanceCharges, setMaintenanceCharges] = useState<string>('');

  // Seller Category Tab
  const [sellerCategoryTab, setSellerCategoryTab] = useState<string>('Land & Plots');

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Lift / Elevator',
    '24/7 Security & CCTV',
    '100% Power Backup',
    'Covered Car Parking',
  ]);

  const toggleItem = (
    list: string[],
    item: string,
    setter: (val: string[]) => void,
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

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

  const [isResolvingMapLink, setIsResolvingMapLink] =
    useState<boolean>(false);

  const [hasLocatedMap, setHasLocatedMap] =
    useState<boolean>(false);

  const [resolvedPlaceName, setResolvedPlaceName] =
    useState<string>('');

  const [mapLinkResolutionStatus, setMapLinkResolutionStatus] =
    useState<{
      type: 'success' | 'error';
      message: string;
    } | null>(null);

  const handleResolveMapLink = async (customUrl?: string) => {
    const rawUrl = (customUrl !== undefined ? customUrl : googleMapsShareLink).trim();
    if (!rawUrl) return;

    setIsResolvingMapLink(true);
    setMapLinkResolutionStatus(null);

    try {
      const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(rawUrl)}`);
      const data = await res.json();

      if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setHasLocatedMap(true);
        if (data.placeName) {
          setResolvedPlaceName(data.placeName);
          if (!address || address.length < 5) {
            setAddress(data.placeName);
          }
        }
        setMapLinkResolutionStatus({
          type: 'success',
          message: data.placeName
            ? `✓ GPS Locked: ${data.placeName} (${data.latitude.toFixed(4)}° N, ${data.longitude.toFixed(4)}° E)`
            : `✓ GPS Locked (${data.latitude.toFixed(4)}° N, ${data.longitude.toFixed(4)}° E)`,
        });
      } else {
        setMapLinkResolutionStatus({
          type: 'error',
          message: data.error || 'Could not parse coordinates from this Google Maps link.',
        });
      }
    } catch {
      setMapLinkResolutionStatus({
        type: 'error',
        message: 'Could not resolve link. Please adjust location manually on the map.',
      });
    } finally {
      setIsResolvingMapLink(false);
    }
  };

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

  // Step 5: Images & Video
  const [images, setImages] =
    useState<UploadedImagePreview[]>([]);

  const [isUploadingImage, setIsUploadingImage] =
    useState<boolean>(false);

  const [imageCompressionMessage, setImageCompressionMessage] =
    useState<string>('');

  const [video, setVideo] =
    useState<{
      secureUrl: string;
      objectKey: string;
      fileName: string;
      size: number;
      mimeType: string;
      originalSize?: number;
      compressionRatio?: number;
    } | null>(null);

  const [isUploadingVideo, setIsUploadingVideo] =
    useState<boolean>(false);

  const [videoUploadMessage, setVideoUploadMessage] =
    useState<string>('');

  // Step 6: Documents
  const [documents, setDocuments] =
    useState<UploadedDocPreview[]>([]);

  const [isUploadingDoc, setIsUploadingDoc] =
    useState<boolean>(false);

  // Step 7: Terms & Payment
  const [termsAccepted, setTermsAccepted] =
    useState<boolean>(false);

  const [createdProperty, setCreatedProperty] =
    useState<IProperty | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] =
    useState<boolean>(false);

  // Area conversions
  const areaConversions = useMemo(() => {
    return {
      squareYards: landAreaYards,
      squareFeet: convertFromSquareYards(landAreaYards, 'SQUARE_FEET'),
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
              if (property.bhk) setBhk(property.bhk);
              if (property.facing) setFacing(property.facing);
              if (property.floorNumber) setFloorNumber(property.floorNumber);
              if (property.totalFloors) setTotalFloors(String(property.totalFloors));
              if (property.furnishingStatus) setFurnishingStatus(property.furnishingStatus);
              if (typeof property.bathrooms === 'number') setBathrooms(property.bathrooms);
              if (typeof property.balconies === 'number') setBalconies(property.balconies);
              if (property.carpetAreaSqFt) setCarpetAreaSqFt(String(property.carpetAreaSqFt));
              if (property.superBuiltUpAreaSqFt) setSuperBuiltUpAreaSqFt(String(property.superBuiltUpAreaSqFt));
              if (property.boundaryWall) setBoundaryWall(property.boundaryWall);
              if (typeof property.cornerPlot === 'boolean') setCornerPlot(property.cornerPlot);
              if (typeof property.gatedCommunity === 'boolean') setGatedCommunity(property.gatedCommunity);
              if (Array.isArray(property.amenities) && property.amenities.length > 0) setSelectedAmenities(property.amenities);
              if (Array.isArray(property.approvals) && property.approvals.length > 0) setApprovals(property.approvals);
              if (Array.isArray(property.waterSource) && property.waterSource.length > 0) setWaterSources(property.waterSource);
              if (property.electricityPhase) setElectricityPhase(property.electricityPhase);
              if (property.soilType) setSoilType(property.soilType);
              if (property.propertyAttributes) {
                if (property.propertyAttributes.plotWidthFt) setPlotWidthFt(String(property.propertyAttributes.plotWidthFt));
                if (property.propertyAttributes.plotLengthFt) setPlotLengthFt(String(property.propertyAttributes.plotLengthFt));
                if (property.propertyAttributes.villaType) setVillaType(property.propertyAttributes.villaType);
                if (property.propertyAttributes.villaFloors) setVillaFloors(property.propertyAttributes.villaFloors);
                if (property.propertyAttributes.vastuCompliant !== undefined) setVastuCompliant(Boolean(property.propertyAttributes.vastuCompliant));
                if (Array.isArray(property.propertyAttributes.additionalRooms)) setAdditionalRooms(property.propertyAttributes.additionalRooms);
                if (Array.isArray(property.propertyAttributes.villaPrivateFeatures)) setVillaPrivateFeatures(property.propertyAttributes.villaPrivateFeatures);
                if (Array.isArray(property.propertyAttributes.furnishingDetails)) setFurnishingDetails(property.propertyAttributes.furnishingDetails);
                if (property.propertyAttributes.possessionStatus) setPossessionStatus(property.propertyAttributes.possessionStatus);
                if (property.propertyAttributes.ageOfProperty) setAgeOfProperty(property.propertyAttributes.ageOfProperty);
                if (property.propertyAttributes.commercialFitout) setCommercialFitout(property.propertyAttributes.commercialFitout);
                if (property.propertyAttributes.commercialWashrooms) setCommercialWashrooms(property.propertyAttributes.commercialWashrooms);
                if (property.propertyAttributes.powerLoadKva) setPowerLoadKva(property.propertyAttributes.powerLoadKva);
                if (Array.isArray(property.propertyAttributes.suitableBusinesses)) setSuitableBusinesses(property.propertyAttributes.suitableBusinesses);
                if (property.propertyAttributes.farmFencing) setFarmFencing(property.propertyAttributes.farmFencing);
                if (property.propertyAttributes.plantations) setPlantations(property.propertyAttributes.plantations);
                if (property.propertyAttributes.totalRooms) setTotalRooms(property.propertyAttributes.totalRooms);
                if (property.propertyAttributes.eventLawnCapacity) setEventLawnCapacity(property.propertyAttributes.eventLawnCapacity);
                if (Array.isArray(property.propertyAttributes.hospitalityFeatures)) setHospitalityFeatures(property.propertyAttributes.hospitalityFeatures);
                if (property.propertyAttributes.monthlyRent) setMonthlyRent(property.propertyAttributes.monthlyRent);
                if (property.propertyAttributes.securityDepositMonths) setSecurityDepositMonths(property.propertyAttributes.securityDepositMonths);
                if (property.propertyAttributes.leaseLockInPeriod) setLeaseLockInPeriod(property.propertyAttributes.leaseLockInPeriod);
                if (property.propertyAttributes.maintenanceCharges) setMaintenanceCharges(property.propertyAttributes.maintenanceCharges);
              }
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

              if (property.video && property.video.secureUrl) {
                setVideo({
                  secureUrl: property.video.secureUrl,
                  objectKey: property.video.objectKey,
                  fileName: property.video.fileName || 'property_video.webm',
                  size: typeof property.video.size === 'number' ? property.video.size : 0,
                  mimeType: property.video.mimeType || 'video/webm',
                });
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
      if (!Number.isFinite(landAreaYards) || landAreaYards < 1) {
        setErrorMessage('Land area must be at least 1 square yard.');
        return false;
      }
      if (landAreaYards > 100000000) {
        setErrorMessage(
          'Land area exceeds maximum allowable limit (10 crore sq. yards / approx. 20,660 acres). Please check the value and unit.',
        );
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

  // Video Upload via Direct Cloudflare R2 Presigned URL + Serverless WebM Compression
  const uploadVideoFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Video exceeds the maximum allowed size of 50 MB. Please choose a shorter clip.');
      return;
    }

    setIsUploadingVideo(true);
    setErrorMessage('');
    setVideoUploadMessage(`Preparing direct upload for ${file.name}...`);

    try {
      // Step 1: Request presigned ticket from API for temporary staging in R2 (bypasses Vercel 4.5MB limit)
      const ticketRes = await fetch('/api/uploads/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || 'video/mp4',
          isPrivate: false,
          folder: 'temp/raw-videos',
        }),
      });

      if (!ticketRes.ok) {
        let errMsg = 'Failed to generate upload ticket';
        try {
          const errData = await ticketRes.json();
          errMsg = errData.error || errMsg;
        } catch {
          const text = await ticketRes.text().catch(() => '');
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }

      const ticket = await ticketRes.json();

      if (!ticket.uploadUrl) {
        throw new Error('Storage ticket did not return an upload URL.');
      }

      // Step 2: Direct raw upload to Cloudflare R2 via XMLHttpRequest to track upload percentage
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', ticket.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setVideoUploadMessage(`Uploading raw video to cloud storage... ${percent}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Cloud storage rejected upload with status ${xhr.status}.`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network or CORS error while uploading video to cloud storage. Please ensure CORS is enabled on Cloudflare R2 bucket.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Video upload timed out. Please try again with a smaller file.'));
        };

        xhr.send(file);
      });

      // Step 3: Call backend to transcode & compress video to WebM and delete raw staging file
      setVideoUploadMessage(`Compressing & optimizing video to WebM (~85% size reduction)... Please wait`);

      const processRes = await fetch('/api/uploads/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawKey: ticket.key,
          fileName: file.name,
        }),
      });

      if (!processRes.ok) {
        let procErr = 'Failed to compress video';
        try {
          const errData = await processRes.json();
          procErr = errData.error || procErr;
        } catch {
          const text = await processRes.text().catch(() => '');
          if (text) procErr = text;
        }
        throw new Error(procErr);
      }

      const processData = await processRes.json();
      const processedFile = processData.file;

      setVideo({
        secureUrl: processedFile.secureUrl,
        objectKey: processedFile.objectKey,
        fileName: processedFile.fileName,
        size: processedFile.size,
        mimeType: processedFile.mimeType || 'video/webm',
        originalSize: processedFile.originalSize,
        compressionRatio: processedFile.compressionRatio,
      });

      const savingsMsg = processedFile.compressionRatio
        ? ` (${processedFile.compressionRatio}% size reduction • ${formatFileSize(processedFile.originalSize)} → ${formatFileSize(processedFile.size)})`
        : ` (${formatFileSize(processedFile.size)})`;

      setVideoUploadMessage(`✓ Video compressed & uploaded: ${processedFile.fileName}${savingsMsg}`);
    } catch (err: unknown) {
      console.error('Direct video upload error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload video';
      setErrorMessage(msg);
    } finally {
      setIsUploadingVideo(false);
      window.setTimeout(() => {
        setVideoUploadMessage('');
      }, 7000);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await uploadVideoFile(file);
  };

  // Unified Media Upload (Upload photos & video in one go)
  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      } else if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
          imageFiles.push(file);
        } else if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext || '')) {
          videoFiles.push(file);
        } else {
          setErrorMessage(`Unsupported file format "${file.name}". Please select images or video.`);
        }
      }
    }

    event.target.value = '';

    // 1. Process Images
    if (imageFiles.length > 0) {
      setIsUploadingImage(true);
      setErrorMessage('');
      setImageCompressionMessage('');

      try {
        for (let index = 0; index < imageFiles.length; index += 1) {
          const originalFile = imageFiles[index];

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
        window.setTimeout(() => {
          setImageCompressionMessage('');
        }, 4000);
      }
    }

    // 2. Process Video
    if (videoFiles.length > 0) {
      const videoFile = videoFiles[0];
      if (videoFiles.length > 1) {
        setErrorMessage('Only 1 video tour is supported per listing. Processing the first video.');
      }
      await uploadVideoFile(videoFile);
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

    if (!Number.isFinite(landAreaYards) || landAreaYards < 1) {
      setErrorMessage('Please enter a valid land area (minimum 1 sq. yard).');
      setCurrentStep(1);
      return;
    }

    if (landAreaYards > 100000000) {
      setErrorMessage(
        'Land area exceeds maximum allowable limit (10 crore sq. yards / approx. 20,660 acres). Please verify your entered value and unit.',
      );
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
        propertyType: landType,
        bhk: [
          'FLAT',
          'INDEPENDENT_HOUSE',
          'VILLA',
          'HOUSE_VILLA',
          'TOWNHOUSE',
          'DUPLEX',
          'PENTHOUSE',
          'SERVICE_APARTMENT',
          'RESIDENTIAL_RENTAL',
          'COLIVING_PG',
          'VACATION_RENTAL_AIRBNB',
        ].includes(landType)
          ? bhk
          : undefined,
        facing,
        floorNumber: [
          'FLAT',
          'PENTHOUSE',
          'DUPLEX',
          'OFFICE_SPACE',
          'COWORKING_SPACE',
          'SERVICE_APARTMENT',
        ].includes(landType)
          ? floorNumber
          : undefined,
        totalFloors: totalFloors ? Number(totalFloors) : undefined,
        furnishingStatus,
        bathrooms: Number(bathrooms),
        balconies: Number(balconies),
        carpetAreaSqFt: carpetAreaSqFt ? Number(carpetAreaSqFt) : undefined,
        superBuiltUpAreaSqFt: superBuiltUpAreaSqFt ? Number(superBuiltUpAreaSqFt) : undefined,
        boundaryWall,
        cornerPlot: Boolean(cornerPlot),
        gatedCommunity: Boolean(gatedCommunity),
        amenities: Array.from(new Set([...selectedAmenities, ...villaPrivateFeatures, ...additionalRooms])),
        approvals,
        waterSource: waterSources,
        electricityPhase,
        soilType,
        propertyAttributes: {
          bhk: bhk === 'NOT_SPECIFIED' ? undefined : bhk,
          facing: facing === 'NOT_SPECIFIED' ? undefined : facing,
          floorNumber,
          totalFloors,
          furnishingStatus: furnishingStatus === 'NOT_SPECIFIED' ? undefined : furnishingStatus,
          bathrooms: bathrooms > 0 ? bathrooms : undefined,
          balconies: balconies >= 0 ? balconies : undefined,
          carpetAreaSqFt,
          superBuiltUpAreaSqFt,
          parkingSlots: parkingSlots === 'NOT_SPECIFIED' ? undefined : parkingSlots,
          plotLengthFt,
          plotWidthFt,
          boundaryWall,
          cornerPlot,
          gatedCommunity,
          approvals,
          villaType: villaType === 'NOT_SPECIFIED' ? undefined : villaType,
          villaFloors: villaFloors === 'NOT_SPECIFIED' ? undefined : villaFloors,
          vastuCompliant: Boolean(vastuCompliant),
          additionalRooms,
          villaPrivateFeatures,
          furnishingDetails,
          possessionStatus: possessionStatus === 'NOT_SPECIFIED' ? undefined : possessionStatus,
          ageOfProperty: ageOfProperty === 'NOT_SPECIFIED' ? undefined : ageOfProperty,
          commercialFitout,
          commercialWashrooms,
          powerLoadKva,
          suitableBusinesses,
          soilType,
          waterSources,
          electricityPhase,
          farmFencing,
          plantations,
          totalRooms,
          eventLawnCapacity,
          hospitalityFeatures,
          monthlyRent,
          securityDepositMonths,
          leaseLockInPeriod,
          maintenanceCharges,
          amenities: Array.from(new Set([...selectedAmenities, ...villaPrivateFeatures, ...additionalRooms])),
        },
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
        video: video
          ? {
              objectKey: video.objectKey,
              secureUrl: video.secureUrl,
              fileName: video.fileName,
              mimeType: video.mimeType || 'video/webm',
              size: video.size,
            }
          : undefined,
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
          const detailMsg = Array.isArray(data.details)
            ? data.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message || 'invalid'}`).join('; ')
            : '';
          throw new Error(data.error || detailMsg || 'Failed to submit listing draft');
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
    return <SellPageSkeleton />;
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
              'Photos & Video',
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
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-2">
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
                        Sq. Feet
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatArea(areaConversions.squareFeet, 0)}
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

                  {landAreaYards > 100000000 && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      ⚠️ Entered area exceeds maximum allowable limit of 100,000,000 sq. yards (~20,660 acres). Please check your entered value and selected unit.
                    </div>
                  )}
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

                {/* Property Type Selection with Category Tabs */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Property Type *
                    </label>
                    <span className="text-[11px] font-semibold text-[#c75e0a]">
                      Select category &amp; subtype to customize specifications
                    </span>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto scrollbar-none">
                    {[
                      { id: 'ALL', label: 'All Categories' },
                      { id: 'Land & Plots', label: 'Land & Plots' },
                      { id: 'Residential Units', label: 'Residential Units' },
                      { id: 'Commercial & Retail', label: 'Commercial & Retail' },
                      { id: 'Hospitality & Leisure', label: 'Hospitality & Leisure' },
                      { id: 'Income-Generating & Rentals', label: 'Income & Rentals' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSellerCategoryTab(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          sellerCategoryTab === tab.id
                            ? 'bg-white text-[#c75e0a] shadow-xs border border-amber-200 ring-1 ring-[#FF9933]/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Property Type Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LAND_TYPES.filter(
                      (t: any) => sellerCategoryTab === 'ALL' || t.category === sellerCategoryTab
                    ).map((type: any) => {
                      const value = type.value || type.id || type;
                      const label = type.label || type.name || value;
                      const isSelected = landType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setLandType(value as LandType);
                            if (type.category) setSellerCategoryTab(type.category);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#FF9933] bg-[#fff9f0] text-[#7a3705] font-bold ring-2 ring-[#FF9933]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] block leading-tight">{label}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#FF9933] shrink-0 ml-1.5" />
                            )}
                          </div>
                          {type.category && (
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-medium truncate">
                              {type.category}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DYNAMIC REAL ESTATE SPECIFICATIONS INDICATOR (MAGICBRICKS / 99ACRES STYLE) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#fff9f0] via-[#fff1dc]/40 to-amber-50/50 border border-amber-200/90 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FF9933] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 tracking-tight">
                          Dynamic Specifications Activated
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FF9933] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                          {LAND_TYPES.find((t: any) => (t.value || t.id || t) === landType)?.shortLabel || landType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Features below automatically adapt to real estate market standards for this property type. You can select, unselect, or choose &quot;Not Specified&quot; for any item.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200/80 text-[10px] font-bold text-[#c75e0a]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Dynamic Portal Sync
                    </span>
                  </div>
                </div>

                {/* 1. APARTMENT / FLAT / DUPLEX / PENTHOUSE SPECIFIC DETAILS */}
                {(landType === 'FLAT' || landType === 'PENTHOUSE' || landType === 'DUPLEX') && (
                  <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Apartment & Tower Specifications
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Configuration, floor details, areas, and society amenities for apartment buyers.
                        </p>
                      </div>
                    </div>

                    {/* Bedroom Configuration (BHK) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Bedrooms Configuration (BHK) *
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setBhk(item)}
                            className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              bhk === item
                                ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Floor Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Floor Number *
                        </label>
                        <input
                          type="text"
                          value={floorNumber}
                          onChange={(e) => setFloorNumber(e.target.value)}
                          placeholder="e.g. 4th Floor"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Total Floors in Tower *
                        </label>
                        <input
                          type="text"
                          value={totalFloors}
                          onChange={(e) => setTotalFloors(e.target.value)}
                          placeholder="e.g. 14 Floors"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                    </div>

                    {/* Bathrooms & Balconies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Bathrooms
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBathrooms(num)}
                              className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                bathrooms === num
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              {num}{num === 5 ? '+' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Balconies
                        </label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBalconies(num)}
                              className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                balconies === num
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              {num}{num === 4 ? '+' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Furnishing Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Furnishing Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'UNFURNISHED', label: 'Unfurnished' },
                          { id: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                          { id: 'FULLY_FURNISHED', label: 'Fully Furnished' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFurnishingStatus(f.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                              furnishingStatus === f.id
                                ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Super Built-Up & Carpet Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Super Built-up Area (sq. ft)
                        </label>
                        <input
                          type="number"
                          min={100}
                          value={superBuiltUpAreaSqFt}
                          onChange={(e) => setSuperBuiltUpAreaSqFt(e.target.value)}
                          placeholder="e.g. 1450"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Carpet Area (sq. ft)
                        </label>
                        <input
                          type="number"
                          min={100}
                          value={carpetAreaSqFt}
                          onChange={(e) => setCarpetAreaSqFt(e.target.value)}
                          placeholder="e.g. 1120"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                    </div>

                    {/* Facing & Reserved Parking */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Main Door Facing
                        </label>
                        <select
                          value={facing}
                          onChange={(e) => setFacing(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
                          <option value="EAST">East Facing</option>
                          <option value="WEST">West Facing</option>
                          <option value="NORTH">North Facing</option>
                          <option value="SOUTH">South Facing</option>
                          <option value="NORTH_EAST">North-East Facing</option>
                          <option value="NORTH_WEST">North-West Facing</option>
                          <option value="SOUTH_EAST">South-East Facing</option>
                          <option value="SOUTH_WEST">South-West Facing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Reserved Car Parking
                        </label>
                        <select
                          value={parkingSlots}
                          onChange={(e) => setParkingSlots(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
                          <option value="1_COVERED">1 Covered Car Parking</option>
                          <option value="2_COVERED">2 Covered Car Parkings</option>
                          <option value="OPEN">Open Car Parking</option>
                          <option value="NONE">No Reserved Parking</option>
                        </select>
                      </div>
                    </div>

                    {/* Society Amenities */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800">
                          Society &amp; Apartment Amenities ({selectedAmenities.length} selected)
                        </label>
                        {selectedAmenities.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedAmenities([])}
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            ✕ Deselect all
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Lift / Elevator',
                          '24/7 Security & CCTV',
                          '100% Power Backup',
                          'Clubhouse',
                          'Swimming Pool',
                          'Gymnasium',
                          'Children\'s Play Area',
                          'Gated Community',
                          'Piped Gas Line',
                          'Intercom',
                          'Rainwater Harvesting',
                          'EV Charging Station',
                        ].map((amenity) => {
                          const selected = selectedAmenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleItem(selectedAmenities, amenity, setSelectedAmenities)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}{amenity}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PLOT SPECIFIC DETAILS (Open Plots, Farmland Plots, Gated Layouts, Residential & Commercial Plots) */}
                {(['OPEN_PLOT', 'FARMLAND_PLOT', 'GATED_COMMUNITY_PLOT', 'RESIDENTIAL_PLOT', 'COMMERCIAL_LAND', 'INDUSTRIAL_PLOT'].includes(landType)) && (
                  <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Plot Measurements, Facing & Boundary Details
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Specify dimensions, facing direction, boundary walls, and layout sanctions.
                        </p>
                      </div>
                    </div>

                    {/* Plot Facing */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Plot Facing Direction *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'EAST', label: 'East Facing' },
                          { id: 'WEST', label: 'West Facing' },
                          { id: 'NORTH', label: 'North Facing' },
                          { id: 'SOUTH', label: 'South Facing' },
                          { id: 'NORTH_EAST', label: 'North-East' },
                          { id: 'NORTH_WEST', label: 'North-West' },
                          { id: 'SOUTH_EAST', label: 'South-East' },
                          { id: 'SOUTH_WEST', label: 'South-West' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFacing(item.id)}
                            className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              facing === item.id
                                ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Plot Dimensions */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Plot Dimensions (Frontage × Depth in Feet)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] text-slate-500 mb-1 block font-medium">Frontage / Width (ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={plotWidthFt}
                            onChange={(e) => setPlotWidthFt(e.target.value)}
                            placeholder="e.g. 30"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 mb-1 block font-medium">Depth / Length (ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={plotLengthFt}
                            onChange={(e) => setPlotLengthFt(e.target.value)}
                            placeholder="e.g. 50"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                          />
                        </div>
                      </div>
                      {plotWidthFt && plotLengthFt && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-2">
                          Dimensions: {plotWidthFt} ft × {plotLengthFt} ft = {(Number(plotWidthFt) * Number(plotLengthFt)).toLocaleString('en-IN')} sq. ft ({(Number(plotWidthFt) * Number(plotLengthFt) / 9).toFixed(1)} sq. yd)
                        </p>
                      )}
                    </div>

                    {/* Boundary & Enclosure Details */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Boundary & Enclosure Status *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'FULL_WALL', label: 'Full Concrete Boundary Wall Constructed' },
                          { id: 'FENCING', label: 'Barbed Wire / Chainlink Fencing' },
                          { id: 'DEMARCATED_STONES', label: 'Demarcated Survey Boundary Stones' },
                          { id: 'OPEN_PLOT', label: 'Open / Unfenced Plot' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBoundaryWall(item.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-colors ${
                              boundaryWall === item.id
                                ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Corner Plot & Gated Community Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={cornerPlot}
                          onChange={(e) => setCornerPlot(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-[#FF9933]"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Corner Plot</p>
                          <p className="text-[10px] text-slate-500">Plot has 2 or more road faces</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={gatedCommunity}
                          onChange={(e) => setGatedCommunity(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-[#FF9933]"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Gated Layout</p>
                          <p className="text-[10px] text-slate-500">Located in a secured/gated development</p>
                        </div>
                      </label>
                    </div>

                    {/* Layout Approvals */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Layout Sanctions & Approvals
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'HMDA Approved',
                          'GHMC Approved',
                          'DTCP Approved',
                          'RERA Registered',
                          'BDA Approved',
                          'Panchayat Approved',
                          'Clear Title / Revenue Patta',
                        ].map((appr) => {
                          const selected = approvals.includes(appr);
                          return (
                            <button
                              key={appr}
                              type="button"
                              onClick={() => toggleItem(approvals, appr, setApprovals)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}{appr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. HOUSE / VILLA / TOWNHOUSE / DUPLEX SPECIFIC DETAILS (MAGICBRICKS STYLE) */}
                {(['HOUSE_VILLA', 'VILLA', 'INDEPENDENT_HOUSE', 'TOWNHOUSE', 'DUPLEX'].includes(landType)) && (
                  <div className="rounded-2xl border-2 border-amber-300/80 bg-[#fffdfa] p-5 sm:p-7 space-y-7 animate-in fade-in duration-200 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0 shadow-xs">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">
                              Villa &amp; Independent House Specifications
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-[#fff1dc] text-[#c75e0a] text-[10px] font-extrabold">
                              Dynamic Studio
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Capture villa architecture, structure levels, private grounds, and exclusive amenities. Unselect any features you do not wish to specify.
                          </p>
                        </div>
                      </div>

                      {/* Quick Option: Skip/Minimal Toggle */}
                      <button
                        type="button"
                        onClick={() => setSkipOptionalFeatures(!skipOptionalFeatures)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          skipOptionalFeatures
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF9933]" />
                        {skipOptionalFeatures ? 'Expand All Villa Features' : 'Keep Minimal (Skip Optional Features)'}
                      </button>
                    </div>

                    {!skipOptionalFeatures ? (
                      <>
                        {/* 1. Villa Style & Architecture */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>Villa Style / Architecture</span>
                              <span className="text-[10px] font-normal text-slate-400">(Click to select or change)</span>
                            </label>
                            {villaType !== 'NOT_SPECIFIED' && (
                              <button
                                type="button"
                                onClick={() => setVillaType('NOT_SPECIFIED')}
                                className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                              >
                                ✕ Don&apos;t specify style
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {[
                              { id: 'GATED_VILLA', label: 'Gated Community Luxury Villa', desc: 'Private secured enclave with clubhouse' },
                              { id: 'INDEPENDENT_HOUSE', label: 'Independent Bungalow / Kothi', desc: 'Standalone home with private compound' },
                              { id: 'DUPLEX_VILLA', label: 'Duplex Villa (G+1)', desc: 'Two-floor luxury villa with internal stairs' },
                              { id: 'TRIPLEX_VILLA', label: 'Triplex Villa (G+2 / G+3)', desc: 'Three-floor sprawling villa' },
                              { id: 'ROW_HOUSE', label: 'Row House / Townhouse', desc: 'Modern attached villa with dedicated parking' },
                              { id: 'FARMHOUSE_VILLA', label: 'Farmhouse / Retreat Villa', desc: 'Spacious countryside holiday home' },
                            ].map((item) => {
                              const isSelected = villaType === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setVillaType(isSelected ? 'NOT_SPECIFIED' : item.id)}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#FF9933] bg-[#fff9f0] text-[#7a3705] ring-2 ring-[#FF9933]/20 shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold">{item.label}</p>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF9933] shrink-0 ml-1" />}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Bedrooms (BHK), Structure Elevation & Total Floors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* BHK */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-slate-800">
                                Bedroom Configuration (BHK) *
                              </label>
                              {bhk !== 'NOT_SPECIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => setBhk('NOT_SPECIFIED')}
                                  className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                  ✕ Don&apos;t specify
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '6+ BHK'].map((item) => {
                                const isSelected = bhk === item;
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => setBhk(isSelected ? 'NOT_SPECIFIED' : item)}
                                    className={`py-2.5 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Structure Floors */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-slate-800">
                                Structure Floors / Elevation
                              </label>
                              {villaFloors !== 'NOT_SPECIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => setVillaFloors('NOT_SPECIFIED')}
                                  className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                  ✕ Don&apos;t specify
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[
                                { id: 'G', label: 'Ground (G)' },
                                { id: 'G_PLUS_1', label: 'G + 1 (Duplex)' },
                                { id: 'G_PLUS_2', label: 'G + 2 (Triplex)' },
                                { id: 'G_PLUS_3', label: 'G + 3 Floors' },
                              ].map((item) => {
                                const isSelected = villaFloors === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setVillaFloors(isSelected ? 'NOT_SPECIFIED' : item.id)}
                                    className={`py-2.5 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 3. Bathrooms & Balconies */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-slate-700">
                                Bathrooms
                              </label>
                              {bathrooms > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setBathrooms(0)}
                                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                  ✕ Don&apos;t specify
                                </button>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setBathrooms(bathrooms === num ? 0 : num)}
                                  className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                    bathrooms === num
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {num}{num === 6 ? '+' : ''}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-slate-700">
                                Balconies / Sit-outs
                              </label>
                              {balconies >= 0 && (
                                <button
                                  type="button"
                                  onClick={() => setBalconies(-1)}
                                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                  ✕ Don&apos;t specify
                                </button>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              {[0, 1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setBalconies(balconies === num ? -1 : num)}
                                  className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                    balconies === num
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {num}{num === 5 ? '+' : ''}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 4. Built-up Area, Carpet Area & Plot Land Sync */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Built-up Area (sq. ft)
                            </label>
                            <input
                              type="number"
                              value={superBuiltUpAreaSqFt}
                              onChange={(e) => setSuperBuiltUpAreaSqFt(e.target.value)}
                              placeholder="e.g. 3400"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Carpet Area (sq. ft)
                            </label>
                            <input
                              type="number"
                              value={carpetAreaSqFt}
                              onChange={(e) => setCarpetAreaSqFt(e.target.value)}
                              placeholder="e.g. 2800"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Dedicated Plot Area
                            </label>
                            <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-sm font-bold text-[#7a3705] flex items-center justify-between">
                              <span>{formatArea(landAreaYards, 2)}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({(landAreaYards * 9).toLocaleString('en-IN')} sq. ft)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 5. Facing Direction & Vastu Compliance */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Main Entrance Facing Direction
                            </label>
                            {facing !== 'NOT_SPECIFIED' && (
                              <button
                                type="button"
                                onClick={() => setFacing('NOT_SPECIFIED')}
                                className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                              >
                                ✕ Don&apos;t specify facing
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'EAST', label: 'East Facing' },
                              { id: 'NORTH', label: 'North Facing' },
                              { id: 'WEST', label: 'West Facing' },
                              { id: 'SOUTH', label: 'South Facing' },
                              { id: 'NORTH_EAST', label: 'North-East (Ishanya)' },
                              { id: 'NORTH_WEST', label: 'North-West (Vayavya)' },
                              { id: 'SOUTH_EAST', label: 'South-East (Agneya)' },
                              { id: 'SOUTH_WEST', label: 'South-West (Nairuti)' },
                            ].map((item) => {
                              const isSelected = facing === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setFacing(isSelected ? 'NOT_SPECIFIED' : item.id)}
                                  className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* 100% Vastu Compliant Toggle */}
                          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer hover:bg-emerald-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={vastuCompliant}
                              onChange={(e) => setVastuCompliant(e.target.checked)}
                              className="w-4 h-4 mt-0.5 accent-emerald-600"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-emerald-950">
                                  100% Vastu Compliant Layout
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900 text-[9px] font-bold">
                                  MagicBricks Highlight
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-800 mt-0.5">
                                Entrance, pooja room (North-East), kitchen (South-East) and master bedroom (South-West) adhere strictly to Indian Vedic Vastu principles.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* 6. Dedicated Additional Rooms (Pooja, Servant, Study, Theatre, etc.) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Dedicated Additional Rooms ({additionalRooms.length} selected)
                            </label>
                            {additionalRooms.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setAdditionalRooms([])}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                              >
                                ✕ Deselect all rooms
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'Pooja Room', label: '🪔 Pooja Room (Mandir)' },
                              { id: 'Servant Room', label: '🧹 Servant Room / Maid Quarter' },
                              { id: 'Study Room', label: '💼 Study / Home Office' },
                              { id: 'Store Room', label: '📦 Dedicated Store Room' },
                              { id: 'Home Theatre', label: '🎬 Home Cinema / Theatre Lounge' },
                              { id: 'Private Gym Room', label: '🏋️ Private Gym Space' },
                              { id: 'Utility & Dry Balcony', label: '🧺 Utility & Wash Area' },
                              { id: 'Covered Verandah', label: '🌅 Covered Sit-out / Verandah' },
                            ].map((room) => {
                              const selected = additionalRooms.includes(room.id);
                              return (
                                <button
                                  key={room.id}
                                  type="button"
                                  onClick={() => toggleItem(additionalRooms, room.id, setAdditionalRooms)}
                                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    selected
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {selected ? '✓ ' : '+ '}{room.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 7. Exclusive Private Villa Features (Garden, Pool, Roof Rights, Car Porch, etc.) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Exclusive Private Villa Grounds &amp; Features ({villaPrivateFeatures.length} selected)
                            </label>
                            {villaPrivateFeatures.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setVillaPrivateFeatures([])}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                              >
                                ✕ Deselect all private features
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'Private Garden / Lawn', label: '🌳 Private Landscaped Garden / Lawn' },
                              { id: 'Private Swimming Pool', label: '🏊 Private Swimming Pool / Plunge Pool' },
                              { id: 'Private Terrace / Roof Rights', label: '☀️ Private Terrace with 100% Roof Rights' },
                              { id: 'Covered Car Porch (2+ Cars)', label: '🚗 Covered Car Porch (2+ Cars)' },
                              { id: 'Private Elevator / Lift', label: '🛗 Private Home Elevator / Lift Provision' },
                              { id: 'Solar Rooftop & Water Heater', label: '⚡ Solar Panels & Solar Water Heater' },
                              { id: 'Dedicated Private Borewell', label: '💧 Dedicated Private Borewell & Motor' },
                              { id: 'Underground Sump & Overhead Tank', label: '🚰 Underground Sump + Overhead Tank' },
                              { id: 'Perimeter Compound Wall & Gate', label: '🧱 Boundary Compound Wall & Personal Gate' },
                              { id: 'EV Car Charging Station', label: '🔌 EV Car Charging Point in Porch' },
                              { id: 'Separate Servant Entrance', label: '🚪 Dedicated Servant / Service Entrance' },
                              { id: 'Rainwater Harvesting Pit', label: '🌧️ Rainwater Harvesting Pit' },
                            ].map((feat) => {
                              const selected = villaPrivateFeatures.includes(feat.id);
                              return (
                                <button
                                  key={feat.id}
                                  type="button"
                                  onClick={() => toggleItem(villaPrivateFeatures, feat.id, setVillaPrivateFeatures)}
                                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    selected
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {selected ? '✓ ' : '+ '}{feat.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 8. Reserved Car Parking */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-800">
                              Reserved Car Parking
                            </label>
                            {parkingSlots !== 'NOT_SPECIFIED' && (
                              <button
                                type="button"
                                onClick={() => setParkingSlots('NOT_SPECIFIED')}
                                className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                              >
                                ✕ Don&apos;t specify parking
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'NOT_SPECIFIED', label: 'Don\'t want to specify' },
                              { id: '1_COVERED', label: '1 Covered Car Porch' },
                              { id: '2_COVERED', label: '2 Covered Car Porch' },
                              { id: '3_PLUS_COVERED', label: '3+ Covered Car Porch' },
                              { id: 'OPEN', label: 'Open Driveway Parking' },
                              { id: 'NONE', label: 'No Dedicated Parking' },
                            ].map((p) => {
                              const isSelected = parkingSlots === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setParkingSlots(p.id)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 9. Furnishing Status & Inclusions */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Furnishing Status
                            </label>
                            {furnishingStatus !== 'NOT_SPECIFIED' && (
                              <button
                                type="button"
                                onClick={() => setFurnishingStatus('NOT_SPECIFIED')}
                                className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                              >
                                ✕ Don&apos;t specify
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'NOT_SPECIFIED', label: 'Don\'t specify' },
                              { id: 'UNFURNISHED', label: 'Unfurnished' },
                              { id: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                              { id: 'FULLY_FURNISHED', label: 'Fully Furnished' },
                            ].map((f) => {
                              const isSelected = furnishingStatus === f.id;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => setFurnishingStatus(f.id)}
                                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Modular Inclusions (when Semi or Fully Furnished) */}
                          {(furnishingStatus === 'SEMI_FURNISHED' || furnishingStatus === 'FULLY_FURNISHED') && (
                            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                  Included Fittings &amp; Inclusions ({furnishingDetails.length} selected)
                                </span>
                                {furnishingDetails.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setFurnishingDetails([])}
                                    className="text-[10px] text-rose-600 font-semibold cursor-pointer"
                                  >
                                    ✕ Clear inclusions
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  'Modular Kitchen with Chimney',
                                  'Built-in Floor-to-Ceiling Wardrobes',
                                  'Split / VRV Air Conditioners',
                                  'Italian Marble / Vitrified Flooring',
                                  'Teakwood Main Door & Frames',
                                  'Designer False Ceiling & LED Lights',
                                  'Bathroom Geysers & Shower Cubicles',
                                  'Smart Digital Door Lock',
                                  'RO Water Purifier',
                                  'Jacuzzi / Premium Sanitaryware',
                                ].map((inc) => {
                                  const sel = furnishingDetails.includes(inc);
                                  return (
                                    <button
                                      key={inc}
                                      type="button"
                                      onClick={() => toggleItem(furnishingDetails, inc, setFurnishingDetails)}
                                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                                        sel
                                          ? 'border-[#FF9933] bg-[#FF9933] text-white'
                                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {sel ? '✓ ' : '+ '}{inc}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 10. Possession Status & Property Age */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-slate-700">
                                Possession Status
                              </label>
                              {possessionStatus !== 'NOT_SPECIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => setPossessionStatus('NOT_SPECIFIED')}
                                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                  ✕ Don&apos;t specify
                                </button>
                              )}
                            </div>
                            <select
                              value={possessionStatus}
                              onChange={(e) => setPossessionStatus(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                            >
                              <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
                              <option value="READY_TO_MOVE">Ready to Move</option>
                              <option value="UNDER_CONSTRUCTION">Under Construction</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-slate-700">
                                Age of Construction / Property
                              </label>
                              {ageOfProperty !== 'NOT_SPECIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => setAgeOfProperty('NOT_SPECIFIED')}
                                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                  ✕ Don&apos;t specify
                                </button>
                              )}
                            </div>
                            <select
                              value={ageOfProperty}
                              onChange={(e) => setAgeOfProperty(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                            >
                              <option value="NOT_SPECIFIED">Don&apos;t want to specify</option>
                              <option value="NEW">Brand New / Under 1 Year</option>
                              <option value="1_TO_5_YEARS">1 to 5 Years Old</option>
                              <option value="5_TO_10_YEARS">5 to 10 Years Old</option>
                              <option value="10_PLUS_YEARS">10+ Years Old</option>
                            </select>
                          </div>
                        </div>

                        {/* 11. Gated Community / Enclave Amenities */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Gated Community / Enclave Amenities ({selectedAmenities.length} selected)
                            </label>
                            {selectedAmenities.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedAmenities([])}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                              >
                                ✕ Deselect all community amenities
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              '24/7 Security Guard & CCTV',
                              'Grand Clubhouse & Banquet Hall',
                              'Common Swimming Pool & Kids Pool',
                              'Modern Gymnasium',
                              'Children\'s Play Area & Sandpit',
                              'Jogging & Cycling Track',
                              'Tennis / Badminton Court',
                              '100% DG Power Backup',
                              '30ft / 40ft Wide Internal Concrete Roads',
                              'Underground Cabling & Drainage',
                              'Rainwater Harvesting System',
                              'Boom Barrier & RFID Entry Gate',
                            ].map((amenity) => {
                              const selected = selectedAmenities.includes(amenity);
                              return (
                                <button
                                  key={amenity}
                                  type="button"
                                  onClick={() => toggleItem(selectedAmenities, amenity, setSelectedAmenities)}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                    selected
                                      ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                                  }`}
                                >
                                  {selected ? '✓ ' : '+ '}{amenity}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                        <p className="text-xs font-bold text-slate-700">
                          Optional villa specifications skipped for a minimal listing.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Your listing will publish with base plot area and pricing. Click &quot;Expand All Villa Features&quot; above at any time to add specific features.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. COMMERCIAL & RETAIL SPACES (Shops, Showrooms, Offices, Coworking, Malls, Warehouses) */}
                {(['RETAIL_SHOP', 'SHOWROOM', 'SHOP_SHOWROOM', 'OFFICE_SPACE', 'COWORKING_SPACE', 'SHOPPING_MALL', 'WAREHOUSE_LAND', 'INDUSTRIAL_BUILDING', 'INDUSTRIAL_SHED', 'INSTITUTIONAL'].includes(landType)) && (
                  <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Commercial Space Specifications
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Fitout status, suitable businesses, and power/parking infrastructure.
                        </p>
                      </div>
                    </div>

                    {/* Fitout Condition */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Fitout / Furnishing Condition
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'BARE_SHELL', label: 'Bare Shell / Core' },
                          { id: 'WARM_SHELL', label: 'Warm Shell' },
                          { id: 'FULLY_FURNISHED', label: 'Fully Furnished (Plug & Play)' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setCommercialFitout(f.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                              commercialFitout === f.id
                                ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Washroom & Power */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Washroom Facility
                        </label>
                        <select
                          value={commercialWashrooms}
                          onChange={(e) => setCommercialWashrooms(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="PRIVATE">Private Attached Washroom</option>
                          <option value="COMMON">Common Floor Washrooms</option>
                          <option value="BOTH">Both Private & Common</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Power Load / Sanction
                        </label>
                        <input
                          type="text"
                          value={powerLoadKva}
                          onChange={(e) => setPowerLoadKva(e.target.value)}
                          placeholder="e.g. 15 KVA / Dedicated Transformer"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                    </div>

                    {/* Suitable For */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Suitable Business Uses
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'IT / Software Company',
                          'Corporate Office',
                          'Retail Store / Showroom',
                          'Doctor Clinic / Diagnostics',
                          'Bank / ATM Center',
                          'Restaurant / Cafe',
                          'Warehouse / Logistics',
                          'Manufacturing / Workshop',
                        ].map((biz) => {
                          const selected = suitableBusinesses.includes(biz);
                          return (
                            <button
                              key={biz}
                              type="button"
                              onClick={() => toggleItem(suitableBusinesses, biz, setSuitableBusinesses)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}{biz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. AGRICULTURAL LAND, FARMLAND PLOTS & FARM HOUSES */}
                {(landType === 'AGRICULTURAL_LAND' || landType === 'FARMLAND_PLOT' || landType === 'FARM_HOUSE_LAND') && (
                  <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <Trees className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Farmland, Soil &amp; Water Infrastructure
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Agricultural attributes, soil quality, irrigation sources, and existing plantations.
                        </p>
                      </div>
                    </div>

                    {/* Soil Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Soil Quality / Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'RED_SOIL', label: 'Red Soil (Fertile)' },
                          { id: 'BLACK_COTTON', label: 'Black Cotton' },
                          { id: 'ALLUVIAL', label: 'Alluvial Soil' },
                          { id: 'LOAMY', label: 'Loamy / Sandy' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSoilType(item.id)}
                            className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              soilType === item.id
                                ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Water Sources */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Water &amp; Irrigation Sources
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Dedicated Borewell',
                          'Canal / River Irrigation',
                          'Drip Irrigation System',
                          'Open Agricultural Well',
                          'Pond / Water Reservoir',
                        ].map((src) => {
                          const selected = waterSources.includes(src);
                          return (
                            <button
                              key={src}
                              type="button"
                              onClick={() => toggleItem(waterSources, src, setWaterSources)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}{src}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Electricity & Fencing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Agricultural Electricity
                        </label>
                        <select
                          value={electricityPhase}
                          onChange={(e) => setElectricityPhase(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="3_PHASE">3-Phase Agricultural Power</option>
                          <option value="SINGLE_PHASE">Single Phase Power</option>
                          <option value="SOLAR">Solar Power Installed</option>
                          <option value="NONE">No Direct Connection</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Perimeter Fencing
                        </label>
                        <select
                          value={farmFencing}
                          onChange={(e) => setFarmFencing(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="CHAINLINK">Fully Fenced (Chainlink / Barbed Wire)</option>
                          <option value="PARTIAL">Partially Fenced</option>
                          <option value="UNFENCED">Open / Unfenced</option>
                        </select>
                      </div>
                    </div>

                    {/* Plantations */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Existing Plantations / Crops (Optional)
                      </label>
                      <input
                        type="text"
                        value={plantations}
                        onChange={(e) => setPlantations(e.target.value)}
                        placeholder="e.g. 50 Mango Trees, Teakwood, Guava, Organic Vegetables"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                      />
                    </div>
                  </div>
                )}

                {/* 6. HOSPITALITY & LEISURE (Resort, Hotel, Service Apartment, Guest House) */}
                {(['RESORT', 'HOTEL', 'SERVICE_APARTMENT', 'GUEST_HOUSE'].includes(landType)) && (
                  <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <Palmtree className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Hospitality, Resort &amp; Retreat Infrastructure
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Room capacity, event lawns, guest recreation, and hospitality amenities.
                        </p>
                      </div>
                    </div>

                    {/* Rooms and Event Capacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Total Rooms / Cottages / Keys *
                        </label>
                        <input
                          type="text"
                          value={totalRooms}
                          onChange={(e) => setTotalRooms(e.target.value)}
                          placeholder="e.g. 24 Luxury Cottages / 40 Keys"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Event Lawn / Banquet Capacity
                        </label>
                        <input
                          type="text"
                          value={eventLawnCapacity}
                          onChange={(e) => setEventLawnCapacity(e.target.value)}
                          placeholder="e.g. 600 Guests / 15,000 sq.ft Party Lawn"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                    </div>

                    {/* Hospitality Features */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Hospitality &amp; Guest Amenities
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Swimming Pool',
                          'Restaurant / Kitchen Setup',
                          'Banquet / Event Lawn',
                          'Guest Parking (50+ Cars)',
                          'Spa & Wellness Pavilion',
                          'EV Charging Station',
                          '100% Generator Backup',
                          'Children Play Park',
                          'Tourism / Bar License Sanctioned',
                          'Conference / Meeting Room',
                        ].map((feat) => {
                          const selected = hospitalityFeatures.includes(feat);
                          return (
                            <button
                              key={feat}
                              type="button"
                              onClick={() => toggleItem(hospitalityFeatures, feat, setHospitalityFeatures)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}{feat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. INCOME-GENERATING & RENTAL FORMATS */}
                {(['RESIDENTIAL_RENTAL', 'COMMERCIAL_LEASE', 'COLIVING_PG', 'VACATION_RENTAL_AIRBNB'].includes(landType)) && (
                  <div className="rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center shrink-0">
                        <BadgeIndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Rental, Lease &amp; Income Terms
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Expected monthly rent, security deposit, lock-in period, and maintenance.
                        </p>
                      </div>
                    </div>

                    {/* Monthly Rent & Security Deposit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Monthly Rent / Lease Asking (₹ / Month) *
                        </label>
                        <input
                          type="text"
                          value={monthlyRent}
                          onChange={(e) => setMonthlyRent(e.target.value)}
                          placeholder="e.g. 45,000 / month"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Security Deposit
                        </label>
                        <select
                          value={securityDepositMonths}
                          onChange={(e) => setSecurityDepositMonths(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="1 Month">1 Month Rent</option>
                          <option value="2 Months">2 Months Rent</option>
                          <option value="3 Months">3 Months Rent</option>
                          <option value="6 Months">6 Months Rent</option>
                          <option value="10 Months">10 Months Rent</option>
                        </select>
                      </div>
                    </div>

                    {/* Lock-in Period & Maintenance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Lease Agreement / Lock-in Period
                        </label>
                        <select
                          value={leaseLockInPeriod}
                          onChange={(e) => setLeaseLockInPeriod(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] cursor-pointer"
                        >
                          <option value="11 Months">11 Months (Standard)</option>
                          <option value="1 Year">1 Year</option>
                          <option value="2 Years">2 Years</option>
                          <option value="3 Years">3 Years</option>
                          <option value="5 Years">5 Years (Commercial)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Maintenance Charges
                        </label>
                        <input
                          type="text"
                          value={maintenanceCharges}
                          onChange={(e) => setMaintenanceCharges(e.target.value)}
                          placeholder="e.g. Included in rent / ₹3,000 extra"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                        />
                      </div>
                    </div>

                    {/* Furnishing Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Furnishing Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'UNFURNISHED', label: 'Unfurnished' },
                          { id: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                          { id: 'FULLY_FURNISHED', label: 'Fully Furnished' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFurnishingStatus(f.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                              furnishingStatus === f.id
                                ? 'border-[#FF9933] bg-[#fff1dc] text-[#c75e0a] font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Google Maps Share Link (Optional)
                    </label>
                    {isResolvingMapLink && (
                      <span className="text-[11px] font-semibold text-[#c75e0a] flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Extracting GPS...
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={googleMapsShareLink}
                        onChange={(event) => {
                          const val = event.target.value;
                          setGoogleMapsShareLink(val);
                          if (val.includes('goo.gl/') || val.includes('/maps/') || val.includes('@')) {
                            handleResolveMapLink(val);
                          }
                        }}
                        onPaste={(event) => {
                          const pasted = event.clipboardData.getData('text');
                          if (pasted) {
                            setTimeout(() => handleResolveMapLink(pasted), 50);
                          }
                        }}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933] bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResolveMapLink()}
                      disabled={isResolvingMapLink || !googleMapsShareLink.trim()}
                      className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                    >
                      {isResolvingMapLink ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4 text-[#FF9933]" />
                      )}
                      <span>Locate Link</span>
                    </button>
                  </div>

                  {mapLinkResolutionStatus && (
                    <div
                      className={`mt-2.5 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                        mapLinkResolutionStatus.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {mapLinkResolutionStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>{mapLinkResolutionStatus.message}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 mt-1.5">
                    You can paste the location link copied directly from Google Maps (e.g. from the Google Maps app Share button). We automatically extract the coordinates and lock the live satellite map below.
                  </p>
                </div>

                {/* Map Display: shows cleanly below once link is entered and located */}
                {hasLocatedMap || googleMapsShareLink ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 animate-in fade-in duration-200">
                    <GoogleMapPicker
                      latitude={latitude}
                      longitude={longitude}
                      address={address}
                      city={city}
                      state={state}
                      pincode={pincode}
                      approximateLocation={approximateLocation}
                      placeName={resolvedPlaceName}
                      showAddressInputs={false}
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
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100/70 text-[#c75e0a] flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-[#FF9933]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Paste your Google Maps link above
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mt-1">
                        Paste the location link from Google Maps into the box above and click <span className="font-semibold text-slate-700">&quot;Locate Link&quot;</span>. Your interactive property satellite map will appear directly here.
                      </p>
                    </div>
                  </div>
                )}

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
                      Your exact coordinates can remain private while buyers see an approximate 50–100m area on the public map.
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

            {/* STEP 5: Unified Photos & Video Walkthrough with In-Browser & Server Optimization */}
            {currentStep === 5 && (
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
                    onChange={handleMediaUpload}
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
                              onClick={() => setVideo(null)}
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
                              onClick={() =>
                                setImages((prev) => {
                                  const remaining = prev.filter((_, itemIndex) => itemIndex !== index);
                                  if (remaining.length > 0 && !remaining.some((item) => item.isPrimary)) {
                                    remaining[0] = { ...remaining[0], isPrimary: true };
                                  }
                                  return remaining;
                                })
                              }
                              className="absolute right-2 top-2 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
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
                                    }))
                                  )
                                }
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
                        Property Type & Configuration
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {LAND_TYPES.find((t) => (t.value || (t as any).id) === landType)?.label || landType}
                        {[
                          'FLAT',
                          'INDEPENDENT_HOUSE',
                          'VILLA',
                          'HOUSE_VILLA',
                          'TOWNHOUSE',
                          'DUPLEX',
                          'PENTHOUSE',
                          'SERVICE_APARTMENT',
                          'RESIDENTIAL_RENTAL',
                          'COLIVING_PG',
                          'VACATION_RENTAL_AIRBNB',
                        ].includes(landType) && bhk && bhk !== 'NOT_SPECIFIED' ? ` • ${bhk}` : ''}
                        {facing && facing !== 'NOT_SPECIFIED' ? ` • ${facing} Facing` : ''}
                        {vastuCompliant && ['VILLA', 'INDEPENDENT_HOUSE', 'HOUSE_VILLA', 'TOWNHOUSE', 'DUPLEX'].includes(landType) ? ' • 100% Vastu' : ''}
                        {['RESORT', 'HOTEL', 'SERVICE_APARTMENT', 'GUEST_HOUSE'].includes(landType) && totalRooms ? ` • ${totalRooms}` : ''}
                        {['RESIDENTIAL_RENTAL', 'COMMERCIAL_LEASE', 'COLIVING_PG', 'VACATION_RENTAL_AIRBNB'].includes(landType) && monthlyRent ? ` • ₹${monthlyRent}/mo` : ''}
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

                    {/* Private Villa Features & Rooms if any */}
                    {(villaPrivateFeatures.length > 0 || additionalRooms.length > 0) && ['VILLA', 'INDEPENDENT_HOUSE', 'HOUSE_VILLA', 'TOWNHOUSE', 'DUPLEX'].includes(landType) && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                          Private Grounds &amp; Rooms ({villaPrivateFeatures.length + additionalRooms.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {villaPrivateFeatures.map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded-md bg-[#fff1dc] border border-[#FF9933]/30 text-[#7a3705] text-[10px] font-bold"
                            >
                              ★ {f}
                            </span>
                          ))}
                          {additionalRooms.map((r) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold"
                            >
                              + {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAmenities.length > 0 && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                          Key Amenities & Features ({selectedAmenities.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedAmenities.map((a) => (
                            <span
                              key={a}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                            >
                              ✓ {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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

/* ================================================================
   SELL PAGE SKELETON (Gray Boxes with Continuous Shimmer Wave)
================================================================ */

function SellPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          {/* Header Skeleton */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="space-y-2">
                <div className="h-3.5 w-28 rounded-md shimmer" />
                <div className="h-8 w-64 sm:w-80 rounded-xl shimmer" />
                <div className="h-4 w-72 sm:w-96 rounded-md shimmer" />
              </div>

              <div className="hidden sm:block h-10 w-44 rounded-xl shimmer" />
            </div>

            {/* Progress Bar Skeleton */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-6">
              <div className="h-full w-1/6 shimmer" />
            </div>
          </div>

          {/* Stepper Skeleton (7 steps) */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg shimmer" />
            ))}
          </div>

          {/* Form Card Skeleton */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Step Title & Subtitle */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="h-6 w-56 rounded-lg shimmer" />
              <div className="h-4 w-72 rounded-md shimmer" />
            </div>

            {/* Category Filter Tabs */}
            <div className="h-11 rounded-2xl shimmer w-full" />

            {/* Property Type Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>

            {/* Title Input Field */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-36 rounded-md shimmer" />
              <div className="h-12 rounded-xl shimmer w-full" />
            </div>

            {/* Area & Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="h-12 rounded-xl shimmer w-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="h-12 rounded-xl shimmer w-full" />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-md shimmer" />
              <div className="h-28 rounded-xl shimmer w-full" />
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div className="h-11 w-28 rounded-xl shimmer" />
              <div className="h-11 w-44 rounded-xl shimmer" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<SellPageSkeleton />}>
      <SellPageForm />
    </Suspense>
  );
}