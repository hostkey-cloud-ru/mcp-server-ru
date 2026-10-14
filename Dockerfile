FROM harbor.hostkey.com/public/node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsdown.config.ts ./
COPY src ./src
RUN npm run build

FROM harbor.hostkey.com/public/node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV MODE=http
ENV PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && chown -R node:node /app
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "dist/index.mjs"]
