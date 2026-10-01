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
import { fetchCreditBalance } from '../api/credits';
import { useAuth } from '../context/AuthContext';

const DISCOUNT_TAGS = [
  { value: 'college', label: 'College' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'senior', label: 'Senior' },
  { value: 'military', label: 'Military' },
  { value: 'first_responder', label: 'First Responder' },
];

const SHARE_TYPES = [
  { value: 'deal', label: 'a Deal' },
  { value: 'happening', label: 'a Community Happening' },
  { value: 'help_wanted', label: 'a Job' },
  { value: 'farm_stand', label: 'a Farm Stand' },
  { value: 'yard_sale', label: 'a Yard/Garage Sale' },
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
  const [shareType, setShareType] = useState(''); // 'deal' | 'happening' | 'farm_stand' | 'help_wanted'
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

  // Frugull Exclusive: a paid-post flag meaning redemption requires
  // showing the deal photo to the business. Independent of "Photo says
  // it all" - both can be checked at once.
  const [isFrugullExclusive, setIsFrugullExclusive] = useState(false);

  const [allowance, setAllowance] = useState(null);
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [durationDays, setDurationDays] = useState(null);

  // "Date of" mode - currently Activities/Community Happenings. When
  // active, the poster picks the event's actual date instead of a "runs
  // until" date, and the backend automatically expires the post at
  // midnight the following day.
  const [isEventDate, setIsEventDate] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  // Community Happenings-only: 'date' | 'range' | 'recurring'. Defaults to
  // 'date' since a single specific date is the most common case (Grand
  // Opening, a comedy show), with Range and Recurring as opt-ins.
  const [happeningsMode, setHappeningsMode] = useState('date');
  // Deal / Farm Stand only: a Credits/Unlimited bonus. Needs at least one Valid Day.
  const [isRecurring, setIsRecurring] = useState(false);
  // Credits: how many the account has, and whether the poster chose to
  // spend one on this post (default is the Free weekly post).
  const [creditBalance, setCreditBalance] = useState(0);
  const [useCredit, setUseCredit] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((results) => setCategories(results))
      .catch(() => setCategoriesError('Could not load categories.'));

    fetchSubscriptionStatus()
      .then((sub) => setPlan(sub?.plan ?? 'free'))
      .catch(() => setPlan('free'));

    fetchCreditBalance()
      .then((bal) => setCreditBalance(Number(bal) || 0))
      .catch(() => setCreditBalance(0));
  }, []);

  const shareCategories = categories.filter((c) => c.post_type === shareType);
  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));
  const usesGpsLocation = !!selectedCategory?.requires_gps_location;
  const isActivities = selectedCategory?.name === 'Activities';
  const isCommunityHappenings = selectedCategory?.name === 'Community Happenings';
  const allowsEventDate = isActivities || isCommunityHappenings;
  const infoOnly = !!selectedCategory && selectedCategory.post_type !== 'deal';
  const isYardSale = shareType === 'yard_sale';
  const isJob = shareType === 'help_wanted';
  const usesDateModes = isCommunityHappenings || isYardSale;
  const canRecur = shareType === 'deal' || shareType === 'farm_stand';
  const paidPost = !!allowance && allowance.method !== 'free';
  const recurringOn = canRecur && paidPost && isRecurring;
  const freeRunDays = infoOnly && shareType !== 'farm_stand' ? 30 : 7;

  // Post type is fully derived from category, never user-chosen - any
  // category whose post_type isn't 'deal' (Happenings, Farm Stands, Help
  // Wanted) posts as General Info, everything else posts as a Deal.
  const postType = infoOnly ? 'info' : 'deal';

  // Frugull Exclusive is offered on paid posts only: any Unlimited
  // account (including comped), or a post that will be paid with a
  // credit. Mirrors the server-side rule in dealsController.postDeal,
  // which is the real enforcement. Hidden for info-only categories,
  // since those aren't redeemable offers.
  const canMarkExclusive =
    !infoOnly && (plan === 'unlimited' || allowance?.method === 'credit');

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
    fetchPreviewAllowance(businessRecord.id, subcategoryId, useCredit)
      .then((result) => {
        setAllowance(result);
        setDurationDays(result.method !== 'free' ? result.maxDurationDays : null);
      })
      .catch(() => setAllowance(null))
      .finally(() => setAllowanceLoading(false));
  }, [businessRecord?.id, subcategoryId, useCredit]);

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
    applyCategory(e.target.value);
  }

  function handleShareTypeChange(e) {
    const nextType = e.target.value;
    setShareType(nextType);
    if (nextType && nextType !== 'deal') {
      const match = categories.find((c) => c.post_type === nextType);
      applyCategory(match ? String(match.id) : '');
      if (match && match.subcategories.length === 1) {
        setSubcategoryId(String(match.subcategories[0].id));
      }
    } else {
      applyCategory('');
    }
  }

  function applyCategory(newCategoryId) {
    setCategoryId(newCategoryId);
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
    setEventEndDate('');
    setHappeningsMode('date');
    setIsRecurring(false);
    setUseCredit(false);
    setAdditionalTags([]);
  }

  // Switching scheduling mode clears any picked dates. The event date
  // inputs below always mount blank (defaultValue="") so the calendar's
  // Reset button clears them - clearing state here keeps state matching
  // what's on screen when a different mode's inputs mount.
  function changeHappeningsMode(mode) {
    if (mode === happeningsMode) return;
    setHappeningsMode(mode);
    setEventDate('');
    setEventEndDate('');
  }

  function changeActivitiesEventMode(nextIsEventDate) {
    if (nextIsEventDate === isEventDate) return;
    setIsEventDate(nextIsEventDate);
    setEventDate('');
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
    if (!e.target.value) return;
    const chosen = new Date(e.target.value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((chosen - today) / (1000 * 60 * 60 * 24));
    const clamped = Math.min(Math.max(diffDays, 1), allowance.maxDurationDays);
    setDurationDays(clamped);
  }

  // A mode that needs a date can't post without one - otherwise a
  // cleared Specific Date would silently fall through to Recurring
  // (90 days) on the backend.
  const missingEventDate =
    (usesDateModes && happeningsMode === 'date' && !eventDate) ||
    (usesDateModes && happeningsMode === 'range' && (!eventDate || !eventEndDate)) ||
    (isActivities && isEventDate && !eventDate);

  const yardSaleLastDate = eventEndDate || eventDate;
  const yardSaleTooFar =
    isYardSale &&
    !!yardSaleLastDate &&
    Math.round((new Date(yardSaleLastDate + 'T00:00:00') - new Date().setHours(0, 0, 0, 0)) / 86400000) > 29;

  const canSubmit =
    photoFile &&
    businessRecord &&
    categoryId &&
    subcategoryId &&
    caption.trim().length > 0 &&
    !missingEventDate &&
    !yardSaleTooFar &&
    !(recurringOn && validDays.length === 0) &&
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
        discountTags: discountTags.length > 0 && !isYardSale && !isJob ? discountTags : undefined,
        validDaysOfWeek: validDays.length > 0 && !isJob && !isYardSale ? validDays : undefined,
        requestedDurationDays: durationDays || undefined,
        postType,
        isEventDate: isActivities ? isEventDate : usesDateModes && happeningsMode !== 'recurring',
        eventDate:
          isActivities && isEventDate
            ? eventDate
            : usesDateModes && happeningsMode !== 'recurring'
            ? eventDate
            : undefined,
        eventEndDate: usesDateModes && happeningsMode === 'range' ? eventEndDate : undefined,
        isRecurring: recurringOn ? true : undefined,
        useCredit: canRecur && useCredit ? true : undefined,
        isCommunityHappenings,
        additionalTags: plan === 'unlimited' && validAdditionalTags.length > 0 ? validAdditionalTags : undefined,
        // Only sent when currently eligible - if the poster checked it and
        // then switched to an ineligible category/location, it drops off.
        isFrugullExclusive: canMarkExclusive && isFrugullExclusive ? true : undefined,
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
        {/* 1. What are you sharing? - picks the post type first, which
            limits the category/subtype options below. Deals pick a
            category then a subtype; every other type has exactly one
            category, so it's auto-selected and only the subtype shows. */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">What are you sharing?</label>
          <select
            value={shareType}
            onChange={handleShareTypeChange}
            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-brand-link"
          >
            <option value="">Select...</option>
            {SHARE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {shareType && !(shareType !== 'deal' && selectedCategory?.subcategories.length === 1) && (
        <div className={shareType === 'deal' ? 'grid grid-cols-2 gap-3' : ''}>
          {shareType === 'deal' && (
          <div>
            <label className="block text-sm text-slate-600 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="w-full rounded-xl bg-white border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-brand-link"
            >
              <option value="">Select...</option>
              {shareCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          )}
          <div>
            <label className="block text-sm text-slate-600 mb-1">
              {shareType === 'deal' ? 'Subcategory' : 'Type'}
            </label>
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
        )}
        {categoriesError && <p className="text-red-500 text-sm">{categoriesError}</p>}
        {selectedCategory && (
          <p className="text-brand-gray text-xs -mt-3">
            {infoOnly
              ? 'This category posts as General Info.'
              : 'This category posts as a Deal.'}
          </p>
        )}

        {/* Multi-tagging (Unlimited only): one photo/post can advertise
            multiple, unrelated offerings (e.g. a sign showing both a food
            special and a drink special) by tagging additional category/
            subcategory pairs onto this same post. */}
        {plan === 'unlimited' && categoryId && shareType !== 'yard_sale' && (
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
                      {shareCategories.map((cat) => (
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

        {/* 2. Business / Location */}
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
                    <label className="block text-sm text-slate-600 mb-1">
                      {shareType === 'yard_sale' ? 'Location' : 'Business'}
                    </label>
                    <BusinessSearchInput
                      onSelect={handleBusinessSelect}
                      selectedName={business?.name}
                      placeholder={shareType === 'yard_sale' ? 'Add location...' : undefined}
                    />
                    {business && <p className="text-brand-gray text-xs mt-1">{business.address}</p>}
                    {businessError && <p className="text-red-500 text-xs mt-1">{businessError}</p>}
                  </div>
                ) : (
                  <GpsLocationCapture
                    isYardSale={shareType === 'yard_sale'}
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

        {/* 3. Photo */}
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
                <span className="text-brand-gray text-sm">
                  {infoOnly ? 'Take a photo of the flyer' : 'Take a photo of the deal'}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* 4. Description */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            {infoOnly ? 'Describe the Details' : 'Describe the Deal'} <span className="text-red-500">*</span>
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
          {canMarkExclusive && (
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFrugullExclusive}
                onChange={(e) => setIsFrugullExclusive(e.target.checked)}
                className="w-4 h-4 accent-brand-link cursor-pointer"
              />
              <span className="text-brand-navy text-sm font-medium">Frugull Exclusive Deal</span>
              <span className="text-brand-gray text-xs">— customers show this photo to redeem</span>
            </label>
          )}
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

        {/* Credits: choose the Free post or spend a credit. Sits right under
            the description so the options a credit unlocks are visible. */}
        {canRecur &&
          creditBalance > 0 &&
          (allowance?.method === 'free' || (useCredit && allowance?.method === 'credit')) && (
            <div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseCredit(false)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                    !useCredit
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-navy border-brand-link'
                  }`}
                >
                  Use Free (7 days)
                </button>
                <button
                  type="button"
                  onClick={() => setUseCredit(true)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                    useCredit
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-navy border-brand-link'
                  }`}
                >
                  Use 1 credit
                </button>
              </div>
              <p className="text-brand-gray text-xs text-center mt-2">
                You have {creditBalance} credit{creditBalance === 1 ? '' : 's'}.{' '}
                {shareType === 'deal'
                  ? 'A credit adds up to 30 days, Recurring and the Frugull Exclusive option.'
                  : 'A credit adds up to 30 days and Recurring.'}
              </p>
            </div>
          )}

        {/* 5. Discounts Offered - not offered for yard sales */}
        {!isYardSale && !isJob && (
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
        )}

        {/* 6. Valid Days - not offered for Jobs or Yard Sales */}
        {!isJob && !isYardSale && (
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            Valid days <span className="text-brand-gray">(optional)</span>
          </label>
          <div
            className={`flex flex-wrap justify-center gap-2 ${
              !allowance ? 'opacity-40 pointer-events-none' : ''
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
          {!allowance && (
            <p className="text-brand-gray text-xs text-center mt-2">
              Select a location and subcategory to see day options.
            </p>
          )}
        </div>

        )}

        {/* 7. Expiration / Duration - the final cap on the post.
            Event date inputs use defaultValue="" (not value=) so the
            calendar's Reset button clears them - with a controlled value,
            iOS Reset restores the currently picked date instead. */}
        <div>
          {canRecur && paidPost && (
            <div className="flex justify-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                  !recurringOn
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                Runs until
              </button>
              <button
                type="button"
                disabled={!paidPost}
                onClick={() => setIsRecurring(true)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  recurringOn
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-navy border-brand-link'
                }`}
              >
                Recurring{allowance?.method === 'free' ? ' · Credits' : ''}
              </button>
            </div>
          )}
          {recurringOn ? (
            <p className="text-brand-gray text-sm">
              Set which day(s) this happens using Valid Days above. This post stays live
              for up to {allowance.maxDurationDays} days.
            </p>
          ) : usesDateModes ? (
            <>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => changeHappeningsMode('date')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                    happeningsMode === 'date'
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-navy border-brand-link'
                  }`}
                >
                  Specific Date
                </button>
                <button
                  type="button"
                  onClick={() => changeHappeningsMode('range')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                    happeningsMode === 'range'
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-navy border-brand-link'
                  }`}
                >
                  Date Range
                </button>
                <button
                  type="button"
                  onClick={() => changeHappeningsMode('recurring')}
                  hidden={isYardSale}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                    happeningsMode === 'recurring'
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-navy border-brand-link'
                  }`}
                >
                  Recurring
                </button>
              </div>

              {happeningsMode === 'date' && (
                <>
                  <label className="block text-sm text-slate-600 mb-2">Date of event</label>
                  <input
                    type="date"
                    defaultValue=""
                    min={toDateInputValue(today)}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
                  />
                  <p className="text-brand-gray text-xs mt-1">
                    This post will automatically expire at midnight the day after the event.
                  </p>
                </>
              )}

              {happeningsMode === 'range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-600 mb-2">Starts</label>
                    <input
                      type="date"
                      defaultValue=""
                      min={toDateInputValue(today)}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-2">Ends</label>
                    <input
                      type="date"
                      defaultValue=""
                      min={eventDate || toDateInputValue(today)}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
                    />
                  </div>
                  <p className="text-brand-gray text-xs col-span-2 mt-1">
                    This post will automatically expire at midnight the day after it ends.
                  </p>
                </div>
              )}

              {happeningsMode === 'recurring' && (
                <p className="text-brand-gray text-sm">
                  Set which day(s) this happens using Valid Days above. This post stays live
                  for up to 90 days.
                </p>
              )}
            </>
          ) : isActivities ? (
            <>
              <div className="flex justify-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => changeActivitiesEventMode(false)}
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
                  onClick={() => changeActivitiesEventMode(true)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border-2 ${
                    isEventDate
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-navy border-brand-link'
                  }`}
                >
                  Date of
                </button>
              </div>

              {isEventDate ? (
                <>
                  <label className="block text-sm text-slate-600 mb-2">Date of event</label>
                  <input
                    type="date"
                    defaultValue=""
                    min={toDateInputValue(today)}
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
                      {freeRunDays} days (fixed for Frugull Free)
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
            </>
          ) : (
            <>
              {!canRecur && (
                <label className="block text-sm text-slate-600 mb-2">
                  {isJob ? 'Runs for' : 'Runs until'}
                </label>
              )}
              {!businessRecord || !subcategoryId ? (
                <p className="text-brand-gray text-sm">
                  Select a location and subcategory to see how long this post can run.
                </p>
              ) : allowanceLoading ? (
                <p className="text-brand-gray text-sm">Checking...</p>
              ) : allowance?.method === 'free' ? (
                <>
                  <p className="text-brand-navy text-sm">
                    {freeRunDays} days (fixed for Frugull Free)
                  </p>
                  {canRecur && (
                    <p className="text-brand-gray text-xs mt-1">
                      Recurring posts need a Credits or Unlimited plan.
                    </p>
                  )}
                </>
              ) : isJob && allowance ? (
                <p className="text-brand-navy text-sm">
                  {allowance.maxDurationDays} days
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

        {yardSaleTooFar && (
          <p className="text-red-500 text-sm">Yard sale dates can be up to 30 days out.</p>
        )}
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