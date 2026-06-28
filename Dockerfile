FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack to handle pnpm automatically
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lockfile and package configuration
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of your app source code
COPY . .

# Build the SvelteKit application via Vite
RUN pnpm run build

# Prune devDependencies to keep the production image tiny
RUN pnpm prune --prod

FROM node:22-alpine
WORKDIR /app

# Copy the build output and pruned node_modules from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production

# SvelteKit adapter-node generates its server entry point here
CMD ["node", "build/index.js"]
