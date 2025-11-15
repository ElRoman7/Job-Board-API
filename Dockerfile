# ---------- STAGE 1: Builder ----------
FROM node:18 AS builder

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build


# ---------- STAGE 2: Production ----------
FROM node:18

WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copiar el build final
COPY --from=builder /app/dist ./dist

# Variables base
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
