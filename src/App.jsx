import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Account({ session }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [newInstrument, setNewInstrument] = useState("");

  // Get current user info
  useEffect(() => {
    async function getUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUserData();
  }, []);

  // Fetch instruments for the current user
  useEffect(() => {
    if (user) {
      getInstruments();
    }
  }, [user]);

  async function getInstruments() {
    const { data, error } = await supabase
      .from("instruments")
      .select()
      .eq("user_id", user.id); // Only fetch user's instruments

    if (!error) setInstruments(data);
  }

  async function handleAddInstrument(e) {
    e.preventDefault();
    if (!newInstrument.trim()) return;

    const { data, error } = await supabase
      .from("instruments")
      .insert([
        {
          name: newInstrument.trim(),
          user_id: user.id, // Save user ID
        },
      ]);

    if (error) {
      alert("Error adding instrument: " + error.message);
    } else {
      setInstruments([...instruments, ...data]);
      setNewInstrument("");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">Welcome, {user.email}</h1>

      <button
        onClick={handleLogout}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Sign out
      </button>

      <form onSubmit={handleAddInstrument} className="flex mb-4 gap-2">
        <input
          type="text"
          value={newInstrument}
          onChange={(e) => setNewInstrument(e.target.value)}
          placeholder="Add new instrument"
          className="flex-grow border p-2 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {instruments.map((inst) => (
          <li key={inst.id} className="border p-2 rounded">
            {inst.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
