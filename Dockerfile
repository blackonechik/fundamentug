FROM node:20-alpine

WORKDIR /app

COPY assets/fonts/basic.ttf assets/fonts/basic.ttf

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["npm", "start"]
