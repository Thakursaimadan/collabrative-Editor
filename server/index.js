import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import { readFileSync } from "fs";
import mammoth from "mammoth";
import { unlinkSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import Document from "./schema/documentSchema.js";

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

// Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/collab-editing", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = 9000;
const server = app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

const upload = multer({ dest: "uploads/" });

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});



io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("join-room", async (docId) => {
    socket.join(docId);
    console.log(`📂 User joined room: ${docId}`);

    try {
      let document = await Document.findById(docId);

      // If the document doesn't exist, create a new one
      if (!document) {
        document = new Document({ _id: docId, content: "" });
        await document.save();
      }

      // Send the document content to the user
      socket.emit("load-document", document.content);
    } catch (error) {
      console.error("❌ Error loading document:", error);
    }
  });

  socket.on("send-changes", (docId, delta) => {
    socket.to(docId).emit("receive-changes", delta);
  });

  socket.on("save-document", async (docId, content) => {
    try {
      await Document.findByIdAndUpdate(docId, { content });
    } catch (error) {
      console.error("❌ Error saving document:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});




app.post("/documents", async (req, res) => {
  try {
    const docId = uuidv4(); // Generate a unique ID
    const newDocument = new Document({ _id: docId, content: "" });
    await newDocument.save();
    res.status(201).json({ docId });
  } catch (error) {
    console.error("❌ Error creating document:", error);
    res.status(500).json({ error: "Server error" });
  }
});



app.post("/upload-docx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const docxBuffer = readFileSync(req.file.path);
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    
    const deltaContent = {
      ops: [{ insert: result.value + "\n" }], // Ensuring proper formatting
    };

    const newDocument = new Document({
      _id: uuidv4(),
      content:deltaContent,
    });

    await newDocument.save(); 

    unlinkSync(req.file.path); 

    res.json(newDocument);
  } catch (error) {
    console.error("❌ Error processing DOCX file:", error);
    res.status(500).json({ error: "Failed to process file." });
  }
});




app.get("/documents/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  } catch (error) {
    console.error("❌ Error fetching document:", error);
    res.status(500).json({ error: "Server error" });
  }
});




app.put("/documents/:id", async (req, res) => {
  try {
    const { content } = req.body;
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true } // Returns the updated document
    );
    if (!updatedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(updatedDocument);
  } catch (error) {
    console.error("❌ Error updating document:", error);
    res.status(500).json({ error: "Server error" });
  }
});




app.delete("/documents/:id", async (req, res) => {
  try {
    const deletedDocument = await Document.findByIdAndDelete(req.params.id);
    if (!deletedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    res.status(500).json({ error: "Server error" });
  }
});
