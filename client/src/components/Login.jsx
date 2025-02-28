import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!name) {
      alert("Please enter a name.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:9000/users/register", { name });
      localStorage.setItem("id", response); // Store username
      alert("Login successful!");
      navigate("/home");
    } catch (error) {
      console.error("Error registering user:", error);
      alert(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
