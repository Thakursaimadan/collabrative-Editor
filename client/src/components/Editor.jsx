import { Box } from "@mui/material";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const Component = styled.div`
  background-color: #f5f5f5;
`;

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  ["link", "image", "video", "formula"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["clean"],
];

const Editor = () => {
  const { docId } = useParams(); // Get document ID from URL
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const containerRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const quillInstance = new Quill(containerRef.current, {
      theme: "snow",
      modules: { toolbar: toolbarOptions },
    });

    quillRef.current = quillInstance;
    setQuill(quillInstance);
  }, []);

  useEffect(() => {
    const socketServer = io("http://localhost:9000");

    socketServer.on("connect", () => {
      console.log("✅ Connected to server:", socketServer.id);
      setSocket(socketServer);
      socketServer.emit("join-room", docId);
    });

    return () => {
      socketServer.disconnect();
    };
  }, [docId]);

  useEffect(() => {
    if (!socket || !quill) return;

    socket.on("load-document", (content) => {
      quill.setContents(content);
      console.log("📂 Loaded document content");
    });

    const handleChange = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", docId, delta);
    };

    quill.on("text-change", handleChange);

    return () => {
      quill.off("text-change", handleChange);
    };
  }, [socket, quill,docId]);

  useEffect(() => {
    if (!socket || !quill) return;

    socket.on("receive-changes", (delta) => {
      quill.updateContents(delta, "silent");
    });

    return () => {
      socket.off("receive-changes");
    };
  }, [socket, quill,docId]);

  // Save document every 2 seconds
  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit("save-document", docId, quill.getContents());
    }, 2000);

    return () => clearInterval(interval);
  }, [socket, quill,docId]);

  return (
    <Component>
      <Box ref={containerRef} id="container" className="container"></Box>
    </Component>
  );
};

export default Editor;
