# Face Check Bite

**Know your skin. Pick what fits.**

A mobile-first, rule-based skincare recommendation and starter-kit web application built for men and women in India (18–35).

## Features Included (v1 MVP)
- **Skin Fit Test**: 9-step mobile-first quiz with privacy consent gate, visual skin tone & undertone swatches, concern selection, allergy exclusions, lifestyle/environment inputs, current routine level, and budget range (`₹500–800`, `₹800–1,200`, `₹1,200+`).
- **Skin Profile & Instagram Share Card**: Plain-language summary card with downloadable `1080×1350` PNG image for Instagram Stories.
- **Transparent Rule-Based Engine**: Recommends a Cleanser, Moisturizer, Sunscreen, and Optional Serum—plus a budget-friendly swap per slot and the **₹799 3-Step Starter Kit**.
- **Routine Guide & Catalogue**: Morning (AM) and Night (PM) step-by-step routine, 14-item filterable catalogue, and Product Detail modal with Ingredient Transparency.
- **Cart, Checkout & Pre-Launch Validation**: UPI (demo), COD, and Express Purchase Interest checkout, post-recommendation validation survey, UTM/QR campaign tracking, referral codes (`₹50 off`), and password-protected Admin Dashboard (`facecheck2026`) with CSV export.

## How to Edit Recommendation Rules
Edit `src/data/recommendationRules.json`:
- **`skinTypeRules`**: Update `preferredCleanserIds`, `preferredMoisturizerIds`, `preferredSunscreenIds`, and `explanation` for `oily`, `dry`, `combination`, `normal`, or `sensitive`.
- **`concernSerumRules`**: Map concerns (`acne`, `oiliness`, `pigmentation`, `dullness`, `dryness`, `sensitivity`) to ordered `preferredSerumIds` and `reason` text.
- **`starterKitConfig`**: Adjust `introPriceInr` (default `799`), `estimatedVariableCostInr` (`450`), or `referralDiscountInr` (`50`).
- **`toneSwatches`**: Update hex codes for `fair`, `medium`, `tan`, and `deep` skin tones across `warm`, `cool`, and `neutral` undertones.

The matching logic lives in `src/lib/recommendationEngine.ts` (deterministic scoring + allergy filtering—no AI diagnosis in v1).

## How to Add or Edit Products
1. Open `src/data/products.json` and add a new object following the existing schema (`id`, `slug`, `name`, `category`, `priceInr`, `mrpInr`, `budgetTier`, `genderFocus`, `skinTypes`, `concerns`, `keyIngredients`, `avoidIfAllergicTo`, `howToUseAM`, `howToUsePM`, `whyItSuits`, `ingredientTransparency`, `imageUrl`, `sizeLabel`, `inStock`, and optional `budgetAlternativeId`).
2. To sync the updated catalogue to Firestore, open **Admin** (`passcode: facecheck2026`), sign in with your authorized Google Admin account, and click **Sync 14 Products to DB**.

## Firestore & Security
- Schema blueprint: `firebase-blueprint.json`
- Security rules: `firestore.rules` (validated with `@firebase/eslint-plugin-security-rules`)
- Review `firestore.rules` before broader public rollout to ensure admin email allowlists and collection rules match your production requirements.
