import mongoose from "mongoose";
const SharedLinkSchema = new mongoose.Schema({
  linkId: String,
  permission: { type: String, enum: ["view", "edit"], required: true }, 
  createdAt: { type: Date, default: Date.now },
});

const DocumentSchema = new mongoose.Schema({
  _id: String,  
  content: Object, 
  title: String, 
  Permissions: Array, 
  lastUpdated: { type: Date, default: Date.now }, 
  created: { type: Date, default: Date.now }, 
  owner: String, 
  sharedLinks: [SharedLinkSchema], // Store shared links and permissions
});

const Document = mongoose.model("Document", DocumentSchema);
export default Document;