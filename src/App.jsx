import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [instruments, setInstruments] = useState([]);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login"); // or "signup"

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) getInstruments();
    });

    // Listen to login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) getInstruments();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function getInstruments() {
    const { data, error } = await supabase.from("instruments").select();
    if (!error) setInstruments(data);
  }

  async function handleAuth(e) {
    e.preventDefault();
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Login error: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Signup error: " + error.message);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setInstruments([]);
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>{authMode === "login" ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />
          <button type="submit">{authMode === "login" ? "Login" : "Sign Up"}</button>
        </form>
        <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
          Switch to {authMode === "login" ? "Sign Up" : "Login"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {user.email}</h2>
      <button onClick={logout}>Logout</button>
      <h3>Instruments</h3>
      <ul>
        {instruments.map((instrument) => (
          <li key={instrument.id}>{instrument.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
