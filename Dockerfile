FROM node:18-alpine AS build

RUN mkdir /osome-test
WORKDIR /osome-test

COPY package*.json ./ 

RUN npm install

COPY . .
RUN npm run build

#---------------------------

FROM node:18-alpine

RUN mkdir /osome-test
WORKDIR /osome-test

COPY package.json ./

RUN npm install --only=production

COPY . .

COPY --from=build /osome-test/dist ./dist

ENV NODE_ENV=production

CMD [ "npm", "run", "start:prod" ]