import { useState } from "react";

export default function Register({ onSwitch }) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Registration successful!");

      // Clear the form
      setFirstname("");
      setLastname("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Go back to login
      onSwitch();

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

      <h1>Create Wallet</h1>

      <p className="auth-subtitle">
        Create your blockchain wallet
      </p>

      <form onSubmit={handleRegister}>

        <input
          type="text"
          placeholder="First Name"
          className="auth-input"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
        />

        <input
          type="text"
          placeholder="Last Name"
          className="auth-input"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="auth-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Creating Wallet..." : "Create Wallet"}
        </button>

      </form>

      <p className="auth-footer">
        Already have a wallet?{" "}
        <button
          type="button"
          className="auth-link"
          onClick={onSwitch}
        >
          Login
        </button>
      </p>

    </div>
  );
}