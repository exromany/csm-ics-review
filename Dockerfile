# This Dockerfile uses `serve` npm package to serve the static files with node process.
# You can find the Dockerfile for nginx in the following link:
# https://github.com/refinedev/dockerfiles/blob/main/vite/Dockerfile.nginx
FROM node:24-alpine AS base
RUN addgroup -S refine && adduser -S refine -G refine
WORKDIR /app/refine
RUN chown refine:refine /app/refine

FROM base AS deps

COPY package.json yarn.lock* .npmrc* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else echo "yarn.lock not found." && exit 1; \
  fi

FROM base AS builder

ARG BUILD_MODE=production
ENV NODE_ENV=production

COPY --from=deps /app/refine/node_modules ./node_modules

COPY . .

RUN yarn build --mode $BUILD_MODE

FROM base AS runner

ENV NODE_ENV=production

RUN npm install -g serve

COPY --from=builder /app/refine/dist ./

USER refine

CMD ["serve"]
