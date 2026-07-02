# --- Stage 1: build frontend (React + Vite) ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: backend + built frontend ---
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.js ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
