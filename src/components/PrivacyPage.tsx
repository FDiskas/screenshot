import type { FC, ReactNode } from "react";
import { CONFIG } from "../config";

const SERVICE_NAME = "SnapService";
const CONTACT_EMAIL = "projektas@gmail.com";
const EFFECTIVE_DATE = "October 18, 2026";

const Section: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <section>
    <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
    {children}
  </section>
);

const Code: FC<{ children: ReactNode }> = ({ children }) => (
  <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">
    {children}
  </code>
);

export const PrivacyPage: FC = () => {
  const minReloadDays = Math.ceil(
    CONFIG.server.minReloadAgeMs / (24 * 60 * 60 * 1000),
  );
  const retentionMonths = CONFIG.retention.months;
  const retention = `${retentionMonths} month${retentionMonths !== 1 ? "s" : ""}`;

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
        Privacy Policy & Terms of Service
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <Section title="1. Who We Are and What This Policy Covers">
          <p className="mb-3">
            {SERVICE_NAME} ("we", "us") is a free service that generates
            preview screenshots of public website homepages. This policy
            explains what information we process, why, and what choices you
            have. It applies to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>this website and its screenshot API;</li>
            <li>
              the {SERVICE_NAME} Chrome extension, which shows website preview
              images in Google search results;
            </li>
            <li>
              the Google Cloud project and OAuth client associated with{" "}
              {SERVICE_NAME}.
            </li>
          </ul>
        </Section>

        <Section title="2. Google User Data">
          <p className="mb-3">
            {SERVICE_NAME} does not offer "Sign in with Google" and does not
            request, access, collect, store, use or share any Google user data.
            We never ask end users to grant access to their Google Account,
            Gmail, Drive, Calendar, contacts, profile, email address or any
            other Google service.
          </p>
          <p>
            Our Google OAuth client is used only by the developer, from an
            automated build pipeline (GitHub Actions), to upload and publish new
            versions of our own Chrome extension through the Chrome Web Store
            API. It operates only on the developer's own Chrome Web Store
            account. It is never presented to, or used on behalf of, any other
            user.
          </p>
        </Section>

        <Section title="3. Information We Collect">
          <p className="mb-3">
            We do not require accounts, registration or payment. We do not use
            cookies, analytics, advertising trackers or fingerprinting. The only
            information we process is:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Requested website
              addresses.</strong>{" "}
              When you or the extension request a preview, we receive the
              website URL and the requested image size. We reduce the URL to its
              domain (for example, <Code>example.com</Code>) and discard any
              path, query string or other details.
            </li>
            <li>
              <strong className="text-foreground">Generated
              screenshots.</strong>{" "}
              We store the screenshot image of that domain's public homepage,
              together with the domain name and the time it was taken.
            </li>
            <li>
              <strong className="text-foreground">Technical request
              data.</strong>{" "}
              Like any web server, our hosting infrastructure receives your IP
              address, browser User-Agent and request time when you connect. We
              do not link this data to the domains you request, and we do not
              use it to build profiles of anyone.
            </li>
          </ul>
        </Section>

        <Section title="4. Chrome Extension">
          <p>
            The Chrome extension sends only the domain names of the websites
            listed on the search results page you are viewing to our API, so it
            can display their preview images. It does not read or send your
            search query, your browsing history, the content of pages you visit,
            or any personal information, and it does not use cookies or
            identifiers to track you.
          </p>
        </Section>

        <Section title="5. How We Use Information">
          <ul className="list-disc pl-5 space-y-2">
            <li>to generate, cache and deliver website preview images;</li>
            <li>
              to show recently captured public homepages in our public{" "}
              <a href="/gallery" className="underline hover:text-primary">
                gallery
              </a>
              ;
            </li>
            <li>
              to keep the service secure and working, for example by limiting
              how often a screenshot can be refreshed and by diagnosing errors.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell, rent or trade any information, and we do not use it
            for advertising, profiling or training machine-learning models.
          </p>
        </Section>

        <Section title="6. Sharing and Third Parties">
          <p className="mb-3">
            Generated screenshots are public: anyone who requests the same
            domain, or browses the gallery, can see them. Apart from that, we
            share information only with service providers that help us run the
            service:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              our hosting provider, which runs our servers and may keep standard
              access logs;
            </li>
            <li>
              Hatchet, a job-queue service that receives the domain and image
              size of each screenshot job so it can be processed;
            </li>
            <li>
              Google Fonts, which serves the fonts on this website and therefore
              receives your IP address and User-Agent when the page loads (see
              Google's{" "}
              <a
                href="https://policies.google.com/privacy"
                className="underline hover:text-primary"
              >
                Privacy Policy
              </a>
              ).
            </li>
          </ul>
          <p className="mt-3">
            We may also disclose information if the law requires it.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            Screenshots and the domain names they belong to are kept for at most{" "}
            {retention} and are then deleted automatically. A fresh screenshot
            of a domain can be requested once the cached image is older than{" "}
            {minReloadDays} days. Server and error logs are kept only as long as
            needed to run and troubleshoot the service, and they are rotated
            automatically.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            All traffic to the service is encrypted with HTTPS. Access to our
            servers and credentials is limited to the developer. No system is
            perfectly secure, but because we hold no accounts and no personal
            profiles, very little information is exposed if something goes
            wrong.
          </p>
        </Section>

        <Section title="9. Your Choices and Rights">
          <p>
            You can use the website and API without giving us any personal
            information, and you can uninstall the Chrome extension at any time.
            If you own a website and want its screenshot removed, or if you want
            to ask about, access or delete any information relating to you,
            email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-primary"
            >
              {CONTACT_EMAIL}
            </a>
            . We will reply within 30 days.
          </p>
        </Section>

        <Section title="10. Children">
          <p>
            The service is not directed at children under 13, and we do not
            knowingly collect personal information from children.
          </p>
        </Section>

        <Section title="11. How Screenshots Are Captured">
          <p className="mb-3">
            When generating screenshots, our automated systems enforce the
            following safety and privacy standards:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              We automatically attempt to block advertisements to provide clean
              screenshots.
            </li>
            <li>
              We strictly capture screenshots on child-safe websites only.
            </li>
            <li>We automatically close common consent and cookie pop-ups.</li>
            <li>
              We proactively blur larger images in the screenshots to protect
              underlying privacy.
            </li>
            <li>
              We only take screenshots of the domain's homepage, ignoring any
              specific inner URLs provided.
            </li>
          </ul>
          <p className="mt-3">
            Our service identifies itself with the HTTP User-Agent header{" "}
            <Code>{CONFIG.screenshot.browserUserAgent}</Code>. Website owners
            can block it by that User-Agent. Before each capture we also check
            the site's <Code>robots.txt</Code>: if it disallows the root path (
            <Code>/</Code>) for all agents (<Code>User-agent: *</Code>) or for
            our service, we skip the capture and return a placeholder image.
          </p>
        </Section>

        <Section title="12. Service Availability and Content">
          <p className="mb-3">
            The service is provided "as is" and "as available", without
            warranties, and may be modified, suspended or closed at any time
            without notice.
          </p>
          <p>
            Screenshots are automated snapshots of public homepages. We do not
            host or endorse the content of those websites. Complaints about
            that content should go to the website's owner. To have a screenshot
            removed from our service, contact us at the address below.
          </p>
        </Section>

        <Section title="13. Changes to This Policy">
          <p>
            We may update this policy from time to time. Changes will be posted
            on this page with a new effective date.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For any questions about this policy or your data, contact{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-primary"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
};
