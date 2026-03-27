# Construction Project Management App

A full-stack application for managing construction projects with a Node.js backend and React Native mobile app.

## Backend Features

- User authentication with JWT and RBAC (Admin, Manager, Worker)
- Project management with GPS geofencing
- Task assignment and photo documentation
- Attendance tracking with GPS validation using Haversine formula
- Real-time chat for tasks via Socket.IO
- Construction diary logs

## Mobile App Features

- GPS-based check-in with geofence validation
- Photo documentation for tasks
- Real-time connection to backend API

## Setup

### Backend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your PostgreSQL database and update `.env` with the correct DATABASE_URL and JWT_SECRET.

3. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Mobile App

1. Navigate to mobile directory:
   ```bash
   cd mobile/NexusBuildMobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Use Expo Go app on your device or emulator to test.

## API Endpoints

- `POST /api/attendance/checkin`: Check in with GPS coordinates (requires JWT token)

## WebSocket Events

- `join_task_chat`: Join a task's chat room
- `send_message`: Send a message to a task chat
- `receive_message`: Receive messages from task chat

## Database Schema

The app uses Prisma ORM with PostgreSQL. See `prisma/schema.prisma` for the full schema.