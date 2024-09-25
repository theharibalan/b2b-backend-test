# Use the official Node.js image as a base
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Define the command to run your app
CMD [ "node", "server.js" ]
