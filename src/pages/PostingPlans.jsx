import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';

export default function PostingPlans() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  // Opening /posting-plans#credits scrolls to that plan's section.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <AppLayout>
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Posting Plans</h1>
          <p className="text-brand-gray text-sm leading-relaxed">
            Every plan can post every type of listing. The plans differ in how long a post runs
            and which options it unlocks.
          </p>
        </div>

        <section id="free" className="scroll-mt-20">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Frugull Free — $0</h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>One post per business location and subcategory each week</li>
            <li>Deals and Farm Stands run 7 days; Jobs run 30 days</li>
            <li>Earn 1 point for every post</li>
          </ul>
        </section>

        <section id="credits" className="scroll-mt-20">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            Post by Credits — 5 for $15
          </h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Upgrade a single Deal or Farm Stand to run up to 30 days</li>
            <li>Make it Recurring on the days you pick</li>
            <li>Add the Frugull Exclusive option to a Deal</li>
            <li>Credits never expire</li>
            <li>Earn 1 point for every post</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Using a credit</h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>
              On a Deal or Farm Stand, choose Use Free (7 days) or Use 1 credit. Free is the
              default
            </li>
            <li>
              If your Free post for that business location and subcategory is already used this
              week, a credit is used automatically
            </li>
            <li>
              Recurring repeats a post on the days you pick, such as every Tuesday, until its end
              date
            </li>
          </ul>
        </section>

        <section id="unlimited" className="scroll-mt-20">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            Frugull Unlimited — $30/month or $150/6 months
          </h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Covers one business location</li>
            <li>Additional locations: $15/month or $75/6 months each</li>
            <li>Post as many deals as you want, all live at the same time</li>
            <li>Deals, Farm Stands, and Jobs run up to 90 days; Deals and Farm Stands can be Recurring</li>
            <li>Edit and delete your posts after you publish them</li>
            <li>
              Tag one post with multiple subcategories (e.g., one sign showing a food deal
              and a drink special can appear under both)
            </li>
            <li>Priority placement ahead of Credits and Free posts</li>
            <li>Frugull Exclusive deals</li>
            <li>Unlimited posts do not earn points</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">By post type</h2>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            Individual discounts are the College, Teacher, Senior, Military, and First Responder
            tags.
          </p>

          <h3 className="text-sm font-semibold text-brand-navy mb-1.5">Deal and Farm Stand</h3>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5 mb-4">
            <li>Free: 7 days, pick days of the week, individual discounts</li>
            <li>Credits: up to 30 days, plus Recurring</li>
            <li>Unlimited: up to 90 days, plus Recurring</li>
          </ul>

          <h3 className="text-sm font-semibold text-brand-navy mb-1.5">Job</h3>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5 mb-4">
            <li>30 days on Free and Credits, 90 days on Unlimited</li>
            <li>No days-of-the-week or discount options</li>
          </ul>

          <h3 className="text-sm font-semibold text-brand-navy mb-1.5">Community Happening</h3>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5 mb-4">
            <li>The same on every plan</li>
            <li>Pick a specific date, a date range, or Recurring, up to 90 days out</li>
            <li>Individual discounts available</li>
          </ul>

          <h3 className="text-sm font-semibold text-brand-navy mb-1.5">Yard/Garage Sale</h3>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>The same on every plan</li>
            <li>Pick a specific date and/or date range, up to 30 days out</li>
            <li>Removed automatically after the end date</li>
            <li>No discounts or Recurring</li>
          </ul>
        </section>

        <p className="text-brand-gray text-xs text-center pt-4">
          You can upgrade or manage your plan anytime from your Profile.
        </p>
      </div>
    </AppLayout>
  );
}