FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    ffmpeg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Paksa npm pakai HTTPS bukan SSH untuk GitHub
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    git config --global url."https://github.com/".insteadOf "git@github.com:"

WORKDIR /app
RUN mkdir -p /app/auth_info

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

CMD ["node", "bot.js"]
