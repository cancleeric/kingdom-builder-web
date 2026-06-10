FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_WS_SERVER_URL=ws://localhost:8088
ENV VITE_WS_SERVER_URL=$VITE_WS_SERVER_URL
ARG VITE_URL_HERBALISM=http://192.168.50.83:8085/lobby/herbalism
ENV VITE_URL_HERBALISM=$VITE_URL_HERBALISM
ARG VITE_URL_EVOLUTION=http://192.168.50.83:8085/lobby/evolution
ENV VITE_URL_EVOLUTION=$VITE_URL_EVOLUTION
ARG VITE_URL_SUDOKU=http://192.168.50.83:8089/
ENV VITE_URL_SUDOKU=$VITE_URL_SUDOKU
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
