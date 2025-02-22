import { Box } from "@mui/material";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { io } from "socket.io-client";

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
    setSocket(socketServer);

    return () => {
      socketServer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;

    const handleChange = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handleChange);

    return () => {
      quill.off("text-change", handleChange);
    };
  }, [socket, quill]);

  return (
    <Component>
      <Box ref={containerRef} id="container" className="container"></Box>
    </Component>
  );
};

export default Editor;
