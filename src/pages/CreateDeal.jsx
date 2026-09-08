import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import BusinessSearchInput from '../components/BusinessSearchInput';
import GpsLocationCapture from '../components/GpsLocationCapture';
import { fetchCategories } from '../api/categories';
import { findOrCreateBusiness } from '../api/businesses';
import { getUploadUrl, uploadFileToS3 } from '../api/upload';
import { createDeal, fetchPreviewAllowance } from '../api/deals';
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

function toDateInputValue(date) {
  return date.toISOString().split('T')[0];
}

export default function CreateDeal() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [plan, setPlan] = useState(null); // 'unlimited' | 'free' - gates multi-tagging UI
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');

  // Multi-tagging (Unlimited only): one post, additional category/
  // subcategory pairs beyond the primary one above. Each entry:
  // { categoryId, subcategoryId }.
  const [additionalTags, setAdditionalTags] = useState([]);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [postType, setPostType] = useState('deal');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');

  const [business, setBusiness] = useState(null);
  const [businessRecord, setBusinessRecord] = useState(null);
  const [businessError, setBusinessError] = useState('');

  const [locationMode, setLocationMode] = useState('search'); // 'search' | 'gps' - for GPS-enabled categories only
  const [gpsStandName, setGpsStandName] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsBusinessError, setGpsBusinessError] = useState('');

  const [caption, setCaption] = useState('');
  const [discountTags, setDiscountTags] = useState([]);
  const [validDays, setValidDays] = useState([]);

  const [allowance, setAllowance] = useState(null);
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [durationDays, setDurationDays] = useState(null);

  // "Date of" mode - currently Recreation-only. When active, the poster
  // picks the event's actual date instead of a "runs until" date, and the
  // backend automatically expires the post at midnight the following day.
  const [isEventDate, setIsEventDate] = useState(false);
  const [eventDate, setEventDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((results) => {
        const HIDDEN_CATEGORIES = new Set([
          'For Sale by Owner',
          'Public Art',
          'Property Rental',
          'Home Care',
        ]);
        setCategories(results.filter((c) => !HIDDEN_CATEGORIES.has(c.name)));
      })
      .catch(() => setCategoriesError('Could not load categories.'));

    fetchSubscriptionStatus()
      .then((sub) => setPlan(sub?.plan ?? 'free'))
      .catch(() => setPlan('free'));
  }, []);

  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));
  const usesGpsLocation = !!selectedCategory?.requires_gps_location;
  const allowsEventDate = selectedCategory?.name === 'Recreation';

  useEffect(() => {
    if (!usesGpsLocation) return;
    if (!gpsCoords || !gpsStandName.trim()) {
      setBusinessRecord(null);
      return;
    }
    setGpsBusinessError('');
    findOrCreateBusiness({
      name: gpsStandName.trim(),
      latitude: gpsCoords.lat,
      longitude: gpsCoords.lng,
    })
      .then(setBusinessRecord)
      .catch(() => setGpsBusinessError('Could not save this location. Try again.'));
  }, [usesGpsLocation, gpsCoords, gpsStandName]);

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

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      setPhotoPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  }

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

  function addAnotherCategory() {
    setAdditionalTags((prev) => [...prev, { categoryId: '', subcategoryId: '' }]);
  }

  function removeAdditionalTag(index) {
    setAdditionalTags((prev) => prev.filter((_, i) => i !== index));
  }

  function updateAdditionalTagCategory(index, newCategoryId) {
    setAdditionalTags((prev) =>
      prev.map((tag, i) => (i === index ? { categoryId: newCategoryId, subcategoryId: '' } : tag))
    );
  }

  function updateAdditionalTagSubcategory(index, newSubcategoryId) {
    setAdditionalTags((prev) =>
      prev.map((tag, i) => (i === index ? { ...tag, subcategoryId: newSubcategoryId } : tag))
    );
  }

  function handleCategoryChange(e) {
    setCategoryId(e.target.value);
    setSubcategoryId('');
    setBusiness(null);
    setBusinessRecord(null);
    setBusinessError('');
    setLocationMode('search');
    setGpsStandName('');
    setGpsCoords(null);
    setGpsBusinessError('');
    setIsEventDate(false);
    setEventDate('');
    setAdditionalTags([]);
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
      const { uploadUrl, publicUrl } = await getUploadUrl(photoFile.type);
      await uploadFileToS3(uploadUrl, photoFile);

      const validAdditionalTags = additionalTags
        .filter((t) => t.categoryId && t.subcategoryId)
        .map((t) => ({ categoryId: Number(t.categoryId), subcategoryId: Number(t.subcategoryId) }));

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
        isEventDate: allowsEventDate && isEventDate,
        eventDate: allowsEventDate && isEventDate ? eventDate : undefined,
        additionalTags: plan === 'unlimited' && validAdditionalTags.length > 0 ? validAdditionalTags : undefined,
      });

      try {
        const { user: freshUser } = await fetchMe();
        setUser(freshUser);
        localStorage.setItem('frugull_user', JSON.stringify(freshUser));
      } catch {
        // Non-critical
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

        {/* Multi-tagging (Unlimited only): one photo/post can advertise
            multiple, unrelated offerings (e.g. a sign showing both a food
            special and a drink special) by tagging additional category/
            subcategory pairs onto this same post. */}
        {plan === 'unlimited' && categoryId && (
          <div className="space-y-3">
            {additionalTags.map((tag, index) => {
              const tagCategory = categories.find((c) => String(c.id) === String(tag.categoryId));
              return (
                <div key={index} className="grid grid-cols-2 gap-3 items-start bg-slate-50 rounded-xl p-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Also tag as</label>
                    <select
                      value={tag.categoryId}
                      onChange={(e) => updateAdditionalTagCategory(index, e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-link"
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-start">
                    <select
                      value={tag.subcategoryId}
                      onChange={(e) => updateAdditionalTagSubcategory(index, e.target.value)}
                      disabled={!tagCategory}
                      className="flex-1 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-link disabled:bg-slate-100 disabled:text-brand-gray mt-5"
                    >
                      <option value="">Select...</option>
                      {tagCategory?.subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAdditionalTag(index)}
                      className="cursor-pointer text-red-500 text-sm font-medium mt-5 px-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addAnotherCategory}
              className="text-brand-link text-sm font-medium cursor-pointer hover:underline"
            >
              + Add another category
            </button>
          </div>
        )}

        {selectedCategory && (
          <div>
            {usesGpsLocation ? (
              <div>
                <div className="flex justify-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setLocationMode('search')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                      locationMode === 'search'
                        ? 'bg-brand-navy text-white border-brand-navy'
                        : 'bg-white text-brand-navy border-brand-link'
                    }`}
                  >
                    Search for it
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('gps')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                      locationMode === 'gps'
                        ? 'bg-brand-navy text-white border-brand-navy'
                        : 'bg-white text-brand-navy border-brand-link'
                    }`}
                  >
                    Use my location
                  </button>
                </div>

                {locationMode === 'search' ? (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Business</label>
                    <BusinessSearchInput onSelect={handleBusinessSelect} selectedName={business?.name} />
                    {business && <p className="text-brand-gray text-xs mt-1">{business.address}</p>}
                    {businessError && <p className="text-red-500 text-xs mt-1">{businessError}</p>}
                  </div>
                ) : (
                  <GpsLocationCapture
                    name={gpsStandName}
                    onNameChange={setGpsStandName}
                    onLocationReady={setGpsCoords}
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Business</label>
                <BusinessSearchInput onSelect={handleBusinessSelect} selectedName={business?.name} />
                {business && <p className="text-brand-gray text-xs mt-1">{business.address}</p>}
                {businessError && <p className="text-red-500 text-xs mt-1">{businessError}</p>}
              </div>
            )}
            {gpsBusinessError && <p className="text-red-500 text-xs mt-1">{gpsBusinessError}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={caption === 'See photo'}
              onChange={(e) => setCaption(e.target.checked ? 'See photo' : '')}
              className="w-4 h-4 accent-brand-link cursor-pointer"
            />
            <span className="text-brand-gray text-sm">Photo says it all — just use "See photo"</span>
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What's the deal?"
            disabled={caption === 'See photo'}
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link resize-none disabled:bg-slate-100 disabled:text-brand-gray"
          />
        </div>

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
                ? "Free posts run for a fixed window and can't be limited to specific days. Upgrade to Frugull Unlimited or use a credit for this."
                : 'Select a location and subcategory to see day options.'}
            </p>
          )}
        </div>

        <div>
          {allowsEventDate && (
            <div className="flex justify-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsEventDate(false)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                  !isEventDate
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                Runs until
              </button>
              <button
                type="button"
                onClick={() => setIsEventDate(true)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                  isEventDate
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                Date of
              </button>
            </div>
          )}

          {allowsEventDate && isEventDate ? (
            <>
              <label className="block text-sm text-slate-600 mb-2">Date of event</label>
              <input
                type="date"
                value={eventDate}
                min={toDateInputValue(tomorrow)}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
              />
              <p className="text-brand-gray text-xs mt-1">
                This post will automatically expire at midnight the day after the event.
              </p>
            </>
          ) : (
            <>
              <label className="block text-sm text-slate-600 mb-2">Runs until</label>
              {!businessRecord || !subcategoryId ? (
                <p className="text-brand-gray text-sm">
                  Select a location and subcategory to see how long this post can run.
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
            </>
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