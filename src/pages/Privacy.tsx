import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

const Privacy = () => {
  const effectiveDate = "March 28, 2026";
  const lastUpdated = "March 28, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <Sparkles className="h-5 w-5 text-secondary" />
            <span className="font-display text-xl font-bold text-foreground">
              Resume<span className="text-secondary">Rig</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="font-body text-sm text-muted-foreground mb-10">
          Effective Date: {effectiveDate} · Last Updated: {lastUpdated}
        </p>

        <div className="prose prose-sm max-w-none font-body text-foreground/90 space-y-8">

          {/* 1 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. Introduction &amp; Scope</h2>
            <p>
              This Privacy Policy ("Policy") describes how ResumeRig ("Company," "we," "us," or "our") collects, uses, discloses, retains, and protects the personal information of individuals ("you" or "User") who access or use our website located at resumerig.lovable.app and any related services (collectively, the "Service"). By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Policy. If you do not agree, you must immediately discontinue use of the Service.
            </p>
            <p>
              This Policy is incorporated into and forms part of our <Link to="/terms" className="text-secondary hover:underline">Terms of Service</Link>. Capitalized terms not defined herein have the meanings given in the Terms of Service.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. Information We Collect</h2>

            <h3 className="font-display text-base font-medium text-foreground mt-4">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> When you create an account, we collect your email address and an encrypted password (hashed; we never store plaintext passwords).</li>
              <li><strong>Resume Content:</strong> The text of résumés, CVs, or professional summaries you paste or upload into the Service for analysis.</li>
              <li><strong>Job Description Content:</strong> The text of job descriptions you provide for comparison and tuning purposes.</li>
              <li><strong>Payment Information:</strong> When you purchase credits, payment card details are collected and processed directly by our third-party payment processor, Stripe, Inc. We do not receive or store your full card number, CVV, or expiration date. We receive only a tokenized reference, the last four digits of your card, and your billing postal code.</li>
              <li><strong>Communications:</strong> If you contact us via email at support@resumerig.com, we collect the contents of your correspondence.</li>
            </ul>

            <h3 className="font-display text-base font-medium text-foreground mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Log Data:</strong> IP address, browser type and version, operating system, referring URL, pages visited, date/time stamps, and clickstream data.</li>
              <li><strong>Device Information:</strong> Device type, screen resolution, unique device identifiers, and language preferences.</li>
              <li><strong>Cookies &amp; Similar Technologies:</strong> We use strictly necessary session cookies to maintain your authenticated session. We do not use advertising or tracking cookies. See Section 7 for details.</li>
            </ul>

            <h3 className="font-display text-base font-medium text-foreground mt-4">2.3 Information from Third Parties</h3>
            <p>
              We may receive limited information from Stripe (e.g., transaction success/failure status, subscription status) to fulfill credit purchases. We do not purchase personal information from data brokers.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use collected information for the following purposes, each supported by a lawful basis:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service Delivery (Contract Performance):</strong> To analyze your résumé against a job description, generate refined résumé content, identify decision-makers, and draft outreach messages.</li>
              <li><strong>Account Management (Contract Performance):</strong> To create and maintain your account, authenticate your identity, and manage your credit balance.</li>
              <li><strong>Payment Processing (Contract Performance):</strong> To process credit purchases and manage billing through Stripe.</li>
              <li><strong>Service Improvement (Legitimate Interest):</strong> To diagnose technical issues, analyze aggregate usage patterns, and improve functionality. We do not use your résumé content to train machine-learning models.</li>
              <li><strong>Security &amp; Fraud Prevention (Legitimate Interest):</strong> To detect, investigate, and prevent unauthorized access, abuse, or fraudulent activity.</li>
              <li><strong>Legal Compliance (Legal Obligation):</strong> To comply with applicable laws, regulations, court orders, or governmental requests.</li>
              <li><strong>Communications (Consent / Legitimate Interest):</strong> To respond to your inquiries, send transactional emails (e.g., password reset), and, where you have opted in, send product updates.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. AI Processing &amp; Data Handling</h2>
            <p>
              The Service uses third-party artificial intelligence models (including models provided by Google and OpenAI) to analyze and transform your résumé content. When you submit a résumé and job description:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your content is transmitted to the AI provider's API solely to generate your results.</li>
              <li>We do <strong>not</strong> use your submitted content to train, fine-tune, or improve any AI models.</li>
              <li>AI providers process your data pursuant to their data processing agreements with us, which restrict use of your data to performing the requested inference.</li>
              <li>Results are returned to you in real-time and are <strong>not stored on our servers</strong> after delivery, unless you choose to save them (feature availability may vary).</li>
            </ul>
            <p>
              You retain all intellectual property rights in your original résumé content. See the Terms of Service for license grants related to AI-generated output.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. How We Share Your Information</h2>
            <p>We do not sell, rent, or trade your personal information. We share information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service Providers:</strong> With third-party vendors who assist us in operating the Service (e.g., Stripe for payments, Supabase for infrastructure, AI model providers for inference). Each is contractually obligated to use your data only for the services they provide to us.</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or governmental regulation, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or prominent notice on the Service of any change in ownership or use of your personal information.</li>
              <li><strong>With Your Consent:</strong> We may share information for purposes not described in this Policy if we obtain your prior consent.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Data:</strong> Retained for as long as your account is active. Upon account deletion, we will delete your account data within thirty (30) calendar days, except as required by law.</li>
              <li><strong>Resume &amp; Job Description Content:</strong> Processed in real-time and not persistently stored on our servers after the analysis is complete.</li>
              <li><strong>Transaction Records:</strong> Retained for seven (7) years for tax, accounting, and legal compliance purposes.</li>
              <li><strong>Log Data:</strong> Retained for up to ninety (90) days for security and diagnostic purposes, then automatically purged.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. Cookies &amp; Tracking Technologies</h2>
            <p>
              We use only strictly necessary cookies required to maintain your authenticated session and to prevent cross-site request forgery (CSRF). These cookies are exempt from consent requirements under applicable law because the Service cannot function without them.
            </p>
            <p>
              We do <strong>not</strong> use analytics cookies, advertising cookies, social-media tracking pixels, or fingerprinting technologies. We do not participate in cross-site behavioral advertising.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">8. Data Security</h2>
            <p>
              We implement commercially reasonable administrative, technical, and physical safeguards designed to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption of data in transit using TLS 1.2 or higher.</li>
              <li>Encryption of data at rest using AES-256.</li>
              <li>Password hashing using bcrypt with a minimum work factor of 10.</li>
              <li>Row-level security (RLS) policies enforced at the database layer to ensure users can access only their own data.</li>
              <li>Regular security audits and vulnerability assessments.</li>
            </ul>
            <p>
              No method of electronic transmission or storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">9. Your Rights &amp; Choices</h2>

            <h3 className="font-display text-base font-medium text-foreground mt-4">9.1 All Users</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access &amp; Portability:</strong> You may request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> You may request correction of inaccurate or incomplete personal information.</li>
              <li><strong>Deletion:</strong> You may request deletion of your account and associated personal information, subject to legal retention obligations.</li>
              <li><strong>Objection &amp; Restriction:</strong> You may object to or request restriction of certain processing activities.</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>. We will respond within thirty (30) days. We may require verification of your identity before processing your request.</p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">9.2 California Residents (CCPA / CPRA)</h3>
            <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act, as amended by the California Privacy Rights Act ("CCPA/CPRA"):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Right to Know:</strong> You may request the categories and specific pieces of personal information we have collected, the sources, the business purposes, and the categories of third parties with whom we share it.</li>
              <li><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to exceptions.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA/CPRA rights.</li>
              <li><strong>Sale / Sharing:</strong> We do <strong>not</strong> "sell" or "share" (as defined by CCPA/CPRA) your personal information.</li>
              <li><strong>Sensitive Personal Information:</strong> We limit our use of sensitive personal information to purposes authorized under CCPA/CPRA.</li>
            </ul>
            <p>To submit a verifiable consumer request, contact us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>.</p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">9.3 Virginia, Colorado, Connecticut, Utah, and Other State Residents</h3>
            <p>
              Residents of states with comprehensive privacy legislation (including the Virginia CDPA, Colorado CPA, Connecticut CTDPA, and Utah UCPA) may have rights similar to those described in Sections 9.1 and 9.2 above, including the right to access, correct, delete, and opt out of certain processing. To exercise your rights, contact us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>. You may appeal a denial of a request by emailing the same address with "Appeal" in the subject line.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">9.4 EEA / UK Residents (GDPR)</h3>
            <p>
              If you are located in the European Economic Area or the United Kingdom, you have rights under the General Data Protection Regulation ("GDPR"), including the right to access, rectification, erasure, data portability, restriction of processing, and objection. You also have the right to lodge a complaint with your local supervisory authority. Our lawful bases for processing are set forth in Section 3.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">10. Children's Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of sixteen (16). We do not knowingly collect personal information from children under 16. If we learn that we have collected personal information from a child under 16, we will promptly delete it. If you believe a child under 16 has provided us with personal information, please contact us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">11. International Data Transfers</h2>
            <p>
              Your information may be processed in the United States and other countries where our service providers operate. These countries may have data protection laws that differ from those in your jurisdiction. When we transfer personal information outside of your jurisdiction, we implement appropriate safeguards, including standard contractual clauses approved by the European Commission, to ensure your data receives an adequate level of protection.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">12. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites, including LinkedIn. We are not responsible for the privacy practices or content of those websites. We encourage you to read the privacy policy of any website you visit.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">13. Changes to This Policy</h2>
            <p>
              We may update this Policy from time to time. If we make material changes, we will notify you by email (sent to the address associated with your account) or by posting a prominent notice on the Service at least thirty (30) days before the changes take effect. Your continued use of the Service after the effective date of a revised Policy constitutes acceptance of the revised Policy.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">14. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <address className="not-italic mt-2 pl-4 border-l-2 border-secondary/40">
              <strong>ResumeRig</strong><br />
              Email: <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>
            </address>
          </section>

          {/* 15 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">15. Governing Law</h2>
            <p>
              This Policy shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Privacy;
