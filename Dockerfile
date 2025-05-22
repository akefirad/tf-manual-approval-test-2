FROM node:22-alpine

RUN apk add --update --no-cache util-linux python3 make g++

RUN wget https://releases.hashicorp.com/terraform/1.12.1/terraform_1.12.1_linux_arm64.zip
RUN unzip terraform_1.12.1_linux_arm64.zip && rm terraform_1.12.1_linux_arm64.zip
RUN mv terraform /usr/bin/terraform

WORKDIR /app

COPY package*.json /app/

RUN npm ci

COPY . /app

ENV TF_LOG=trace

ENTRYPOINT ["/bin/sh"]
