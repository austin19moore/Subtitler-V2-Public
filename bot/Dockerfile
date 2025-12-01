FROM node:current-slim

WORKDIR /usr/src/app

COPY . .

RUN apt update
# RUN apt-get -y install nodejs
RUN apt-get -y install npm
RUN apt-get -y install python3
# RUN apt-get -y install python3-pip
RUN apt-get -y install make

RUN npm ci --omit=dev

# EXPOSE 8090

CMD [ "node", "src/index.js" ]