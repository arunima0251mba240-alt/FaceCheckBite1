import { ArrowRight, Check, ShieldCheck, Sun } from 'lucide-react';
import { ProductImage } from '@/src/components/ProductImage';
import type { AppView, Product } from '@/src/types/skincare';

interface LandingViewProps {
  products: Product[];
  onStartQuiz: () => void;
  onNavigate: (view: AppView) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function LandingView({
  products,
  onStartQuiz,
  onNavigate,
  onSelectProduct,
  onAddToCart,
}: LandingViewProps) {
  const featuredProducts = products
    .filter((p) =>
      [
        'fcb-kit-starter-799',
        'fcb-cleanser-salicylic-gel',
        'fcb-sunscreen-matte-spf50',
      ].includes(p.id)
    )
    .slice(0, 3);

  return (
    <div className="space-y-20 pb-20">
      {/* Section 1: Storefront Split Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium tracking-wide text-[#3F624D]">
              Formulated for Indian Skin & Climate · Delhi NCR Launch
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#1C241E] leading-[1.12]">
              Know your skin. Pick what fits.
            </h1>
            <p className="text-base sm:text-lg text-[#525C54] leading-relaxed max-w-xl">
              Take our simple Skin Fit Test and explore personalized skincare recommendations
              without relying on guesswork or blindly following trends.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onStartQuiz}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#DF5A47] text-white text-sm sm:text-base font-semibold hover:bg-[#C84A38] transition-colors shadow-sm min-h-[48px] whitespace-nowrap shrink-0"
              >
                <span>Take the free Skin Fit Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('catalogue')}
                className="inline-flex items-center px-5 py-3.5 rounded-xl border border-[#DDE3D7] bg-white text-[#1C241E] text-sm sm:text-base font-medium hover:bg-[#F1F3EE] transition-colors min-h-[48px] whitespace-nowrap shrink-0"
              >
                Browse Catalogue
              </button>
            </div>

            <div className="pt-4 border-t border-[#DDE3D7] grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="font-mono text-lg font-semibold text-[#1C241E] tabular-nums">
                  &lt; 2 min
                </p>
                <p className="text-xs text-[#525C54]">9-step Skin Fit quiz</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-[#1C241E] tabular-nums">
                  ₹799
                </p>
                <p className="text-xs text-[#525C54]">3-step Starter Kit</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-[#1C241E] tabular-nums">
                  0%
                </p>
                <p className="text-xs text-[#525C54]">Trend-based fluff</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-[#DDE3D7] bg-[#E4E8DF]">
              <ProductImage
                src="/src/assets/images/hero_skincare_ritual_1795068695392.jpg"
                alt="Young Indian man and woman with natural healthy skin in warm morning sunlight"
                title="Face Check Bite"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works (3 Clear Steps) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[#F1F3EE] rounded-2xl p-6 sm:p-10 border border-[#DDE3D7]">
          <div className="max-w-2xl mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C241E]">
              Simple science, built around your budget
            </h2>
            <p className="text-sm sm:text-base text-[#525C54] mt-2">
              Skip 10-step influencer hauls that trigger breakouts or waste your allowance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="font-mono text-xs font-semibold text-[#3F624D]">01. CHECK</p>
              <h3 className="text-lg font-semibold text-[#1C241E]">
                Answer 9 honest questions
              </h3>
              <p className="text-sm text-[#525C54] leading-relaxed">
                Tell us your skin type, Indian skin tone & undertone, allergies, Delhi NCR dust or
                sun exposure, and monthly budget.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-xs font-semibold text-[#3F624D]">02. MATCH</p>
              <h3 className="text-lg font-semibold text-[#1C241E]">
                Transparent rule-based fit
              </h3>
              <p className="text-sm text-[#525C54] leading-relaxed">
                See why every cleanser, moisturizer, sunscreen, and optional serum fits your
                profile—plus a budget-friendly swap for every slot.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-xs font-semibold text-[#3F624D]">03. START</p>
              <h3 className="text-lg font-semibold text-[#1C241E]">
                AM/PM routine + ₹799 Kit
              </h3>
              <p className="text-sm text-[#525C54] leading-relaxed">
                Get a clear morning & night guide, save a shareable Instagram Skin Profile card, or
                order your matched Starter Kit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Featured Starter Kit & Core Essentials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C241E]">
              Featured essentials & Starter Kit
            </h2>
            <p className="text-sm text-[#525C54] mt-1">
              Gender-inclusive formulas with zero white cast and full ingredient transparency.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalogue')}
            className="text-sm font-semibold text-[#3F624D] hover:text-[#1C241E] transition-colors whitespace-nowrap shrink-0"
          >
            View all {products.length} products →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-[#DDE3D7] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3EE] text-left"
              >
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  title={product.name}
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-[#525C54]">
                    {product.category.toUpperCase()} · {product.sizeLabel} ·{' '}
                    {product.genderFocus === 'unisex' ? 'All Genders' : product.genderFocus}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="text-left block"
                  >
                    <h3 className="text-base font-semibold text-[#1C241E] group-hover:text-[#3F624D] transition-colors">
                      {product.name}
                    </h3>
                  </button>
                  <p className="text-sm text-[#525C54] line-clamp-2">{product.whyItSuits}</p>
                </div>

                <div className="pt-3 border-t border-[#F1F3EE] flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-base font-semibold text-[#1C241E] tabular-nums">
                      ₹{product.priceInr}
                    </span>
                    {product.mrpInr > product.priceInr && (
                      <span className="font-mono text-xs text-[#525C54] line-through tabular-nums">
                        ₹{product.mrpInr}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="px-3.5 py-2 rounded-lg bg-[#1C241E] text-white text-xs font-medium hover:bg-[#3F624D] transition-colors whitespace-nowrap shrink-0"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Ingredient & Trust Pledge */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-[#DDE3D7] bg-white p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#1C241E]">
              Built for students & young professionals across India
            </h2>
            <p className="text-sm text-[#525C54] leading-relaxed">
              From metro commutes in Delhi NCR to humid hostel summers, skincare shouldn&apos;t
              require a dermatology glossary or a ₹3,000 cart. Every recommendation explains why an
              ingredient is included and flags potential allergens before you buy.
            </p>
            <ul className="space-y-2 text-sm text-[#1C241E]">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#3F624D] shrink-0" />
                <span>No white-cast SPF 50 across fair, medium, tan, and deep tones</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#3F624D] shrink-0" />
                <span>Allergy filters for fragrance, salicylic acid, niacinamide & Vitamin C</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-[#3F624D] shrink-0" />
                <span>Cash on Delivery & UPI options starting with ₹799 Starter Kits</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#F1F3EE] rounded-xl p-6 space-y-4 border border-[#DDE3D7]">
            <h3 className="font-serif text-xl font-semibold text-[#1C241E]">
              Ready to find your routine?
            </h3>
            <p className="text-sm text-[#525C54]">
              Takes under 2 minutes. Get your shareable Skin Profile card and custom AM/PM guide
              instantly.
            </p>
            <button
              type="button"
              onClick={onStartQuiz}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] transition-colors"
            >
              <span>Take the free Skin Fit Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
