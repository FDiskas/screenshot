# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /app

# Shared Puppeteer cache dir used at both build (install) and runtime.
# Without this, Chrome installs into root's home cache at build time but the
# `bun` user looks in its own home cache at runtime and can't find it.
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# Install OS dependencies required by Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    libjemalloc-dev \
    libgbm1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lock ./
RUN PUPPETEER_SKIP_DOWNLOAD=1 bun install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Ensure screenshot output directory exists for the mounted volume
RUN mkdir -p /app/public/screenshots && chown -R bun:bun /app/public

# Download Chromium via Puppeteer after dependencies are installed
RUN bun x puppeteer browsers install chrome \
  && chown -R bun:bun /app/.cache

# Run the app
USER bun
VOLUME ["/app/public/screenshots"]
EXPOSE 3000
CMD ["bun", "start"]
