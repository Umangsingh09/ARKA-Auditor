import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GithubAuthProvider
} from "firebase/auth";
import { auth, provider } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loginWithGithub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      await handleLoginSuccess(result);
    } catch (popupError) {
      console.error("Login Error:", popupError);

      if (popupError.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
      } else {
        setError(popupError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (result) => {
    try {
      const user = result.user;
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      const firebaseToken = await user.getIdToken();

      localStorage.setItem("token", firebaseToken);
      localStorage.setItem("github_token", accessToken);

      alert(`Welcome ${user.displayName || user.email}! 🚀`);

      navigate("/dashboard");

    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handleLoginSuccess(result);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkRedirect();
  }, []);

  return (
    <div style={{
      textAlign: "center",
      marginTop: "100px",
      padding: "20px",
      maxWidth: "400px",
      margin: "100px auto"
    }}>
      <h1>🔐 GitHub Login</h1>

      {error && (
        <div style={{
          backgroundColor: "#fee",
          color: "#c33",
          padding: "10px",
          borderRadius: "5px",
          margin: "20px 0"
        }}>
          {error}
        </div>
      )}

      <button
        onClick={loginWithGithub}
        disabled={isLoading}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          cursor: isLoading ? "not-allowed" : "pointer",
          backgroundColor: "#24292e",
          color: "white",
          border: "none",
          borderRadius: "6px"
        }}
      >
        {isLoading ? "Logging in..." : "Login with GitHub"}
      </button>
    </div>
  );
};

export default Login;