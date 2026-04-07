import { describe, it, expect, vi } from "vitest";
import {
  applyConsentHiding,
  containsConsentToken,
  shouldHideConsentNodeFromAttributes,
} from "../src/lib/screenshot-consent";
import {
  applyMediaBlur,
  shouldBlurMediaCandidate,
  type BlurConfig,
} from "../src/lib/screenshot-blur";

const blurConfig: BlurConfig = {
  selector: "img, picture",
  minWidthPx: 160,
  minHeightPx: 90,
  minAreaPx: 12000,
  minIntrinsicAreaPx: 12000,
  blurPx: 18,
  blurVisibleMediaInViewport: true,
};

describe("Consent helper", () => {
  it("matches consent token regardless of prefix/suffix", () => {
    expect(containsConsentToken("fc-consent-root")).toBe(true);
    expect(containsConsentToken("preconsentpost")).toBe(true);
    expect(containsConsentToken("cookie-banner")).toBe(false);
  });

  it("detects consent-like node attributes", () => {
    const shouldHide = shouldHideConsentNodeFromAttributes({
      id: "foo",
      className: "bar consent modal",
      role: "dialog",
    });

    const shouldNotHide = shouldHideConsentNodeFromAttributes({
      id: "cookie-banner",
      className: "modal",
      role: "dialog",
    });

    expect(shouldHide).toBe(true);
    expect(shouldNotHide).toBe(false);
  });

  it("continues with evaluate when addStyleTag is blocked", async () => {
    const addStyleTag = vi
      .fn()
      .mockRejectedValue(new Error("Could not load style"));
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = { addStyleTag, evaluate } as any;

    await applyConsentHiding(page, "https://example.com");

    expect(addStyleTag).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledTimes(1);
  });
});

describe("Blur helper", () => {
  it("blurs by size threshold", () => {
    const shouldBlur = shouldBlurMediaCandidate(
      {
        width: 400,
        height: 300,
        area: 120000,
        intrinsicArea: 120000,
        hasBackgroundImage: false,
        pictureHasSources: false,
        inViewport: true,
        hasRenderableMedia: true,
      },
      blurConfig,
    );

    expect(shouldBlur).toBe(true);
  });

  it("blurs visible media by viewport fallback", () => {
    const shouldBlur = shouldBlurMediaCandidate(
      {
        width: 90,
        height: 60,
        area: 5400,
        intrinsicArea: 0,
        hasBackgroundImage: false,
        pictureHasSources: false,
        inViewport: true,
        hasRenderableMedia: true,
      },
      blurConfig,
    );

    expect(shouldBlur).toBe(true);
  });

  it("does not blur tiny off-threshold non-visible media", () => {
    const shouldBlur = shouldBlurMediaCandidate(
      {
        width: 40,
        height: 40,
        area: 1600,
        intrinsicArea: 0,
        hasBackgroundImage: false,
        pictureHasSources: false,
        inViewport: false,
        hasRenderableMedia: true,
      },
      blurConfig,
    );

    expect(shouldBlur).toBe(false);
  });

  it("executes page.evaluate with blur config", async () => {
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = { evaluate } as any;

    await applyMediaBlur(page, blurConfig);

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith(expect.any(Function), blurConfig);
  });
});
