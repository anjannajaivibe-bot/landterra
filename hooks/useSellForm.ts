'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandType, IProperty, IPropertyImage, IPropertyDocument } from '@/types/property';
import { SellerType, IUser } from '@/types/user';
import {
  LandAreaUnit,
  UploadedImagePreview,
  UploadedDocPreview,
  UploadedVideoPreview,
  AreaConversions,
  AuthoritativeFees,
  UseSellFormReturn,
} from '@/types/sell-form';

const LAND_AREA_CONVERSIONS: Record<LandAreaUnit, number> = {
  SQUARE_YARDS: 1,
  SQUARE_FEET: 1 / 9,
  GUNTAS: 121,
  CENTS: 48.4,
  ACRES: 4840,
  HECTARES: 11959.9004,
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

function convertToSquareYards(value: number, unit: LandAreaUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value * LAND_AREA_CONVERSIONS[unit];
}

function convertFromSquareYards(squareYards: number, unit: LandAreaUnit): number {
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
      image.onerror = () => reject(new Error(`Unable to read image: ${file.name}`));
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
        MAX_IMAGE_DIMENSION / height
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

    const canvasToBlob = (quality: number): Promise<Blob> =>
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
          quality
        );
      });

    let quality = INITIAL_IMAGE_QUALITY;
    let blob = await canvasToBlob(quality);

    while (blob.size > MAX_IMAGE_UPLOAD_BYTES && quality > MIN_IMAGE_QUALITY) {
      quality = Math.max(MIN_IMAGE_QUALITY, quality - 0.07);
      blob = await canvasToBlob(quality);
    }

    let attempts = 0;
    while (blob.size > MAX_IMAGE_UPLOAD_BYTES && attempts < 5) {
      attempts += 1;
      width = Math.max(800, Math.round(width * 0.85));
      height = Math.max(600, Math.round(height * 0.85));

      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);

      blob = await canvasToBlob(MIN_IMAGE_QUALITY);
    }

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const finalFileName = `${fileNameWithoutExt}.webp`;

    return new File([blob], finalFileName, {
      type: outputMimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function useSellForm(): UseSellFormReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyIdParam =
    searchParams.get('propertyId') ||
    searchParams.get('edit');

  const [currentUser, setCurrentUser] = useState<Partial<IUser> | null>(null);
  const [existingPropertyId, setExistingPropertyId] = useState<string | null>(null);
  const [existingPaymentStatus, setExistingPaymentStatus] = useState<string | null>(null);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState<boolean>(false);

  const hasInitializedSettingsRef = useRef(false);
  const lastFetchedPropertyIdRef = useRef<string | null>(null);
  const hasRestoredDraftRef = useRef(false);

  // Settings
  const [requireGoogleLogin, setRequireGoogleLogin] = useState<boolean>(true);
  const [requirePhoneOtp, setRequirePhoneOtp] = useState<boolean>(true);
  const [listingFeeAmount, setListingFeeAmount] = useState<number>(10);
  const [listingDurationDays, setListingDurationDays] = useState<number>(30);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  // Auth / OTP
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testOtpNotice, setTestOtpNotice] = useState<string | null>(null);

  // Wizard
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [draftSavedSuccess, setDraftSavedSuccess] = useState<boolean>(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [createdProperty, setCreatedProperty] = useState<IProperty | null>(null);

  // Step 1: Specs & Pricing
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [landAreaYards, setLandAreaYards] = useState<number>(300);
  const [landAreaInput, setLandAreaInput] = useState<string>('300');
  const [landAreaUnit, setLandAreaUnit] = useState<LandAreaUnit>('SQUARE_YARDS');
  const [pricePerYard, setPricePerYard] = useState<string>('25000');
  const [priceNegotiable, setPriceNegotiable] = useState<boolean>(true);
  const [landType, setLandType] = useState<LandType>('RESIDENTIAL_PLOT');
  const [sellerCategoryTab, setSellerCategoryTab] = useState<string>('Land & Plots');

  // Residential Attributes
  const [bhk, setBhk] = useState<string>('3 BHK');
  const [floorNumber, setFloorNumber] = useState<string>('');
  const [totalFloors, setTotalFloors] = useState<string>('');
  const [furnishingStatus, setFurnishingStatus] = useState<string>('SEMI_FURNISHED');
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<string>('');
  const [superBuiltUpAreaSqFt, setSuperBuiltUpAreaSqFt] = useState<string>('');
  const [parkingSlots, setParkingSlots] = useState<string>('1_COVERED');

  // Facing & Boundaries
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

  // Hospitality Specific
  const [totalRooms, setTotalRooms] = useState<string>('20 Rooms');
  const [eventLawnCapacity, setEventLawnCapacity] = useState<string>('500 Guests');
  const [hospitalityFeatures, setHospitalityFeatures] = useState<string[]>([
    'Swimming Pool',
    'Restaurant / Kitchen Setup',
    'Banquet / Event Lawn',
    'Guest Parking',
  ]);

  // Rental Specific
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [securityDepositMonths, setSecurityDepositMonths] = useState<string>('2 Months');
  const [leaseLockInPeriod, setLeaseLockInPeriod] = useState<string>('11 Months');
  const [maintenanceCharges, setMaintenanceCharges] = useState<string>('');

  // Amenities & Road Access
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Lift / Elevator',
    '24/7 Security & CCTV',
    '100% Power Backup',
    'Covered Car Parking',
  ]);
  const [roadAccess, setRoadAccess] = useState<string>('30_FT_PLUS');
  const [landmarks, setLandmarks] = useState<string>('');

  // Step 2: Location
  const [googleMapsShareLink, setGoogleMapsShareLink] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(17.4123);
  const [longitude, setLongitude] = useState<number>(78.3512);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('Telangana');
  const [pincode, setPincode] = useState<string>('');
  const [approximateLocation, setApproximateLocation] = useState<boolean>(false);
  const [isResolvingMapLink, setIsResolvingMapLink] = useState<boolean>(false);
  const [hasLocatedMap, setHasLocatedMap] = useState<boolean>(false);
  const [resolvedPlaceName, setResolvedPlaceName] = useState<string>('');
  const [mapLinkResolutionStatus, setMapLinkResolutionStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Step 3: Seller Details
  const [sellerName, setSellerName] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState<string>('');
  const [sellerEmail, setSellerEmail] = useState<string>('');
  const [sellerType, setSellerType] = useState<SellerType>('INDIVIDUAL');
  const [sellerAddress, setSellerAddress] = useState<string>('');

  // Step 4: Govt Records
  const [governmentRegistrationId, setGovernmentRegistrationId] = useState<string>('');

  // Step 5: Media
  const [images, setImages] = useState<UploadedImagePreview[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageCompressionMessage, setImageCompressionMessage] = useState<string>('');
  const [video, setVideo] = useState<UploadedVideoPreview | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoUploadMessage, setVideoUploadMessage] = useState<string>('');

  // Step 6: Documents
  const [documents, setDocuments] = useState<UploadedDocPreview[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  // Step 7: Terms & Security Check
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Entry Gate: Human Verification (front door — verified before Step 1 renders)
  const [humanVerified, setHumanVerified] = useState<boolean>(false);

  // Helpers
  const toggleItem = useCallback(
    (list: string[], item: string, setter: (val: string[]) => void) => {
      if (list.includes(item)) {
        setter(list.filter((i) => i !== item));
      } else {
        setter([...list, item]);
      }
    },
    []
  );

  // Area conversions
  const areaConversions: AreaConversions = useMemo(() => {
    return {
      sqYards: landAreaYards,
      sqFeet: landAreaYards * 9,
      guntas: landAreaYards / 121,
      cents: landAreaYards / 48.4,
      acres: landAreaYards / 4840,
      hectares: landAreaYards / 11959.9004,
    };
  }, [landAreaYards]);

  // Authoritative Fees & Valuation
  const numericPricePerYard = Number(pricePerYard) || 0;
  const totalValuation = useMemo(() => {
    return Math.round(landAreaYards * numericPricePerYard);
  }, [landAreaYards, numericPricePerYard]);

  const authoritativeFees: AuthoritativeFees = useMemo(() => {
    return {
      landAreaYards,
      pricePerYard: numericPricePerYard,
      totalPrice: totalValuation,
      monthlyListingFee: listingFeeAmount,
      publishingFee: listingFeeAmount,
    };
  }, [landAreaYards, numericPricePerYard, totalValuation, listingFeeAmount]);

  const progressPercent = (currentStep / 7) * 100;

  // Handle land area input changes
  const handleAreaInputChange = (value: string) => {
    setLandAreaInput(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setLandAreaYards(convertToSquareYards(parsed, landAreaUnit));
    } else {
      setLandAreaYards(0);
    }
  };

  const handleAreaUnitChange = (unit: LandAreaUnit) => {
    setLandAreaUnit(unit);
    if (landAreaYards > 0) {
      const converted = convertFromSquareYards(landAreaYards, unit);
      const rounded =
        unit === 'ACRES' || unit === 'HECTARES'
          ? converted.toFixed(4)
          : unit === 'SQUARE_FEET'
          ? Math.round(converted).toString()
          : converted.toFixed(2);
      setLandAreaInput(rounded);
    }
  };

  // Sync step to URL
  const syncStepToUrl = useCallback((step: number) => {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('step') !== String(step)) {
          url.searchParams.set('step', String(step));
          window.history.replaceState(null, '', url.toString());
        }
      } catch {}
    }, 0);
  }, []);

  // Step Validation
  const validateCurrentStep = useCallback((step: number): boolean => {
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
          'Land area exceeds maximum allowable limit (10 crore sq. yards / approx. 20,660 acres). Please check the value and unit.'
        );
        return false;
      }
      if (!Number.isFinite(numericPricePerYard) || numericPricePerYard <= 0) {
        setErrorMessage('Price per sq. yard must be greater than zero.');
        return false;
      }
    }

    if (step === 2) {
      if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        setErrorMessage(
          'Please complete all mandatory location fields (Address, City, State, Pincode).'
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
  }, [title, landAreaYards, numericPricePerYard, address, city, state, pincode, sellerName, sellerPhone, sellerEmail, images.length]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep(currentStep)) {
      const next = Math.min(currentStep + 1, 7);
      setCurrentStep(next);
      syncStepToUrl(next);
    }
  }, [currentStep, validateCurrentStep, syncStepToUrl]);

  const handlePrev = useCallback(() => {
    setErrorMessage('');
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
    syncStepToUrl(prevStep);
  }, [currentStep, syncStepToUrl]);

  // Initial Data Fetch & Draft Hydration
  useEffect(() => {
    async function init() {
      try {
        setPageLoading(true);

        // Fetch settings and current user session only once upon initial mount
        if (!hasInitializedSettingsRef.current) {
          hasInitializedSettingsRef.current = true;

          // Fetch settings
          try {
            const settingsRes = await fetch('/api/settings/public');
            if (settingsRes.ok) {
              const settingsData = await settingsRes.json();
              if (settingsData.settings) {
                setRequireGoogleLogin(Boolean(settingsData.settings.requireGoogleLogin));
                setRequirePhoneOtp(Boolean(settingsData.settings.requirePhoneOtp));
                if (settingsData.settings.listingFeeAmount !== undefined) {
                  setListingFeeAmount(Number(settingsData.settings.listingFeeAmount));
                }
                if (settingsData.settings.listingDurationDays !== undefined) {
                  setListingDurationDays(Number(settingsData.settings.listingDurationDays));
                }
              }
            }
          } catch (e) {
            console.warn('Failed to load portal settings:', e);
          }

          // Fetch current user session
          try {
            const sessionRes = await fetch('/api/auth/session');
            if (sessionRes.ok) {
              const sessionData = await sessionRes.json();
              const user = sessionData.session?.user;
              if (user) {
                setCurrentUser(user);
                if (user.name) setSellerName((prev) => prev || user.name);
                if (user.email) setSellerEmail((prev) => prev || user.email);
                if (user.phone) {
                  setPhoneInput(user.phone);
                  setSellerPhone(user.phone);
                }
                if (user.sellerType) {
                  setSellerType(user.sellerType);
                }
              }
            }
          } catch (e) {
            console.warn('Failed to load current session:', e);
          }
        }

        // Load existing property if propertyId / edit is in URL
        if (propertyIdParam && lastFetchedPropertyIdRef.current !== propertyIdParam) {
          lastFetchedPropertyIdRef.current = propertyIdParam;
          try {
            const propRes = await fetch(`/api/properties/${propertyIdParam}`);
            if (propRes.ok) {
              const propData = await propRes.json();
              const property = propData.property;

              // Enforce strict account isolation: Only the owner or platform admin can edit a listing
              if (property && (propData.isOwner || propData.isAdmin)) {
                setExistingPropertyId(property._id);
                if (property.paymentStatus) {
                  setExistingPaymentStatus(property.paymentStatus);
                }
                if (property.title) setTitle(property.title);
                if (property.description) setDescription(property.description);
                if (property.landAreaYards) {
                  setLandAreaYards(property.landAreaYards);
                  setLandAreaInput(String(property.landAreaYards));
                  setLandAreaUnit('SQUARE_YARDS');
                }
                if (property.pricePerYard) setPricePerYard(String(property.pricePerYard));
                if (property.priceNegotiable !== undefined) setPriceNegotiable(property.priceNegotiable);
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
                if (property.cornerPlot !== undefined) setCornerPlot(property.cornerPlot);
                if (property.gatedCommunity !== undefined) setGatedCommunity(property.gatedCommunity);
                if (Array.isArray(property.amenities)) setSelectedAmenities(property.amenities);
                if (Array.isArray(property.approvals)) setApprovals(property.approvals);
                if (Array.isArray(property.waterSource)) setWaterSources(property.waterSource);
                if (property.electricityPhase) setElectricityPhase(property.electricityPhase);
                if (property.soilType) setSoilType(property.soilType);

                if (property.propertyAttributes) {
                  const attrs = property.propertyAttributes;
                  if (attrs.plotWidthFt) setPlotWidthFt(attrs.plotWidthFt);
                  if (attrs.plotLengthFt) setPlotLengthFt(attrs.plotLengthFt);
                  if (attrs.villaType) setVillaType(attrs.villaType);
                  if (attrs.villaFloors) setVillaFloors(attrs.villaFloors);
                  if (attrs.vastuCompliant !== undefined) setVastuCompliant(attrs.vastuCompliant);
                  if (Array.isArray(attrs.additionalRooms)) setAdditionalRooms(attrs.additionalRooms);
                  if (Array.isArray(attrs.villaPrivateFeatures)) setVillaPrivateFeatures(attrs.villaPrivateFeatures);
                  if (Array.isArray(attrs.furnishingDetails)) setFurnishingDetails(attrs.furnishingDetails);
                  if (attrs.possessionStatus) setPossessionStatus(attrs.possessionStatus);
                  if (attrs.ageOfProperty) setAgeOfProperty(attrs.ageOfProperty);
                  if (attrs.commercialFitout) setCommercialFitout(attrs.commercialFitout);
                  if (attrs.commercialWashrooms) setCommercialWashrooms(attrs.commercialWashrooms);
                  if (attrs.powerLoadKva) setPowerLoadKva(attrs.powerLoadKva);
                  if (Array.isArray(attrs.suitableBusinesses)) setSuitableBusinesses(attrs.suitableBusinesses);
                  if (attrs.farmFencing) setFarmFencing(attrs.farmFencing);
                  if (attrs.plantations) setPlantations(attrs.plantations);
                  if (attrs.totalRooms) setTotalRooms(attrs.totalRooms);
                  if (attrs.eventLawnCapacity) setEventLawnCapacity(attrs.eventLawnCapacity);
                  if (Array.isArray(attrs.hospitalityFeatures)) setHospitalityFeatures(attrs.hospitalityFeatures);
                  if (attrs.monthlyRent) setMonthlyRent(attrs.monthlyRent);
                  if (attrs.securityDepositMonths) setSecurityDepositMonths(attrs.securityDepositMonths);
                  if (attrs.leaseLockInPeriod) setLeaseLockInPeriod(attrs.leaseLockInPeriod);
                  if (attrs.maintenanceCharges) setMaintenanceCharges(attrs.maintenanceCharges);
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

                if (property.googleMapsShareLink) setGoogleMapsShareLink(property.googleMapsShareLink);
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
                    property.images.map((img: IPropertyImage) => ({
                      secureUrl: img.secureUrl,
                      isPrimary: Boolean(img.isPrimary),
                      objectKey: img.objectKey,
                      fileName: img.fileName || 'image.webp',
                      size: typeof img.size === 'number' ? img.size : 0,
                      mimeType: img.mimeType || 'image/webp',
                    }))
                  );
                }

                if (Array.isArray(property.documents) && property.documents.length > 0) {
                  setDocuments(
                    property.documents.map((doc: IPropertyDocument) => ({
                      documentType: doc.documentType,
                      fileName: doc.fileName || 'document.pdf',
                      objectKey: doc.objectKey,
                      size: typeof doc.size === 'number' ? doc.size : 0,
                    }))
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

                if (property.sellerDeclarationAccepted !== undefined) {
                  setTermsAccepted(Boolean(property.sellerDeclarationAccepted));
                }
                if (property.sellerPhone) setPhoneInput(property.sellerPhone);
                if (property.sellerName) setSellerName(property.sellerName);
                if (property.sellerEmail) setSellerEmail(property.sellerEmail);

                const stepParam = searchParams.get('step');
                if (stepParam && !isNaN(Number(stepParam))) {
                  const parsed = Math.min(Math.max(1, parseInt(stepParam, 10)), 7);
                  setCurrentStep(parsed);
                } else if (property.paymentStatus === 'PENDING') {
                  setCurrentStep(7);
                }
              } else {
                setErrorMessage('You do not have permission to edit this listing. Users can only manage their own properties.');
                setExistingPropertyId(null);
              }
            } else {
              setErrorMessage('Listing not found or you do not have permission to access it.');
              setExistingPropertyId(null);
            }
          } catch (e) {
            console.warn('Failed to load property from ID:', e);
          }
        } else if (!hasRestoredDraftRef.current) {
          hasRestoredDraftRef.current = true;
          // Restore from localStorage
          try {
            const rawDraft =
              localStorage.getItem('landterra_sell_form_draft') ||
              localStorage.getItem('bhoomimitra_sell_draft');
            if (rawDraft) {
              const localDraft = JSON.parse(rawDraft);
              if (localDraft && typeof localDraft === 'object') {
                if (localDraft.title) setTitle(localDraft.title);
                if (localDraft.description) setDescription(localDraft.description);
                if (localDraft.landAreaInput) setLandAreaInput(localDraft.landAreaInput);
                if (localDraft.landAreaUnit) setLandAreaUnit(localDraft.landAreaUnit);
                if (localDraft.landAreaYards) setLandAreaYards(localDraft.landAreaYards);
                if (localDraft.pricePerYard) setPricePerYard(String(localDraft.pricePerYard));
                if (localDraft.priceNegotiable !== undefined) setPriceNegotiable(localDraft.priceNegotiable);
                if (localDraft.landType) setLandType(localDraft.landType);
                if (localDraft.bhk) setBhk(localDraft.bhk);
                if (localDraft.facing) setFacing(localDraft.facing);
                if (localDraft.floorNumber) setFloorNumber(localDraft.floorNumber);
                if (localDraft.totalFloors) setTotalFloors(localDraft.totalFloors);
                if (localDraft.furnishingStatus) setFurnishingStatus(localDraft.furnishingStatus);
                if (typeof localDraft.bathrooms === 'number') setBathrooms(localDraft.bathrooms);
                if (typeof localDraft.balconies === 'number') setBalconies(localDraft.balconies);
                if (localDraft.carpetAreaSqFt) setCarpetAreaSqFt(localDraft.carpetAreaSqFt);
                if (localDraft.superBuiltUpAreaSqFt) setSuperBuiltUpAreaSqFt(localDraft.superBuiltUpAreaSqFt);
                if (localDraft.boundaryWall) setBoundaryWall(localDraft.boundaryWall);
                if (localDraft.cornerPlot !== undefined) setCornerPlot(localDraft.cornerPlot);
                if (localDraft.gatedCommunity !== undefined) setGatedCommunity(localDraft.gatedCommunity);
                if (Array.isArray(localDraft.selectedAmenities)) setSelectedAmenities(localDraft.selectedAmenities);
                if (Array.isArray(localDraft.approvals)) setApprovals(localDraft.approvals);
                if (Array.isArray(localDraft.waterSources)) setWaterSources(localDraft.waterSources);
                if (localDraft.electricityPhase) setElectricityPhase(localDraft.electricityPhase);
                if (localDraft.soilType) setSoilType(localDraft.soilType);
                if (localDraft.plotWidthFt) setPlotWidthFt(localDraft.plotWidthFt);
                if (localDraft.plotLengthFt) setPlotLengthFt(localDraft.plotLengthFt);
                if (localDraft.villaType) setVillaType(localDraft.villaType);
                if (localDraft.villaFloors) setVillaFloors(localDraft.villaFloors);
                if (localDraft.vastuCompliant !== undefined) setVastuCompliant(localDraft.vastuCompliant);
                if (Array.isArray(localDraft.additionalRooms)) setAdditionalRooms(localDraft.additionalRooms);
                if (Array.isArray(localDraft.villaPrivateFeatures)) setVillaPrivateFeatures(localDraft.villaPrivateFeatures);
                if (Array.isArray(localDraft.furnishingDetails)) setFurnishingDetails(localDraft.furnishingDetails);
                if (localDraft.possessionStatus) setPossessionStatus(localDraft.possessionStatus);
                if (localDraft.ageOfProperty) setAgeOfProperty(localDraft.ageOfProperty);
                if (localDraft.commercialFitout) setCommercialFitout(localDraft.commercialFitout);
                if (localDraft.commercialWashrooms) setCommercialWashrooms(localDraft.commercialWashrooms);
                if (localDraft.powerLoadKva) setPowerLoadKva(localDraft.powerLoadKva);
                if (Array.isArray(localDraft.suitableBusinesses)) setSuitableBusinesses(localDraft.suitableBusinesses);
                if (localDraft.farmFencing) setFarmFencing(localDraft.farmFencing);
                if (localDraft.plantations) setPlantations(localDraft.plantations);
                if (localDraft.totalRooms) setTotalRooms(localDraft.totalRooms);
                if (localDraft.eventLawnCapacity) setEventLawnCapacity(localDraft.eventLawnCapacity);
                if (Array.isArray(localDraft.hospitalityFeatures)) setHospitalityFeatures(localDraft.hospitalityFeatures);
                if (localDraft.monthlyRent) setMonthlyRent(localDraft.monthlyRent);
                if (localDraft.securityDepositMonths) setSecurityDepositMonths(localDraft.securityDepositMonths);
                if (localDraft.leaseLockInPeriod) setLeaseLockInPeriod(localDraft.leaseLockInPeriod);
                if (localDraft.maintenanceCharges) setMaintenanceCharges(localDraft.maintenanceCharges);
                if (localDraft.roadAccess) setRoadAccess(localDraft.roadAccess);
                if (localDraft.landmarks) setLandmarks(localDraft.landmarks);
                if (localDraft.address) setAddress(localDraft.address);
                if (localDraft.city) setCity(localDraft.city);
                if (localDraft.state) setState(localDraft.state);
                if (localDraft.pincode) setPincode(localDraft.pincode);
                if (localDraft.googleMapsShareLink) setGoogleMapsShareLink(localDraft.googleMapsShareLink);
                if (localDraft.latitude) setLatitude(localDraft.latitude);
                if (localDraft.longitude) setLongitude(localDraft.longitude);
                if (localDraft.sellerType) setSellerType(localDraft.sellerType);
                if (Array.isArray(localDraft.images) && localDraft.images.length > 0) setImages(localDraft.images);
                if (localDraft.video) setVideo(localDraft.video);
                if (Array.isArray(localDraft.documents) && localDraft.documents.length > 0) setDocuments(localDraft.documents);
                if (localDraft.termsAccepted !== undefined) setTermsAccepted(localDraft.termsAccepted);
                if (typeof localDraft.currentStep === 'number' && localDraft.currentStep >= 1 && localDraft.currentStep <= 7) {
                  setCurrentStep(localDraft.currentStep);
                }
              }
            }
          } catch (e) {
            console.warn('Could not restore local draft:', e);
          }
        }
      } catch (err) {
        console.error('Init error in useSellForm:', err);
      } finally {
        setPageLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyIdParam]);

  // Local Storage Autosave
  useEffect(() => {
    if (pageLoading || existingPropertyId) return;
    if (!title && !landAreaInput && images.length === 0) return;

    const timeout = setTimeout(() => {
      try {
        const draftData = {
          title,
          description,
          landAreaInput,
          landAreaUnit,
          landAreaYards,
          pricePerYard,
          priceNegotiable,
          landType,
          bhk,
          facing,
          floorNumber,
          totalFloors,
          furnishingStatus,
          bathrooms,
          balconies,
          carpetAreaSqFt,
          superBuiltUpAreaSqFt,
          boundaryWall,
          cornerPlot,
          gatedCommunity,
          selectedAmenities,
          approvals,
          waterSources,
          electricityPhase,
          soilType,
          plotWidthFt,
          plotLengthFt,
          villaType,
          villaFloors,
          vastuCompliant,
          additionalRooms,
          villaPrivateFeatures,
          furnishingDetails,
          possessionStatus,
          ageOfProperty,
          commercialFitout,
          commercialWashrooms,
          powerLoadKva,
          suitableBusinesses,
          farmFencing,
          plantations,
          totalRooms,
          eventLawnCapacity,
          hospitalityFeatures,
          monthlyRent,
          securityDepositMonths,
          leaseLockInPeriod,
          maintenanceCharges,
          roadAccess,
          landmarks,
          address,
          city,
          state,
          pincode,
          googleMapsShareLink,
          latitude,
          longitude,
          approximateLocation,
          governmentRegistrationId,
          sellerName,
          phoneInput,
          sellerEmail,
          sellerType,
          images,
          video,
          documents,
          currentStep,
          termsAccepted,
          savedAt: Date.now(),
        };
        localStorage.setItem('landterra_sell_form_draft', JSON.stringify(draftData));
        localStorage.setItem('bhoomimitra_sell_draft', JSON.stringify(draftData));
      } catch (err) {
        console.warn('Failed to auto-save local draft:', err);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [
    pageLoading,
    existingPropertyId,
    title,
    description,
    landAreaInput,
    landAreaUnit,
    landAreaYards,
    pricePerYard,
    priceNegotiable,
    landType,
    bhk,
    facing,
    floorNumber,
    totalFloors,
    furnishingStatus,
    bathrooms,
    balconies,
    carpetAreaSqFt,
    superBuiltUpAreaSqFt,
    boundaryWall,
    cornerPlot,
    gatedCommunity,
    selectedAmenities,
    approvals,
    waterSources,
    electricityPhase,
    soilType,
    plotWidthFt,
    plotLengthFt,
    villaType,
    villaFloors,
    vastuCompliant,
    additionalRooms,
    villaPrivateFeatures,
    furnishingDetails,
    possessionStatus,
    ageOfProperty,
    commercialFitout,
    commercialWashrooms,
    powerLoadKva,
    suitableBusinesses,
    farmFencing,
    plantations,
    totalRooms,
    eventLawnCapacity,
    hospitalityFeatures,
    monthlyRent,
    securityDepositMonths,
    leaseLockInPeriod,
    maintenanceCharges,
    roadAccess,
    landmarks,
    address,
    city,
    state,
    pincode,
    googleMapsShareLink,
    latitude,
    longitude,
    approximateLocation,
    governmentRegistrationId,
    sellerName,
    phoneInput,
    sellerEmail,
    sellerType,
    images,
    video,
    documents,
    currentStep,
    termsAccepted,
  ]);

  // Phone OTP Handlers
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
          prev ? { ...prev, phone: data.phone, isPhoneVerified: true } : null
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

  // Google Maps Link Resolution
  const handleResolveMapLink = async (customUrl?: string) => {
    const rawUrl = (customUrl !== undefined ? customUrl : googleMapsShareLink).trim();
    if (!rawUrl) return;

    setIsResolvingMapLink(true);
    setMapLinkResolutionStatus(null);

    try {
      const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(rawUrl)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not resolve Google Maps link');
      }

      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setHasLocatedMap(true);

        if (data.placeName) setResolvedPlaceName(data.placeName);
        if (data.address && !address) setAddress(data.address);
        if (data.city && !city) setCity(data.city);
        if (data.state && !state) setState(data.state);
        if (data.pincode && !pincode) setPincode(data.pincode);

        setMapLinkResolutionStatus({
          type: 'success',
          message: `Location locked: GPS (${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)})${
            data.placeName ? ` • ${data.placeName}` : ''
          }`,
        });
      } else {
        throw new Error('Could not extract coordinates from link');
      }
    } catch (err: unknown) {
      console.warn('Map link extraction error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to locate map coordinates';
      setMapLinkResolutionStatus({
        type: 'error',
        message: `${msg}. You can still enter your address manually below.`,
      });
    } finally {
      setIsResolvingMapLink(false);
    }
  };

  // Image Upload
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
            `${originalFile.name}: ${formatFileSize(originalFile.size)} → ${formatFileSize(compressedFile.size)}`
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
            setErrorMessage(data.error || `Failed to upload ${originalFile.name}`);
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

  // Remove Image
  const handleRemoveImage = async (index: number) => {
    const targetImage = images[index];
    if (!targetImage) return;

    setImages((prev) => {
      const remaining = prev.filter((_, itemIndex) => itemIndex !== index);
      if (remaining.length > 0 && !remaining.some((item) => item.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining;
    });

    if (targetImage.objectKey) {
      try {
        await fetch('/api/uploads/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey: targetImage.objectKey,
            propertyId: existingPropertyId || undefined,
            type: 'image',
          }),
        });
      } catch (err) {
        console.warn('Failed to delete image from storage:', err);
      }
    }
  };

  // Set Primary Image
  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((item, itemIndex) => ({
        ...item,
        isPrimary: itemIndex === index,
      }))
    );
  };

  // Video Upload
  const uploadVideoFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Video exceeds the maximum allowed size of 50 MB. Please choose a shorter clip.');
      return;
    }

    setIsUploadingVideo(true);
    setErrorMessage('');
    setVideoUploadMessage(`Preparing direct upload for ${file.name}...`);

    try {
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
          reject(new Error('Network or CORS error while uploading video to cloud storage.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Video upload timed out. Please try again with a smaller file.'));
        };

        xhr.send(file);
      });

      setVideoUploadMessage('Compressing & optimizing video to WebM (~85% size reduction)... Please wait');

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

      if (video?.objectKey && video.objectKey !== processedFile.objectKey) {
        fetch('/api/uploads/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey: video.objectKey,
            propertyId: existingPropertyId || undefined,
            type: 'video',
          }),
        }).catch((err) => console.warn('Failed to clean up replaced video:', err));
      }

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

  const handleRemoveVideo = async () => {
    if (!video) return;
    const oldKey = video.objectKey;
    setVideo(null);

    if (oldKey) {
      try {
        await fetch('/api/uploads/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey: oldKey,
            propertyId: existingPropertyId || undefined,
            type: 'video',
          }),
        });
      } catch (err) {
        console.warn('Failed to delete video from storage:', err);
      }
    }
  };

  // Documents
  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docType: UploadedDocPreview['documentType'] = 'TITLE_DEED'
  ) => {
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
              documentType: docType,
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

  const handleRemoveDocument = async (index: number) => {
    const targetDoc = documents[index];
    if (!targetDoc) return;

    setDocuments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    if (targetDoc.objectKey) {
      try {
        await fetch('/api/uploads/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey: targetDoc.objectKey,
            propertyId: existingPropertyId || undefined,
            type: 'document',
          }),
        });
      } catch (err) {
        console.warn('Failed to delete document from storage:', err);
      }
    }
  };

  // Reusable Payload Builder
  const constructPropertyPayload = () => {
    return {
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
        ? landmarks.split(',').map((l) => l.trim()).filter(Boolean)
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
      turnstileToken: turnstileToken || undefined,
      images: (() => {
        const hasPrimary = images.some((img) => img.isPrimary);
        return images.map((image, index) => ({
          objectKey: image.objectKey,
          secureUrl: image.secureUrl,
          fileName: image.fileName,
          mimeType: image.mimeType,
          size: image.size,
          isPrimary: hasPrimary ? Boolean(image.isPrimary) : index === 0,
          sortOrder: index,
        }));
      })(),
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
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!Number.isFinite(landAreaYards) || landAreaYards < 1) {
      setErrorMessage('Please enter a valid land area (minimum 1 sq. yard) before saving draft.');
      setCurrentStep(1);
      return;
    }

    if (!title || title.trim().length < 6) {
      setErrorMessage('Please enter a listing title (at least 6 characters) before saving draft.');
      setCurrentStep(1);
      return;
    }

    if (images.length === 0) {
      setErrorMessage('Please upload at least 1 property photograph before saving draft.');
      setCurrentStep(5);
      return;
    }

    setIsSavingDraft(true);
    setErrorMessage('');
    setDraftSavedMessage(null);

    try {
      const payload = constructPropertyPayload();

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
          setErrorMessage('Phone verification is required before listing. Please verify your mobile number.');
        } else if (data.code === 'TURNSTILE_REQUIRED') {
          setErrorMessage(data.error || 'Security verification required to list property.');
        } else {
          const detailMsg = Array.isArray(data.details)
            ? data.details.map((d: { path?: (string | number)[]; message?: string }) => `${d.path?.join('.') || 'field'}: ${d.message || 'invalid'}`).join('; ')
            : '';
          throw new Error(data.error || detailMsg || 'Failed to save listing draft');
        }
        return;
      }

      const savedProperty =
        data.property ||
        (existingPropertyId ? { ...payload, _id: existingPropertyId } : null);

      if (savedProperty?._id) {
        setExistingPropertyId(savedProperty._id);
        setCreatedProperty(savedProperty);
        if (savedProperty.paymentStatus) {
          setExistingPaymentStatus(savedProperty.paymentStatus);
        }

        setTimeout(() => {
          try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('edit', savedProperty._id);
            newUrl.searchParams.set('step', String(currentStep));
            window.history.replaceState(null, '', newUrl.toString());
          } catch {}
        }, 0);
      }

      try {
        localStorage.removeItem('landterra_sell_form_draft');
        localStorage.removeItem('bhoomimitra_sell_draft');
      } catch {}

      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setDraftSavedTime(timeStr);
      setDraftSavedSuccess(true);
      setDraftSavedMessage(
        `Draft saved successfully at ${timeStr}! All property details, photos, and video are securely stored. You can safely refresh the page or proceed to pay anytime.`
      );

      setTimeout(() => {
        setDraftSavedSuccess(false);
      }, 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving listing draft';
      setErrorMessage(message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Final Submit / Proceed to Payment
  const handleProceedToPayment = async () => {
    if (!termsAccepted) {
      setErrorMessage('You must accept the listing terms and publishing declaration.');
      return;
    }

    // (Human verification is done at page entry — no re-check needed here)

    if (!Number.isFinite(landAreaYards) || landAreaYards < 1) {
      setErrorMessage('Please enter a valid land area (minimum 1 sq. yard).');
      setCurrentStep(1);
      return;
    }

    if (landAreaYards > 100000000) {
      setErrorMessage(
        'Land area exceeds maximum allowable limit (10 crore sq. yards / approx. 20,660 acres). Please verify your entered value and unit.'
      );
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = constructPropertyPayload();

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
          setErrorMessage('Phone verification is required before listing. Please verify your phone number.');
        } else if (data.code === 'TURNSTILE_REQUIRED') {
          setErrorMessage(data.error || 'Security verification required to list property.');
        } else {
          const detailMsg = Array.isArray(data.details)
            ? data.details.map((d: { path?: (string | number)[]; message?: string }) => `${d.path?.join('.') || 'field'}: ${d.message || 'invalid'}`).join('; ')
            : '';
          throw new Error(data.error || detailMsg || 'Failed to submit listing draft');
        }
        setIsSubmitting(false);
        return;
      }

      const savedProperty =
        data.property ||
        (existingPropertyId ? { ...payload, _id: existingPropertyId } : null);

      if (savedProperty?._id) {
        setExistingPropertyId(savedProperty._id);
        if (savedProperty.paymentStatus) {
          setExistingPaymentStatus(savedProperty.paymentStatus);
        }

        setTimeout(() => {
          try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('edit', savedProperty._id);
            newUrl.searchParams.set('step', '7');
            window.history.replaceState(null, '', newUrl.toString());
          } catch {}
        }, 0);
      }

      try {
        localStorage.removeItem('landterra_sell_form_draft');
        localStorage.removeItem('bhoomimitra_sell_draft');
      } catch {}

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
      const message = error instanceof Error ? error.message : 'Error submitting listing';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    router.push('/dashboard/seller');
  };

  return {
    state: {
      currentStep,
      errorMessage,
      isSubmitting,
      isSavingDraft,
      draftSaveSuccess: draftSavedSuccess,
      draftSavedMessage,
      draftSavedTime,
      currentUser,
      authModalOpen,
      paymentModalOpen,
      createdProperty,
      progressPercent,
      existingPropertyId,
      existingPaymentStatus,
      isUpdateSuccess,
      pageLoading,
      requireGoogleLogin,
      requirePhoneOtp,
      listingFeeAmount,
      listingDurationDays,
      phoneInput,
      otpSent,
      otpCode,
      otpLoading,
      otpMessage,
      testOtpNotice,
      title,
      description,
      landType,
      sellerCategoryTab,
      areaInput: landAreaInput,
      selectedAreaUnit: landAreaUnit,
      pricePerYard,
      priceNegotiable,
      areaConversions,
      authoritativeFees,
      bhk,
      floorNumber,
      totalFloors,
      furnishingStatus,
      bathrooms,
      balconies,
      carpetAreaSqFt,
      superBuiltUpAreaSqFt,
      parkingSlots,
      facing,
      plotLengthFt,
      plotWidthFt,
      boundaryWall,
      cornerPlot,
      gatedCommunity,
      approvals,
      villaType,
      villaFloors,
      vastuCompliant,
      additionalRooms,
      villaPrivateFeatures,
      furnishingDetails,
      possessionStatus,
      ageOfProperty,
      skipOptionalFeatures,
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
      selectedAmenities,
      roadAccess,
      landmarks,
      googleMapsShareLink,
      latitude,
      longitude,
      address,
      city,
      state,
      pincode,
      approximateLocation,
      isResolvingMapLink,
      hasLocatedMap,
      resolvedPlaceName,
      mapLinkResolutionStatus,
      sellerName,
      sellerPhone,
      sellerEmail,
      sellerType,
      sellerAddress,
      governmentRegistrationId,
      images,
      isUploadingImage,
      imageCompressionMessage,
      video,
      isUploadingVideo,
      videoUploadMessage,
      documents,
      isUploadingDoc,
      termsAccepted,
      turnstileToken,
      humanVerified,
    },
    actions: {
      setCurrentStep,
      setErrorMessage,
      setAuthModalOpen,
      setPaymentModalOpen,
      syncStepToUrl,
      handleNext,
      handlePrev,
      validateCurrentStep,
      setDraftSavedMessage,
      setPhoneInput,
      setOtpCode,
      setOtpSent,
      handleSendOtp,
      handleVerifyOtp,
      setTitle,
      setDescription,
      setLandType,
      setSellerCategoryTab,
      setAreaInput: handleAreaInputChange,
      setSelectedAreaUnit: handleAreaUnitChange,
      setPricePerYard,
      setPriceNegotiable,
      toggleItem,
      setBhk,
      setFloorNumber,
      setTotalFloors,
      setFurnishingStatus,
      setBathrooms,
      setBalconies,
      setCarpetAreaSqFt,
      setSuperBuiltUpAreaSqFt,
      setParkingSlots,
      setFacing,
      setPlotLengthFt,
      setPlotWidthFt,
      setBoundaryWall,
      setCornerPlot,
      setGatedCommunity,
      setApprovals,
      setVillaType,
      setVillaFloors,
      setVastuCompliant,
      setAdditionalRooms,
      setVillaPrivateFeatures,
      setFurnishingDetails,
      setPossessionStatus,
      setAgeOfProperty,
      setSkipOptionalFeatures,
      setCommercialFitout,
      setCommercialWashrooms,
      setPowerLoadKva,
      setSuitableBusinesses,
      setSoilType,
      setWaterSources,
      setElectricityPhase,
      setFarmFencing,
      setPlantations,
      setTotalRooms,
      setEventLawnCapacity,
      setHospitalityFeatures,
      setMonthlyRent,
      setSecurityDepositMonths,
      setLeaseLockInPeriod,
      setMaintenanceCharges,
      setSelectedAmenities,
      setRoadAccess,
      setLandmarks,
      setGoogleMapsShareLink,
      setLatitude,
      setLongitude,
      setAddress,
      setCity,
      setState,
      setPincode,
      setApproximateLocation,
      handleResolveMapLink,
      setSellerName,
      setSellerPhone,
      setSellerEmail,
      setSellerType,
      setSellerAddress,
      setGovernmentRegistrationId,
      handleImageUpload,
      handleRemoveImage,
      handleSetPrimaryImage,
      handleVideoUpload,
      handleRemoveVideo,
      handleDocumentUpload,
      handleRemoveDocument,
      setTermsAccepted,
      setTurnstileToken,
      setHumanVerified,
      handleSaveDraft,
      handleProceedToPayment,
      handlePaymentSuccess,
    },
  };
}
