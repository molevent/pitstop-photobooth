FROM node:20-slim
WORKDIR /app

# Install build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --production

# Rebuild better-sqlite3 to ensure native binary is compiled for this architecture
RUN npm rebuild better-sqlite3

COPY . .
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "index.js"]
