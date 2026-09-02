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
          <h2 className="text-lg font-semibold text-brand-navy mb-2">What is Frugull?</h2>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            Frugull is a hyper-localized map of real, local deals and information — built by
            the people who find them, not by algorithms or paid ads. Anyone can snap a photo
            of a deal, sale, menu, or piece of local info, tag the business and category, and
            pin it to the map for others nearby to find. Our tagline says it best:{' '}
            <span className="font-semibold text-brand-navy">Local, Organized.</span>
          </p>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            I started Frugull because deals and local info are scattered across flyers,
            storefront windows, word of mouth, and social feeds that bury the good stuff under
            algorithms. Frugull puts it all in one place, organized by category and location,
            kept current because posts naturally expire and get refreshed — no stale coupons,
            no guessing if an offer's still good.
          </p>
          <p className="text-brand-gray text-sm italic">
            Sincerely,
            <br />
            Jeremy aka "the Gullfather"
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">For Consumers</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Browse the map or list views for free — no account needed. Filter and search by
            type and subtype to zero in on exactly what you're looking for nearby. Want to
            post a deal you found, or save one for later? That just takes a free account with
            a verified email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">For Businesses</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Frugull gives businesses a direct, low-cost way to reach nearby customers — no ad
            spend, no algorithm deciding who sees your offer. Post your own deals, or let
            customers who find you organically spread the word by posting on your behalf.
            It's a simple way to test what kind of promotions actually bring people in,
            without committing to a print run or a paid ad campaign.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Getting Started</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Browsing is free for everyone. To create a post or to save one for later, you'll
            need a free account with a verified email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Frugull Free</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Create a free account with your verified email to post deals or info, and to
            save deals you find. On the free tier, posts run on a 7-day cycle — one live post
            per business and subcategory at a time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Credits</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Need more flexibility without a subscription? Buy credits: 5 for $10 or 10 for
            $20 ($2 per credit). Credits don't expire, and each one lets you keep a post live
            for up to 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Frugull Unlimited</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            For $30/month or $150/6 months, post as many deals as you want at the same time,
            with each post staying live for up to 90 days. Unlimited posts also get priority
            placement on the map.
          </p>
        </section>

        <p className="text-brand-gray text-xs text-center pt-4">
          You can upgrade or manage your plan anytime from your Profile.
        </p>
      </div>
    </AppLayout>
  );
}