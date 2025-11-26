# Installation Guide

## Step 1: Install Dependencies

```bash
cd server
npm install
```

This will install:
- `better-auth` - Authentication library
- `@better-auth/mongodb` - MongoDB adapter for Better Auth
- Express, TypeScript, and other dependencies

## Step 2: Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:
- `BETTER_AUTH_SECRET` - Generate a strong secret key
- `MONGODB_URI` - Should be `mongodb://localhost:27017/gym_db` for Docker
- Other variables as needed

## Step 3: Start Services

```bash
# From project root
docker-compose up -d
```

This starts:
- MongoDB (port 27017)
- Redis (port 6379)
- MinIO (ports 9000, 9001)

## Step 4: Start Server

```bash
cd server
npm run dev
```

Server will run on `http://localhost:3000`

## Step 5: Test Authentication

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Session (with cookies)

```bash
curl http://localhost:3000/api/auth/session \
  -b cookies.txt
```

## Troubleshooting

### Better Auth not found
```bash
npm install better-auth @better-auth/mongodb
```

### MongoDB connection error
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker logs gym_mongodb
```

### Port already in use
Change `PORT` in `.env` file

