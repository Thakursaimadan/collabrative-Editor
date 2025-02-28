import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Editor from "./components/Editor";
import Login from "./components/Login";
import SharedDocument from "./components/SharedDocument";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:docId" element={<Editor />} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/documents/shared/:linkId" element={<SharedDocument />} />
      </Routes>
    </Router>
  );
}

export default App;
