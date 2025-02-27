import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import Document from "./schema/documentSchema.js";


// Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/collab-editing", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


const app = express();
app.use(cors());

const PORT = 9000;
const server = app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("join-room", async (docId) => {
    socket.join(docId);
    console.log(`📂 User joined room: ${docId}`);

    // Load existing document content or create a new one
    const document = await Document.findById(docId);
    if (document) {
      socket.emit("load-document", document.content);
    } else {
      await Document.create({ _id: docId, content: {} });
    }
  });

  socket.on("send-changes", (docId, delta) => {
    socket.to(docId).emit("receive-changes", delta);
  });

  socket.on("save-document", async (docId, content) => {
    await Document.findByIdAndUpdate(docId, { content });
    console.log(`Document ${docId} saved`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
