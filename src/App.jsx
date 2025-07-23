import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [instrumentName, setInstrumentName] = useState('');
  const [instruments, setInstruments] = useState([]);

  // Load session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch instruments when user logs in
  useEffect(() => {
    if (user) {
      fetchInstruments();
    }
  }, [user]);

  const fetchInstruments = async () => {
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching instruments:', error.message);
    } else {
      setInstruments(data);
    }
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      setUser(data.user);
    }
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert('Sign-up failed: ' + error.message);
    } else {
      alert('Check your email for confirmation!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInstruments([]);
  };

  const handleAddInstrument = async () => {
    if (!instrumentName) return;

    const { data, error } = await supabase
      .from('instruments')
      .insert([{ name: instrumentName, user_id: user.id }])
      .select();

    if (error) {
      alert('Error adding instrument: ' + error.message);
    } else {
      setInstrumentName('');
      setInstruments((prev) => [...prev, ...data]);
    }
  };

  if (!user) {
    return (
      <div>
        <h1>Login or Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleSignUp}>Sign Up</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={handleLogout}>Logout</button>

      <h2>Your Instruments</h2>
      <ul>
        {instruments.map((inst) => (
          <li key={inst.id}>{inst.name}</li>
        ))}
      </ul>

      <input
        type="text"
        placeholder="Add new instrument"
        value={instrumentName}
        onChange={(e) => setInstrumentName(e.target.value)}
      />
      <button onClick={handleAddInstrument}>Add</button>
    </div>
  );
}

export default App;
