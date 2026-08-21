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
import { useAuth } from '../context/AuthContext';

export default function CreateDeal() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [business, setBusiness] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [caption, setCaption] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategoriesError('Could not load categories.'));
  }, []);

  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function handleCategoryChange(e) {
    setCategoryId(e.target.value);
    setSubcategoryId(''); // reset subcategory whenever the category changes
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
            className="w-full aspect-square bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer"
          >
            {photoPreviewUrl ? (
              <img src={photoPreviewUrl} alt="Deal preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={32} className="text-brand-gray" />
                <span className="text-brand-gray text-sm">Take or choose a photo</span>
              </>
            )}
          </button>
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

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center">Deal posted!</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-brand-link text-white font-semibold py-3 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : 'Post Deal'}
        </button>
      </form>
    </AppLayout>
  );
}