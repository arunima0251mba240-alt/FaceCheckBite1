import productsData from '@/src/data/products.json';
import rulesData from '@/src/data/recommendationRules.json';
import type {
  AllergyFlag,
  BudgetRange,
  Product,
  QuizAnswers,
  RecommendationResult,
  RecommendedSlot,
  RoutineStep,
  SkinConcern,
  SkinType,
} from '@/src/types/skincare';

export const DEFAULT_PRODUCTS: Product[] = productsData as Product[];

const CONCERN_LABELS: Record<SkinConcern, string> = {
  acne: 'Acne & Breakouts',
  pigmentation: 'Pigmentation & Marks',
  dryness: 'Dryness',
  dullness: 'Dullness',
  oiliness: 'Excess Oil',
  sensitivity: 'Sensitivity',
};

function isSafeForAllergies(product: Product, allergies: AllergyFlag[]): boolean {
  const activeAllergies = allergies.filter((a) => a !== 'none');
  if (activeAllergies.length === 0) return true;
  return !(product.avoidIfAllergicTo as string[]).some((flag) =>
    (activeAllergies as string[]).includes(flag)
  );
}

function matchesBudgetPreference(product: Product, budgetRange: BudgetRange): number {
  if (budgetRange === '500-800') {
    return product.budgetTier === 'budget' ? 3 : product.budgetTier === 'mid' ? 1 : 0;
  }
  if (budgetRange === '800-1200') {
    return product.budgetTier === 'mid' ? 3 : product.budgetTier === 'budget' ? 2 : 1;
  }
  return product.budgetTier === 'premium' ? 3 : product.budgetTier === 'mid' ? 2 : 1;
}

