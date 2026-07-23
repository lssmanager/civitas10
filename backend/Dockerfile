FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
COPY contracts/ /contracts/
COPY scripts/modules/ /scripts/modules/
COPY core/ /core/
COPY scripts/authorization/ /scripts/authorization/
COPY dist/ /dist/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
