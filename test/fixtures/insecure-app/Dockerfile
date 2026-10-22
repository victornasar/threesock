FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
RUN curl -fsSL https://get.tools-installer.io/install.sh | bash
CMD ["node", "src/server.js"]
