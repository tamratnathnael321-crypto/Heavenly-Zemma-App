import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Send,
  Users,
  ExternalLink,
  Music,
  Disc,
  User,
  ListMusic,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { CoverArtTile } from '../Common/CoverArtTile';

export const ShareModal: React.FC = () => {
  const {
    shareTarget,
    closeShareModal,
    showToast,
    sendInAppShare,
    artists,
  } = useMusic();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'external' | 'in_app'>('external');
  const [selectedRecipient, setSelectedRecipient] = useState(artists[0]?.name || '');
  const [shareNote, setShareNote] = useState('');
  const [customRecipient, setCustomRecipient] = useState('');

  if (!shareTarget) return null;

  // Build the deep link URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://heavenlyzemma.app';
  const paramKey = shareTarget.type;
  const shareUrl = `${baseUrl}?${paramKey}=${encodeURIComponent(shareTarget.id)}`;

  const shareTitle = `Heavenly Zemma · ${shareTarget.title}`;
  const shareText = `Listen to "${shareTarget.title}"${shareTarget.subtitle ? ` by ${shareTarget.subtitle}` : ''} on Heavenly Zemma:`;

  const communityRecipients = artists.slice(0, 4).map((a) => ({
    name: a.name,
    role: 'Artist',
    avatar: a.name.charAt(0).toUpperCase(),
  }));

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Unable to copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        showToast('Shared successfully!');
        closeShareModal();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendInApp = (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = customRecipient.trim() || selectedRecipient;
    if (!recipient) return;

    sendInAppShare(shareTarget, recipient, shareNote);
    showToast(`Shared "${shareTarget.title}" with ${recipient}!`);
    closeShareModal();
  };

  const getTypeIcon = () => {
    switch (shareTarget.type) {
      case 'song':
        return <Music size={14} className="text-[#1ed760]" />;
      case 'album':
        return <Disc size={14} className="text-[#1ed760]" />;
      case 'artist':
        return <User size={14} className="text-[#1ed760]" />;
      case 'playlist':
        return <ListMusic size={14} className="text-[#1ed760]" />;
    }
  };

  const getPlatformShares = () => [
    {
      name: 'SMS / Text',
      icon: MessageSquare,
      color: 'bg-emerald-600 hover:bg-emerald-500',
      action: () => {
        const smsUrl = `sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.open(smsUrl, '_blank');
      },
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-[#25D366] hover:opacity-90',
      action: () => {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.open(waUrl, '_blank');
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#229ED9] hover:opacity-90',
      action: () => {
        const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(tgUrl, '_blank');
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-slate-700 hover:bg-slate-600',
      action: () => {
        const mailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        window.open(mailUrl, '_blank');
      },
    },
    {
      name: 'X (Twitter)',
      icon: ExternalLink,
      color: 'bg-black hover:bg-neutral-800 border border-neutral-700',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 select-none">
      <div className="w-full sm:max-w-md bg-[#181818] border border-[#282828] rounded-t-2xl sm:rounded-2xl overflow-hidden pb-safe flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <Share2 size={18} className="text-[#1ed760]" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Share {shareTarget.type.charAt(0).toUpperCase() + shareTarget.type.slice(1)}
            </h3>
          </div>
          <button
            onClick={closeShareModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white hover:bg-[#242424]"
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Item Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#202020] border border-[#2c2c2c]">
            <div className="w-14 h-14 shrink-0">
              <CoverArtTile
                src={shareTarget.image_url}
                title={shareTarget.title}
                type={shareTarget.type}
                className="w-14 h-14"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#1ed760]">
                {getTypeIcon()}
                <span>{shareTarget.type}</span>
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-0.5">
                {shareTarget.title}
              </h4>
              {shareTarget.subtitle && (
                <p className="text-xs text-[#a7a7a7] truncate">{shareTarget.subtitle}</p>
              )}
            </div>
          </div>

          {/* Tab Selector: External Apps vs In-App Community Share */}
          <div className="grid grid-cols-2 p-1 bg-[#121212] rounded-lg border border-[#242424]">
            <button
              onClick={() => setActiveTab('external')}
              className={`py-2 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'external'
                  ? 'bg-[#252525] text-white shadow-sm'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Apps & Social
            </button>
            <button
              onClick={() => setActiveTab('in_app')}
              className={`py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'in_app'
                  ? 'bg-[#252525] text-[#1ed760] shadow-sm'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>In-App Community</span>
            </button>
          </div>

          {activeTab === 'external' ? (
            <div className="space-y-4">
              <button
                onClick={handleNativeShare}
                className="w-full h-11 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Share2 size={16} />
                <span>Open System Share Sheet</span>
              </button>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                  Shareable Link
                </span>
                <div className="flex items-center gap-2 p-1.5 pl-3 rounded-lg bg-[#121212] border border-[#282828]">
                  <span className="text-xs font-mono text-[#a7a7a7] truncate flex-1">
                    {shareUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#252525] hover:bg-[#303030] text-xs font-semibold text-white transition-colors shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-[#1ed760]" />
                        <span className="text-[#1ed760]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                  Send Via
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {getPlatformShares().map((plat, idx) => {
                    const Icon = plat.icon;
                    return (
                      <button
                        key={idx}
                        onClick={plat.action}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-white transition-transform active:scale-95 ${plat.color}`}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="truncate">{plat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendInApp} className="space-y-4">
              {communityRecipients.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                    Select Contact
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {communityRecipients.map((rec) => {
                      const isSelected = selectedRecipient === rec.name && !customRecipient;
                      return (
                        <button
                          type="button"
                          key={rec.name}
                          onClick={() => {
                            setSelectedRecipient(rec.name);
                            setCustomRecipient('');
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                            isSelected
                              ? 'bg-[#1ed760]/10 border-[#1ed760] text-white'
                              : 'bg-[#202020] border-[#2c2c2c] text-[#a7a7a7] hover:border-[#444]'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#303030] text-[#1ed760] flex items-center justify-center text-xs font-bold shrink-0">
                            {rec.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">{rec.name}</div>
                            <div className="text-[10px] text-[#888] truncate">{rec.role}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                  Or Enter Listener Username
                </label>
                <input
                  type="text"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  placeholder="e.g. Samuel K., Sunday Group..."
                  className="w-full h-10 px-3.5 rounded-lg bg-[#141414] text-white text-xs placeholder-[#666] border border-[#2c2c2c] focus:outline-none focus:border-[#1ed760]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                  Add a Personal Note (Optional)
                </label>
                <textarea
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="Listen to this song..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg bg-[#141414] text-white text-xs placeholder-[#666] border border-[#2c2c2c] focus:outline-none focus:border-[#1ed760] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors flex items-center justify-center gap-2"
              >
                <Send size={15} />
                <span>Send to {customRecipient.trim() || selectedRecipient}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
