import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("userId");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUsername(storedUser);
    }
  }, [navigate]);

  const createNewDocument = async () => {
    try {
      const response = await axios.post("http://localhost:9000/documents", { username });
      const docId = response.data.docId;
      console.log("📂 Created new document:", docId);
      navigate(`/editor/${docId}`);
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("username", username);

    try {
      const response = await axios.post("http://localhost:9000/upload-docx", formData);
      const docId = response.data._id;
      navigate(`/editor/${docId}`);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
      <h1>Welcome, {username}</h1>
      <button onClick={createNewDocument}>Create New Document</button>
      <input type="file" accept=".docx" onChange={handleFileUpload} />
    </div>
  );
};

export default Home;
