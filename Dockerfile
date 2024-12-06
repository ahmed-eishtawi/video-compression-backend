FROM node:20.10

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production && npm install ffmpeg

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
