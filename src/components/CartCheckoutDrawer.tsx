import { useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { ProductImage } from '@/src/components/ProductImage';
import type { CartItem, OrderRecord } from '@/src/types/skincare';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  initialReferralCode?: string;
  quizResponseId?: string;
  utmSource: string;
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutStarted: () => void;
  onSubmitOrder: (payload: Omit<OrderRecord, 'id' | 'createdAtIso'>) => Promise<OrderRecord>;
  onClearCart: () => void;
}

export function CartCheckoutDrawer({
  isOpen,
  items,
  initialReferralCode = '',
  quizResponseId = '',
  utmSource,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckoutStarted,
  onSubmitOrder,
  onClearCart,
}: CartCheckoutDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [referralInput, setReferralInput] = useState(initialReferralCode);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | 'prelaunch_interest'>('upi');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.priceInr * item.quantity, 0);
  const validReferral =
    referralInput.trim().toUpperCase().startsWith('FCB') && subtotal >= 499;
  const discount = validReferral ? 50 : 0;
  const total = Math.max(0, subtotal - discount);

  const handleProceedCheckout = () => {
    setFormError('');
    setStep('checkout');
    onCheckoutStarted();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (paymentMethod !== 'prelaunch_interest' && address.trim().length < 5) {
      setFormError('Please enter your delivery address.');
      return;
    }
    if (paymentMethod !== 'prelaunch_interest' && pincode.replace(/\D/g, '').length < 6) {
      setFormError('Please enter a valid 6-digit pincode.');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = `FCB-${Math.floor(10000 + Math.random() * 89999)}`;
      const isInterest = paymentMethod === 'prelaunch_interest';
      const itemSummaries = items.map(
        (i) =>
          `${i.product.name} x${i.quantity} (₹${i.product.priceInr * i.quantity})${
            i.bundleSummary ? ` [${i.bundleSummary}]` : ''
          }`
      );

      const saved = await onSubmitOrder({
        orderNumber,
        quizResponseId: quizResponseId || 'direct_catalogue',
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim() || 'Pre-launch inquiry',
        city: city.trim() || 'Delhi NCR',
        pincode: pincode.trim() || '110001',
        paymentMethod,
        orderType: isInterest ? 'interest' : 'order',
        itemSummaries,
        subtotalInr: subtotal,
        discountInr: discount,
        totalInr: total,
        referralCodeUsed: validReferral ? referralInput.trim().toUpperCase() : '',
        utmSource,
        status: isInterest ? 'interest_recorded' : 'confirmed',
      });

      setConfirmedOrder(saved);
      onClearCart();
      setStep('confirmed');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save order right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep('cart');
    setConfirmedOrder(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C241E]/45 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and Checkout"
    >
      <div className="w-full max-w-md bg-[#FAF9F5] h-full flex flex-col border-l border-[#DDE3D7]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#DDE3D7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#3F624D]" />
            <h2 className="font-serif text-lg font-semibold text-[#1C241E]">
              {step === 'cart'
                ? 'Your Skincare Bag'
                : step === 'checkout'
                  ? 'Delivery & Payment'
                  : 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 rounded-lg text-[#525C54] hover:bg-[#F1F3EE]"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'cart' && (
            <div className="space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-14 space-y-3">
                  <p className="font-serif text-xl font-semibold text-[#1C241E]">
                    Your bag is empty
                  </p>
                  <p className="text-sm text-[#525C54]">
                    Take the Skin Fit Test to get your ₹799 Starter Kit or pick essentials from the
                    catalogue.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-white border border-[#DDE3D7] rounded-xl p-3.5 flex gap-3.5"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F1F3EE] shrink-0">
                          <ProductImage
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-[#1C241E] leading-snug">
                              {item.product.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-[#525C54] hover:text-[#DF5A47]"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {item.bundleSummary && (
                            <p className="text-xs text-[#3F624D]">{item.bundleSummary}</p>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <div className="inline-flex items-center border border-[#DDE3D7] rounded-lg">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.product.id, -1)}
                                className="p-1.5 text-[#1C241E] hover:bg-[#F1F3EE]"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 font-mono text-xs tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.product.id, 1)}
                                className="p-1.5 text-[#1C241E] hover:bg-[#F1F3EE]"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-mono text-sm font-semibold text-[#1C241E] tabular-nums">
                              ₹{item.product.priceInr * item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Referral Code */}
                  <div className="bg-white border border-[#DDE3D7] rounded-xl p-4 space-y-2">
                    <label className="block text-xs font-semibold text-[#525C54]">
                      REFERRAL CODE (GET ₹50 OFF ON ₹499+)
                    </label>
                    <input
                      type="text"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value)}
                      placeholder="Enter FCB50 or friend's FCB code"
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE3D7] font-mono text-xs uppercase"
                    />
                    {validReferral && (
                      <p className="text-xs text-[#3F624D] font-medium">
                        Referral applied: ₹50 off unlocked!
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'checkout' && (
            <form id="fcb-checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#DF5A47]/10 border border-[#DF5A47]/30 text-xs text-[#C84A38] font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3D7] bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1">
                  Phone Number (WhatsApp / Delivery Updates) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3D7] bg-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525C54] mb-1">
                  Street / Hostel / Flat Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Hostel / House No., Sector / Locality"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3D7] bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#525C54] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New Delhi / Noida / Gurugram"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3D7] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#525C54] mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="110001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3D7] bg-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-[#525C54]">PAYMENT OR INQUIRY OPTION</p>
                {(
                  [
                    {
                      id: 'upi',
                      label: 'UPI (GPay / PhonePe / Paytm — v1 Demo)',
                      desc: 'Instant order confirmation without real payment charge in v1.',
                    },
                    {
                      id: 'cod',
                      label: 'Cash on Delivery (COD)',
                      desc: 'Pay in cash or UPI when your kit arrives. Free shipping on ₹499+.',
                    },
                    {
                      id: 'prelaunch_interest',
                      label: 'Express Purchase Interest (Pre-Launch Reserve)',
                      desc: 'No payment needed now—reserves your ₹799 launch slot & notifies you.',
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.id}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === opt.id
                        ? 'border-[#3F624D] bg-[#F1F3EE]'
                        : 'border-[#DDE3D7] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === opt.id}
                        onChange={() => setPaymentMethod(opt.id)}
                        className="mt-1 accent-[#3F624D]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1C241E]">{opt.label}</p>
                        <p className="text-xs text-[#525C54] mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </form>
          )}

          {step === 'confirmed' && confirmedOrder && (
            <div className="bg-white border border-[#DDE3D7] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-[#3F624D]">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-serif text-xl font-semibold text-[#1C241E]">
                  {confirmedOrder.orderType === 'interest'
                    ? 'Pre-launch Interest Recorded'
                    : `Order ${confirmedOrder.orderNumber} Confirmed`}
                </h3>
              </div>

              <p className="text-sm text-[#525C54]">
                Thank you, <span className="font-semibold text-[#1C241E]">{confirmedOrder.customerName}</span>.
                {confirmedOrder.orderType === 'interest'
                  ? ' We have reserved your priority slot and will message you before dispatch.'
                  : ' Your personalized skincare order is queued for packing.'}
              </p>

              <div className="bg-[#F1F3EE] rounded-xl p-4 space-y-2 text-xs">
                <p className="font-semibold text-[#1C241E]">
                  Reference: <span className="font-mono">{confirmedOrder.orderNumber}</span>
                </p>
                <p className="text-[#525C54]">
                  Payment Mode: {confirmedOrder.paymentMethod.toUpperCase()} · City:{' '}
                  {confirmedOrder.city}
                </p>
                <ul className="space-y-1 pt-2 border-t border-[#DDE3D7] text-[#1C241E]">
                  {confirmedOrder.itemSummaries.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                <p className="pt-2 border-t border-[#DDE3D7] font-mono text-sm font-bold text-[#1C241E] tabular-nums">
                  Total Payable: ₹{confirmedOrder.totalInr}
                </p>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-3 rounded-xl bg-[#1C241E] text-white text-sm font-semibold hover:bg-[#3F624D]"
              >
                Continue Exploring
              </button>
            </div>
          )}
        </div>

        {/* Footer Totals */}
        {step !== 'confirmed' && items.length > 0 && (
          <div className="px-6 py-4 bg-white border-t border-[#DDE3D7] space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-[#525C54]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#3F624D] font-medium">
                  <span>Referral Discount</span>
                  <span className="font-mono tabular-nums">−₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-[#1C241E] pt-1 border-t border-[#F1F3EE]">
                <span>Total (Free Delivery)</span>
                <span className="font-mono tabular-nums">₹{total}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={handleProceedCheckout}
                className="w-full py-3 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] transition-colors"
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 rounded-xl border border-[#DDE3D7] text-sm font-medium text-[#1C241E]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="fcb-checkout-form"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] disabled:opacity-50"
                >
                  {submitting
                    ? 'Confirming...'
                    : paymentMethod === 'prelaunch_interest'
                      ? 'Submit Pre-Launch Interest'
                      : `Confirm Order · ₹${total}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
