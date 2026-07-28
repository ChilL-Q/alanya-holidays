FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --legacy-peer-deps
COPY backend ./backend
COPY shared ./shared
WORKDIR /app/backend
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
