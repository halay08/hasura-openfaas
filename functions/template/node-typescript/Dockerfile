FROM --platform=${TARGETPLATFORM:-linux/amd64} ghcr.io/openfaas/of-watchdog:0.8.4 as watchdog
FROM --platform=${TARGETPLATFORM:-linux/amd64} node:15-alpine as ship

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG NPM_TOKEN=$(NPM_TOKEN)

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

RUN addgroup -S app && adduser -S -g app app

WORKDIR /root/

# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir -p /home/app
RUN mkdir -p /home/app/root/function

RUN echo -e "//npm.pkg.github.com/:_authToken=$NPM_TOKEN\n\
@halay08:registry=https://npm.pkg.github.com/" > ~/.npmrc

# This ordering means the npm installation is cached for the outer function handler.
#RUN npm i
WORKDIR /home/app/root
# Copy outer function handler
COPY index.ts ./
COPY function/*.json ./

# COPY function node packages and install, adding this as a separate
# entry allows caching of npm install
WORKDIR /home/app/root/function

# COPY function files and folders
COPY function/ ./
#RUN npm i || :


# Set correct permissions to use non root user
WORKDIR /home/app/root
RUN npm i

RUN rm -rf ~/.npmrc

# chmod for tmp is for a buildkit issue (@alexellis)
RUN chown app:app -R /home/app \
    && chmod 777 /tmp

USER app

RUN yarn run tsc index.ts --lib esnext,dom,esnext.asynciterable --esModuleInterop true

ENV cgi_headers="true"
ENV fprocess="node index.js"
ENV mode="http"
ENV upstream_url="http://127.0.0.1:3000"

ENV exec_timeout="10s"
ENV write_timeout="15s"
ENV read_timeout="15s"

ENV prefix_logs="false"

HEALTHCHECK --interval=3s CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]

