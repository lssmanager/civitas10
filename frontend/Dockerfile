FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

ARG VITE_API_URL
ARG VITE_LOGTO_ENDPOINT
ARG VITE_LOGTO_APP_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LOGTO_ENDPOINT=$VITE_LOGTO_ENDPOINT
ENV VITE_LOGTO_APP_ID=$VITE_LOGTO_APP_ID

COPY frontend/package*.json ./
RUN npm install --include=dev

COPY frontend/ ./
COPY config/ /config/
COPY core/ /core/
COPY docs/design-system/ /docs/design-system/
RUN npm run build
RUN npm install -g serve

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
