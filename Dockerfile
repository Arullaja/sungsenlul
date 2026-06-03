FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir -p /app/auth_info

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "bot.js"]
