import mongoose from "mongoose";
const DocumentSchema=new mongoose.Schema({
    _id: String,  // Document ID
  content: Object, // Quill Delta format
})
const Document=mongoose.model('Document',DocumentSchema);

export default Document;