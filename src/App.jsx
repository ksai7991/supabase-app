import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [instrumentName, setInstrumentName] = useState("");
  const [instruments, setInstruments] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch session on load
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user);
          fetchInstruments(session.user);
        } else {
          setAvatarUrl(null);
          setInstruments([]);
        }
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch instruments for a user
  const fetchInstruments = async (user) => {
    const { data, error } = await supabase
      .from("instruments")
      .select("*")
      .eq("user_id", user.id);

    if (error) console.error("Error fetching instruments:", error.message);
    else setInstruments(data || []);
  };

  // Fetch profile & avatar
  const fetchProfile = async (user) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.warn("No profile found:", error.message);
      return;
    }

    if (data?.avatar_url) {
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.avatar_url);
      setAvatarUrl(publicUrlData.publicUrl);
    } else {
      setAvatarUrl(null);
    }
  };

  // Handle login with email
  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle signup with email
  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert("Check your email for confirmation!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // GitHub login
  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: "https://supabase-app-bay.vercel.app/",
      },
    });
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInstruments([]);
    setAvatarUrl(null);
  };

  // Add instrument
  const handleAddInstrument = async () => {
    if (!instrumentName) return;
    const { error } = await supabase
      .from("instruments")
      .insert([{ name: instrumentName, user_id: user.id }]);
    if (error) alert("Error adding instrument: " + error.message);
    else setInstrumentName("");
  };

  // Upload avatar
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Update profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: filePath });
      if (updateError) throw updateError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);
    } catch (err) {
      alert("Avatar upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

if (!user) {
  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "relative",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: -1,
        }}
      >
        <source
          src="https://rnuiwvfcdorupidgnovp.supabase.co/storage/v1/object/public/avatars/sunrayshadow.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Centered login form */}
      <div
        style={{
          position: "absolute",            // overlay on video
          top: "50%",                      // vertical center
          left: "50%",                     // horizontal center
          transform: "translate(-50%, -50%)", // exact center
          width: "350px",                  // fixed width
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(255, 255, 255, 0.85)", // semi-transparent
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          zIndex: 1,                        // above video
        }}
      >
        <h1 style={{ textAlign: "center" }}>Login or Sign Up</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: "10px", padding: "8px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: "10px", padding: "8px" }}
        />

        <button onClick={handleLogin} disabled={loading} style={{ marginBottom: "10px" }}>
          Login
        </button>
        <button onClick={handleSignUp} disabled={loading} style={{ marginBottom: "10px" }}>
          Sign Up
        </button>
        <button onClick={handleGithubLogin}>Login with GitHub</button>
      </div>
    </div>
  );
}



return (
  <div style={{ position: "relative", height: "100vh", overflow: "hidden", padding: "20px" }}>
    {/* Background video */}
    <video
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: "relative",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        zIndex: -1,
      }}
    >
      <source
        src="https://rnuiwvfcdorupidgnovp.supabase.co/storage/v1/object/public/avatars/sunrayshadow.mp4"
        type="video/mp4"
      />
      Your browser does not support the video tag.
    </video>

    {/* Content */}
    <div
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "600px",
        margin: "0 auto",
        padding: "40px",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1>Welcome, {user.email}</h1>
      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>Logout</button>

      {avatarUrl ? (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={avatarUrl}
            alt="Avatar"
            width={150}   // bigger avatar
            height={150}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <p>No avatar set</p>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      {uploading && <p>Uploading...</p>}

      <h2>Your Favorite Movies</h2>
      <ul>
        {instruments.map((movie) => (   // reuse instruments array as movies
          <li key={movie.id}>{movie.name}</li>
        ))}
      </ul>

      <input
        type="text"
        placeholder="Add new favorite movie"
        value={instrumentName}  // reuse state variable
        onChange={(e) => setInstrumentName(e.target.value)}
        style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
      />
      <button onClick={handleAddInstrument}>Add</button>
    </div>
  </div>
);


export default App;
