import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import BusinessSearchInput from '../components/BusinessSearchInput';
import { fetchCategories } from '../api/categories';
import { findOrCreateBusiness } from '../api/businesses';
import { getUploadUrl, uploadFileToS3 } from '../api/upload';
import { createDeal } from '../api/deals';
import { fetchMe } from '../api/auth';
import { fetchSubscriptionStatus } from '../api/subscriptions';
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

export default function CreateDeal() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [isUnlimited, setIsUnlimited] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [business, setBusiness] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [caption, setCaption] = useState('');
  const [discountTags, setDiscountTags] = useState([]);
  const [validDays, setValidDays] = useState([]); // empty array = "Any"
  const [postType, setPostType] = useState('deal');

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

    fetchSubscriptionStatus()
      .then((sub) => setIsUnlimited(sub.plan === 'unlimited'))
      .catch(() => setIsUnlimited(false));
  }, []);

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

  const canSubmit =
    photoFile && business && categoryId && subcategoryId && caption.trim().length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      // 1. Get a presigned S3 URL and upload the actual photo bytes to it.
      const { uploadUrl, publicUrl } = await getUploadUrl(photoFile.type);
      await uploadFileToS3(uploadUrl, photoFile);

      // 2. Find-or-create the business by Google Place ID.
      const businessRecord = await findOrCreateBusiness(business);

      // 3. Create the deal itself.
      await createDeal({
        businessId: businessRecord.id,
        categoryId: Number(categoryId),
        subcategoryId: Number(subcategoryId),
        caption: caption.trim(),
        imageUrl: publicUrl,
        discountTags: discountTags.length > 0 ? discountTags : undefined,
        validDaysOfWeek:
          isUnlimited && validDays.length > 0 ? validDays : undefined,
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
            className="relative w-full aspect-square bg-slate-100 rounded-xl border-2 border-slate-200 flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer"
          >
            {photoPreviewUrl ? (
              <img
                src={photoPreviewUrl}
                alt="Deal preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <Camera size={32} className="text-brand-gray" />
                <span className="text-brand-gray text-sm">Take or choose a photo</span>
              </>
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
          <BusinessSearchInput onSelect={setBusiness} selectedName={business?.name} />
          {business && (
            <p className="text-brand-gray text-xs mt-1">{business.address}</p>
          )}
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

        {/* Valid days of week - Unlimited only, grayed out otherwise as an upsell */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            Valid days <span className="text-brand-gray">(optional)</span>
          </label>
          <div
            className={`flex flex-wrap justify-center gap-2 ${
              !isUnlimited ? 'opacity-40 pointer-events-none' : ''
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
          {!isUnlimited && (
            <p className="text-brand-gray text-xs text-center mt-2">
              Upgrade to Frugull Unlimited to schedule specific days.
            </p>
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