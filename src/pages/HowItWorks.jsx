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
            Welcome to Frugull,
          </p>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            I started Frugull because deals and happenings around town are typically displayed on chalkboards,
            window signs, in-store print and flyers, yet only the people who happen to walk by or step
            inside ever discover them.
          </p>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            Frugull extends that reach by putting what businesses already advertise in front of
            anyone searching for exactly that. It's a hyper-local map of real deals,
            happenings, and more, built by the community, not algorithms or paid ads.
          </p>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            Snap a photo of a sign, tag it, and pin it to the map
            for others to find.
          </p>
          <p className="font-semibold text-brand-navy text-sm mb-3">Local found.</p>
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
            <li>Earn 1 point for every post you create — good for Frugull exclusive offers and merch</li>
            <li>Vote on posts to help others know what's current</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            Add Frugull to Your Home Screen
          </h2>
          <p className="text-brand-gray text-sm leading-relaxed mb-3">
            Get one-tap access, just like an app.
          </p>

          <h3 className="text-sm font-semibold text-brand-navy mb-1.5">iPhone</h3>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5 mb-4">
            <li>Open frugull.com in Safari</li>
            <li>
              Tap the Share button. On newer iOS
              versions, tap ••• first, then Share
            </li>
            <li>Scroll down and tap Add to Home Screen; tap Add</li>
          </ul>

          <h3 className="text-sm font-semibold text-brand-navy mb-1.5">Android</h3>
          <ul className="text-brand-gray text-sm leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Open frugull.com in Chrome</li>
            <li>Tap the ⋮ menu in the top-right corner</li>
            <li>Tap Add to Home screen; tap Add</li>
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}