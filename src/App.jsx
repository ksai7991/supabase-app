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
  const [loading, setLoading] = useState(true); // Add loading state

  // Fetch session on load and listen for auth changes
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial Session:', session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching );
      } finally {
        setLoading(false); // Stop loading once session is checked
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session);
      setUser(session?.user ?? null);
      setLoading(false); // Ensure loading stops on state change
    });

    return () => {
      listener.subscription.unsubscribe();
    };
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
    else setInstruments(data || []);
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('ava    .eq('id', user.id)
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
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Login failed: ' + error.message);
      console.log('Login response:', data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Email/password signup
  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error('Sign-up failed: ' + error.message);
      alert('Check your email for confirmation!');
    } catch (error) {
      alert(error.message);
    } se);
    }
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
     d: user.id, avatar_url: filePath });
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

  // Login screen
  if (loading) {
    return <div>Loading...</div>; // Show loading state while checking auth
  }

  if (!user) {
    return (
      <div id="root" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h1>Login or Sign Up</h1>
        <div style={{ marginBottom: '20px' }}>
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
        (e) => setPassword(e.target.value)}
          />
          <br />
          <button onClick={handleLogin} disabled={loading}>Login</button>
          <button onClick={handleSignUp} disabled={loading}>Sign Up</button>
        </div>
        <div>
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

  // Dashboard
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
        </div>  <input
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
