FROM node:carbon-alpine

ENV WORKDIR /opt/insights-ui-service_catalog/
WORKDIR $WORKDIR
RUN chgrp -R 0 $WORKDIR && \
    chmod -R g=u $WORKDIR

COPY package*.json $WORKDIR
RUN npm install

COPY . $WORKDIR
RUN npm run build

EXPOSE 8002

CMD ["npm", "run", "start"]
