import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";

const Terms = () => {
  const effectiveDate = "March 28, 2026";
  const lastUpdated = "March 28, 2026";

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Terms of Service — ResumeRig" description="The terms and conditions for using ResumeRig." path="/terms" />
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
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="font-body text-sm text-muted-foreground mb-10">
          Effective Date: {effectiveDate} · Last Updated: {lastUpdated}
        </p>

        <div className="prose prose-sm max-w-none font-body text-foreground/90 space-y-8">

          {/* 1 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and ResumeRig ("Company," "we," "us," or "our") governing your access to and use of the website located at resumerig.lovable.app and all related services, features, and content (collectively, the "Service").
            </p>
            <p>
              By creating an account, accessing, or using the Service, you represent and warrant that: (a) you are at least eighteen (18) years of age or the age of legal majority in your jurisdiction, whichever is greater; (b) you have the legal capacity to enter into a binding agreement; and (c) you agree to be bound by these Terms and our <Link to="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>, which is incorporated herein by reference.
            </p>
            <p>
              <strong>IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST IMMEDIATELY STOP USING THE SERVICE.</strong>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>
              ResumeRig is an AI-powered résumé optimization platform that: (a) analyzes your résumé content against a target job description; (b) generates a refined version of your résumé optimized for applicant tracking systems (ATS) and human reviewers; (c) identifies potential decision-makers at target companies via publicly available LinkedIn data; and (d) drafts personalized outreach messages. The Service is provided on a credit-based system.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. Account Registration &amp; Security</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide a valid email address and create a password to register for an account.</li>
              <li>You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
              <li>You agree to notify us immediately at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a> if you suspect unauthorized use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts that we reasonably believe are being used in violation of these Terms.</li>
              <li>You may not create multiple accounts to circumvent credit limits, abuse free credits, or for any other purpose that violates these Terms.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Credits, Payments &amp; Refunds</h2>

            <h3 className="font-display text-base font-medium text-foreground mt-4">4.1 Credit System</h3>
            <p>
              The Service operates on a credit-based model. Each résumé analysis ("Tune") and each outreach generation consumes one (1) credit. New accounts receive one (1) complimentary credit upon first use. Additional credits may be purchased through the Service.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">4.2 Payment Processing</h3>
            <p>
              All payments are processed securely by Stripe, Inc., a PCI-DSS Level 1 certified payment processor. By submitting a payment, you agree to Stripe's <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Terms of Service</a>. All prices are displayed in United States Dollars (USD) unless otherwise stated and are inclusive of applicable taxes as required by law.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">4.3 Refund Policy</h3>
            <p>
              Due to the nature of AI-generated digital content that is delivered instantaneously upon request, <strong>all credit purchases are final and non-refundable</strong> once credits have been consumed. Unused credits may be eligible for a refund within fourteen (14) calendar days of purchase, provided you have not consumed any credits from that purchase. To request a refund, email <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a> with your account email and transaction reference.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">4.4 Credit Expiration</h3>
            <p>
              Purchased credits do not expire and remain in your account until consumed, unless your account is terminated pursuant to Section 12.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Intellectual Property</h2>

            <h3 className="font-display text-base font-medium text-foreground mt-4">5.1 Your Content</h3>
            <p>
              You retain all ownership rights in the original résumé content, job descriptions, and other materials you submit to the Service ("User Content"). By submitting User Content, you grant us a limited, non-exclusive, non-transferable, revocable license to process your User Content solely for the purpose of providing the Service to you. This license terminates when your User Content is no longer needed for processing (typically upon delivery of results).
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">5.2 AI-Generated Output</h3>
            <p>
              Subject to your compliance with these Terms, we assign to you all rights, title, and interest in the AI-generated output (including refined résumés, outreach messages, and analysis results) produced by the Service from your User Content ("Output"). You are solely responsible for reviewing, verifying, and editing any Output before use. Output is provided "as is" — see Section 9 for warranty disclaimers.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">5.3 Our Intellectual Property</h3>
            <p>
              The Service, including its software, algorithms, user interface, design, branding, trademarks, logos, and documentation, is owned by ResumeRig and protected by United States and international intellectual property laws. Nothing in these Terms grants you any right to use our trademarks, trade names, logos, or other proprietary designations without our prior written consent.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submit content that is fraudulent, misleading, defamatory, obscene, or otherwise unlawful.</li>
              <li>Fabricate qualifications, credentials, work experience, or other professional claims.</li>
              <li>Impersonate another person or misrepresent your affiliation with any person or entity.</li>
              <li>Attempt to reverse-engineer, decompile, disassemble, or otherwise derive the source code, algorithms, or models underlying the Service.</li>
              <li>Use automated scripts, bots, scrapers, or similar technologies to access the Service without our prior written consent.</li>
              <li>Circumvent or attempt to circumvent any access controls, rate limits, or credit-enforcement mechanisms.</li>
              <li>Interfere with or disrupt the integrity, security, or performance of the Service or its underlying infrastructure.</li>
              <li>Resell, sublicense, or commercially redistribute the Service or any Output without our prior written consent.</li>
              <li>Violate any applicable local, state, national, or international law or regulation.</li>
            </ul>
            <p>
              Violation of this Section may result in immediate termination of your account and may subject you to civil or criminal liability.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. AI Disclaimer &amp; Accuracy</h2>
            <p>
              The Service uses artificial intelligence to generate suggestions and content. <strong>AI-generated output may contain inaccuracies, omissions, or errors.</strong> You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Output is intended as a <strong>starting point</strong> and must be reviewed, verified, and edited by you before use in any application, interview, or professional context.</li>
              <li>We do <strong>not</strong> guarantee that Output will result in job interviews, employment offers, or any specific outcome.</li>
              <li>We do <strong>not</strong> guarantee the accuracy, completeness, or suitability of any decision-maker identification or LinkedIn outreach content.</li>
              <li>You are solely responsible for ensuring that your final résumé and outreach materials are truthful and accurate.</li>
              <li>We are not an employment agency, staffing firm, or career counselor, and the Service does not constitute professional career advice.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">8. Third-Party Services</h2>
            <p>
              The Service integrates with or references third-party services, including but not limited to Stripe (payments), LinkedIn (public profile data), and AI model providers (Google, OpenAI). Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for the availability, accuracy, or practices of any third-party service.
            </p>
            <p>
              LinkedIn® is a registered trademark of LinkedIn Corporation. ResumeRig is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">9. Disclaimer of Warranties</h2>
            <p>
              <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</strong>
            </p>
            <p>
              Without limiting the foregoing, we do not warrant that: (a) the Service will be uninterrupted, timely, secure, or error-free; (b) the results obtained from the Service will be accurate, reliable, or complete; (c) any defects or errors will be corrected; or (d) the Service will meet your specific requirements or expectations.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">10. Limitation of Liability</h2>
            <p>
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RESUMERIG, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, SUCCESSORS, OR ASSIGNS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, USE, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</strong>
            </p>
            <p>
              <strong>OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM; OR (B) FIFTY UNITED STATES DOLLARS (USD $50.00).</strong>
            </p>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, our liability shall be limited to the fullest extent permitted by law.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless ResumeRig and its officers, directors, employees, agents, affiliates, successors, and assigns from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; (d) your violation of any applicable law or regulation; or (e) your violation of the rights of any third party.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">12. Termination</h2>
            <p>
              You may terminate your account at any time by contacting us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>. We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice, including for violation of these Terms.
            </p>
            <p>
              Upon termination: (a) your right to use the Service immediately ceases; (b) any unused credits in your account are forfeited unless a refund is applicable under Section 4.3; (c) we may delete your account data in accordance with our Privacy Policy. Sections 5, 9, 10, 11, 13, 14, 15, and 16 shall survive termination.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">13. Dispute Resolution &amp; Arbitration</h2>

            <h3 className="font-display text-base font-medium text-foreground mt-4">13.1 Informal Resolution</h3>
            <p>
              Before initiating any formal dispute resolution, you agree to first contact us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a> and attempt to resolve the dispute informally for at least thirty (30) calendar days.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">13.2 Binding Arbitration</h3>
            <p>
              If the dispute cannot be resolved informally, you and ResumeRig agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved by <strong>binding individual arbitration</strong> administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules then in effect. The arbitration shall be conducted in the English language and shall take place in the State of Delaware, United States, or, at your election, via telephone or video conference.
            </p>
            <p>
              The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction. The arbitrator shall have the authority to award any remedy that would be available in a court of law.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">13.3 Class Action Waiver</h3>
            <p>
              <strong>YOU AND RESUMERIG AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.</strong> The arbitrator may not consolidate more than one person's claims and may not preside over any form of class or representative proceeding.
            </p>

            <h3 className="font-display text-base font-medium text-foreground mt-4">13.4 Exceptions</h3>
            <p>
              Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">14. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. To the extent that litigation is permitted under Section 13, you consent to the exclusive jurisdiction and venue of the state and federal courts located in the State of Delaware.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">15. General Provisions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and ResumeRig and supersede all prior agreements, understandings, and communications.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall remain in full force and effect.</li>
              <li><strong>Waiver:</strong> No waiver of any provision shall be deemed a further or continuing waiver of such provision or any other provision. Our failure to enforce any right or provision shall not constitute a waiver.</li>
              <li><strong>Assignment:</strong> You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.</li>
              <li><strong>Force Majeure:</strong> We shall not be liable for any delay or failure to perform resulting from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, epidemics, government actions, power failures, internet disturbances, or third-party service outages.</li>
              <li><strong>Notices:</strong> We may provide notices to you via email to the address associated with your account or by posting a notice on the Service. You may provide notices to us at <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>.</li>
            </ul>
          </section>

          {/* 16 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">16. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or by posting a prominent notice on the Service at least thirty (30) days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must discontinue use of the Service and may request account deletion.
            </p>
          </section>

          {/* 17 */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">17. Contact Information</h2>
            <p>For questions or concerns about these Terms, please contact us at:</p>
            <address className="not-italic mt-2 pl-4 border-l-2 border-secondary/40">
              <strong>ResumeRig</strong><br />
              Email: <a href="mailto:support@resumerig.com" className="text-secondary hover:underline">support@resumerig.com</a>
            </address>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Terms;
