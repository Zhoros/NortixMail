FROM node:20-alpine #Use older version to prevent issues

RUN apk add --no-cache git nodejs npm

WORKDIR /app

COPY . /app

RUN npm install --production

WORKDIR svelte

RUN npm install
RUN npm run build

WORKDIR /app

CMD ["node", "main.js"]
