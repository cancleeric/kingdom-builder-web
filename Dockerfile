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

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
