import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy mb-2">How Frugull Works</h1>
        </div>

        <section>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            Frugull is a hyper-localized map of real, local deals and information — built by
            the community, not algorithms or paid ads. Snap a photo of a deal,
            sale, menu, or piece of local info, tag it, and pin it to the map for others
            nearby to find. I started Frugull to take the in-store advertising businesses
            already have — a sandwich board, a window sign, a sidewalk chalkboard — and
            extend its reach beyond just the people who happen to walk by, putting it in
            front of anyone nearby searching for exactly that kind of info.{' '}
            <span className="font-semibold text-brand-navy">Local, Organized.</span>
          </p>
          <p className="text-brand-gray text-sm italic">
            Sincerely,
            <br />
            Jeremy aka "the Gullfather"
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Browsing & Accounts</h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Anyone can search and browse posts for free — no account needed</li>
            <li>To create a post or save one for later, make a free account — just verify your email</li>
            <li>Vote on posts to help others know what's current, and earn points as you post</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Frugull Free</h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>One live post per business, per subcategory</li>
            <li>Each post runs for 7 days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            Post by Credits — 5 for $10, or 10 for $20
          </h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>One live post per business, per subcategory</li>
            <li>Up to 30 days per post</li>
            <li>Credits never expire</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            Frugull Unlimited — $30/month or $150/6 months
          </h2>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Post as many deals as you want, all live at the same time</li>
            <li>Up to 90 days per post</li>
            <li>
              Tag one post with multiple subcategories (e.g., one sign showing a food deal
              and a drink special can appear under both)
            </li>
            <li>Unlimited posts get priority placement on the map over Credits and Free</li>
          </ul>
        </section>

        <p className="text-brand-gray text-xs text-center pt-4">
          You can upgrade or manage your plan anytime from your Profile.
        </p>
      </div>
    </AppLayout>
  );
}