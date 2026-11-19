import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { DEFAULT_PRODUCTS } from '@/src/lib/recommendationEngine';
import type {
  AnalyticsEventRecord,
  CampaignContext,
  FeedbackRecord,
  OrderRecord,
  Product,
  QuizAnswers,
  QuizSubmissionRecord,
} from '@/src/types/skincare';

const LOCAL_KEYS = {
  quizResponses: 'fcb_local_quiz_responses',
  orders: 'fcb_local_orders',
  feedback: 'fcb_local_feedback',
  events: 'fcb_local_analytics_events',
  sessionId: 'fcb_session_id',
};

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function readLocalList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function appendLocalList<T>(key: string, item: T): void {
  try {
    const list = readLocalList<T>(key);
    list.unshift(item);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignore storage quota failures
  }
}

export function getOrCreateCampaignContext(): CampaignContext {
  const params = new URLSearchParams(window.location.search);
  let sessionId = '';
  try {
    sessionId = localStorage.getItem(LOCAL_KEYS.sessionId) || '';
    if (!sessionId) {
      sessionId = makeId('sess');
      localStorage.setItem(LOCAL_KEYS.sessionId, sessionId);
    }
  } catch {
    sessionId = makeId('sess');
  }

  const qrTag = params.get('qr') || '';
  const utmSource =
    params.get('utm_source') || (qrTag ? `qr_${qrTag}` : params.get('ref') ? 'referral' : 'direct');
  const utmMedium = params.get('utm_medium') || (qrTag ? 'qr_poster' : 'organic');
  const utmCampaign = params.get('utm_campaign') || (qrTag || 'delhi_ncr_launch');
  const referralCode = (params.get('ref') || '').slice(0, 40);

  return {
    utmSource: utmSource.slice(0, 60),
    utmMedium: utmMedium.slice(0, 60),
    utmCampaign: utmCampaign.slice(0, 80),
    referralCode,
    sessionId,
  };
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      return DEFAULT_PRODUCTS;
    }
    const items = snap.docs.map((d) => d.data() as Product);
    return items.length > 0 ? items : DEFAULT_PRODUCTS;
  } catch (error) {
    console.warn('Using bundled default catalog:', error);
    return DEFAULT_PRODUCTS;
  }
}

