import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const updateToken = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("userLogin", updateToken);

    return () => {
      window.removeEventListener("userLogin", updateToken);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        DEV@Deakin
      </Link>

      <input
        type="text"
        placeholder="Search..."
        className="navbar-search"
      />

      <Link to="/create-post" className="navbar-post">
        Post
      </Link>

      <Link to="/pricing" className="navbar-post">
        Pricing
      </Link>

      {token ? (
        <button onClick={handleLogout} className="navbar-login">
          Logout
        </button>
      ) : (
        <>
          <Link to="/login" className="navbar-login">
            Login
          </Link>

          <Link to="/signup" className="navbar-login">
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;
