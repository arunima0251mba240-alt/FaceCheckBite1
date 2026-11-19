import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Shield } from 'lucide-react';
import rulesData from '@/src/data/recommendationRules.json';
import type {
  AllergyFlag,
  BudgetRange,
  QuizAnswers,
  RoutineLevel,
  SkinConcern,
  SkinTone,
  SkinType,
  Undertone,
} from '@/src/types/skincare';

interface SkinFitQuizProps {
  onStepChange: (stepNumber: number) => void;
  onComplete: (answers: QuizAnswers) => Promise<void>;
  onCancel: () => void;
}

const TOTAL_STEPS = 10; // Step 0: Privacy Consent, Steps 1..9: Quiz Questions

const SKIN_TYPE_OPTIONS: { value: SkinType; title: string; desc: string }[] = [
  { value: 'oily', title: 'Oily', desc: 'Shiny T-zone or full face within 2–3 hours of washing.' },
  { value: 'dry', title: 'Dry', desc: 'Feels tight, flaky, or dull after cleansing or in AC.' },
  { value: 'combination', title: 'Combination', desc: 'Oily forehead/nose with normal or dry cheeks.' },
  { value: 'normal', title: 'Normal', desc: 'Rarely greasy or flaky; generally balanced.' },
  { value: 'sensitive', title: 'Sensitive', desc: 'Easily stings, flushes red, or breaks out with new products.' },
];

const CONCERN_OPTIONS: { value: SkinConcern; label: string; hint: string }[] = [
  { value: 'acne', label: 'Acne & Breakouts', hint: 'Pimples, whiteheads, or clogged pores' },
  { value: 'pigmentation', label: 'Pigmentation & Marks', hint: 'Post-acne spots, uneven patches, or tan' },
  { value: 'oiliness', label: 'Excess Oil & Shine', hint: 'Midday grease or enlarged pores' },
  { value: 'dryness', label: 'Dryness & Flaking', hint: 'Tightness or rough texture' },
  { value: 'dullness', label: 'Dullness', hint: 'Tired tone from dust, sun, or screens' },
  { value: 'sensitivity', label: 'Sensitivity & Redness', hint: 'Irritation or reactive barrier' },
];

const ALLERGY_OPTIONS: { value: AllergyFlag; label: string }[] = [
  { value: 'none', label: 'No known allergies' },
  { value: 'fragrance', label: 'Added Fragrance / Perfume' },
  { value: 'salicylic_acid', label: 'Salicylic Acid (BHA)' },
  { value: 'niacinamide', label: 'Niacinamide (Vitamin B3)' },
  { value: 'vitamin_c', label: 'Vitamin C (Ascorbic Acid)' },
  { value: 'essential_oils', label: 'Essential Oils (Tea tree, citrus)' },
  { value: 'alcohol', label: 'Drying Alcohols' },
];

