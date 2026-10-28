import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithGoogle } from "./utils/firebase";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "https://devdeakin-backend-matn.onrender.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Incorrect email or password.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("userLogin"));

      alert("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");

    try {
      // Sign in with Google through Firebase
      const googleUser = await loginWithGoogle();

      // Get the Firebase ID token
      const idToken = await googleUser.getIdToken();

      // Send the token to the backend
      const response = await fetch(
        "https://devdeakin-backend-matn.onrender.com/google-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ idToken })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Google login failed.");
        return;
      }

      // Save the application session
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("userLogin"));

      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);

      setMessage(
        error.code === "auth/popup-closed-by-user"
          ? "Google sign-in was cancelled."
          : "Unable to sign in with Google. Please try again."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <Link to="/signup" className="signup-link">
          Sign up
        </Link>

        <form onSubmit={handleLogin}>
          <label>Your email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Your password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {message && <p className="error-message">{message}</p>}

          <button type="submit">Login</button>
        </form>

        <p>or</p>

        <button type="button" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
