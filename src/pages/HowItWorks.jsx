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
          <p className="text-brand-gray text-sm">
            Here's what you can do for free, and what it costs to do more.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Browsing is free for everyone</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Anyone can browse the map or list, search for deals/info, and view business
            details — no account needed. To create a post or to save one for later requires
            signing up for a free account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Frugull Free</h2>
          <p className="text-brand-gray text-sm leading-relaxed">
            Create a free account with your verified email to post deals or info, and to
            save deals you find. On the free tier, posts run on a 7-day cycle — one live post per business and subcategory at a time.
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