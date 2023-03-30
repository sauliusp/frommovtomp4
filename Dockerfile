# Use the official Node.js image as the base
FROM node:18

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port your app will run on
EXPOSE 10000

# Start the application
CMD [ "npm", "start" ]