export async function seedProductsToFirestore(): Promise<number> {
  let count = 0;
  for (const product of DEFAULT_PRODUCTS) {
    const path = `products/${product.id}`;
    try {
      const payload: Record<string, unknown> = {
        id: product.id,
        slug: product.slug.slice(0, 100),
        name: product.name.slice(0, 140),
        brand: product.brand.slice(0, 80),
        category: product.category,
        priceInr: product.priceInr,
        mrpInr: product.mrpInr,
        isStarterKit: product.isStarterKit,
        budgetTier: product.budgetTier,
        genderFocus: product.genderFocus,
        skinTypes: product.skinTypes.slice(0, 10),
        concerns: product.concerns.slice(0, 12),
        keyIngredients: product.keyIngredients.slice(0, 15),
        avoidIfAllergicTo: product.avoidIfAllergicTo.slice(0, 15),
        howToUseAM: product.howToUseAM.slice(0, 400),
        howToUsePM: product.howToUsePM.slice(0, 400),
        whyItSuits: product.whyItSuits.slice(0, 500),
        ingredientTransparency: product.ingredientTransparency.slice(0, 800),
        imageUrl: product.imageUrl.slice(0, 300),
        sizeLabel: product.sizeLabel.slice(0, 40),
        inStock: product.inStock,
        createdAt: serverTimestamp(),
      };
      if (product.budgetAlternativeId) {
        payload.budgetAlternativeId = product.budgetAlternativeId;
      }
      await setDoc(doc(db, 'products', product.id), payload);
      count += 1;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
  return count;
}

export async function logAnalyticsEvent(
  eventName: AnalyticsEventRecord['eventName'],
  campaign: CampaignContext,
  stepNumber = 0
): Promise<void> {
  const eventId = makeId('evt');
  const localRecord: AnalyticsEventRecord = {
    id: eventId,
    eventName,
    sessionId: campaign.sessionId,
    utmSource: campaign.utmSource,
    utmMedium: campaign.utmMedium,
    utmCampaign: campaign.utmCampaign,
    referralCode: campaign.referralCode,
    stepNumber,
    createdAtIso: new Date().toISOString(),
  };
  appendLocalList(LOCAL_KEYS.events, localRecord);

  try {
    await setDoc(doc(db, 'analytics_events', eventId), {
      eventName,
      sessionId: campaign.sessionId.slice(0, 80),
      utmSource: campaign.utmSource.slice(0, 60),
      utmMedium: campaign.utmMedium.slice(0, 60),
      utmCampaign: campaign.utmCampaign.slice(0, 80),
      referralCode: campaign.referralCode.slice(0, 40),
      stepNumber,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Analytics event recorded locally:', error);
  }
}

export async function saveQuizSubmission(
  responseId: string,
  answers: QuizAnswers,
  campaign: CampaignContext,
  referralCodeGenerated: string,
  recommendedProductIds: string[]
): Promise<void> {
  const localRecord: QuizSubmissionRecord = {
    id: responseId,
    responseId,
    gender: answers.gender,
    ageRange: answers.ageRange,
    skinType: answers.skinType,
    skinTone: answers.skinTone,
    undertone: answers.undertone,
    concerns: answers.concerns,
    allergies: answers.allergies,
    budgetRange: answers.budgetRange,
    utmSource: campaign.utmSource,
    utmMedium: campaign.utmMedium,
    utmCampaign: campaign.utmCampaign,
    referralCode: referralCodeGenerated,
    recommendedProductIds,
    createdAtIso: new Date().toISOString(),
  };
  appendLocalList(LOCAL_KEYS.quizResponses, localRecord);

  const path = `quiz_responses/${responseId}`;
  try {
    await setDoc(doc(db, 'quiz_responses', responseId), {
      responseId,
      gender: answers.gender,
      ageRange: answers.ageRange.slice(0, 30),
      skinType: answers.skinType,
      skinTone: answers.skinTone,
      undertone: answers.undertone,
      concerns: answers.concerns.slice(0, 10),
      allergies: answers.allergies.slice(0, 12),
      customAllergyNote: answers.customAllergyNote.slice(0, 240),
      sunExposure: answers.sunExposure.slice(0, 40),
      pollutionExposure: answers.pollutionExposure.slice(0, 40),
      sleepHours: answers.sleepHours.slice(0, 40),
      waterIntake: answers.waterIntake.slice(0, 40),
      screenTime: answers.screenTime.slice(0, 40),
      currentRoutine: answers.currentRoutine,
      budgetRange: answers.budgetRange,
      consentAccepted: true,
      referralCode: referralCodeGenerated.slice(0, 40),
      utmSource: campaign.utmSource.slice(0, 60),
      utmMedium: campaign.utmMedium.slice(0, 60),
      utmCampaign: campaign.utmCampaign.slice(0, 80),
      recommendedProductIds: recommendedProductIds.slice(0, 10),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveOrderSubmission(
  orderInput: Omit<OrderRecord, 'id' | 'createdAtIso'>
): Promise<OrderRecord> {
  const orderId = makeId('ord');
  const createdAtIso = new Date().toISOString();
  const fullRecord: OrderRecord = {
    id: orderId,
    ...orderInput,
    createdAtIso,
  };
  appendLocalList(LOCAL_KEYS.orders, fullRecord);

  const path = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), {
      orderNumber: orderInput.orderNumber.slice(0, 40),
      quizResponseId: orderInput.quizResponseId.slice(0, 80),
      customerName: orderInput.customerName.slice(0, 120),
      phone: orderInput.phone.slice(0, 20),
      address: orderInput.address.slice(0, 300),
      city: orderInput.city.slice(0, 80),
      pincode: orderInput.pincode.slice(0, 12),
      paymentMethod: orderInput.paymentMethod,
      orderType: orderInput.orderType,
      itemSummaries: orderInput.itemSummaries.slice(0, 20),
      subtotalInr: orderInput.subtotalInr,
      discountInr: orderInput.discountInr,
      totalInr: orderInput.totalInr,
      referralCodeUsed: orderInput.referralCodeUsed.slice(0, 40),
      utmSource: orderInput.utmSource.slice(0, 60),
      status: orderInput.status,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return fullRecord;
}

export async function saveFeedbackSubmission(
  feedbackInput: Omit<FeedbackRecord, 'id' | 'createdAtIso'>
): Promise<FeedbackRecord> {
  const feedbackId = makeId('fb');
  const fullRecord: FeedbackRecord = {
    id: feedbackId,
    ...feedbackInput,
    createdAtIso: new Date().toISOString(),
  };
  appendLocalList(LOCAL_KEYS.feedback, fullRecord);

  const path = `feedback/${feedbackId}`;
  try {
    await setDoc(doc(db, 'feedback', feedbackId), {
      quizResponseId: feedbackInput.quizResponseId.slice(0, 80),
      relevanceScore: feedbackInput.relevanceScore,
      wouldTry: feedbackInput.wouldTry,
      willingnessToPayInr: feedbackInput.willingnessToPayInr,
      comment: feedbackInput.comment.slice(0, 400),
      utmSource: feedbackInput.utmSource.slice(0, 60),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return fullRecord;
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export interface AdminSnapshot {
  quizResponses: QuizSubmissionRecord[];
  orders: OrderRecord[];
  feedback: FeedbackRecord[];
  events: AnalyticsEventRecord[];
  source: 'firestore' | 'local_session';
}

export function getLocalAdminSnapshot(): AdminSnapshot {
  return {
    quizResponses: readLocalList<QuizSubmissionRecord>(LOCAL_KEYS.quizResponses),
    orders: readLocalList<OrderRecord>(LOCAL_KEYS.orders),
    feedback: readLocalList<FeedbackRecord>(LOCAL_KEYS.feedback),
    events: readLocalList<AnalyticsEventRecord>(LOCAL_KEYS.events),
    source: 'local_session',
  };
}

export async function fetchFirestoreAdminSnapshot(): Promise<AdminSnapshot> {
  try {
    const [quizSnap, ordersSnap, fbSnap, evtSnap] = await Promise.all([
      getDocs(query(collection(db, 'quiz_responses'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'analytics_events'), orderBy('createdAt', 'desc'))),
    ]);

    const quizResponses: QuizSubmissionRecord[] = quizSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        responseId: String(data.responseId || d.id),
        gender: String(data.gender || ''),
        ageRange: String(data.ageRange || ''),
        skinType: data.skinType,
        skinTone: data.skinTone,
        undertone: data.undertone,
        concerns: Array.isArray(data.concerns) ? data.concerns : [],
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        budgetRange: data.budgetRange,
        utmSource: String(data.utmSource || 'direct'),
        utmMedium: String(data.utmMedium || ''),
        utmCampaign: String(data.utmCampaign || ''),
        referralCode: String(data.referralCode || ''),
        recommendedProductIds: Array.isArray(data.recommendedProductIds)
          ? data.recommendedProductIds
          : [],
        createdAtIso: toIsoString(data.createdAt),
      };
    });

    const orders: OrderRecord[] = ordersSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderNumber: String(data.orderNumber || ''),
        quizResponseId: String(data.quizResponseId || ''),
        customerName: String(data.customerName || ''),
        phone: String(data.phone || ''),
        address: String(data.address || ''),
        city: String(data.city || ''),
        pincode: String(data.pincode || ''),
        paymentMethod: data.paymentMethod,
        orderType: data.orderType,
        itemSummaries: Array.isArray(data.itemSummaries) ? data.itemSummaries : [],
        subtotalInr: Number(data.subtotalInr || 0),
        discountInr: Number(data.discountInr || 0),
        totalInr: Number(data.totalInr || 0),
        referralCodeUsed: String(data.referralCodeUsed || ''),
        utmSource: String(data.utmSource || 'direct'),
        status: data.status,
        createdAtIso: toIsoString(data.createdAt),
      };
    });

    const feedback: FeedbackRecord[] = fbSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        quizResponseId: String(data.quizResponseId || ''),
        relevanceScore: Number(data.relevanceScore || 0),
        wouldTry: data.wouldTry,
        willingnessToPayInr: Number(data.willingnessToPayInr || 0),
        comment: String(data.comment || ''),
        utmSource: String(data.utmSource || 'direct'),
        createdAtIso: toIsoString(data.createdAt),
      };
    });

    const events: AnalyticsEventRecord[] = evtSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        eventName: data.eventName,
        sessionId: String(data.sessionId || ''),
        utmSource: String(data.utmSource || 'direct'),
        utmMedium: String(data.utmMedium || ''),
        utmCampaign: String(data.utmCampaign || ''),
        referralCode: String(data.referralCode || ''),
        stepNumber: Number(data.stepNumber || 0),
        createdAtIso: toIsoString(data.createdAt),
      };
    });

    return { quizResponses, orders, feedback, events, source: 'firestore' };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_dashboard');
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderRecord['status']
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const str = Array.isArray(val) ? val.join('; ') : String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
