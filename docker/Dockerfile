FROM node:lts-alpine
RUN apk add --update git

# deploying development environment
RUN git clone https://github.com/hyoo-ru/mam.git ./mam
WORKDIR ./mam
RUN npm install

# copy src
COPY ./ hyoo/sync

# build modules
RUN npm start hyoo/sync/auth
RUN npm start hyoo/sync/watch
RUN npm start hyoo/sync/server

# bundled modules
RUN cp -r hyoo/sync/watch/- hyoo/sync/server/-/watch
RUN cp -r hyoo/sync/auth/- hyoo/sync/server/-/auth

WORKDIR ./hyoo/sync/server/-
ENTRYPOINT node node.js port=3000 db=postgres://docker:password@:5432/sync?sslmode=disable log=/var/log/sync.log &>> /var/log/sync.log
