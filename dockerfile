FROM node:14

COPY yarn.lock .
COPY package.json .
COPY server.js .

RUN yarn install

EXPOSE 3000
CMD [ "node", "server.js" ]