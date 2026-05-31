import type { FC } from "react";
import { CONFIG } from "../config";

export const PrivacyPage: FC = () => {
  const minReloadDays = Math.ceil(
    CONFIG.server.minReloadAgeMs / (24 * 60 * 60 * 1000),
  );
  const retentionMonths = CONFIG.retention.months;

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
        Privacy Policy & Terms of Service
      </h1>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. No Data Collection
          </h2>
          <p>
            We do not collect, store, or process any personal information from
            our users. Our service operates without tracking your activity,
            ensuring a fully private experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. Image Privacy & Safety
          </h2>
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
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Browser Extensions
          </h2>
          <p>
            We may publish a Chrome extension designed to add preview images
            directly into Google search results. Just like our core service,
            this extension operates entirely locally within your browser and
            does not collect or transmit any user information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Service Availability
          </h2>
          <p>
            The service may be modified, suspended, or closed entirely at any
            time without prior information or notification. We provide this
            service on an "as is" and "as available" basis without any
            warranties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Content Complaints
          </h2>
          <p>
            Any complaints regarding the content depicted in the screenshots
            should be addressed directly to the respective website owners. We
            simply provide an automated snapshot utility of public homepages and
            do not host or endorse the content found on those external websites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Data Retention & Updates
          </h2>
          <p>
            Generated screenshots are temporarily cached on our servers to
            improve performance. We store these public homepage snapshots for a
            maximum of {retentionMonths} month{retentionMonths !== 1 ? "s" : ""}{" "}
            before they are automatically deleted. If a website's design
            changes, a fresh screenshot can be requested, provided the existing
            cached image is older than {minReloadDays} days. This ensures our
            system is not abused while keeping previews reasonably up-to-date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            7. Identification & Blocking
          </h2>
          <p>
            When our service visits a website to generate a screenshot, it
            identifies itself via the HTTP User-Agent header:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">
              {CONFIG.screenshot.browserUserAgent}
            </code>
            . Website owners who wish to block our service can easily do so by
            blocking requests from this User-Agent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            8. Respecting robots.txt
          </h2>
          <p>
            We respect standard web scraping etiquette. Before taking a
            screenshot of a homepage, our automated system checks the website's{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">
              robots.txt
            </code>{" "}
            file. If the file explicitly disallows crawling for the root path (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">
              /
            </code>
            ) for all agents (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">
              User-agent: *
            </code>
            ) or specifically for our service, we will safely abort the capture
            and return a placeholder image instead.
          </p>
        </section>
      </div>
    </div>
  );
};
