FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
COPY core/ /core/
COPY dist/ /dist/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
