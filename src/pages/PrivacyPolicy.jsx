import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `Account information. When you create a Frugull account, we collect your email address and the username you choose. Frugull does not use passwords; instead, we verify your account through a one-time code sent to your email.

Content you submit. Photos, captions, business names, categories, and other information you post through the Service.

Location information. To center the map and show nearby deals, we request your device's location. If you decline or your device cannot provide it, we estimate an approximate location from your IP address. You can decline location access entirely; some features (such as automatically centering the map on your location) will be limited as a result.

Usage and points information. Activity such as deals posted, points earned, and rank tier.

Payment information. If you purchase Frugull Unlimited or credits, payment is processed by Stripe, Inc. Frugull does not receive, store, or have access to your full card number or other sensitive payment details — Stripe handles that directly. We retain only limited billing information such as your subscription status, plan, and renewal date.`,
  },
  {
    title: '2. How We Use Information',
    body: `We use the information we collect to operate the Service, including to authenticate your account, display your posts and their location on the map, calculate points and rank, process payments and subscriptions, send account-related emails (such as verification codes), and maintain the security and integrity of the Service.`,
  },
  {
    title: '3. We Do Not Sell Your Information',
    body: `Frugull does not sell your personal information to third parties.`,
  },
  {
    title: '4. How We Share Information',
    body: `We share information only as necessary to operate the Service, including with:

- Amazon Web Services (AWS), which stores photos you upload;
- Stripe, which processes payments and subscriptions;
- Resend, which sends account verification emails;
- Google, whose Maps service displays business locations and deals;
- an IP-geolocation service, used only as a fallback to approximate your location if device GPS is unavailable or denied;
- service providers who help us operate the Service (such as hosting and database providers), bound by obligations to protect your information; and
- as required by law, legal process, or to protect the rights, safety, or property of Frugull, our users, or others.`,
  },
  {
    title: '5. Content You Post Is Public',
    body: `Deals, photos, and other content you post through the Service are visible to other users and, in some cases, the public — that is the purpose of the Service. Do not post information you wish to keep private.`,
  },
  {
    title: '6. Data Retention',
    body: `We retain your account and content for as long as your account is active. If you delete your account, we will delete or de-identify your personal information within a reasonable time, except where we are required to retain it for legal, security, or fraud-prevention purposes.`,
  },
  {
    title: '7. Your Choices',
    body: `You may update your account information, delete individual posts, or delete your account entirely at any time through the Service or by contacting us. You may also decline location access or email digest preferences at any time.`,
  },
  {
    title: "8. Children's Privacy",
    body: `The Service is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can remove it.`,
  },
  {
    title: '9. Security',
    body: `We use reasonable administrative, technical, and physical safeguards designed to protect your information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '10. California Privacy Rights',
    body: `If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to request access to or deletion of your personal information. You may exercise these rights by contacting us using the information below.`,
  },
  {
    title: '11. Changes to This Policy',
    body: `We may update this Privacy Policy periodically. The current version and its effective date will be posted through the Service. Continued use of the Service after a change takes effect constitutes acceptance of the updated policy.`,
  },
  {
    title: '12. Contact',
    body: `Questions about this Privacy Policy may be submitted through the contact information provided on Frugull.com.`,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-navy mb-1">Privacy Policy</h1>
        <p className="text-brand-gray text-sm mb-6">Last Updated: September 2, 2026</p>

        <p className="text-brand-gray text-sm leading-relaxed mb-8">
          This Privacy Policy describes how Frugull LLC, a Colorado limited liability company
          ("Frugull," "we," "us," or "our") collects, uses, and shares information when you
          use the Frugull website and web application (the "Service").
        </p>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-brand-navy mb-2">{section.title}</h2>
              <p className="text-brand-gray text-sm leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="text-brand-gray text-xs text-center pt-8">© 2026 Frugull LLC. All rights reserved.</p>
      </div>
    </AppLayout>
  );
}