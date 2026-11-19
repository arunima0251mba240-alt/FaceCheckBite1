import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import type { AppView } from '@/src/types/skincare';

interface NavbarProps {
  activeView: AppView;
  hasProfile: boolean;
  cartCount: number;
  onNavigate: (view: AppView) => void;
  onOpenCart: () => void;
}

export function Navbar({
  activeView,
  hasProfile,
  cartCount,
  onNavigate,
  onOpenCart,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: AppView; label: string }[] = [
    { id: 'landing', label: 'Home' },
    { id: 'quiz', label: 'Skin Fit Test' },
    ...(hasProfile ? [{ id: 'results' as AppView, label: 'My Routine' }] : []),
    { id: 'catalogue', label: 'Catalogue' },
    { id: 'campaign', label: 'Share & QR' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleNav = (view: AppView) => {
    setMobileOpen(false);
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-sm border-b border-[#DDE3D7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNav('landing')}
          className="font-serif text-xl font-semibold tracking-tight text-[#1C241E] whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3F624D]"
        >
          Face Check Bite
        </button>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
          {navItems.slice(0, 5).map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 pb-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3F624D] ${
                  isActive
                    ? 'text-[#1C241E] border-b-2 border-[#DF5A47]'
                    : 'text-[#525C54] hover:text-[#1C241E]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {navItems.length > 5 && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`text-sm font-medium whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                activeView === 'admin'
                  ? 'text-[#1C241E] border-b-2 border-[#DF5A47]'
                  : 'text-[#525C54] hover:text-[#1C241E]'
              }`}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Bag action + mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1C241E] text-[#FAF9F5] text-sm font-medium hover:bg-[#2F3B32] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#DDE3D7] text-[#1C241E] hover:bg-[#F1F3EE]"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#DDE3D7] bg-[#FAF9F5] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-[#E4E8DF] text-[#1C241E]'
                  : 'text-[#525C54] hover:bg-[#F1F3EE]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
