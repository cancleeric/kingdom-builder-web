FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_WS_SERVER_URL=ws://localhost:8088
ENV VITE_WS_SERVER_URL=$VITE_WS_SERVER_URL
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY --from=build /app/tsconfig*.json ./
EXPOSE 4173 8787
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
