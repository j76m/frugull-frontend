import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';

const SECTIONS = [
  {
    title: '1. Eligibility',
    body: `You must be at least 13 years old to create a Frugull account or use the Service. If you are under 18, you may only use the Service with the involvement and consent of a parent or legal guardian. By creating an account, you represent that you meet these requirements.`,
  },
  {
    title: '2. The Frugull Service',
    body: `Frugull provides a platform designed to help users discover deals, promotions, businesses, products, services, and related information.

Frugull may display information provided by businesses, users, third-party services, public sources, or other sources. Frugull does not guarantee that any deal, promotion, price, product, service, business information, location information, availability, description, or other content displayed through the Service is accurate, complete, current, or available.

Businesses and other third parties are responsible for honoring their own offers, promotions, representations, products, and services.`,
  },
  {
    title: '3. Unverified Business Information',
    body: `Frugull does not require businesses to register, claim, or verify their identity before information or offers referencing that business are posted by users on the Service. Deals, information, photographs, and other content referencing a business may be submitted by any user, and Frugull does not independently confirm that the poster is affiliated with, employed by, or authorized to represent that business.

A business that believes it has been inaccurately represented, or that wishes to have content concerning it removed or corrected, may contact us using the information in Section 16.`,
  },
  {
    title: '4. No Guarantee of Deals or Offers',
    body: `Deals, discounts, promotions, prices, availability, business hours, and other information may change without notice.

Users should verify applicable terms, restrictions, availability, pricing, and expiration dates directly with the applicable business before making a purchase or relying upon an offer.

Frugull LLC is not responsible for a business's refusal or inability to honor an offer, inaccurate information supplied by a business or third party, or losses resulting from reliance upon information displayed through the Service.`,
  },
  {
    title: '5. Third-Party Businesses and Services',
    body: `Frugull provides a platform for discovering and interacting with independent businesses and third parties.

Unless expressly stated otherwise, Frugull LLC does not own, operate, control, endorse, warrant, or guarantee any third-party business, product, service, website, promotion, or transaction.

Any transaction between a user and a third-party business is solely between those parties. Frugull LLC is not a party to such transaction unless expressly identified otherwise.`,
  },
  {
    title: '6. User Accounts',
    body: `Certain features may require creation of an account.

You are responsible for maintaining the confidentiality and security of your login credentials and for activity occurring through your account.

You agree to provide accurate information and promptly update information that becomes inaccurate.

You may delete your account at any time through the Service or by contacting us. We reserve the right to suspend or terminate accounts that violate these Terms, misuse the Service, engage in fraudulent activity, or otherwise create risk to Frugull, its users, or third parties.`,
  },
  {
    title: '7. Fees, Subscriptions, Credits, and Auto-Renewal',
    body: `Frugull offers a free tier as well as paid options, including "Frugull Unlimited" subscriptions and one-time credit purchases, as described on the Service.

Frugull Unlimited subscriptions automatically renew at the end of each billing period (monthly or six-month, as selected) at the then-current price, using the payment method on file, unless you cancel before the renewal date. You may cancel auto-renewal at any time through your account settings; cancellation takes effect at the end of the then-current billing period, and you will retain access through that period's end.

Credits are purchased individually, do not expire, and do not auto-renew. Fees for credits and subscriptions are generally non-refundable except where required by law or expressly stated otherwise.

We may change our pricing, tiers, or features at any time. Material price changes to an active subscription will be communicated before they take effect on your next renewal.`,
  },
  {
    title: '8. User and Business Content',
    body: `Users and participating businesses may be permitted to submit content, including listings, promotions, photographs, descriptions, reviews, comments, pricing, or other materials.

You retain ownership of content you own. By submitting content to Frugull, you grant Frugull LLC a non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, distribute, format, and otherwise use that content as reasonably necessary to operate, promote, and improve the Service.

You represent that you have the rights necessary to submit the content and that its use through Frugull does not violate the rights of another person or entity.

We may remove content that violates these Terms, applicable law, or our platform policies.`,
  },
  {
    title: '9. Reporting and Content Removal',
    body: `The Service includes a mechanism for users to report content, including content that is inaccurate, expired, misleading, or otherwise objectionable. We may review reported content and remove, hide, or restrict it at our discretion. We are not obligated to take any specific action in response to a report and do not guarantee the timing of any review.`,
  },
  {
    title: '10. Points and Rewards',
    body: `Frugull may award points or rank status to users for certain activity on the Service, such as posting content. Points and rank status have no cash value, are not redeemable for money or goods, are non-transferable, and may be adjusted, reset, or revoked by Frugull at any time, including where associated content is found to violate these Terms.`,
  },
  {
    title: '11. Acceptable Use',
    body: `You may not use Frugull to:

- engage in unlawful, fraudulent, deceptive, abusive, or harmful activity;
- impersonate another person or business;
- submit knowingly false or misleading information;
- interfere with or disrupt the Service;
- attempt unauthorized access to Frugull systems or other accounts;
- scrape, harvest, copy, or extract data from the Service through automated means except where expressly authorized;
- introduce malware, malicious code, or other harmful technology; or
- infringe intellectual-property or other legal rights.`,
  },
  {
    title: '12. Frugull Intellectual Property',
    body: `The Frugull Service, including its software, original source code, design, interface, graphics, logos, branding, text, organization, and other original materials, is owned by or licensed to Frugull LLC and is protected by applicable intellectual-property laws.

Frugull™ and associated branding are trademarks of Frugull LLC.

Except as expressly permitted by Frugull LLC, no portion of the Service may be copied, reproduced, modified, distributed, sold, licensed, reverse engineered, or commercially exploited.`,
  },
  {
    title: '13. Copyright Complaints',
    body: `If you believe content on the Service infringes your copyright, you may submit a notice to the contact information in Section 16, including: identification of the copyrighted work, identification of the allegedly infringing content and its location on the Service, your contact information, and a statement that you have a good-faith belief the use is unauthorized. We may remove or disable access to content in response to such notices.`,
  },
  {
    title: '14. Privacy',
    body: `Your use of Frugull is also subject to our Privacy Policy, which describes how information is collected, used, stored, and shared.`,
  },
  {
    title: '15. Service Availability',
    body: `We may modify, suspend, discontinue, restrict, or change any portion of Frugull at any time.

We do not guarantee uninterrupted or error-free operation of the Service or that defects will always be corrected.`,
  },
  {
    title: '16. Contact',
    body: `Questions regarding these Terms, reports concerning business information, or copyright notices may be submitted through the contact information provided on Frugull.com.`,
  },
  {
    title: '17. Disclaimer of Warranties',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, FRUGULL AND THE SERVICE ARE PROVIDED "AS IS" AND "AS AVAILABLE."

FRUGULL LLC DISCLAIMS WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AVAILABILITY, AND NON-INFRINGEMENT TO THE EXTENT PERMITTED BY LAW.`,
  },
  {
    title: '18. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FRUGULL LLC AND ITS MEMBERS, MANAGERS, OFFICERS, EMPLOYEES, CONTRACTORS, AGENTS, AND AFFILIATES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATING TO USE OF, OR INABILITY TO USE, THE SERVICE.

This includes, without limitation, losses resulting from inaccurate listings, unavailable or expired deals, interactions or transactions with third-party businesses, user-generated content, interruptions of service, unauthorized access, or reliance upon information available through Frugull.

Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited under applicable law.`,
  },
  {
    title: '19. Indemnification',
    body: `To the extent permitted by law, you agree to indemnify and hold harmless Frugull LLC and its members, managers, officers, employees, contractors, agents, and affiliates from claims, damages, liabilities, losses, and reasonable costs arising from your violation of these Terms, misuse of the Service, content you submit, or violation of another person's rights.`,
  },
  {
    title: '20. Changes to These Terms',
    body: `We may update these Terms periodically. The current version and effective date will be posted through the Service.

Your continued use of the Service following an effective change constitutes acceptance of the updated Terms to the extent permitted by applicable law.`,
  },
  {
    title: '21. Governing Law',
    body: `These Terms are governed by the laws of the State of Colorado, without regard to conflict-of-law principles.`,
  },
  {
    title: '22. Severability',
    body: `If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.`,
  },
];

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-navy mb-1">Terms of Service</h1>
        <p className="text-brand-gray text-sm mb-6">Last Updated: September 2, 2026</p>

        <p className="text-brand-gray text-sm leading-relaxed mb-8">
          These Terms of Service ("Terms") govern your access to and use of the Frugull
          website, web application, services, features, and content (collectively, the
          "Service"). The Service is owned and operated by Frugull LLC, a Colorado limited
          liability company ("Frugull," "we," "us," or "our").
          <br />
          <br />
          By accessing or using the Service, creating an account, or otherwise using Frugull,
          you agree to these Terms. If you do not agree to these Terms, do not use the
          Service.
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