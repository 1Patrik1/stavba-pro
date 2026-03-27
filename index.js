import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// [ATTENDANCE] API pro GPS Docházku s Geofence logikou
app.post('/api/attendance/checkin', authenticateToken, async (req, res) => {
  const { projectId, lat, lng } = req.body;
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) return res.status(404).json({ error: "Projekt nenalezen" });

  // Geofence výpočet (Haversine formula pro vzdálenost)
  const R = 6371e3; // Poloměr země v metrech
  const dLat = (lat - project.latitude) * Math.PI / 180;
  const dLng = (lng - project.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(project.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const isValid = distance <= project.radius;

  const attendance = await prisma.attendance.create({
    data: { userId: req.user.id, projectId, inLat: lat, inLng: lng, isValid }
  });

  res.json({ success: true, attendance, distance, isValid });
});

// [CHAT] WebSocket Real-time infrastruktura
io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  socket.on('join_task_chat', (taskId) => {
    socket.join(taskId);
    console.log(`[SOCKET] User joined task chat: ${taskId}`);
  });

  socket.on('send_message', async (data) => {
    const message = await prisma.message.create({
      data: { content: data.content, userId: data.userId, taskId: data.taskId }
    });
    io.to(data.taskId).emit('receive_message', message);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`[SYSTEM] Nexus Build Server běží na portu ${PORT}`);
});