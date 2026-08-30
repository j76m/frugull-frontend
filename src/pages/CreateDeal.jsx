import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import BusinessSearchInput from '../components/BusinessSearchInput';
import { fetchCategories } from '../api/categories';
import { findOrCreateBusiness } from '../api/businesses';
import { getUploadUrl, uploadFileToS3 } from '../api/upload';
import { createDeal, fetchPreviewAllowance } from '../api/deals';
import { fetchMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const DISCOUNT_TAGS = [
  { value: 'college', label: 'College' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'senior', label: 'Senior' },
  { value: 'military', label: 'Military' },
  { value: 'first_responder', label: 'First Responder' },
];

// Matches JS Date.getDay() convention: 0 = Sunday ... 6 = Saturday.
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const POST_TYPES = [
  { value: 'deal', label: 'Deal / Special' },
  { value: 'info', label: 'General Info' },
];

// Resizes and compresses a photo before upload - phone camera photos are
// often 3-4000px wide and several MB, but the app never displays them
// larger than ~500px, so this cuts file size dramatically (typically to
// 200-400KB) with no visible quality loss, improving load speed and
// cutting S3 storage/bandwidth costs as the app grows.
async function compressImage(file, maxDimension = 1600, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}

// Formats a Date as YYYY-MM-DD for use in an <input type="date"> value/min/max.
function toDateInputValue(date) {
  return date.toISOString().split('T')[0];
}

export default function CreateDeal() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [business, setBusiness] = useState(null); // raw Google Place result, for display
  const [businessRecord, setBusinessRecord] = useState(null); // real DB row, for API calls
  const [businessError, setBusinessError] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [caption, setCaption] = useState('');
  const [discountTags, setDiscountTags] = useState([]);
  const [validDays, setValidDays] = useState([]); // empty array = "Any"
  const [postType, setPostType] = useState('deal');

  const [allowance, setAllowance] = useState(null); // { allowed, method, maxDurationDays }
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [durationDays, setDurationDays] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((results) => {
        // Hidden for this phase of launch — not deleted from the database,
        // just kept out of the picker while focus stays on categories that
        // actually drive real deal volume. Easy to re-enable later by
        // removing names from this list.
        const HIDDEN_CATEGORIES = new Set([
          'For Sale by Owner',
          'Employment',
          'Public Art',
          'Property Rental',
          'Home Care',
        ]);
        setCategories(results.filter((c) => !HIDDEN_CATEGORIES.has(c.name)));
      })
      .catch(() => setCategoriesError('Could not load categories.'));
  }, []);

  // Fetches an accurate preview of which posting method (Free/Credit/
  // Unlimited) applies and what duration is allowed, as soon as both a
  // business and subcategory are chosen - since Free-tier eligibility
  // depends on that specific business+subcategory combo, not just the
  // user's subscription status.
  useEffect(() => {
    if (!businessRecord?.id || !subcategoryId) {
      setAllowance(null);
      setDurationDays(null);
      return;
    }
    setAllowanceLoading(true);
    fetchPreviewAllowance(businessRecord.id, subcategoryId)
      .then((result) => {
        setAllowance(result);
        setDurationDays(result.method !== 'free' ? result.maxDurationDays : null);
      })
      .catch(() => setAllowance(null))
      .finally(() => setAllowanceLoading(false));
  }, [businessRecord?.id, subcategoryId]);

  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      setPhotoPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      // Fall back to the original file if compression fails for any reason.
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  }

  // Finds-or-creates the business record as soon as it's selected (rather
  // than waiting for final submit) so we have a real database ID to check
  // the accurate posting-allowance preview against.
  async function handleBusinessSelect(place) {
    setBusiness(place);
    setBusinessRecord(null);
    setBusinessError('');
    try {
      const record = await findOrCreateBusiness(place);
      setBusinessRecord(record);
    } catch {
      setBusinessError('Could not look up this business. Try selecting it again.');
    }
  }

  function handleCategoryChange(e) {
    setCategoryId(e.target.value);
    setSubcategoryId(''); // reset subcategory whenever the category changes
  }

  function toggleDiscountTag(value) {
    setDiscountTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  }

  function toggleDay(value) {
    setValidDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  }

  function handleDurationDateChange(e) {
    if (!allowance || allowance.method === 'free') return;
    const chosen = new Date(e.target.value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((chosen - today) / (1000 * 60 * 60 * 24));
    const clamped = Math.min(Math.max(diffDays, 1), allowance.maxDurationDays);
    setDurationDays(clamped);
  }

  const canSubmit =
    photoFile &&
    businessRecord &&
    categoryId &&
    subcategoryId &&
    caption.trim().length > 0 &&
    !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      // 1. Get a presigned S3 URL and upload the actual photo bytes to it.
      const { uploadUrl, publicUrl } = await getUploadUrl(photoFile.type);
      await uploadFileToS3(uploadUrl, photoFile);

      // 2. Create the deal - businessRecord was already found-or-created
      // when the business was selected, so we reuse its id here.
      await createDeal({
        businessId: businessRecord.id,
        categoryId: Number(categoryId),
        subcategoryId: Number(subcategoryId),
        caption: caption.trim(),
        imageUrl: publicUrl,
        discountTags: discountTags.length > 0 ? discountTags : undefined,
        validDaysOfWeek: validDays.length > 0 ? validDays : undefined,
        requestedDurationDays: durationDays || undefined,
        postType,
      });

      // Points were just awarded server-side — reflect that in the
      // Profile screen without waiting for a full page reload.
      try {
        const { user: freshUser } = await fetchMe();
        setUser(freshUser);
        localStorage.setItem('frugull_user', JSON.stringify(freshUser));
      } catch {
        // Non-critical — Profile will still show the old point count
        // until next login if this refresh fails.
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong posting this deal.');
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = allowance ? new Date(today) : null;
  if (maxDate && allowance) maxDate.setDate(maxDate.getDate() + allowance.maxDurationDays);
  const selectedDate = durationDays
    ? (() => {
        const d = new Date(today);
        d.setDate(d.getDate() + durationDays);
        return d;
      })()
    : null;

  return (
    <AppLayout>
      <TopNav leftLabel="Cancel" onLeft={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-5">
        {/* Photo capture */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer"
          >
            {photoPreviewUrl ? (
              <img
                src={photoPreviewUrl}
                alt="Deal preview"
                className="w-full h-auto max-h-[60vh] object-contain block"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <Camera size={32} className="text-brand-gray" />
                <span className="text-brand-gray text-sm">Take or choose a photo</span>
              </div>
            )}
          </button>
        </div>

        {/* Post type */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">Post type</label>
          <div className="flex flex-wrap justify-center gap-2">
            {POST_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setPostType(type.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                  postType === type.value
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Business */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">Business</label>
          <BusinessSearchInput onSelect={handleBusinessSelect} selectedName={business?.name} />
          {business && (
            <p className="text-brand-gray text-xs mt-1">{business.address}</p>
          )}
          {businessError && <p className="text-red-500 text-xs mt-1">{businessError}</p>}
        </div>

        {/* Category / Subcategory */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="w-full rounded-xl bg-white border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-brand-link"
            >
              <option value="">Select...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Subcategory</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!selectedCategory}
              className="w-full rounded-xl bg-white border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-brand-link disabled:bg-slate-100 disabled:text-brand-gray"
            >
              <option value="">Select...</option>
              {selectedCategory?.subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {categoriesError && <p className="text-red-500 text-sm">{categoriesError}</p>}

        {/* Caption */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">Description</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What's the deal?"
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link resize-none"
          />
        </div>

        {/* Discount tags */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            Discounts offered <span className="text-brand-gray">(optional)</span>
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            {DISCOUNT_TAGS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleDiscountTag(tag.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                  discountTags.includes(tag.value)
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Valid days of week - only meaningful for non-Free posts */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            Valid days <span className="text-brand-gray">(optional)</span>
          </label>
          <div
            className={`flex flex-wrap justify-center gap-2 ${
              !allowance || allowance.method === 'free' ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setValidDays([])}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                validDays.length === 0
                  ? 'bg-brand-navy text-white border-brand-navy'
                  : 'bg-white text-brand-navy border-brand-link'
              }`}
            >
              Any
            </button>
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                  validDays.includes(day.value)
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {(!allowance || allowance.method === 'free') && (
            <p className="text-brand-gray text-xs text-center mt-2">
              {businessRecord && subcategoryId
                ? 'Free posts run for a fixed window and can\'t be limited to specific days. Upgrade to Frugull Unlimited or use a credit for this.'
                : 'Select a business and subcategory to see day options.'}
            </p>
          )}
        </div>

        {/* Expiration date - shows once we know which method (Free/Credit/
            Unlimited) applies, since that determines whether it's fixed or
            choosable and what the max is. */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">Runs until</label>
          {!businessRecord || !subcategoryId ? (
            <p className="text-brand-gray text-sm">
              Select a business and subcategory to see how long this post can run.
            </p>
          ) : allowanceLoading ? (
            <p className="text-brand-gray text-sm">Checking...</p>
          ) : allowance?.method === 'free' ? (
            <p className="text-brand-navy text-sm">
              {postType === 'info' ? '30 days' : '7 days'} (fixed for Frugull Free)
            </p>
          ) : allowance ? (
            <>
              <input
                type="date"
                value={selectedDate ? toDateInputValue(selectedDate) : ''}
                min={toDateInputValue(tomorrow)}
                max={maxDate ? toDateInputValue(maxDate) : undefined}
                onChange={handleDurationDateChange}
                className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
              />
              <p className="text-brand-gray text-xs mt-1">
                Up to {allowance.maxDurationDays} days from today
                {allowance.method === 'credit' ? ' (using 1 credit)' : ' (Frugull Unlimited)'}.
              </p>
            </>
          ) : (
            <p className="text-red-500 text-sm">Could not check posting options. Try again.</p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center">Posted!</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-brand-link text-white font-semibold py-3 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : postType === 'info' ? 'Post Info' : 'Post Deal'}
        </button>
      </form>
    </AppLayout>
  );
}