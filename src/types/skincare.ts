export type AppView = 'landing' | 'quiz' | 'results' | 'catalogue' | 'campaign' | 'admin';

export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
export type SkinTone = 'fair' | 'medium' | 'tan' | 'deep';
export type Undertone = 'warm' | 'cool' | 'neutral';
export type SkinConcern = 'acne' | 'pigmentation' | 'dryness' | 'dullness' | 'oiliness' | 'sensitivity';
export type AllergyFlag =
  | 'fragrance'
  | 'salicylic_acid'
  | 'niacinamide'
  | 'vitamin_c'
  | 'essential_oils'
  | 'alcohol'
  | 'none';
export type RoutineLevel = 'none' | 'basic' | 'advanced';
export type BudgetRange = '500-800' | '800-1200' | '1200+';
export type ProductCategory = 'cleanser' | 'moisturizer' | 'sunscreen' | 'serum' | 'kit';
export type BudgetTier = 'budget' | 'mid' | 'premium';
export type GenderFocus = 'unisex' | 'men' | 'women';

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  priceInr: number;
  mrpInr: number;
  isStarterKit: boolean;
  budgetTier: BudgetTier;
  genderFocus: GenderFocus;
  skinTypes: SkinType[];
  concerns: SkinConcern[];
  keyIngredients: string[];
  avoidIfAllergicTo: AllergyFlag[];
  howToUseAM: string;
  howToUsePM: string;
  whyItSuits: string;
  ingredientTransparency: string;
  imageUrl: string;
  sizeLabel: string;
  inStock: boolean;
  budgetAlternativeId?: string;
}

export interface QuizAnswers {
  gender: 'Male' | 'Female' | 'Prefer not to say';
  ageRange: string;
  skinType: SkinType;
  skinTone: SkinTone;
  undertone: Undertone;
  concerns: SkinConcern[];
  allergies: AllergyFlag[];
  customAllergyNote: string;
  sunExposure: string;
  pollutionExposure: string;
  sleepHours: string;
  waterIntake: string;
  screenTime: string;
  currentRoutine: RoutineLevel;
  budgetRange: BudgetRange;
  consentAccepted: boolean;
}

export interface RoutineStep {
  stepNumber: number;
  slot: 'Cleanser' | 'Treatment Serum' | 'Moisturizer' | 'Sunscreen';
  productName: string;
  productId: string;
  instruction: string;
  frequency: string;
}

export interface RecommendedSlot {
  slot: 'Cleanser' | 'Moisturizer' | 'Sunscreen' | 'Serum (Optional)';
  product: Product;
  whyItSuitsYou: string;
  budgetAlternative: Product | null;
  allergyNote?: string;
}

export interface SkinProfile {
  headline: string;
  skinTypeLabel: string;
  toneLabel: string;
  undertoneLabel: string;
  swatchHex: string;
  topConcerns: string[];
  plainLanguageExplanation: string;
  lifestyleNote: string;
  patchTestRequired: boolean;
  referralCode: string;
}

export interface RecommendationResult {
  responseId: string;
  answers: QuizAnswers;
  profile: SkinProfile;
  recommendations: RecommendedSlot[];
  starterKit: {
    kitProduct: Product;
    includedItems: Product[];
    introPriceInr: number;
    individualTotalInr: number;
    savingsInr: number;
  };
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  totalRecommendedPriceInr: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isStarterKitBundle?: boolean;
  bundleSummary?: string;
}

export interface CampaignContext {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referralCode: string;
  sessionId: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  quizResponseId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: 'upi' | 'cod' | 'prelaunch_interest';
  orderType: 'order' | 'interest';
  itemSummaries: string[];
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  referralCodeUsed: string;
  utmSource: string;
  status: 'confirmed' | 'interest_recorded' | 'dispatched';
  createdAtIso: string;
}

export interface FeedbackRecord {
  id: string;
  quizResponseId: string;
  relevanceScore: number;
  wouldTry: 'Yes' | 'Maybe' | 'No';
  willingnessToPayInr: number;
  comment: string;
  utmSource: string;
  createdAtIso: string;
}

export interface QuizSubmissionRecord {
  id: string;
  responseId: string;
  gender: string;
  ageRange: string;
  skinType: SkinType;
  skinTone: SkinTone;
  undertone: Undertone;
  concerns: SkinConcern[];
  allergies: AllergyFlag[];
  budgetRange: BudgetRange;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referralCode: string;
  recommendedProductIds: string[];
  createdAtIso: string;
}

export interface AnalyticsEventRecord {
  id: string;
  eventName:
    | 'page_view'
    | 'quiz_started'
    | 'quiz_step'
    | 'quiz_completed'
    | 'kit_added'
    | 'checkout_started'
    | 'order_placed'
    | 'interest_expressed'
    | 'feedback_submitted'
    | 'profile_shared';
  sessionId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referralCode: string;
  stepNumber: number;
  createdAtIso: string;
}
