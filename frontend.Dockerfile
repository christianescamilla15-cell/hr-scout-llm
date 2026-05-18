# Vite dev server for use with docker-compose. NOT for production builds —
# production is Vercel via `vercel deploy --prod` from the root.

FROM node:20-alpine

WORKDIR /app

# Install deps first for layer caching
COPY package.json ./
# package-lock.json is gitignored so we use `npm install` instead of `npm ci`
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
