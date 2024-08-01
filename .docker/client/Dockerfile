# Use the official Node.js 20 image as a base image
FROM node:20-alpine as dependency-base

# Install system dependencies
RUN apk update && apk upgrade
RUN apk add --no-cache openssh g++ make python3 bash vim git wget curl && \
    rm -rf /var/cache/apk/*

# Create destination directory
ENV WORKDIR=/home/client
RUN mkdir -p $WORKDIR
WORKDIR $WORKDIR

# Copy over package.json and package-lock.json files
COPY ./package*.json $WORKDIR/

FROM dependency-base AS client_development
RUN npm install && npm cache clean --force

# Set NODE_ENV environment variable to development
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
# Service hostname
ENV NUXT_HOST=0.0.0.0

# Copy the rest of the application code
COPY . .

# Adjust permissions for Nuxt.js directory
RUN chmod -R 755 $WORKDIR

# Use non-root user for better security
ARG UID=1041
ARG GID=1001
RUN if getent passwd client > /dev/null; then deluser client; fi && \
    if getent group client > /dev/null; then delgroup client; fi && \
    addgroup -g ${GID} client && \
    adduser -D -G client -u ${UID} client

# Change ownership of the working directory
RUN chown -R client:client $WORKDIR

# Switch to the non-root user
USER client

# Expose port 3000 (Nuxt default port)
EXPOSE 3000

# Command to keep the container running
CMD ["npm", "run", "dev"]
# CMD ["sh", "-c", "while :; do sleep 2073600; done"]
