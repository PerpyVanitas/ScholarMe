# Local Development Dockerfile
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.1.2

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose Next.js port
EXPOSE 3000

# Start dev server
CMD ["pnpm", "run", "dev"]
