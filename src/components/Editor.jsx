import { Box } from "@mui/material";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef } from "react";
import styled from "@emotion/styled";

const Component = styled.div`
background-color: #f5f5f5;`

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
  const editorRef = useRef(null);
  const containerRef = useRef(null); // Reference for the container div

  useEffect(() => {
    if (!editorRef.current && containerRef.current) {
      editorRef.current = new Quill(containerRef.current, {
        theme: "snow",
        modules: { toolbar: toolbarOptions },
      });
    }
  }, []);

  return(
    <Component>
        <Box ref={containerRef} id="container" className='container'></Box>;
    </Component>
  )
   
};

export default Editor;
