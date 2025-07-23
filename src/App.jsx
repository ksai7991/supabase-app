import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [user, setUser] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [newInstrument, setNewInstrument] = useState("");
  const [email, setEmail] = useState("");

  // Check current user on app load
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchInstruments(data.user.id);
      }
    };
    getCurrentUser();

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchInstruments(session.user.id);
        } else {
          setUser(null);
          setInstruments([]);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch instruments created by current user
  const fetchInstruments = async (userId) => {
    const { data, error } = await supabase
      .from("instruments")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      alert("Error fetching instruments: " + error.message);
    } else {
      setInstruments(data);
    }
  };

  // Add a new instrument
  const addInstrument = async () => {
    if (!newInstrument || !user) return;

    const { data, error } = await supabase
      .from("instruments")
      .insert([{ name: newInstrument, user_id: user.id }]);

    if (error) {
      alert("Error adding instrument: " + error.message);
    } else {
      setNewInstrument("");
      setInstruments([...instruments, ...data]);
    }
  };

  // Log in using magic link
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    if (error) {
      alert("Error sending login email: " + error.message);
    } else {
      alert("Check your email for the login link.");
    }
  };

  // Log out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInstruments([]);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎵 My Instruments</h1>

      {!user ? (
        <>
          <p>Sign in with your email</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginRight: "1rem" }}
          />
          <button onClick={signIn}>Send Magic Link</button>
        </>
      ) : (
        <>
          <p>Signed in as {user.email}</p>
          <button onClick={signOut} style={{ marginBottom: "1rem" }}>
            Log out
          </button>

          <div>
            <input
              value={newInstrument}
              onChange={(e) => setNewInstrument(e.target.value)}
              placeholder="Add instrument"
              style={{ marginRight: "1rem" }}
            />
            <button onClick={addInstrument}>Add</button>
          </div>

          <h3 style={{ marginTop: "2rem" }}>🎸 Your Instruments</h3>
          {instruments.length === 0 ? (
            <p>No instruments added yet.</p>
          ) : (
            <ul>
              {instruments.map((instrument) => (
                <li key={instrument.id}>{instrument.name}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
