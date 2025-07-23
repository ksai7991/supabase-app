import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client using Vite env variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [instruments, setInstruments] = useState([]);
  const [newInstrument, setNewInstrument] = useState("");

  // Fetch data on load
  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    const { data, error } = await supabase.from("instruments").select("*");
    if (error) {
      console.error("Error fetching instruments:", error.message);
    } else {
      setInstruments(data);
    }
  };

  const addInstrument = async () => {
    if (!newInstrument) return;

    const { data, error } = await supabase
      .from("instruments")
      .insert([{ name: newInstrument }]);

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
    </div>
  );
}
