FROM node:lts

RUN mkdir -p /workspace /results

WORKDIR /workspace

COPY workspace /workspace

RUN npm install

CMD npx ts-node index.ts
