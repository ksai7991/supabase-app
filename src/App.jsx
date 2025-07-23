import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [instruments, setInstruments] = useState([]);
  const [newInstrument, setNewInstrument] = useState("");
  const [user, setUser] = useState(null);

  // Get the current user on load
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchInstruments(data.user.id);
      } else {
        console.error("User not logged in:", error?.message);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch instruments filtered by current user
  const fetchInstruments = async (userId) => {
    const { data, error } = await supabase
      .from("instruments")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching instruments:", error.message);
    } else {
      setInstruments(data);
    }
  };

  // Add instrument with user_id
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

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎵 Instruments</h1>

      {!user ? (
        <p>Please log in</p>
      ) : (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <input
              value={newInstrument}
              onChange={(e) => setNewInstrument(e.target.value)}
              placeholder="Add new instrument"
            />
            <button onClick={addInstrument}>Add</button>
          </div>

          <ul>
            {instruments.map((instrument) => (
              <li key={instrument.id}>{instrument.name}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
