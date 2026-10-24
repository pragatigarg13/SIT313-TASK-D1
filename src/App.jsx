import "./App.css";
import { Routes, Route } from "react-router-dom";

import Navbar from "./Navbar";
import About from "./About";
import Projects from "./Projects";
import Photos from "./Photos";
import FeaturedArticles from "./FeaturedArticles";
import FeaturedTutorials from "./FeaturedTutorials";
import Subscribe from "./Subscribe";
import Contact from "./Contact";
import Footer from "./Footer";
import Login from "./Login";
import SignUp from "./SignUp";
import CreatePost from "./CreatePost";
import Pricing from "./Pricing";

function Home() {
  return (
    <>
      <About />
      <Projects />
      <Photos />
      <FeaturedArticles />
      <FeaturedTutorials />
      <Subscribe />
      <Contact />
    </>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
