FROM node:20-alpine3.19

WORKDIR /app

RUN apk add ffmpeg

RUN mkdir -p uploads/videos

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
