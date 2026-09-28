import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCategories } from '../api/categories';
import { fetchAlertSettings, saveAlertSettings } from '../api/alerts';

const RADII = [5, 10, 25];

// Same display grouping as the Filters page.
const DEAL_CATEGORY_NAMES = new Set([
  'Restaurants',
  'Beverages',
  'Personal Care',
  'Auto Care',
  'Retail',
  'Dispensary',
  'Activities',
]);

export default function DealAlertsSection() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [zip, setZip] = useState('');
  const [radius, setRadius] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Full taxonomy, not just categories with active deals like Filters -
  // alerts are for deals that haven't been posted yet.
  useEffect(() => {
    Promise.all([fetchAlertSettings(), fetchCategories()])
      .then(([settings, cats]) => {
        const ids = new Set(settings.subcategoryIds);
        setCategories(cats);
        setEnabled(settings.enabled);
        setZip(settings.zip || '');
        setRadius(settings.radiusMiles || 10);
        setSelected(ids);
        setExpanded(
          new Set(cats.filter((c) => c.subcategories.some((s) => ids.has(s.id))).map((c) => c.id))
        );
      })
      .catch(() => setError('Could not load deal alerts.'))
      .finally(() => setLoading(false));
  }, []);

  function toggleSub(id) {
    setNotice('');
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategoryAll(cat) {
    setNotice('');
    const ids = cat.subcategories.map((s) => s.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }

  function toggleExpanded(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const settings = await saveAlertSettings({
        enabled,
        zip,
        radiusMiles: radius,
        subcategoryIds: [...selected],
      });
      setEnabled(settings.enabled);
      setZip(settings.zip || '');
      setRadius(settings.radiusMiles);
      setSelected(new Set(settings.subcategoryIds));
      setNotice(
        settings.enabled
          ? "Saved. You'll get an email when new matching deals are posted."
          : 'Saved. Deal alert emails are off.'
      );
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save deal alerts. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const dealCategories = categories.filter((c) => DEAL_CATEGORY_NAMES.has(c.name));
  const otherCategories = categories.filter((c) => !DEAL_CATEGORY_NAMES.has(c.name));

  function renderGroup(cats, groupLabel) {
    if (cats.length === 0) return null;
    return (
      <div>
        {groupLabel && (
          <p className="text-brand-gray text-xs font-semibold uppercase tracking-wide pt-3 pb-1">
            {groupLabel}
          </p>
        )}
        {cats.map((cat) => {
          const count = cat.subcategories.filter((s) => selected.has(s.id)).length;
          const allSelected = cat.subcategories.length > 0 && count === cat.subcategories.length;
          const isExpanded = expanded.has(cat.id);

          return (
            <div key={cat.id} className="border-b border-slate-100">
              <button
                type="button"
                onClick={() => toggleExpanded(cat.id)}
                className="w-full flex items-center justify-between py-3 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${count > 0 ? 'text-brand-link' : 'text-brand-navy'}`}>
                    {cat.name}
                  </span>
                  {count > 0 && (
                    <span className="text-[11px] font-semibold text-brand-link bg-blue-50 rounded-full px-2 py-0.5">
                      {count}
                    </span>
                  )}
                </span>
                {isExpanded ? (
                  <ChevronUp size={18} className={count > 0 ? 'text-brand-link' : 'text-brand-gray'} />
                ) : (
                  <ChevronDown size={18} className={count > 0 ? 'text-brand-link' : 'text-brand-gray'} />
                )}
              </button>

              {isExpanded && (
                <div className="pb-3 pl-2 space-y-2">
                  <label className="flex items-center gap-2 py-1 cursor-pointer border-b border-slate-100 pb-2 mb-1">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleCategoryAll(cat)}
                      className="w-4 h-4 accent-brand-link cursor-pointer"
                    />
                    <span className="text-brand-navy text-sm font-medium">All {cat.name}</span>
                  </label>
                  {cat.subcategories.map((sub) => (
                    <label key={sub.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(sub.id)}
                        onChange={() => toggleSub(sub.id)}
                        className="w-4 h-4 accent-brand-link cursor-pointer"
                      />
                      <span className="text-brand-navy text-sm">{sub.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <div className="max-w-sm mx-auto">
        <p className="text-brand-navy font-medium text-sm px-4 mb-3">Deal Alerts</p>

        <div className="px-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-brand-gray text-sm mb-4">
              Get an email when new deals you care about are posted near you. One email a day at most,
              only when something new matches.
            </p>

            {loading ? (
              <p className="text-brand-gray text-sm">Loading...</p>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm text-brand-navy font-medium mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setEnabled(e.target.checked);
                      setNotice('');
                    }}
                    className="w-4 h-4 accent-brand-link cursor-pointer"
                  />
                  Email me new deals
                </label>

                <label className="block text-brand-navy text-xs font-medium mb-1">Zip code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value.replace(/\D/g, ''));
                    setNotice('');
                  }}
                  placeholder="80501"
                  className="w-full rounded-lg border-2 border-slate-300 focus:border-brand-link p-2 text-sm text-brand-navy outline-none mb-4"
                />

                <p className="text-brand-navy text-xs font-medium mb-1">Distance</p>
                <div className="flex gap-2 mb-4">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRadius(r);
                        setNotice('');
                      }}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                        radius === r
                          ? 'bg-brand-navy text-white border-2 border-brand-navy'
                          : 'bg-slate-100 text-brand-navy border-2 border-brand-navy/30'
                      }`}
                    >
                      {r} mi
                    </button>
                  ))}
                </div>

                <p className="text-brand-navy text-xs font-medium">
                  Deal types{selected.size > 0 && ` · ${selected.size} selected`}
                </p>
                {renderGroup(dealCategories, 'Deals')}
                {renderGroup(otherCategories, null)}

                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                {notice && <p className="text-brand-navy text-sm mt-3">{notice}</p>}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-4 w-full rounded-xl bg-brand-navy text-white font-medium py-3 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Deal Alerts'}
                </button>
                {user?.email && (
                  <p className="text-brand-gray text-xs mt-2 text-center">Alerts go to {user.email}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}