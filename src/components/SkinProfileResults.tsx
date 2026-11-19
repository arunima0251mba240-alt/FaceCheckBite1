import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Download,
  Moon,
  RefreshCw,
  Share2,
  Sun,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ProductImage } from '@/src/components/ProductImage';
import { generateSkinProfileImageDataUrl } from '@/src/lib/profileCardCanvas';
import type { FeedbackRecord, Product, RecommendationResult } from '@/src/types/skincare';

interface SkinProfileResultsProps {
  result: RecommendationResult;
  onAddStarterKit: (result: RecommendationResult) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onRetakeQuiz: () => void;
  onShareProfile: () => void;
  onSubmitFeedback: (payload: {
    quizResponseId: string;
    relevanceScore: number;
    wouldTry: 'Yes' | 'Maybe' | 'No';
    willingnessToPayInr: number;
    comment: string;
  }) => Promise<FeedbackRecord>;
}

export function SkinProfileResults({
  result,
  onAddStarterKit,
  onAddToCart,
  onSelectProduct,
  onRetakeQuiz,
  onShareProfile,
  onSubmitFeedback,
}: SkinProfileResultsProps) {
  const [swappedBudgetIds, setSwappedBudgetIds] = useState<Record<string, boolean>>({});
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Validation Feedback Form state
  const [relevanceScore, setRelevanceScore] = useState<number>(5);
  const [wouldTry, setWouldTry] = useState<'Yes' | 'Maybe' | 'No'>('Yes');
  const [willingnessToPay, setWillingnessToPay] = useState<number>(799);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const shareLink = `${window.location.origin}/?ref=${encodeURIComponent(result.profile.referralCode)}&utm_source=referral`;

  const handleGenerateShareCard = () => {
    const dataUrl = generateSkinProfileImageDataUrl(result);
    setShareImageUrl(dataUrl);
    onShareProfile();
  };

  const handleDownloadCard = () => {
    const dataUrl = shareImageUrl || generateSkinProfileImageDataUrl(result);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `face-check-bite-profile-${result.profile.referralCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(
        `Take the 2-min Face Check Bite Skin Fit Test & use code ${result.profile.referralCode} for ₹50 off: ${shareLink}`
      );
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      await onSubmitFeedback({
        quizResponseId: result.responseId,
        relevanceScore,
        wouldTry,
        willingnessToPayInr: willingnessToPay,
        comment,
      });
      setFeedbackSaved(true);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* 1. Skin Profile Summary Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#DDE3D7] rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className="w-14 h-14 rounded-full border border-[#1C241E]/15 shrink-0"
                  style={{ backgroundColor: result.profile.swatchHex }}
                  title={`${result.profile.toneLabel} · ${result.profile.undertoneLabel}`}
                />
                <div>
                  <p className="text-xs font-medium text-[#3F624D]">YOUR SKIN PROFILE</p>
                  <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C241E]">
                    {result.profile.skinTypeLabel}
                  </h1>
                  <p className="text-sm text-[#525C54]">
                    {result.profile.toneLabel} · {result.profile.undertoneLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onRetakeQuiz}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525C54] hover:text-[#1C241E]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#F1F3EE] space-y-2">
              <p className="text-xs font-semibold text-[#525C54]">TOP PRIORITIES</p>
              <p className="text-base font-semibold text-[#1C241E]">
                {result.profile.topConcerns.join(' · ')}
              </p>
            </div>

            <p className="text-sm sm:text-base text-[#525C54] leading-relaxed">
              {result.profile.plainLanguageExplanation}
            </p>

            <div className="bg-[#F1F3EE] rounded-xl p-4 text-sm text-[#1C241E]">
              <span className="font-semibold text-[#3F624D]">Environment Match: </span>
              {result.profile.lifestyleNote}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerateShareCard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C241E] text-white text-sm font-medium hover:bg-[#3F624D] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Shareable Instagram Card</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DDE3D7] bg-white text-sm font-medium text-[#1C241E] hover:bg-[#F1F3EE] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* Starter Kit Offer Card (₹799) */}
        <div className="lg:col-span-5 bg-[#F1F3EE] border border-[#DDE3D7] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-xs font-semibold text-[#3F624D]">INTRODUCTORY STARTER KIT</p>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-[#1C241E] tabular-nums">
                  ₹{result.starterKit.introPriceInr}
                </span>
                {result.starterKit.individualTotalInr > result.starterKit.introPriceInr && (
                  <span className="ml-2 font-mono text-xs text-[#525C54] line-through tabular-nums">
                    ₹{result.starterKit.individualTotalInr}
                  </span>
                )}
              </div>
            </div>

            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              Your Custom 3-Step Starter Kit
            </h2>
            <p className="text-sm text-[#525C54]">
              Bundles your exact matched Cleanser, Moisturizer, and SPF 50 at our launch price
              {result.starterKit.savingsInr > 0
                ? ` — save ₹${result.starterKit.savingsInr} off individual bottles.`
                : '.'}
            </p>

            <ul className="space-y-2.5 pt-2">
              {result.starterKit.includedItems.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 text-sm text-[#1C241E] bg-white/80 rounded-lg px-3.5 py-2.5 border border-[#DDE3D7]"
                >
                  <Check className="w-4 h-4 text-[#3F624D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {idx + 1}. {item.name}
                    </p>
                    <p className="text-xs text-[#525C54]">
                      {item.sizeLabel} · Worth ₹{item.priceInr}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onAddStarterKit(result)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] transition-colors min-h-[48px]"
          >
            <span>Add ₹799 Starter Kit to Bag</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Shareable Image Preview Drawer/Box */}
      {shareImageUrl && (
        <section className="bg-white border border-[#DDE3D7] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#1C241E]">
                Instagram Story Card Ready
              </h3>
              <p className="text-sm text-[#525C54]">
                Download and post to Instagram Stories with your referral code{' '}
                <span className="font-mono font-semibold text-[#1C241E]">
                  {result.profile.referralCode}
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadCard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38]"
            >
              <Download className="w-4 h-4" />
              <span>Save Image</span>
            </button>
          </div>
          <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-[#DDE3D7]">
            <img
              src={shareImageUrl}
              alt="Shareable Skin Fit Profile Card"
              className="w-full h-auto"
            />
          </div>
        </section>
      )}

      {/* Patch Test & Dermatologist Disclaimer */}
      <section className="bg-[#FAF9F5] border border-[#DDE3D7] rounded-2xl p-5 space-y-2">
        {result.profile.patchTestRequired && (
          <div className="flex items-start gap-2.5 text-sm text-[#1C241E]">
            <AlertTriangle className="w-4 h-4 text-[#DF5A47] shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">Patch-Test Reminder: </span>
              Because you indicated sensitive skin or ingredient sensitivities, apply a small
              amount behind your ear or inner forearm for 24 hours before full-face use.
            </p>
          </div>
        )}
        <p className="text-xs text-[#525C54]">
          These recommendations are based on self-reported information and are not a substitute for
          professional dermatological advice.
        </p>
      </section>

      {/* 2. Personalized Product Recommendations */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C241E]">
            Your personalized matches
          </h2>
          <p className="text-sm text-[#525C54] mt-1">
            Transparent rule-based picks with key ingredients, AM/PM usage, and budget swaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {result.recommendations.map((rec) => {
            const useBudgetSwap = Boolean(swappedBudgetIds[rec.slot] && rec.budgetAlternative);
            const activeProduct =
              useBudgetSwap && rec.budgetAlternative ? rec.budgetAlternative : rec.product;

            return (
              <div
                key={rec.slot}
                className="bg-white border border-[#DDE3D7] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-12">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(activeProduct)}
                      className="sm:col-span-5 aspect-[4/3] sm:aspect-auto sm:h-full bg-[#F1F3EE] overflow-hidden"
                    >
                      <ProductImage
                        src={activeProduct.imageUrl}
                        alt={activeProduct.name}
                        title={activeProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <div className="sm:col-span-7 p-5 space-y-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-[#3F624D]">
                          {rec.slot.toUpperCase()}
                        </p>
                        <p className="font-mono text-base font-semibold text-[#1C241E] tabular-nums">
                          ₹{activeProduct.priceInr}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectProduct(activeProduct)}
                        className="text-left block"
                      >
                        <h3 className="text-base font-semibold text-[#1C241E] hover:text-[#3F624D]">
                          {activeProduct.name}
                        </h3>
                      </button>

                      <p className="text-xs text-[#525C54]">
                        {activeProduct.sizeLabel} · {activeProduct.keyIngredients.join(' · ')}
                      </p>

                      <p className="text-sm text-[#1C241E] leading-relaxed">
                        <span className="font-semibold">Why it suits you: </span>
                        {useBudgetSwap ? activeProduct.whyItSuits : rec.whyItSuitsYou}
                      </p>

                      <div className="text-xs text-[#525C54] space-y-1 pt-1 border-t border-[#F1F3EE]">
                        <p>
                          <span className="font-semibold text-[#1C241E]">AM:</span>{' '}
                          {activeProduct.howToUseAM}
                        </p>
                        <p>
                          <span className="font-semibold text-[#1C241E]">PM:</span>{' '}
                          {activeProduct.howToUsePM}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#FAF9F5] border-t border-[#DDE3D7] flex flex-wrap items-center justify-between gap-3">
                  {rec.budgetAlternative ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSwappedBudgetIds((prev) => ({
                          ...prev,
                          [rec.slot]: !prev[rec.slot],
                        }))
                      }
                      className="text-xs font-medium text-[#3F624D] hover:underline"
                    >
                      {useBudgetSwap
                        ? `Back to primary match (₹${rec.product.priceInr})`
                        : `Budget-friendly alternative: ₹${rec.budgetAlternative.priceInr}`}
                    </button>
                  ) : (
                    <span className="text-xs text-[#525C54]">Best budget fit selected</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onAddToCart(activeProduct)}
                    className="px-4 py-2 rounded-lg bg-[#1C241E] text-white text-xs font-medium hover:bg-[#3F624D] transition-colors whitespace-nowrap shrink-0"
                  >
                    Add ₹{activeProduct.priceInr} to Bag
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Simple Routine Guide (AM & PM) */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C241E]">
            Your Morning & Night Routine Guide
          </h2>
          <p className="text-sm text-[#525C54] mt-1">
            Consistent 2-minute habits beat complicated 10-step shelves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Morning */}
          <div className="bg-white border border-[#DDE3D7] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#F1F3EE]">
              <Sun className="w-5 h-5 text-[#DF5A47]" />
              <h3 className="font-serif text-xl font-semibold text-[#1C241E]">Morning (AM)</h3>
            </div>
            <ol className="space-y-4">
              {result.amRoutine.map((step) => (
                <li key={step.stepNumber} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1C241E]">
                      0{step.stepNumber}. {step.slot} — {step.productName}
                    </p>
                    <span className="text-xs text-[#3F624D] shrink-0">{step.frequency}</span>
                  </div>
                  <p className="text-sm text-[#525C54]">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Night */}
          <div className="bg-white border border-[#DDE3D7] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#F1F3EE]">
              <Moon className="w-5 h-5 text-[#3F624D]" />
              <h3 className="font-serif text-xl font-semibold text-[#1C241E]">Night (PM)</h3>
            </div>
            <ol className="space-y-4">
              {result.pmRoutine.map((step) => (
                <li key={step.stepNumber} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1C241E]">
                      0{step.stepNumber}. {step.slot} — {step.productName}
                    </p>
                    <span className="text-xs text-[#3F624D] shrink-0">{step.frequency}</span>
                  </div>
                  <p className="text-sm text-[#525C54]">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 4. Feedback Validation & Referral Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Validation Feedback Form */}
        <div className="lg:col-span-7 bg-white border border-[#DDE3D7] rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              Help us validate your match
            </h2>
            <p className="text-sm text-[#525C54] mt-1">
              Takes 15 seconds and helps shape our Delhi NCR starter kits.
            </p>
          </div>

          {feedbackSaved ? (
            <div className="bg-[#F1F3EE] rounded-xl p-5 space-y-2">
              <p className="font-semibold text-[#3F624D] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Thank you — your feedback is recorded!</span>
              </p>
              <p className="text-sm text-[#525C54]">
                Use code{' '}
                <span className="font-mono font-semibold text-[#1C241E]">
                  {result.profile.referralCode}
                </span>{' '}
                at checkout for ₹50 off your Starter Kit.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C241E] mb-2">
                  How relevant are these recommendations? (1 = Off-mark, 5 = Spot on)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRelevanceScore(score)}
                      className={`w-11 h-11 rounded-xl border font-mono text-sm font-semibold tabular-nums transition-colors ${
                        relevanceScore === score
                          ? 'bg-[#3F624D] text-white border-[#3F624D]'
                          : 'bg-white text-[#1C241E] border-[#DDE3D7] hover:bg-[#F1F3EE]'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C241E] mb-2">
                  Would you try these products?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Yes', 'Maybe', 'No'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setWouldTry(opt)}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        wouldTry === opt
                          ? 'bg-[#3F624D] text-white border-[#3F624D]'
                          : 'bg-white text-[#1C241E] border-[#DDE3D7] hover:bg-[#F1F3EE]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C241E] mb-1.5">
                  What price would you pay for this 3-step kit? (₹)
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {[599, 699, 799, 999].map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => setWillingnessToPay(price)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-medium tabular-nums ${
                        willingnessToPay === price
                          ? 'bg-[#1C241E] text-white border-[#1C241E]'
                          : 'bg-[#FAF9F5] text-[#1C241E] border-[#DDE3D7]'
                      }`}
                    >
                      ₹{price}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={200}
                  max={5000}
                  value={willingnessToPay}
                  onChange={(e) => setWillingnessToPay(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DDE3D7] font-mono text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C241E] mb-1.5">
                  Anything missing or unclear? (optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={380}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what would make this routine easier to trust..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DDE3D7] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="px-5 py-3 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] transition-colors disabled:opacity-50"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>

        {/* Referral & QR Block */}
        <div className="lg:col-span-5 bg-[#F1F3EE] border border-[#DDE3D7] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#3F624D]">REFERRAL REWARD</p>
            <h3 className="font-serif text-2xl font-semibold text-[#1C241E]">
              Share with a friend, get ₹50 off
            </h3>
            <p className="text-sm text-[#525C54]">
              Send your personal referral code or let a friend scan this QR code to take the free
              Skin Fit Test.
            </p>

            <div className="bg-white rounded-xl p-4 border border-[#DDE3D7] flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#525C54]">YOUR REFERRAL CODE</p>
                <p className="font-mono text-lg font-bold text-[#1C241E]">
                  {result.profile.referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C241E] text-white text-xs font-medium hover:bg-[#3F624D]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedReferral ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DDE3D7] flex items-center gap-4">
            <QRCodeSVG value={shareLink} size={88} fgColor="#1C241E" bgColor="#FFFFFF" />
            <div className="text-xs text-[#525C54] space-y-1">
              <p className="font-semibold text-[#1C241E]">Scan to start Skin Fit Test</p>
              <p>Automatically tracks your referral code & applies ₹50 off at checkout.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
