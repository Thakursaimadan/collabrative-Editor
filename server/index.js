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
import crypto from "crypto";
import User from "./schema/userSchema.js";

const app = express();
// app.use(cors({
//   origin: "*",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"]
// }));

app.use(cors({
  origin: ["http://localhost:3000", "http://10.0.52.:214:3000"],
  credentials: true,
}));


app.use(express.json()); 

mongoose.connect("mongodb+srv://coder1729c:JAjAsoAZLEJKvSqx@documents.mri3g.mongodb.net/?retryWrites=true&w=majority&appName=documents", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = 9000;
const server = app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));

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
    const { username } = req.body; // Owner ID passed from the frontend
    if (!username) {
      return res.status(400).json({ error: "Owner ID is required" });
    }

    const docId = uuidv4();
    const newDocument = new Document({ _id: docId, content: "", title: "", owner: username });

    await newDocument.save();

    await User.findByIdAndUpdate(username, { $push: { documents: docId } });

    res.status(201).json({ docId });
  } catch (error) {
    console.error("❌ Error creating document:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/users/register", async (req, res) => {
  try {
    const { name } = req.body;
    console.log("printing name",req.body);

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    let user = await User.findOne({ name });
    console.log(user);

    if (!user) {
      // Register new user if not found
      user = new User({ name, _id: uuidv4() });
      await user.save();
    }

    res.status(200).json({ message: "User logged in successfully", userId: user._id });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/users/:id/documents", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("documents");
    if (!user) {
      return res.status(404).app.get("/users/:id", async (req, res) => {
        try {
          const user = await User.findById(req.params.id).populate("documents");
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
      
          res.json({ name: user.name,documents: user.documents });
        } catch (error) {
          console.error("❌ Error fetching user details:", error);
          res.status(500).json({ error: "Server error" });
        }
      });
    }

    res.json(user.documents);
  } catch (error) {
    console.error("❌ Error fetching user's documents:", error);
    res.status(500).json({ error: "Server error" });
  }
});




app.put("/documents/:id/title", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      { title, lastUpdated: new Date() },  // Update title and lastUpdated field
      { new: true }  // Return the updated document
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(updatedDocument);
  } catch (error) {
    console.error("❌ Error updating title:", error);
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




app.post("/documents/:id/share", async (req, res) => {
  try {
    const { permission } = req.body;
    if (!["view", "edit"].includes(permission)) {
      return res.status(400).json({ error: "Invalid permission type" });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Generate a unique link ID
    const linkId = crypto.randomBytes(8).toString("hex");

    // Store the shared link
    document.sharedLinks.push({ linkId, permission });
    await document.save();

    const sharedURL = `http://localhost:3000/documents/shared/${linkId}`;
    res.json({ message: "Shareable link generated", sharedURL, permission });
  } catch (error) {
    console.error("❌ Error generating shareable link:", error);
    res.status(500).json({ error: "Server error" });
  }
});



app.get("/documents/shared/:linkId", async (req, res) => {
  try {
    const { linkId } = req.params;
    
    const document = await Document.findOne({ "sharedLinks.linkId": linkId });
    if (!document) {
      return res.status(404).json({ error: "Invalid or expired link" });
    }
     
    const sharedLink = document.sharedLinks.find(link => link.linkId === linkId);
    
    res.json({ document, permission: sharedLink.permission });
  } catch (error) {
    console.error("❌ Error accessing shared document:", error);
    res.status(500).json({ error: "Server error" });
  }
});




app.put("/documents/shared/:linkId", async (req, res) => {
  try {
    const { linkId } = req.params;
    const { content } = req.body;

    const document = await Document.findOne({ "sharedLinks.linkId": linkId });
    if (!document) {
      return res.status(404).json({ error: "Invalid or expired link" });
    }

    const sharedLink = document.sharedLinks.find(link => link.linkId === linkId);
    
    if (sharedLink.permission !== "edit") {
      return res.status(403).json({ error: "You do not have permission to edit this document" });
    }

    document.content = content;
    document.lastUpdated = new Date();
    await document.save();

    res.json({ message: "Document updated successfully" });
  } catch (error) {
    console.error("❌ Error updating shared document:", error);
    res.status(500).json({ error: "Server error" });
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