export function SkinFitQuiz({ onStepChange, onComplete, onCancel }: SkinFitQuizProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState<QuizAnswers>({
    gender: 'Prefer not to say',
    ageRange: '18–25',
    skinType: 'oily',
    skinTone: 'medium',
    undertone: 'warm',
    concerns: ['acne'],
    allergies: ['none'],
    customAllergyNote: '',
    sunExposure: 'Moderate (30–90 mins/day)',
    pollutionExposure: 'High (Commute / Metro / City dust)',
    sleepHours: '6–7 hours',
    waterIntake: '1.5–2.5L',
    screenTime: '5–8 hours daily',
    currentRoutine: 'basic',
    budgetRange: '800-1200',
    consentAccepted: false,
  });

  const goNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      const next = step + 1;
      setStep(next);
      onStepChange(next);
    } else {
      setSubmitting(true);
      try {
        await onComplete(answers);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const goBack = () => {
    if (step === 0) {
      onCancel();
    } else {
      setStep((s) => s - 1);
    }
  };

  const toggleConcern = (concern: SkinConcern) => {
    setAnswers((prev) => {
      const exists = prev.concerns.includes(concern);
      if (exists) {
        const next = prev.concerns.filter((c) => c !== concern);
        return { ...prev, concerns: next.length > 0 ? next : [concern] };
      }
      return { ...prev, concerns: [...prev.concerns, concern].slice(0, 4) };
    });
  };

  const toggleAllergy = (flag: AllergyFlag) => {
    setAnswers((prev) => {
      if (flag === 'none') {
        return { ...prev, allergies: ['none'] };
      }
      const withoutNone = prev.allergies.filter((a) => a !== 'none');
      const exists = withoutNone.includes(flag);
      const next = exists ? withoutNone.filter((a) => a !== flag) : [...withoutNone, flag];
      return { ...prev, allergies: next.length > 0 ? next : ['none'] };
    });
  };

  const progressPct = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  const canProceed = step === 0 ? answers.consentAccepted : true;

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Progress Header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-xs text-[#525C54]">
          <span className="font-medium">
            {step === 0 ? 'Privacy & Consent' : `Question ${step} of ${TOTAL_STEPS - 1}`}
          </span>
          <span className="font-mono tabular-nums">{progressPct}% complete</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#E4E8DF] overflow-hidden">
          <div
            className="h-full bg-[#3F624D] transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Single-Question Card */}
      <div className="bg-white border border-[#DDE3D7] rounded-2xl p-6 sm:p-8 space-y-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#3F624D]">
              <Shield className="w-4 h-4" />
              <span>Under 2 minutes · Self-reported check</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C241E]">
              Before we start your Skin Fit Test
            </h1>
            <p className="text-sm sm:text-base text-[#525C54] leading-relaxed">
              We use your answers strictly to match you with transparent, budget-friendly skincare
              products and an AM/PM routine. No photos or medical diagnosis are involved.
            </p>
            <div className="bg-[#F1F3EE] rounded-xl p-4 text-xs sm:text-sm text-[#525C54] space-y-2">
              <p className="font-semibold text-[#1C241E]">Privacy Notice</p>
              <p>
                Your quiz responses are stored securely to generate your Skin Profile and improve
                product matching. We do not sell your personal details.
              </p>
            </div>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-[#DDE3D7] cursor-pointer hover:bg-[#FAF9F5]">
              <input
                type="checkbox"
                checked={answers.consentAccepted}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, consentAccepted: e.target.checked }))
                }
                className="mt-0.5 w-5 h-5 accent-[#3F624D] rounded cursor-pointer"
              />
              <span className="text-sm text-[#1C241E]">
                I agree to share my self-reported skin preferences for personalized recommendations
                and understand this is not dermatological advice.
              </span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              How do you identify?
            </h2>
            <p className="text-sm text-[#525C54]">
              Helps us account for facial hair, shaving irritation, or grooming texture preferences.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {(['Male', 'Female', 'Prefer not to say'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((p) => ({ ...p, gender: option }))}
                  className={`w-full text-left px-5 py-4 rounded-xl border text-base font-medium transition-colors min-h-[52px] flex items-center justify-between ${
                    answers.gender === option
                      ? 'border-[#3F624D] bg-[#F1F3EE] text-[#1C241E]'
                      : 'border-[#DDE3D7] bg-white text-[#1C241E] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <span>{option}</span>
                  {answers.gender === option && <Check className="w-4 h-4 text-[#3F624D]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              What is your age range?
            </h2>
            <p className="text-sm text-[#525C54]">
              Skin oil production and barrier recovery shift naturally across your 20s and 30s.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['18–21', '22–25', '26–30', '31–35', '36–40+'].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setAnswers((p) => ({ ...p, ageRange: age }))}
                  className={`px-5 py-4 rounded-xl border text-left font-medium transition-colors min-h-[52px] flex items-center justify-between ${
                    answers.ageRange === age
                      ? 'border-[#3F624D] bg-[#F1F3EE] text-[#1C241E]'
                      : 'border-[#DDE3D7] bg-white text-[#1C241E] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <span className="font-mono tabular-nums">{age}</span>
                  {answers.ageRange === age && <Check className="w-4 h-4 text-[#3F624D]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              How does your skin feel 2 hours after washing?
            </h2>
            <p className="text-sm text-[#525C54]">
              Pick the option that best describes your bare skin without moisturizer.
            </p>
            <div className="space-y-3">
              {SKIN_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers((p) => ({ ...p, skinType: opt.value }))}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    answers.skinType === opt.value
                      ? 'border-[#3F624D] bg-[#F1F3EE]'
                      : 'border-[#DDE3D7] bg-white hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div>
                    <p className="text-base font-semibold text-[#1C241E]">{opt.title}</p>
                    <p className="text-sm text-[#525C54] mt-0.5">{opt.desc}</p>
                  </div>
                  {answers.skinType === opt.value && (
                    <Check className="w-5 h-5 text-[#3F624D] shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
                Select your skin tone & undertone
              </h2>
              <p className="text-sm text-[#525C54] mt-1">
                Used to recommend zero-white-cast sunscreens and pigment-safe actives.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#525C54]">SKIN TONE</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['fair', 'medium', 'tan', 'deep'] as SkinTone[]).map((tone) => {
                  const swatch = rulesData.toneSwatches[tone];
                  const selected = answers.skinTone === tone;
                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setAnswers((p) => ({ ...p, skinTone: tone }))}
                      className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col items-start gap-2.5 ${
                        selected
                          ? 'border-[#3F624D] bg-[#F1F3EE]'
                          : 'border-[#DDE3D7] bg-white hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <span
                        className="w-9 h-9 rounded-full border border-[#1C241E]/15"
                        style={{ backgroundColor: swatch[answers.undertone] }}
                      />
                      <span className="text-sm font-semibold text-[#1C241E]">{swatch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#525C54]">UNDERTONE</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { value: 'warm', label: 'Warm', desc: 'Golden / olive / yellow hue' },
                    { value: 'neutral', label: 'Neutral', desc: 'Balanced mix of warm & cool' },
                    { value: 'cool', label: 'Cool', desc: 'Pink, red, or bluish veins' },
                  ] as { value: Undertone; label: string; desc: string }[]
                ).map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setAnswers((p) => ({ ...p, undertone: u.value }))}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      answers.undertone === u.value
                        ? 'border-[#3F624D] bg-[#F1F3EE]'
                        : 'border-[#DDE3D7] bg-white hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#1C241E]">{u.label}</p>
                    <p className="text-xs text-[#525C54] mt-0.5">{u.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
                What are your main skin concerns?
              </h2>
              <p className="text-sm text-[#525C54] mt-1">
                Select up to 4 priorities. Your first selection guides your serum match.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONCERN_OPTIONS.map((item) => {
                const selected = answers.concerns.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleConcern(item.value)}
                    className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? 'border-[#3F624D] bg-[#F1F3EE]'
                        : 'border-[#DDE3D7] bg-white hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1C241E]">{item.label}</p>
                      <p className="text-xs text-[#525C54] mt-0.5">{item.hint}</p>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#3F624D] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
                Any known allergies or ingredient sensitivities?
              </h2>
              <p className="text-sm text-[#525C54] mt-1">
                We automatically exclude products containing flagged ingredients.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALLERGY_OPTIONS.map((item) => {
                const selected = answers.allergies.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleAllergy(item.value)}
                    className={`px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-colors flex items-center justify-between ${
                      selected
                        ? 'border-[#3F624D] bg-[#F1F3EE] text-[#1C241E]'
                        : 'border-[#DDE3D7] bg-white text-[#1C241E] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {selected && <Check className="w-4 h-4 text-[#3F624D]" />}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#525C54] mb-1.5">
                Other sensitivity notes (optional)
              </label>
              <input
                type="text"
                maxLength={200}
                value={answers.customAllergyNote}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, customAllergyNote: e.target.value }))
                }
                placeholder="e.g., benzoyl peroxide or menthol stings my cheeks"
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDE3D7] text-sm focus:outline-none focus:border-[#3F624D]"
              />
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
                Your daily environment & lifestyle
              </h2>
              <p className="text-sm text-[#525C54] mt-1">
                Sun, commute dust, sleep, and screen exposure shape how your skin behaves.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1.5">
                  Daily Sun Exposure
                </label>
                <select
                  value={answers.sunExposure}
                  onChange={(e) => setAnswers((p) => ({ ...p, sunExposure: e.target.value }))}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#DDE3D7] bg-white text-sm text-[#1C241E]"
                >
                  <option>Low (Mostly indoors)</option>
                  <option>Moderate (30–90 mins/day)</option>
                  <option>High (2+ hrs outdoors)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1.5">
                  Pollution / Commute Exposure
                </label>
                <select
                  value={answers.pollutionExposure}
                  onChange={(e) =>
                    setAnswers((p) => ({ ...p, pollutionExposure: e.target.value }))
                  }
                  className="w-full px-3.5 py-3 rounded-xl border border-[#DDE3D7] bg-white text-sm text-[#1C241E]"
                >
                  <option>Low (Home / AC office)</option>
                  <option>Moderate (Campus / Short travel)</option>
                  <option>High (Commute / Metro / City dust)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1.5">
                  Average Sleep
                </label>
                <select
                  value={answers.sleepHours}
                  onChange={(e) => setAnswers((p) => ({ ...p, sleepHours: e.target.value }))}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#DDE3D7] bg-white text-sm text-[#1C241E]"
                >
                  <option>Under 6 hours</option>
                  <option>6–7 hours</option>
                  <option>7–8+ hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1.5">
                  Daily Water Intake
                </label>
                <select
                  value={answers.waterIntake}
                  onChange={(e) => setAnswers((p) => ({ ...p, waterIntake: e.target.value }))}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#DDE3D7] bg-white text-sm text-[#1C241E]"
                >
                  <option>Under 1.5L</option>
                  <option>1.5–2.5L</option>
                  <option>2.5L+</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#525C54] mb-1.5">
                  Daily Screen Time
                </label>
                <select
                  value={answers.screenTime}
                  onChange={(e) => setAnswers((p) => ({ ...p, screenTime: e.target.value }))}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#DDE3D7] bg-white text-sm text-[#1C241E]"
                >
                  <option>Under 4 hours</option>
                  <option>5–8 hours daily</option>
                  <option>8+ hours daily</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              What does your current skincare routine look like?
            </h2>
            <p className="text-sm text-[#525C54]">
              So we don&apos;t overwhelm you with unnecessary steps.
            </p>
            <div className="space-y-3">
              {(
                [
                  {
                    value: 'none',
                    title: 'None — just water or soap',
                    desc: 'We will keep it effortless with a 3-step core habit.',
                  },
                  {
                    value: 'basic',
                    title: 'Basic — face wash + occasional cream/SPF',
                    desc: 'Ready for a dependable AM/PM routine plus 1 targeted serum.',
                  },
                  {
                    value: 'advanced',
                    title: 'Advanced — serums, actives, and daily SPF',
                    desc: 'Focused on optimizing ingredients without overlapping irritation.',
                  },
                ] as { value: RoutineLevel; title: string; desc: string }[]
              ).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setAnswers((p) => ({ ...p, currentRoutine: r.value }))}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    answers.currentRoutine === r.value
                      ? 'border-[#3F624D] bg-[#F1F3EE]'
                      : 'border-[#DDE3D7] bg-white hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div>
                    <p className="text-base font-semibold text-[#1C241E]">{r.title}</p>
                    <p className="text-sm text-[#525C54] mt-0.5">{r.desc}</p>
                  </div>
                  {answers.currentRoutine === r.value && (
                    <Check className="w-5 h-5 text-[#3F624D] shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              What is your comfortable skincare budget?
            </h2>
            <p className="text-sm text-[#525C54]">
              We prioritize picks within your range and still show budget-friendly swaps.
            </p>
            <div className="space-y-3">
              {(
                [
                  {
                    value: '500-800',
                    title: '₹500 – ₹800',
                    desc: 'Student & pocket-friendly essentials + ₹799 Starter Kit.',
                  },
                  {
                    value: '800-1200',
                    title: '₹800 – ₹1,200',
                    desc: 'Balanced clinical formulas for Cleanser + Moisturizer + SPF.',
                  },
                  {
                    value: '1200+',
                    title: '₹1,200+',
                    desc: 'Complete 4-step routine including targeted active serum.',
                  },
                ] as { value: BudgetRange; title: string; desc: string }[]
              ).map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setAnswers((p) => ({ ...p, budgetRange: b.value }))}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    answers.budgetRange === b.value
                      ? 'border-[#3F624D] bg-[#F1F3EE]'
                      : 'border-[#DDE3D7] bg-white hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div>
                    <p className="font-mono text-base font-semibold text-[#1C241E] tabular-nums">
                      {b.title}
                    </p>
                    <p className="text-sm text-[#525C54] mt-0.5">{b.desc}</p>
                  </div>
                  {answers.budgetRange === b.value && (
                    <Check className="w-5 h-5 text-[#3F624D] shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-4 border-t border-[#F1F3EE] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DDE3D7] text-sm font-medium text-[#1C241E] hover:bg-[#F1F3EE] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step === 0 ? 'Back' : 'Previous'}</span>
          </button>

          <button
            type="button"
            disabled={!canProceed || submitting}
            onClick={goNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] disabled:opacity-45 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            <span>
              {submitting
                ? 'Building Profile...'
                : step === TOTAL_STEPS - 1
                  ? 'See My Skin Profile'
                  : 'Continue'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
