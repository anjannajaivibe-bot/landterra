import { LandType, IProperty } from '@/types/property';
import { SellerType, IUser } from '@/types/user';

export interface UploadedImagePreview {
  secureUrl: string;
  isPrimary: boolean;
  objectKey: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface UploadedDocPreview {
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

export interface UploadedVideoPreview {
  secureUrl: string;
  objectKey: string;
  fileName: string;
  size: number;
  mimeType: string;
  originalSize?: number;
  compressionRatio?: number;
}

export type LandAreaUnit =
  | 'SQUARE_YARDS'
  | 'SQUARE_FEET'
  | 'GUNTAS'
  | 'CENTS'
  | 'ACRES'
  | 'HECTARES';

export interface AreaConversions {
  sqYards: number;
  sqFeet: number;
  guntas: number;
  cents: number;
  acres: number;
  hectares: number;
}

export interface AuthoritativeFees {
  landAreaYards: number;
  pricePerYard: number;
  totalPrice: number;
  monthlyListingFee: number;
  publishingFee: number;
}

export interface SellFormState {
  // Navigation & Control
  currentStep: number;
  errorMessage: string;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  draftSaveSuccess: boolean;
  draftSavedMessage: string | null;
  draftSavedTime: string | null;
  currentUser: Partial<IUser> | null;
  authModalOpen: boolean;
  paymentModalOpen: boolean;
  createdProperty: IProperty | null;
  progressPercent: number;
  existingPropertyId: string | null;
  existingPaymentStatus: string | null;
  isUpdateSuccess: boolean;
  pageLoading: boolean;

  // Settings
  requireGoogleLogin: boolean;
  requirePhoneOtp: boolean;
  listingFeeAmount: number;
  listingDurationDays: number;

  // Phone OTP
  phoneInput: string;
  otpSent: boolean;
  otpCode: string;
  otpLoading: boolean;
  otpMessage: {
    type: 'success' | 'error';
    text: string;
  } | null;
  testOtpNotice: string | null;

  // Step 1: Specifications & Pricing
  title: string;
  description: string;
  landType: LandType;
  sellerCategoryTab: string;
  areaInput: string;
  selectedAreaUnit: LandAreaUnit;
  pricePerYard: string;
  priceNegotiable: boolean;
  areaConversions: AreaConversions;
  authoritativeFees: AuthoritativeFees;

  // Step 1 Attributes: Residential (Flats & Apartments)
  bhk: string;
  floorNumber: string;
  totalFloors: string;
  furnishingStatus: string;
  bathrooms: number;
  balconies: number;
  carpetAreaSqFt: string;
  superBuiltUpAreaSqFt: string;
  parkingSlots: string;

  // Step 1 Attributes: Facing, Dimensions & Boundaries (Plots & Villas)
  facing: string;
  plotLengthFt: string;
  plotWidthFt: string;
  boundaryWall: string;
  cornerPlot: boolean;
  gatedCommunity: boolean;
  approvals: string[];

  // Step 1 Attributes: Villa Specifics
  villaType: string;
  villaFloors: string;
  vastuCompliant: boolean;
  additionalRooms: string[];
  villaPrivateFeatures: string[];
  furnishingDetails: string[];
  possessionStatus: string;
  ageOfProperty: string;
  skipOptionalFeatures: boolean;

  // Step 1 Attributes: Commercial Specifics
  commercialFitout: string;
  commercialWashrooms: string;
  powerLoadKva: string;
  suitableBusinesses: string[];

  // Step 1 Attributes: Farmland Specifics
  soilType: string;
  waterSources: string[];
  electricityPhase: string;
  farmFencing: string;
  plantations: string;

  // Step 1 Attributes: Hospitality & Leisure
  totalRooms: string;
  eventLawnCapacity: string;
  hospitalityFeatures: string[];

  // Step 1 Attributes: Rentals
  monthlyRent: string;
  securityDepositMonths: string;
  leaseLockInPeriod: string;
  maintenanceCharges: string;

  // Step 1 Attributes: Amenities & Road Access
  selectedAmenities: string[];
  roadAccess: string;
  landmarks: string;

  // Step 2: Location & Map
  googleMapsShareLink: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  approximateLocation: boolean;
  isResolvingMapLink: boolean;
  hasLocatedMap: boolean;
  resolvedPlaceName: string;
  mapLinkResolutionStatus: {
    type: 'success' | 'error';
    message: string;
  } | null;

  // Step 3: Landowner / Seller Details
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerType: SellerType;
  sellerAddress: string;

  // Step 4: Government Records
  governmentRegistrationId: string;

  // Step 5: Media Uploads
  images: UploadedImagePreview[];
  isUploadingImage: boolean;
  imageCompressionMessage: string;
  video: UploadedVideoPreview | null;
  isUploadingVideo: boolean;
  videoUploadMessage: string;

  // Step 6: Verification Documents
  documents: UploadedDocPreview[];
  isUploadingDoc: boolean;

  // Step 7: Terms & Payment
  termsAccepted: boolean;
}

export interface SellFormActions {
  setCurrentStep: (step: number) => void;
  setErrorMessage: (msg: string) => void;
  setAuthModalOpen: (open: boolean) => void;
  setPaymentModalOpen: (open: boolean) => void;
  syncStepToUrl: (step: number) => void;
  handleNext: () => void;
  handlePrev: () => void;
  validateCurrentStep: (step: number) => boolean;
  setDraftSavedMessage: (msg: string | null) => void;

  // Phone OTP
  setPhoneInput: (val: string) => void;
  setOtpCode: (val: string) => void;
  setOtpSent: (val: boolean) => void;
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;

  // Step 1 Setters
  setTitle: (val: string) => void;
  setDescription: (val: string) => void;
  setLandType: (val: LandType) => void;
  setSellerCategoryTab: (val: string) => void;
  setAreaInput: (val: string) => void;
  setSelectedAreaUnit: (val: LandAreaUnit) => void;
  setPricePerYard: (val: string) => void;
  setPriceNegotiable: (val: boolean) => void;
  toggleItem: (list: string[], item: string, setter: (val: string[]) => void) => void;

  // Residential Setters
  setBhk: (val: string) => void;
  setFloorNumber: (val: string) => void;
  setTotalFloors: (val: string) => void;
  setFurnishingStatus: (val: string) => void;
  setBathrooms: (val: number) => void;
  setBalconies: (val: number) => void;
  setCarpetAreaSqFt: (val: string) => void;
  setSuperBuiltUpAreaSqFt: (val: string) => void;
  setParkingSlots: (val: string) => void;

  // Plot & Boundary Setters
  setFacing: (val: string) => void;
  setPlotLengthFt: (val: string) => void;
  setPlotWidthFt: (val: string) => void;
  setBoundaryWall: (val: string) => void;
  setCornerPlot: (val: boolean) => void;
  setGatedCommunity: (val: boolean) => void;
  setApprovals: (val: string[] | ((prev: string[]) => string[])) => void;

  // Villa Setters
  setVillaType: (val: string) => void;
  setVillaFloors: (val: string) => void;
  setVastuCompliant: (val: boolean) => void;
  setAdditionalRooms: (val: string[] | ((prev: string[]) => string[])) => void;
  setVillaPrivateFeatures: (val: string[] | ((prev: string[]) => string[])) => void;
  setFurnishingDetails: (val: string[] | ((prev: string[]) => string[])) => void;
  setPossessionStatus: (val: string) => void;
  setAgeOfProperty: (val: string) => void;
  setSkipOptionalFeatures: (val: boolean) => void;

  // Commercial Setters
  setCommercialFitout: (val: string) => void;
  setCommercialWashrooms: (val: string) => void;
  setPowerLoadKva: (val: string) => void;
  setSuitableBusinesses: (val: string[] | ((prev: string[]) => string[])) => void;

  // Farmland Setters
  setSoilType: (val: string) => void;
  setWaterSources: (val: string[] | ((prev: string[]) => string[])) => void;
  setElectricityPhase: (val: string) => void;
  setFarmFencing: (val: string) => void;
  setPlantations: (val: string) => void;

  // Hospitality Setters
  setTotalRooms: (val: string) => void;
  setEventLawnCapacity: (val: string) => void;
  setHospitalityFeatures: (val: string[] | ((prev: string[]) => string[])) => void;

  // Rental Setters
  setMonthlyRent: (val: string) => void;
  setSecurityDepositMonths: (val: string) => void;
  setLeaseLockInPeriod: (val: string) => void;
  setMaintenanceCharges: (val: string) => void;

  // Amenities & Road Setters
  setSelectedAmenities: (val: string[] | ((prev: string[]) => string[])) => void;
  setRoadAccess: (val: string) => void;
  setLandmarks: (val: string) => void;

  // Location Setters & Actions
  setGoogleMapsShareLink: (val: string) => void;
  setLatitude: (val: number) => void;
  setLongitude: (val: number) => void;
  setAddress: (val: string) => void;
  setCity: (val: string) => void;
  setState: (val: string) => void;
  setPincode: (val: string) => void;
  setApproximateLocation: (val: boolean) => void;
  handleResolveMapLink: (customUrl?: string) => Promise<void>;

  // Seller Contact Setters
  setSellerName: (val: string) => void;
  setSellerPhone: (val: string) => void;
  setSellerEmail: (val: string) => void;
  setSellerType: (val: SellerType) => void;
  setSellerAddress: (val: string) => void;

  // Government Records Setters
  setGovernmentRegistrationId: (val: string) => void;

  // Media Handlers
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveImage: (index: number) => void;
  handleSetPrimaryImage: (index: number) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveVideo: () => void;

  // Document Handlers
  handleDocumentUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: UploadedDocPreview['documentType']
  ) => Promise<void>;
  handleRemoveDocument: (index: number) => void;

  // Step 7 Handlers
  setTermsAccepted: (val: boolean) => void;
  handleSaveDraft: () => Promise<void>;
  handleProceedToPayment: () => Promise<void>;
  handlePaymentSuccess: () => void;
}

export interface UseSellFormReturn {
  state: SellFormState;
  actions: SellFormActions;
}
