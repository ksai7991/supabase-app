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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch session on load and listen for auth changes
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch instruments and profile when user is logged in
  useEffect(() => {
    if (user) {
      fetchInstruments();
      fetchProfile();

      const channel = supabase
        .channel('instruments-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'instruments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setInstruments((prev) => [...prev, payload.new]);
            } else if (payload.eventType === 'DELETE') {
              setInstruments((prev) =>
                prev.filter((item) => item.id !== payload.old.id)
              );
            } else if (payload.eventType === 'UPDATE') {
              setInstruments((prev) =>
                prev.map((item) =>
                  item.id === payload.new.id ? payload.new : item
                )
              );
            }
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user]);

  const fetchInstruments = async () => {
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .eq('user_id', user.id);

    if (error) console.error('Error fetching instruments:', error.message);
    else setInstruments(data);
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (!error && data?.avatar_url) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.avatar_url);
      setAvatarUrl(urlData.publicUrl);
    }
  };

  // Email/password login
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Login failed: ' + error.message);
    else window.location.href = 'https://stingray-app-5y3zr.ondigitalocean.app/';
  };

  // Email/password signup
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert('Sign-up failed: ' + error.message);
    else alert('Check your email for confirmation!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInstruments([]);
  };

  const handleAddInstrument = async () => {
    if (!instrumentName) return;
    const { error } = await supabase
      .from('instruments')
      .insert([{ name: instrumentName, user_id: user.id }]);
    if (error) alert('Error adding instrument: ' + error.message);
    else setInstrumentName('');
  };

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: filePath });
      if (updateError) throw updateError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      setAvatarUrl(publicUrlData.publicUrl);
    } catch (error) {
      alert('Avatar upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Render login / signup screen
  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Login or Sign Up</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleSignUp}>Sign Up</button>

        {/* GitHub OAuth login */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                  redirectTo: 'https://stingray-app-5y3zr.ondigitalocean.app/',
                },
              })
            }
          >
            Login with GitHub
          </button>
        </div>
      </div>
    );
  }

  // Render dashboard / instruments page
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user.email}</h1>
      <button onClick={handleLogout}>Logout</button>

      {avatarUrl && (
        <div>
          <img
            src={avatarUrl}
            alt="Avatar"
            width={100}
            style={{ borderRadius: '50%' }}
          />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}

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
