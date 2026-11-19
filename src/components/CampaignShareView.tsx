import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface CampaignShareViewProps {
  onStartQuizWithSource: (source: string) => void;
}

export function CampaignShareView({ onStartQuizWithSource }: CampaignShareViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://facecheckbite.in';

  const campaigns = [
    {
      id: 'instagram',
      title: 'Instagram Bio & Reels Link',
      utmSource: 'instagram',
      subtitle: 'Track arrivals from Instagram bio, creator reels, and Stories.',
      url: `${origin}/?utm_source=instagram&utm_medium=social&utm_campaign=ig_launch`,
    },
    {
      id: 'campus',
      title: 'Delhi NCR Campus QR Poster',
      utmSource: 'campus',
      subtitle: 'Print-ready QR code for North Campus, South Campus, and hostel noticeboards.',
      url: `${origin}/?utm_source=campus&utm_medium=qr_poster&utm_campaign=delhi_ncr_campus&qr=campus`,
    },
    {
      id: 'referral',
      title: 'Friend Referral Link (₹50 Off)',
      utmSource: 'referral',
      subtitle: 'Share with friends — auto-applies code FCB50 for ₹50 off any kit.',
      url: `${origin}/?ref=FCB50&utm_source=referral&utm_medium=word_of_mouth`,
    },
  ];

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C241E]">
          Referral & Campaign QR Toolkit
        </h1>
        <p className="text-sm sm:text-base text-[#525C54] mt-2">
          Use these tracked QR codes and links across Instagram, Delhi NCR college campuses, and
          friend referrals. Every visit logs source attribution into the Admin Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-white border border-[#DDE3D7] rounded-2xl p-6 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs font-semibold text-[#3F624D]">
                  SOURCE: {camp.utmSource.toUpperCase()}
                </p>
                <h2 className="font-serif text-xl font-semibold text-[#1C241E] mt-1">
                  {camp.title}
                </h2>
                <p className="text-sm text-[#525C54] mt-1">{camp.subtitle}</p>
              </div>

              <div className="bg-[#FAF9F5] border border-[#DDE3D7] rounded-xl p-5 flex justify-center">
                <QRCodeSVG value={camp.url} size={156} fgColor="#1C241E" bgColor="#FAF9F5" />
              </div>

              <p className="font-mono text-xs text-[#525C54] break-all bg-[#F1F3EE] p-2.5 rounded-lg">
                {camp.url}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCopy(camp.id, camp.url)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#DDE3D7] bg-white text-xs font-semibold text-[#1C241E] hover:bg-[#F1F3EE]"
              >
                {copiedId === camp.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3F624D]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onStartQuizWithSource(camp.utmSource)}
                className="px-4 py-2.5 rounded-xl bg-[#DF5A47] text-white text-xs font-semibold hover:bg-[#C84A38] whitespace-nowrap shrink-0"
              >
                Test Flow
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
