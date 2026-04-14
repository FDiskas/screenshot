import type { Page } from "puppeteer";
import { describe, expect, it, vi } from "vitest";
import {
  applyMediaBlur,
  type BlurConfig,
  shouldBlurMediaCandidate,
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
    const page = { evaluate } as unknown as Page;

    await applyMediaBlur(page, blurConfig);

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith(expect.any(Function), blurConfig);
  });
});
