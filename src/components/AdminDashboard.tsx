import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Download, Lock, LogOut, RefreshCw, Upload } from 'lucide-react';
import rulesData from '@/src/data/recommendationRules.json';
import { auth, signInAdminWithGoogle, signOutAdmin } from '@/src/lib/firebase';
import {
  type AdminSnapshot,
  exportToCsv,
  fetchFirestoreAdminSnapshot,
  getLocalAdminSnapshot,
  seedProductsToFirestore,
  updateOrderStatusInFirestore,
} from '@/src/lib/storageService';
import type { OrderRecord } from '@/src/types/skincare';

const ADMIN_PASSCODE = 'facecheck2026';

export function AdminDashboard({ onCatalogSynced }: { onCatalogSynced: () => void }) {
  const [passcodeInput, setPasscodeInput] = useState('');
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fcb_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [passcodeError, setPasscodeError] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(auth.currentUser);
  const [snapshot, setSnapshot] = useState<AdminSnapshot>(() => getLocalAdminSnapshot());
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'orders' | 'feedback'>(
    'overview'
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsub();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (auth.currentUser) {
        const remote = await fetchFirestoreAdminSnapshot();
        setSnapshot(remote);
      } else {
        setSnapshot(getLocalAdminSnapshot());
      }
    } catch (err) {
      setErrorMessage(
        'Could not read Firestore admin collections (sign in with the authorized admin Google account, or check Firestore rules).'
      );
      console.error(err);
      setSnapshot(getLocalAdminSnapshot());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) {
      loadData();
    }
  }, [unlocked, authUser]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === ADMIN_PASSCODE) {
      setUnlocked(true);
      setPasscodeError('');
      try {
        sessionStorage.setItem('fcb_admin_unlocked', 'true');
      } catch {
        // ignore
      }
    } else {
      setPasscodeError('Incorrect passcode. Check README for the admin passcode.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  const handleSeedProducts = async () => {
    setSyncMessage('');
    setErrorMessage('');
    try {
      const count = await seedProductsToFirestore();
      setSyncMessage(`Synced ${count} products to Firestore.`);
      onCatalogSynced();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Sign in with the admin Google account to write products to Firestore.'
      );
    }
  };

  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderRecord['status']) => {
    if (snapshot.source !== 'firestore') return;
    try {
      await updateOrderStatusInFirestore(orderId, nextStatus);
      setSnapshot((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)),
      }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update order status.');
    }
  };

  const metrics = useMemo(() => {
    const startedEvents = snapshot.events.filter((e) => e.eventName === 'quiz_started');
    const completedEvents = snapshot.events.filter((e) => e.eventName === 'quiz_completed');

    const testsStarted = Math.max(startedEvents.length, snapshot.quizResponses.length);
    const testsCompleted = Math.max(snapshot.quizResponses.length, completedEvents.length);
    const completionRate =
      testsStarted > 0 ? Math.round((testsCompleted / testsStarted) * 100) : 0;

    const totalOrders = snapshot.orders.length;
    const confirmedOrders = snapshot.orders.filter((o) => o.orderType === 'order');
    const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.totalInr, 0);
    const estimatedVariableCost =
      confirmedOrders.length * rulesData.starterKitConfig.estimatedVariableCostInr;
    const conversionRate =
      testsCompleted > 0 ? Math.round((totalOrders / testsCompleted) * 100) : 0;

    const fbCount = snapshot.feedback.length;
    const avgRelevance =
      fbCount > 0
        ? (
            snapshot.feedback.reduce((sum, f) => sum + f.relevanceScore, 0) / fbCount
          ).toFixed(1)
        : '0.0';
    const relevantPct =
      fbCount > 0
        ? Math.round(
            (snapshot.feedback.filter((f) => f.relevanceScore >= 4).length / fbCount) * 100
          )
        : 0;
    const tryYesPct =
      fbCount > 0
        ? Math.round(
            (snapshot.feedback.filter((f) => f.wouldTry === 'Yes').length / fbCount) * 100
          )
        : 0;
    const avgWtp =
      fbCount > 0
        ? Math.round(
            snapshot.feedback.reduce((sum, f) => sum + f.willingnessToPayInr, 0) / fbCount
          )
        : 0;

    // Skin type & concern counts
    const skinTypeCounts: Record<string, number> = {};
    const concernCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    snapshot.quizResponses.forEach((r) => {
      skinTypeCounts[r.skinType] = (skinTypeCounts[r.skinType] || 0) + 1;
      r.concerns.forEach((c) => {
        concernCounts[c] = (concernCounts[c] || 0) + 1;
      });
      const src = r.utmSource || 'direct';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const sortEntries = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]);

    return {
      testsStarted,
      testsCompleted,
      completionRate,
      totalOrders,
      totalRevenue,
      estimatedVariableCost,
      conversionRate,
      fbCount,
      avgRelevance,
      relevantPct,
      tryYesPct,
      avgWtp,
      topSkinTypes: sortEntries(skinTypeCounts),
      topConcerns: sortEntries(concernCounts),
      leadSources: sortEntries(sourceCounts),
    };
  }, [snapshot]);

  if (!unlocked) {
    return (
      <section className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-[#DDE3D7] rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 text-[#3F624D]">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-semibold">ADMIN DASHBOARD</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1C241E]">
            Enter Founder Passcode
          </h1>
          <p className="text-sm text-[#525C54]">
            Protected validation analytics, funnel conversions, lead sources, and CSV exports.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Passcode (default: facecheck2026)"
              className="w-full px-4 py-3 rounded-xl border border-[#DDE3D7] text-sm font-mono"
            />
            {passcodeError && <p className="text-xs text-[#DF5A47]">{passcodeError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1C241E] text-white text-sm font-semibold hover:bg-[#3F624D]"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[#3F624D]">
            DATA SOURCE: {snapshot.source === 'firestore' ? 'LIVE FIRESTORE' : 'LOCAL SESSION'}
            {authUser ? ` · ${authUser.email}` : ''}
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#1C241E] mt-1">
            Validation & Funnel Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!authUser ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="px-4 py-2 rounded-xl bg-[#DF5A47] text-white text-xs font-semibold hover:bg-[#C84A38]"
            >
              Sign in with Google (Live Firestore)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signOutAdmin()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDE3D7] bg-white text-xs font-medium text-[#1C241E]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDE3D7] bg-white text-xs font-medium text-[#1C241E] hover:bg-[#F1F3EE]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSeedProducts}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C241E] text-white text-xs font-medium hover:bg-[#3F624D]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Sync 14 Products to DB</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-[#F1F3EE] border border-[#3F624D]/30 text-xs font-medium text-[#3F624D]">
          {syncMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#DF5A47]/10 border border-[#DF5A47]/30 text-xs font-medium text-[#C84A38]">
          {errorMessage}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-1">
          <p className="text-xs text-[#525C54]">Tests Started / Completed</p>
          <p className="font-mono text-2xl font-bold text-[#1C241E] tabular-nums">
            {metrics.testsStarted} / {metrics.testsCompleted}
          </p>
          <p className="font-mono text-xs text-[#3F624D] tabular-nums">
            {metrics.completionRate}% completion rate
          </p>
        </div>

        <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-1">
          <p className="text-xs text-[#525C54]">Orders & Inquiries</p>
          <p className="font-mono text-2xl font-bold text-[#1C241E] tabular-nums">
            {metrics.totalOrders}
          </p>
          <p className="font-mono text-xs text-[#3F624D] tabular-nums">
            {metrics.conversionRate}% conversion rate
          </p>
        </div>

        <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-1">
          <p className="text-xs text-[#525C54]">Order Revenue (Est. Cost)</p>
          <p className="font-mono text-2xl font-bold text-[#1C241E] tabular-nums">
            ₹{metrics.totalRevenue}
          </p>
          <p className="font-mono text-xs text-[#525C54] tabular-nums">
            Est. cost ₹{metrics.estimatedVariableCost} (@₹450)
          </p>
        </div>

        <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-1">
          <p className="text-xs text-[#525C54]">Validation Targets</p>
          <p className="font-mono text-lg font-bold text-[#1C241E] tabular-nums">
            {metrics.relevantPct}% relevant · {metrics.tryYesPct}% try
          </p>
          <p className="font-mono text-xs text-[#525C54] tabular-nums">
            Avg {metrics.avgRelevance}/5 · WTP ₹{metrics.avgWtp}
          </p>
        </div>
      </div>

      {/* Validation Progress & CSV Exports */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F1F3EE] border border-[#DDE3D7] rounded-2xl p-4 sm:p-5">
        <div className="text-xs sm:text-sm text-[#1C241E] space-y-1">
          <p className="font-semibold">MVP Success Checkpoints</p>
          <p className="text-[#525C54]">
            Target ≥70% rated relevant (≥4/5):{' '}
            <span className="font-mono font-semibold text-[#1C241E] tabular-nums">
              {metrics.relevantPct}%
            </span>{' '}
            · Target ≥50% intend to try:{' '}
            <span className="font-mono font-semibold text-[#1C241E] tabular-nums">
              {metrics.tryYesPct}%
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={snapshot.quizResponses.length === 0}
            onClick={() =>
              exportToCsv(
                'face-check-bite-quiz-responses.csv',
                snapshot.quizResponses as unknown as Record<string, unknown>[]
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DDE3D7] text-xs font-medium text-[#1C241E] disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Quiz CSV</span>
          </button>
          <button
            type="button"
            disabled={snapshot.orders.length === 0}
            onClick={() =>
              exportToCsv(
                'face-check-bite-orders.csv',
                snapshot.orders as unknown as Record<string, unknown>[]
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DDE3D7] text-xs font-medium text-[#1C241E] disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Orders CSV</span>
          </button>
          <button
            type="button"
            disabled={snapshot.feedback.length === 0}
            onClick={() =>
              exportToCsv(
                'face-check-bite-feedback.csv',
                snapshot.feedback as unknown as Record<string, unknown>[]
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DDE3D7] text-xs font-medium text-[#1C241E] disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Feedback CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#DDE3D7] pb-3 overflow-x-auto">
        {(
          [
            { id: 'overview', label: 'Breakdowns & Lead Sources' },
            { id: 'responses', label: `Quiz Responses (${snapshot.quizResponses.length})` },
            { id: 'orders', label: `Orders (${snapshot.orders.length})` },
            { id: 'feedback', label: `Feedback (${snapshot.feedback.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
              activeTab === t.id
                ? 'bg-[#1C241E] text-white'
                : 'text-[#525C54] hover:bg-[#F1F3EE]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-[#1C241E]">
              Most Common Skin Types
            </h2>
            {metrics.topSkinTypes.length === 0 ? (
              <p className="text-xs text-[#525C54]">No completed tests yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {metrics.topSkinTypes.map(([label, count]) => (
                  <li key={label} className="flex justify-between border-b border-[#F1F3EE] pb-1.5">
                    <span className="capitalize">{label}</span>
                    <span className="font-mono tabular-nums font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-[#1C241E]">Top Concerns</h2>
            {metrics.topConcerns.length === 0 ? (
              <p className="text-xs text-[#525C54]">No concerns logged yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {metrics.topConcerns.map(([label, count]) => (
                  <li key={label} className="flex justify-between border-b border-[#F1F3EE] pb-1.5">
                    <span className="capitalize">{label}</span>
                    <span className="font-mono tabular-nums font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-[#DDE3D7] rounded-2xl p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-[#1C241E]">
              Lead Sources (UTM / QR)
            </h2>
            {metrics.leadSources.length === 0 ? (
              <p className="text-xs text-[#525C54]">No attributed tests yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {metrics.leadSources.map(([src, count]) => (
                  <li key={src} className="flex justify-between border-b border-[#F1F3EE] pb-1.5">
                    <span className="font-mono text-xs">{src}</span>
                    <span className="font-mono tabular-nums font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="bg-white border border-[#DDE3D7] rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F3EE] text-[#525C54]">
              <tr>
                <th className="p-3.5 font-semibold">Date</th>
                <th className="p-3.5 font-semibold">Profile</th>
                <th className="p-3.5 font-semibold">Concerns</th>
                <th className="p-3.5 font-semibold">Budget</th>
                <th className="p-3.5 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3EE]">
              {snapshot.quizResponses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#525C54]">
                    No quiz submissions recorded yet.
                  </td>
                </tr>
              ) : (
                snapshot.quizResponses.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3.5 font-mono tabular-nums text-[#525C54]">
                      {r.createdAtIso.slice(0, 10)}
                    </td>
                    <td className="p-3.5 font-medium text-[#1C241E]">
                      {r.skinType} · {r.skinTone}/{r.undertone} · {r.gender}
                    </td>
                    <td className="p-3.5 text-[#525C54]">{r.concerns.join(', ')}</td>
                    <td className="p-3.5 font-mono tabular-nums">₹{r.budgetRange}</td>
                    <td className="p-3.5 font-mono text-[#3F624D]">{r.utmSource}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border border-[#DDE3D7] rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F3EE] text-[#525C54]">
              <tr>
                <th className="p-3.5 font-semibold">Order #</th>
                <th className="p-3.5 font-semibold">Customer</th>
                <th className="p-3.5 font-semibold">City / Mode</th>
                <th className="p-3.5 font-semibold">Total</th>
                <th className="p-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3EE]">
              {snapshot.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#525C54]">
                    No orders or pre-launch inquiries yet.
                  </td>
                </tr>
              ) : (
                snapshot.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3.5 font-mono font-semibold text-[#1C241E]">
                      {o.orderNumber}
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-[#1C241E]">{o.customerName}</p>
                      <p className="font-mono text-[#525C54]">{o.phone}</p>
                    </td>
                    <td className="p-3.5 text-[#525C54]">
                      {o.city} · {o.paymentMethod.toUpperCase()}
                    </td>
                    <td className="p-3.5 font-mono font-semibold tabular-nums">₹{o.totalInr}</td>
                    <td className="p-3.5">
                      <select
                        value={o.status}
                        disabled={snapshot.source !== 'firestore'}
                        onChange={(e) =>
                          handleOrderStatusChange(o.id, e.target.value as OrderRecord['status'])
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#DDE3D7] bg-[#FAF9F5] text-xs font-medium"
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="interest_recorded">interest_recorded</option>
                        <option value="dispatched">dispatched</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white border border-[#DDE3D7] rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F3EE] text-[#525C54]">
              <tr>
                <th className="p-3.5 font-semibold">Date</th>
                <th className="p-3.5 font-semibold">Relevance</th>
                <th className="p-3.5 font-semibold">Would Try</th>
                <th className="p-3.5 font-semibold">WTP (₹)</th>
                <th className="p-3.5 font-semibold">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3EE]">
              {snapshot.feedback.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#525C54]">
                    No feedback submitted yet.
                  </td>
                </tr>
              ) : (
                snapshot.feedback.map((f) => (
                  <tr key={f.id}>
                    <td className="p-3.5 font-mono tabular-nums text-[#525C54]">
                      {f.createdAtIso.slice(0, 10)}
                    </td>
                    <td className="p-3.5 font-mono font-semibold tabular-nums">
                      {f.relevanceScore}/5
                    </td>
                    <td className="p-3.5 font-medium">{f.wouldTry}</td>
                    <td className="p-3.5 font-mono tabular-nums">₹{f.willingnessToPayInr}</td>
                    <td className="p-3.5 text-[#525C54] max-w-xs">{f.comment || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
