import { useState } from "react";
import { Link } from "react-router-dom";
import "./Pricing.css";

function Pricing() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [plan, setPlan] = useState(user?.plan || "Free");
  const [showPayment, setShowPayment] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [message, setMessage] = useState("");

  const handleUpgrade = async (e) => {
    e.preventDefault();

    if (cardName.trim() === "") {
      setMessage("Please enter the cardholder name.");
      return;
    }

    if (cardNumber.length !== 16 || isNaN(cardNumber)) {
      setMessage("Card number must contain 16 digits.");
      return;
    }

    if (expiry.length !== 5 || expiry[2] !== "/") {
      setMessage("Enter expiry in MM/YY format.");
      return;
    }

    if (cvv.length !== 3 && cvv.length !== 4) {
      setMessage("CVV must contain 3 or 4 digits.");
      return;
    }

    if (isNaN(cvv)) {
      setMessage("CVV must contain digits only.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/upgrade", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to upgrade your plan.");
        return;
      }

      setPlan("Paid");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, plan: "Paid" })
      );

      setShowPayment(false);
      setMessage("Plan upgraded successfully.");
    } catch {
      setMessage("Could not connect to the server.");
    }
  };

  return (
    <div className="pricing-container">
      <h1>Subscription Plans</h1>

      <div className="pricing-plans">
        <div className="pricing-card">
          <h2>Free Plan</h2>
          <h3>$0/month</h3>
          <p>Access to free posts</p>
          <p>Up to 5 posts per month</p>
          <p>Image uploads up to 2 MB</p>
          <p>Basic learning resources</p>
        </div>

        <div className="pricing-card">
          <h2>Paid Plan</h2>
          <h3>$9.99/month</h3>
          <p>Access to free and premium posts</p>
          <p>Up to 30 posts per month</p>
          <p>Image uploads up to 10 MB</p>
          <p>Premium learning resources</p>

          {!user ? (
            <Link to="/login">Login to upgrade</Link>
          ) : plan === "Paid" ? (
            <p>You are already on the Paid Plan.</p>
          ) : (
            <button onClick={() => {
              setMessage("");
              setShowPayment(true);
            }}>
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {showPayment && (
        <form onSubmit={handleUpgrade}>
          <h2>Payment Details</h2>

          <label>Cardholder Name</label>
          <input
            type="text"
            placeholder="Enter cardholder name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            required
          />

          <label>Card Number</label>
          <input
            type="text"
            placeholder="16-digit Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />

          <label>Expiry Date</label>
          <input
            type="text"
            placeholder="Expiry (MM/YY)"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            required
          />

          <label>CVV</label>
          <input
            type="password"
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            required
          />

          {message && <p>{message}</p>}

          <button type="submit">Confirm Upgrade</button>

          <button
            type="button"
            onClick={() => setShowPayment(false)}
          >
            Cancel
          </button>
        </form>
      )}

      {message && !showPayment && <p>{message}</p>}
    </div>
  );
}

export default Pricing;
