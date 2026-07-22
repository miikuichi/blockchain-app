import { useState } from "react";

export default function Login({ onSwitch, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      // Save JWT
      localStorage.setItem("token", data.token);

      // Save user info (optional)
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful!");

      if (onLogin) {
        onLogin();
      }

    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">

      <img
        src="/wallet-logo.png"
        alt="Wallet Logo"
        className="auth-logo"
      />

      <h1>ADAPay Wallet</h1>

      <p className="auth-subtitle">
        Secure Blockchain Transactions
      </p>

      <form onSubmit={handleSubmit}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          required
        />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Access Wallet"}
        </button>

      </form>

      <p className="auth-footer">
        New here?

        <button
          type="button"
          className="auth-link"
          onClick={onSwitch}
        >
          Create Wallet
        </button>

      </p>

    </div>
  );
}