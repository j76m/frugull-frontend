import { useState } from 'react';
import { X, MapPin, Phone, Globe, Share2, Mail, Link2, Flag, Heart, Download } from 'lucide-react';
import { submitReport } from '../api/reports';
import logoImg from '../assets/frugull-logo.png';

const REPORT_REASONS = [
  { value: 'deal_no_longer_valid', label: 'Deal is no longer valid' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Fetches the deal photo and stamps a white "Find this on [frugull logo]"
// badge onto the bottom-right corner via canvas - only the copy that
// leaves the app (downloaded or shared) gets watermarked; the original in
// the database and everything shown inside the app stays clean.
async function getWatermarkedBlob(imageUrl) {
  const response = await fetch(imageUrl, { cache: 'no-store' });
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const logo = await loadImage(logoImg);
  const logoWidth = Math.round(canvas.width * 0.22);
  const logoHeight = Math.round(logoWidth * (logo.height / logo.width));
  const fontSize = Math.max(14, Math.round(canvas.width * 0.022));
  const padding = Math.round(canvas.width * 0.02);
  const gap = Math.round(fontSize * 0.4);

  const label = 'Shared from';
  ctx.font = `600 ${fontSize}px sans-serif`;
  const labelWidth = ctx.measureText(label).width;

  const boxWidth = Math.max(labelWidth, logoWidth) + padding * 2;
  const boxHeight = fontSize + gap + logoHeight + padding * 2;
  const boxX = canvas.width - boxWidth - padding;
  const boxY = canvas.height - boxHeight - padding;
  const radius = Math.round(padding * 0.8);

  // White rounded badge behind the text/logo so it stays legible over any photo.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
  } else {
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
  }
  ctx.fill();

  ctx.fillStyle = '#1E3A54';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, boxX + boxWidth / 2, boxY + padding * 0.6);

  ctx.drawImage(
    logo,
    boxX + (boxWidth - logoWidth) / 2,
    boxY + padding * 0.6 + fontSize + gap,
    logoWidth,
    logoHeight
  );

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

export default function DealDetailModal({ deal, onClose, isSaved, onToggleSave }) {
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  if (!deal) return null;

  const shareUrl = window.location.origin + '/?deal=' + deal.id;
  const shareText = deal.business_name + ' — ' + deal.subcategory_name;
  const locationLine = [deal.city, deal.state].filter(Boolean).join(', ');
  const directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + deal.latitude + ',' + deal.longitude;
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function handleShare() {
    let sharedWithFile = false;
    if (navigator.canShare && deal.image_url) {
      try {
        const watermarkedBlob = await getWatermarkedBlob(deal.image_url);
        const file = new File([watermarkedBlob], 'deal.jpg', { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: deal.business_name, text: shareText, files: [file] });
          sharedWithFile = true;
        }
      } catch {
        // Fall through to the URL-based share below.
      }
    }

    if (!sharedWithFile && navigator.share) {
      try {
        await navigator.share({ title: deal.business_name, text: shareText, url: shareUrl });
      } catch {
        // User cancelled the native share sheet.
      }
    }
  }

  // Downloads a watermarked copy of the deal photo to the user's device -
  // this is the universal path that works identically everywhere,
  // including Instagram, which doesn't accept shared photos from web apps.
  // Confirmed working: file downloads, then "More..." -> "Save Image" (or
  // the share icon -> "Save Image") in Safari's file view puts it in Photos.
  async function handleDownload() {
    if (!deal.image_url) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const watermarkedBlob = await getWatermarkedBlob(deal.image_url);
      const blobUrl = URL.createObjectURL(watermarkedBlob);
      const filename = deal.business_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-frugull.jpg';

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setDownloadError('Could not download photo. Try again.');
    } finally {
      setDownloading(false);
    }
  }

  function handleFacebookShare() {
    const url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleEmailShare() {
    const subject = encodeURIComponent('Check out this deal: ' + shareText);
    const body = encodeURIComponent(shareText + '\n\n' + deal.caption + '\n\n' + shareUrl);
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail silently (permissions, insecure context).
    }
  }

  async function handleSubmitReport() {
    setReportSubmitting(true);
    setReportError('');
    try {
      await submitReport({ dealId: deal.id, reason: reportReason });
      setReportDone(true);
    } catch {
      setReportError('Could not submit report. Try again.');
    } finally {
      setReportSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {deal.image_url && (
          <div className="relative">
            <img src={deal.image_url} alt={deal.business_name} className="w-full aspect-video object-cover" />
            <button type="button" onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center cursor-pointer">
              <X size={18} className="text-brand-navy" />
            </button>
            <button
              type="button"
              onClick={() => onToggleSave?.(deal)}
              aria-label={isSaved ? 'Remove from saved' : 'Save this deal'}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center cursor-pointer"
            >
              <Heart size={18} className={isSaved ? 'text-red-500 fill-red-500' : 'text-brand-navy'} />
            </button>
          </div>
        )}

        <div className="p-5">
          {!deal.image_url && (
            <div className="flex justify-between mb-2">
              <button
                type="button"
                onClick={() => onToggleSave?.(deal)}
                aria-label={isSaved ? 'Remove from saved' : 'Save this deal'}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <Heart size={18} className={isSaved ? 'text-red-500 fill-red-500' : 'text-brand-navy'} />
              </button>
              <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X size={18} className="text-brand-navy" />
              </button>
            </div>
          )}

          <p className="text-brand-navy font-bold text-xl">{deal.business_name}</p>
          <p className="text-brand-link font-medium text-sm mt-0.5">{deal.subcategory_name}</p>
          {locationLine && <p className="text-brand-gray text-sm mt-1">{locationLine}</p>}

          <p className="text-brand-navy text-sm mt-3">{deal.caption}</p>
          <p className="text-brand-gray text-xs mt-2">Posted by {deal.posted_by}</p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-brand-link text-white font-semibold py-3 cursor-pointer">
              <MapPin size={18} />
              Get Directions
            </a>
            {deal.phone && (
              <a href={'tel:' + deal.phone} className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-brand-navy text-sm font-medium py-2.5 cursor-pointer hover:bg-slate-200">
                <Phone size={15} />
                Call
              </a>
            )}
            {deal.website && (
              <a href={deal.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-brand-navy text-sm font-medium py-2.5 cursor-pointer hover:bg-slate-200">
                <Globe size={15} />
                Website
              </a>
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-brand-navy font-medium text-sm mb-2">Share this deal</p>

            {deal.image_url && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-navy text-white py-2.5 text-sm font-medium cursor-pointer disabled:opacity-50 mb-2"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download Photo to Post Yourself'}
              </button>
            )}
            {downloadError && <p className="text-red-500 text-xs mb-2">{downloadError}</p>}

            <div className="flex gap-2">
              {canNativeShare && (
                <button type="button" onClick={handleShare} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-brand-navy text-xs font-medium cursor-pointer hover:bg-slate-200">
                  <Share2 size={15} />
                  Share
                </button>
              )}
              {!canNativeShare && (
                <button type="button" onClick={handleFacebookShare} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-brand-navy text-xs font-medium cursor-pointer hover:bg-slate-200">
                  Facebook
                </button>
              )}
              {!canNativeShare && (
                <button type="button" onClick={handleEmailShare} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-brand-navy text-xs font-medium cursor-pointer hover:bg-slate-200">
                  <Mail size={15} />
                  Email
                </button>
              )}
              <button type="button" onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-brand-navy text-xs font-medium cursor-pointer hover:bg-slate-200">
                <Link2 size={15} />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-brand-gray text-[11px] mt-2">
              Download the photo, then tap "More..." → "Save Image" to add it to your camera roll and post it anywhere.
            </p>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            {!showReport && !reportDone && (
              <button type="button" onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-red-500 text-sm font-medium cursor-pointer hover:underline">
                <Flag size={15} />
                Report this deal
              </button>
            )}

            {reportDone && (
              <p className="text-brand-gray text-sm">Thanks — this report has been submitted.</p>
            )}

            {showReport && !reportDone && (
              <div className="space-y-3">
                <p className="text-brand-navy text-sm font-medium">Why are you reporting this?</p>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-link">
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {reportError && <p className="text-red-500 text-xs">{reportError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowReport(false)} className="flex-1 rounded-xl bg-slate-100 text-brand-navy text-sm font-medium py-2.5 cursor-pointer hover:bg-slate-200">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSubmitReport} disabled={reportSubmitting} className="flex-1 rounded-xl bg-red-500 text-white text-sm font-medium py-2.5 cursor-pointer disabled:opacity-50">
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}