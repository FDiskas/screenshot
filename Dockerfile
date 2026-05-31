# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /app

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
RUN bun install --frozen-lockfile \
  && bun x puppeteer browsers install chrome

# Copy the rest of the code
COPY . .

# Run the app
USER bun
EXPOSE 3000
CMD ["bun", "start"]
