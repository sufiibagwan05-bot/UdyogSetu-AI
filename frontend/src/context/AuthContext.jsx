
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE_URL = "import.meta.env.VITE_API_URL";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(
      "udyogsetu_user"
    );

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      localStorage.removeItem("udyogsetu_user");
      return null;
    }
  });

  const [token, setToken] = useState(
    localStorage.getItem("udyogsetu_token")
  );

  const [loading, setLoading] = useState(true);

  const saveAuthentication = (
    loginToken,
    loginUser
  ) => {
    localStorage.setItem(
      "udyogsetu_token",
      loginToken
    );

    localStorage.setItem(
      "udyogsetu_user",
      JSON.stringify(loginUser)
    );

    setToken(loginToken);
    setUser(loginUser);
  };

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email,
        password,
      }
    );

    const {
      token: loginToken,
      user: loginUser,
    } = response.data;

    saveAuthentication(
      loginToken,
      loginUser
    );

    return response.data;
  };

  const demoLogin = async (
    email,
    password,
    role
  ) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/demo-login`,
      {
        email,
        password,
        role,
      }
    );

    const {
      token: loginToken,
      user: loginUser,
    } = response.data;

    saveAuthentication(
      loginToken,
      loginUser
    );

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem(
      "udyogsetu_token"
    );

    localStorage.removeItem(
      "udyogsetu_user"
    );

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const authenticatedUser =
          response.data.user;

        setUser(authenticatedUser);

        localStorage.setItem(
          "udyogsetu_user",
          JSON.stringify(authenticatedUser)
        );
      } catch (error) {
        localStorage.removeItem(
          "udyogsetu_token"
        );

        localStorage.removeItem(
          "udyogsetu_user"
        );

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        logout,
        isAuthenticated: !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

