# Use Node.js 22 Alpine as base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Expose port 4000
EXPOSE 4000

# Start the SSR server
CMD ["npm", "run", "serve:ssr"]
