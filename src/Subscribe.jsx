import { useState } from "react";

function Subscribe() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setMessage(data.message);
      
      if (response.ok) {
        setEmail("");
      }
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    }
  }

  return (
    <section
      id="subscribe"
      className="flex flex-wrap justify-center items-center gap-2 p-6"
    >
      <h3 className="text-xl md:text-2xl text-cyan-700">
        <strong>SIGN UP FOR OUR DAILY INSIDER</strong>
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 p-2"
          required
        />

        <button type="submit" className="bg-gray-300 px-4 py-2">
          Subscribe
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}

export default Subscribe;



