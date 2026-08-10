# ZERON TEMP MAIL — universal container (Render/Railway/Fly/any Docker host)
FROM node:18-alpine

WORKDIR /app

# No node_modules to install — copy everything (zero dependencies).
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]