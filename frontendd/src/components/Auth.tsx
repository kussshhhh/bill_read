import { useState } from "react";
import { signup, login } from "../services/splittyClient";

export interface AuthResponse {
  token?: string;
  userId?: string;
  // Add other response fields as needed
}

interface AuthProps {
  onAuthSuccess: (response: AuthResponse) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSignup() {
    setError(null);
    try {
      const res = await signup(email, password);
      onAuthSuccess(res);
    } catch (err: any) {
      setError(JSON.stringify(err, null, 2));
    }
  }

  async function handleLogin() {
    setError(null);
    try {
      const res = await login(email, password);
      onAuthSuccess(res);
    } catch (err: any) {
      setError(JSON.stringify(err, null, 2));
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Splitty Login</h2>
      <div style={styles.inputContainer}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={handleSignup} style={styles.button}>
          Sign Up
        </button>
        <button onClick={handleLogin} style={styles.button}>
          Log In
        </button>
      </div>
      {error && <div style={styles.error}>❌ Error: {error}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "30px",
    textAlign: "center",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    border: "1px solid #e1e1e1",
    borderRadius: "12px",
    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.1)",
    position: "absolute",
    top: "40%", // Moved up from 50% to 40%
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
  },
  header: {
    color: "#a78bfa", // Updated to your preferred color
    marginBottom: "25px",
    fontSize: "28px",
    fontWeight: 600,
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginBottom: "25px",
  },
  input: {
    padding: "12px 15px",
    fontSize: "16px",
    border: "1px solid #d0d0d0",
    borderRadius: "8px",
    outline: "none",
    transition: "border 0.3s",
    boxSizing: "border-box",
    width: "100%",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "20px",
    gap: "15px",
  },
  button: {
    padding: "12px 0",
    fontSize: "16px",
    cursor: "pointer",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#a78bfa", // Updated to your preferred color
    color: "#fff",
    fontWeight: 600,
    flex: 1,
    transition: "background-color 0.3s",
    boxShadow: "0px 3px 6px rgba(167, 139, 250, 0.3)", // Updated shadow to match new color
  },
  error: {
    color: "#e74c3c",
    whiteSpace: "pre-wrap",
    textAlign: "left",
    fontSize: "14px",
    padding: "10px",
    backgroundColor: "#fdeaea",
    borderRadius: "6px",
    marginTop: "10px",
  },
};