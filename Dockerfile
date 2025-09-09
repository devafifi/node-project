# Use official Node.js runtime (lightweight alpine version)
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy project files
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Run the application
CMD ["node", "app.js"]

