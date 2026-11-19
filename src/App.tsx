import { useEffect, useState } from 'react';
import { AdminDashboard } from '@/src/components/AdminDashboard';
import { CampaignShareView } from '@/src/components/CampaignShareView';
import { CartCheckoutDrawer } from '@/src/components/CartCheckoutDrawer';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { LandingView } from '@/src/components/LandingView';
import { Navbar } from '@/src/components/Navbar';
import { ProductCatalogue } from '@/src/components/ProductCatalogue';
import { SkinFitQuiz } from '@/src/components/SkinFitQuiz';
import { SkinProfileResults } from '@/src/components/SkinProfileResults';
import { testConnection } from '@/src/lib/firebase';
import { DEFAULT_PRODUCTS, generateRecommendations } from '@/src/lib/recommendationEngine';
import {
  fetchCatalogProducts,
  getOrCreateCampaignContext,
  logAnalyticsEvent,
  saveFeedbackSubmission,
  saveOrderSubmission,
  saveQuizSubmission,
} from '@/src/lib/storageService';
import type {
  AppView,
  CampaignContext,
  CartItem,
  Product,
  QuizAnswers,
  RecommendationResult,
} from '@/src/types/skincare';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('landing');
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(
    null
  );
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [campaign, setCampaign] = useState<CampaignContext>(() => getOrCreateCampaignContext());

  useEffect(() => {
    testConnection();
    fetchCatalogProducts().then(setProducts);
    logAnalyticsEvent('page_view', campaign, 0);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? '' : curr));
    }, 2600);
  };

  const navigateTo = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartQuiz = (overrideSource?: string) => {
    const activeCampaign = overrideSource
      ? { ...campaign, utmSource: overrideSource }
      : campaign;
    if (overrideSource) {
      setCampaign(activeCampaign);
    }
    logAnalyticsEvent('quiz_started', activeCampaign, 0);
    navigateTo('quiz');
  };

  const handleQuizComplete = async (answers: QuizAnswers) => {
    const responseId = `resp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const result = generateRecommendations(answers, responseId, products);
    setRecommendationResult(result);

    const recIds = result.recommendations.map((r) => r.product.id);
    await saveQuizSubmission(
      responseId,
      answers,
      campaign,
      result.profile.referralCode,
      recIds
    );
    await logAnalyticsEvent('quiz_completed', campaign, 9);
    navigateTo('results');
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to bag`);
  };

  const handleAddStarterKit = (result: RecommendationResult) => {
    const kitProduct = result.starterKit.kitProduct;
    const bundleSummary = result.starterKit.includedItems.map((i) => i.name).join(' + ');
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === kitProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === kitProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product: { ...kitProduct, priceInr: result.starterKit.introPriceInr },
          quantity: 1,
          isStarterKitBundle: true,
          bundleSummary,
        },
      ];
    });
    logAnalyticsEvent('kit_added', campaign, 0);
    setCartOpen(true);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    if (product && activeView !== 'catalogue') {
      navigateTo('catalogue');
    }
  };

  const totalBagCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#1C241E]">
        <Navbar
          activeView={activeView}
          hasProfile={Boolean(recommendationResult)}
          cartCount={totalBagCount}
          onNavigate={navigateTo}
          onOpenCart={() => setCartOpen(true)}
        />

        <main className="flex-1">
          {activeView === 'landing' && (
            <LandingView
              products={products}
              onStartQuiz={() => handleStartQuiz()}
              onNavigate={navigateTo}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {activeView === 'quiz' && (
            <SkinFitQuiz
              onStepChange={(stepNumber) =>
                logAnalyticsEvent('quiz_step', campaign, stepNumber)
              }
              onComplete={handleQuizComplete}
              onCancel={() => navigateTo('landing')}
            />
          )}

          {activeView === 'results' && recommendationResult && (
            <SkinProfileResults
              result={recommendationResult}
              onAddStarterKit={handleAddStarterKit}
              onAddToCart={handleAddToCart}
              onSelectProduct={handleSelectProduct}
              onRetakeQuiz={() => handleStartQuiz()}
              onShareProfile={() => logAnalyticsEvent('profile_shared', campaign, 0)}
              onSubmitFeedback={async (payload) => {
                const saved = await saveFeedbackSubmission({
                  ...payload,
                  utmSource: campaign.utmSource,
                });
                logAnalyticsEvent('feedback_submitted', campaign, 0);
                return saved;
              }}
            />
          )}

          {activeView === 'catalogue' && (
            <ProductCatalogue
              products={products}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {activeView === 'campaign' && (
            <CampaignShareView onStartQuizWithSource={(src) => handleStartQuiz(src)} />
          )}

          {activeView === 'admin' && (
            <AdminDashboard
              onCatalogSynced={() => {
                fetchCatalogProducts().then(setProducts);
              }}
            />
          )}
        </main>

        <footer className="border-t border-[#DDE3D7] bg-[#F1F3EE]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#525C54]">
            <div>
              <p className="font-serif text-sm font-semibold text-[#1C241E]">Face Check Bite</p>
              <p className="mt-0.5">
                Know your skin. Pick what fits. · Personalized skincare for India.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleStartQuiz()}
                className="hover:text-[#1C241E] font-medium"
              >
                Skin Fit Test
              </button>
              <button
                type="button"
                onClick={() => navigateTo('catalogue')}
                className="hover:text-[#1C241E] font-medium"
              >
                Catalogue
              </button>
              <button
                type="button"
                onClick={() => navigateTo('campaign')}
                className="hover:text-[#1C241E] font-medium"
              >
                Share & QR
              </button>
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="hover:text-[#1C241E] font-medium"
              >
                Admin
              </button>
            </div>
          </div>
        </footer>

        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-xl bg-[#1C241E] text-white text-xs font-medium shadow-lg"
          >
            {toastMessage}
          </div>
        )}

        <CartCheckoutDrawer
          isOpen={cartOpen}
          items={cartItems}
          initialReferralCode={
            campaign.referralCode || recommendationResult?.profile.referralCode || ''
          }
          quizResponseId={recommendationResult?.responseId || ''}
          utmSource={campaign.utmSource}
          onClose={() => setCartOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onCheckoutStarted={() => logAnalyticsEvent('checkout_started', campaign, 0)}
          onSubmitOrder={async (orderPayload) => {
            const saved = await saveOrderSubmission(orderPayload);
            logAnalyticsEvent(
              orderPayload.orderType === 'interest' ? 'interest_expressed' : 'order_placed',
              campaign,
              0
            );
            return saved;
          }}
          onClearCart={() => setCartItems([])}
        />
      </div>
    </ErrorBoundary>
  );
}