function pickBestProduct(
  candidateIds: string[],
  category: Product['category'],
  answers: QuizAnswers,
  catalog: Product[]
): Product {
  const safePool = catalog.filter(
    (p) => p.category === category && p.inStock && isSafeForAllergies(p, answers.allergies)
  );
  const pool = safePool.length > 0 ? safePool : catalog.filter((p) => p.category === category);

  const scored = pool.map((p) => {
    let score = 0;
    const ruleIndex = candidateIds.indexOf(p.id);
    if (ruleIndex !== -1) {
      score += (candidateIds.length - ruleIndex) * 4;
    }
    if (p.skinTypes.includes(answers.skinType)) score += 3;
    const concernOverlap = p.concerns.filter((c) => answers.concerns.includes(c)).length;
    score += concernOverlap * 2;
    score += matchesBudgetPreference(p, answers.budgetRange);

    if (answers.gender === 'Male' && p.genderFocus === 'men') score += 2;
    if (answers.gender === 'Female' && p.genderFocus === 'women') score += 1;
    if (p.genderFocus === 'unisex') score += 1;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].product;
}

function findBudgetAlternative(
  chosen: Product,
  answers: QuizAnswers,
  catalog: Product[]
): Product | null {
  if (chosen.budgetAlternativeId) {
    const linked = catalog.find(
      (p) => p.id === chosen.budgetAlternativeId && isSafeForAllergies(p, answers.allergies)
    );
    if (linked && linked.id !== chosen.id && linked.priceInr < chosen.priceInr) {
      return linked;
    }
  }

  const cheaper = catalog
    .filter(
      (p) =>
        p.category === chosen.category &&
        p.id !== chosen.id &&
        p.priceInr < chosen.priceInr &&
        isSafeForAllergies(p, answers.allergies)
    )
    .sort((a, b) => a.priceInr - b.priceInr);

  return cheaper[0] ?? null;
}

function buildLifestyleNote(answers: QuizAnswers): string {
  const notes: string[] = [];
  if (answers.sunExposure === 'High (2+ hrs outdoors)') {
    notes.push('High UV exposure: reapply two finger-lengths of SPF 50 every 3–4 hours.');
  }
  if (answers.pollutionExposure === 'High (Commute / Metro / City dust)') {
    notes.push('Urban dust & commute: never skip your 45-second evening cleanse to lift PM2.5 grime.');
  }
  if (answers.sleepHours === 'Under 6 hours' || answers.waterIntake === 'Under 1.5L') {
    notes.push('Low sleep or hydration: barrier moisturizers at night help offset overnight water loss.');
  }
  if (answers.screenTime === '8+ hours daily') {
    notes.push('Heavy screen time: consistent morning antioxidants and daily sunscreen protect against visible-light dullness.');
  }
  if (notes.length === 0) {
    notes.push('Balanced daily habits: keep your routine steady for 4–6 weeks before adding extra actives.');
  }
  return notes.slice(0, 2).join(' ');
}

function buildReferralCode(skinType: SkinType): string {
  const prefix = skinType.slice(0, 3).toUpperCase();
  const suffix = Math.floor(10 + Math.random() * 89);
  return `FCB-${prefix}${suffix}`;
}

export function generateRecommendations(
  answers: QuizAnswers,
  responseId: string,
  catalog: Product[] = DEFAULT_PRODUCTS
): RecommendationResult {
  const skinRule = rulesData.skinTypeRules[answers.skinType];
  const primaryConcern: SkinConcern = answers.concerns[0] ?? 'dullness';
  const concernRule = rulesData.concernSerumRules[primaryConcern];

  const cleanser = pickBestProduct(skinRule.preferredCleanserIds, 'cleanser', answers, catalog);
  const moisturizer = pickBestProduct(skinRule.preferredMoisturizerIds, 'moisturizer', answers, catalog);
  const sunscreen = pickBestProduct(skinRule.preferredSunscreenIds, 'sunscreen', answers, catalog);
  const serum = pickBestProduct(concernRule.preferredSerumIds, 'serum', answers, catalog);

  const activeAllergies = answers.allergies.filter((a) => a !== 'none');
  const allergyDisclaimer =
    activeAllergies.length > 0
      ? `Filtered to avoid: ${activeAllergies.map((a) => a.replace('_', ' ')).join(', ')}.`
      : undefined;

  const recommendations: RecommendedSlot[] = [
    {
      slot: 'Cleanser',
      product: cleanser,
      whyItSuitsYou: `${cleanser.whyItSuits} Matched for ${skinRule.label.toLowerCase()}.`,
      budgetAlternative: findBudgetAlternative(cleanser, answers, catalog),
      allergyNote: allergyDisclaimer,
    },
    {
      slot: 'Moisturizer',
      product: moisturizer,
      whyItSuitsYou: `${moisturizer.whyItSuits} Keeps your barrier steady in your ${answers.budgetRange === '500-800' ? 'budget-first' : 'daily'} routine.`,
      budgetAlternative: findBudgetAlternative(moisturizer, answers, catalog),
      allergyNote: allergyDisclaimer,
    },
    {
      slot: 'Sunscreen',
      product: sunscreen,
      whyItSuitsYou: `${sunscreen.whyItSuits} Zero white cast calibrated for ${answers.skinTone} skin with ${answers.undertone} undertone.`,
      budgetAlternative: findBudgetAlternative(sunscreen, answers, catalog),
      allergyNote: allergyDisclaimer,
    },
    {
      slot: 'Serum (Optional)',
      product: serum,
      whyItSuitsYou: `${concernRule.reason} ${serum.whyItSuits}`,
      budgetAlternative: findBudgetAlternative(serum, answers, catalog),
      allergyNote: allergyDisclaimer,
    },
  ];

  const coreThree = [cleanser, moisturizer, sunscreen];
  const individualTotalInr = coreThree.reduce((sum, p) => sum + p.priceInr, 0);
  const starterKitProduct =
    catalog.find((p) => p.id === rulesData.starterKitConfig.kitId) ??
    catalog.find((p) => p.isStarterKit) ??
    catalog[catalog.length - 1];

  const introPriceInr = rulesData.starterKitConfig.introPriceInr;
  const savingsInr = Math.max(0, individualTotalInr - introPriceInr);

  const includeSerumInRoutine =
    answers.currentRoutine !== 'none' || answers.budgetRange !== '500-800';

  const amRoutine: RoutineStep[] = [
    {
      stepNumber: 1,
      slot: 'Cleanser',
      productName: cleanser.name,
      productId: cleanser.id,
      instruction: cleanser.howToUseAM,
      frequency: 'Every morning',
    },
    ...(includeSerumInRoutine
      ? [
          {
            stepNumber: 2,
            slot: 'Treatment Serum' as const,
            productName: serum.name,
            productId: serum.id,
            instruction: serum.howToUseAM,
            frequency: answers.skinType === 'sensitive' ? '3–4 mornings / week' : 'Every morning',
          },
        ]
      : []),
    {
      stepNumber: includeSerumInRoutine ? 3 : 2,
      slot: 'Moisturizer',
      productName: moisturizer.name,
      productId: moisturizer.id,
      instruction: moisturizer.howToUseAM,
      frequency: 'Every morning',
    },
    {
      stepNumber: includeSerumInRoutine ? 4 : 3,
      slot: 'Sunscreen',
      productName: sunscreen.name,
      productId: sunscreen.id,
      instruction: sunscreen.howToUseAM,
      frequency: 'Daily · Reapply outdoors',
    },
  ];

  const pmRoutine: RoutineStep[] = [
    {
      stepNumber: 1,
      slot: 'Cleanser',
      productName: cleanser.name,
      productId: cleanser.id,
      instruction: cleanser.howToUsePM,
      frequency: 'Every night',
    },
    ...(includeSerumInRoutine
      ? [
          {
            stepNumber: 2,
            slot: 'Treatment Serum' as const,
            productName: serum.name,
            productId: serum.id,
            instruction: serum.howToUsePM,
            frequency: answers.skinType === 'sensitive' ? 'Alternate nights' : 'Nightly',
          },
        ]
      : []),
    {
      stepNumber: includeSerumInRoutine ? 3 : 2,
      slot: 'Moisturizer',
      productName: moisturizer.name,
      productId: moisturizer.id,
      instruction: moisturizer.howToUsePM,
      frequency: 'Every night',
    },
  ];

  const toneSwatchMap = rulesData.toneSwatches[answers.skinTone];
  const swatchHex = toneSwatchMap[answers.undertone];
  const concernPool: SkinConcern[] =
    answers.concerns.length > 0 ? answers.concerns : ['dullness'];
  const topConcernLabels = concernPool.slice(0, 3).map((c) => CONCERN_LABELS[c]);

  const patchTestRequired =
    answers.skinType === 'sensitive' ||
    answers.concerns.includes('sensitivity') ||
    activeAllergies.length > 0 ||
    answers.customAllergyNote.trim().length > 0;

  return {
    responseId,
    answers,
    profile: {
      headline: `${skinRule.label} · ${topConcernLabels[0] ?? 'Daily Balance'}`,
      skinTypeLabel: skinRule.label,
      toneLabel: toneSwatchMap.label,
      undertoneLabel: `${answers.undertone.charAt(0).toUpperCase()}${answers.undertone.slice(1)} Undertone`,
      swatchHex,
      topConcerns: topConcernLabels,
      plainLanguageExplanation: skinRule.explanation,
      lifestyleNote: buildLifestyleNote(answers),
      patchTestRequired,
      referralCode: buildReferralCode(answers.skinType),
    },
    recommendations,
    starterKit: {
      kitProduct: starterKitProduct,
      includedItems: coreThree,
      introPriceInr,
      individualTotalInr,
      savingsInr,
    },
    amRoutine,
    pmRoutine,
    totalRecommendedPriceInr: recommendations.reduce((sum, r) => sum + r.product.priceInr, 0),
  };
}
