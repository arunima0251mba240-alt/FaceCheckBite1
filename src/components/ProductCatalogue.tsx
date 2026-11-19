import { useMemo, useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import { ProductImage } from '@/src/components/ProductImage';
import type {
  BudgetTier,
  GenderFocus,
  Product,
  ProductCategory,
  SkinConcern,
  SkinType,
} from '@/src/types/skincare';

interface ProductCatalogueProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product | null) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCatalogue({
  products,
  selectedProduct,
  onSelectProduct,
  onAddToCart,
}: ProductCatalogueProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [skinFilter, setSkinFilter] = useState<'all' | SkinType>('all');
  const [concernFilter, setConcernFilter] = useState<'all' | SkinConcern>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | BudgetTier>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | GenderFocus>('all');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (skinFilter !== 'all' && !p.skinTypes.includes(skinFilter)) return false;
      if (concernFilter !== 'all' && !p.concerns.includes(concernFilter)) return false;
      if (priceFilter !== 'all' && p.budgetTier !== priceFilter) return false;
      if (genderFilter !== 'all' && p.genderFocus !== genderFilter) return false;
      return true;
    });
  }, [products, categoryFilter, skinFilter, concernFilter, priceFilter, genderFilter]);

  const resetFilters = () => {
    setCategoryFilter('all');
    setSkinFilter('all');
    setConcernFilter('all');
    setPriceFilter('all');
    setGenderFilter('all');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C241E]">
            Skincare Catalogue
          </h1>
          <p className="text-sm sm:text-base text-[#525C54] mt-1">
            Curated 14-item range with full ingredient transparency and zero hidden actives.
          </p>
        </div>
        <p className="font-mono text-xs text-[#525C54] tabular-nums">
          Showing {filteredProducts.length} of {products.length} items
        </p>
      </div>

      {/* Category Segmented Tabs + Attribute Filters */}
      <div className="bg-white border border-[#DDE3D7] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'kit', label: 'Starter Kits' },
              { id: 'cleanser', label: 'Cleansers' },
              { id: 'moisturizer', label: 'Moisturizers' },
              { id: 'sunscreen', label: 'Sunscreens' },
              { id: 'serum', label: 'Serums' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === tab.id
                  ? 'bg-[#1C241E] text-white'
                  : 'bg-[#F1F3EE] text-[#525C54] hover:text-[#1C241E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#F1F3EE]">
          <select
            aria-label="Filter by Skin Type"
            value={skinFilter}
            onChange={(e) => setSkinFilter(e.target.value as 'all' | SkinType)}
            className="px-3 py-2.5 rounded-xl border border-[#DDE3D7] bg-[#FAF9F5] text-xs font-medium text-[#1C241E]"
          >
            <option value="all">Skin Type: All</option>
            <option value="oily">Oily</option>
            <option value="dry">Dry</option>
            <option value="combination">Combination</option>
            <option value="normal">Normal</option>
            <option value="sensitive">Sensitive</option>
          </select>

          <select
            aria-label="Filter by Concern"
            value={concernFilter}
            onChange={(e) => setConcernFilter(e.target.value as 'all' | SkinConcern)}
            className="px-3 py-2.5 rounded-xl border border-[#DDE3D7] bg-[#FAF9F5] text-xs font-medium text-[#1C241E]"
          >
            <option value="all">Concern: All</option>
            <option value="acne">Acne</option>
            <option value="pigmentation">Pigmentation</option>
            <option value="oiliness">Excess Oil</option>
            <option value="dryness">Dryness</option>
            <option value="dullness">Dullness</option>
            <option value="sensitivity">Sensitivity</option>
          </select>

          <select
            aria-label="Filter by Price Tier"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as 'all' | BudgetTier)}
            className="px-3 py-2.5 rounded-xl border border-[#DDE3D7] bg-[#FAF9F5] text-xs font-medium text-[#1C241E]"
          >
            <option value="all">Price Tier: All</option>
            <option value="budget">Budget (₹199–₹299)</option>
            <option value="mid">Mid (₹279–₹799)</option>
            <option value="premium">Complete / Serum (₹399–₹1,099)</option>
          </select>

          <select
            aria-label="Filter by Gender Focus"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as 'all' | GenderFocus)}
            className="px-3 py-2.5 rounded-xl border border-[#DDE3D7] bg-[#FAF9F5] text-xs font-medium text-[#1C241E]"
          >
            <option value="all">For: All / Gender-Neutral</option>
            <option value="unisex">Gender-Neutral (Unisex)</option>
            <option value="men">Men Grooming Focus</option>
            <option value="women">Women Focus</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#DDE3D7] rounded-2xl p-10 text-center space-y-3">
          <p className="font-serif text-xl font-semibold text-[#1C241E]">
            No products match these exact filters
          </p>
          <p className="text-sm text-[#525C54]">
            Try widening your concern or price filter to explore compatible picks.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg bg-[#1C241E] text-white text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#DDE3D7] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="aspect-[4/3] w-full bg-[#F1F3EE] overflow-hidden text-left"
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
                    {product.genderFocus === 'unisex'
                      ? 'Gender-Neutral'
                      : product.genderFocus === 'men'
                        ? 'Men'
                        : 'Women'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="text-left block"
                  >
                    <h2 className="text-base font-semibold text-[#1C241E] hover:text-[#3F624D]">
                      {product.name}
                    </h2>
                  </button>
                  <p className="text-xs text-[#525C54]">
                    {product.keyIngredients.slice(0, 3).join(' · ')}
                  </p>
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="px-3 py-2 rounded-lg border border-[#DDE3D7] text-xs font-medium text-[#1C241E] hover:bg-[#F1F3EE]"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className="px-3.5 py-2 rounded-lg bg-[#1C241E] text-white text-xs font-medium hover:bg-[#3F624D]"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal (PDP) with Ingredient Transparency */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-[#1C241E]/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedProduct.name}
        >
          <div className="bg-white border border-[#DDE3D7] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 bg-[#F1F3EE] min-h-[240px]">
                <ProductImage
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  title={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:col-span-7 p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#3F624D]">
                      {selectedProduct.category.toUpperCase()} · {selectedProduct.sizeLabel}
                    </p>
                    <h2 className="font-serif text-2xl font-semibold text-[#1C241E] mt-1">
                      {selectedProduct.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(null)}
                    className="p-2 rounded-lg text-[#525C54] hover:bg-[#F1F3EE]"
                    aria-label="Close product details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-2xl font-bold text-[#1C241E] tabular-nums">
                    ₹{selectedProduct.priceInr}
                  </span>
                  {selectedProduct.mrpInr > selectedProduct.priceInr && (
                    <span className="font-mono text-sm text-[#525C54] line-through tabular-nums">
                      MRP ₹{selectedProduct.mrpInr}
                    </span>
                  )}
                </div>

                <p className="text-sm text-[#1C241E] leading-relaxed">
                  {selectedProduct.whyItSuits}
                </p>

                <div className="space-y-2 text-xs text-[#525C54] border-t border-[#F1F3EE] pt-4">
                  <p className="font-semibold text-[#1C241E]">Key Actives & Skin Types</p>
                  <p>{selectedProduct.keyIngredients.join(' · ')}</p>
                  <p>Best for: {selectedProduct.skinTypes.join(', ')} skin</p>
                </div>

                <div className="bg-[#F1F3EE] rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-[#3F624D] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Ingredient Transparency</span>
                  </p>
                  <p className="text-xs text-[#1C241E] leading-relaxed">
                    {selectedProduct.ingredientTransparency}
                  </p>
                  {selectedProduct.avoidIfAllergicTo.length > 0 && (
                    <p className="text-xs text-[#DF5A47] font-medium pt-1">
                      Contains / flagged for:{' '}
                      {selectedProduct.avoidIfAllergicTo
                        .map((a) => a.replace('_', ' '))
                        .join(', ')}
                    </p>
                  )}
                </div>

                <div className="text-xs text-[#525C54] space-y-1">
                  <p>
                    <span className="font-semibold text-[#1C241E]">AM:</span>{' '}
                    {selectedProduct.howToUseAM}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1C241E]">PM:</span>{' '}
                    {selectedProduct.howToUsePM}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(selectedProduct);
                      onSelectProduct(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add to Bag — ₹{selectedProduct.priceInr}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
