import { IncomingMessage, Server as HttpServer } from "http";
import { RequestHandler } from "express";
import { Server } from "socket.io";
import { config } from "./app-config";
import MemberModel from "../models/Member";
import { SocketEventEnum, SocketEventEnumType } from "../enums/socket";

type SessionRequest = IncomingMessage & {
  session?: { passport?: { user?: { _id?: string } } } | null;
};

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;
const workspaceRoom = (workspaceId: string) => `workspace:${workspaceId}`;

export const initSocket = (
  httpServer: HttpServer,
  sessionMiddleware: RequestHandler
) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_ORIGIN,
      credentials: true,
    },
    // Netlify's proxy can't carry WebSockets, so production uses long
    // polling; keep each poll under the proxy's ~26 s timeout.
    pingInterval: 20000,
    pingTimeout: 20000,
  });

  // Reuse the cookie session, so a socket belongs to the logged-in user.
  io.engine.use(sessionMiddleware);

  io.use((socket, next) => {
    const request = socket.request as SessionRequest;
    const userId = request.session?.passport?.user?._id;
    if (!userId) {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = String(userId);
    next();
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));

    socket.on(SocketEventEnum.WORKSPACE_JOIN, async (workspaceId: unknown) => {
      if (typeof workspaceId !== "string") return;

      const isMember = await MemberModel.exists({
        userId: socket.data.userId,
        workspaceId,
      }).catch(() => null);
      if (!isMember) return;

      socket.rooms.forEach((room) => {
        if (room.startsWith("workspace:")) socket.leave(room);
      });
      socket.join(workspaceRoom(workspaceId));
    });
  });

  return io;
};

export const emitToWorkspace = (
  workspaceId: string,
  event: SocketEventEnumType,
  payload: Record<string, unknown> = {}
) => {
  io?.to(workspaceRoom(String(workspaceId))).emit(event, {
    workspaceId: String(workspaceId),
    ...payload,
  });
};

export const emitToUser = (
  userId: string,
  event: SocketEventEnumType,
  payload: Record<string, unknown> = {}
) => {
  io?.to(userRoom(String(userId))).emit(event, payload);
};
