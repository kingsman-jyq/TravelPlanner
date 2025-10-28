import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../services/api';

// Define the shape of the context data
interface AuthContextType {
  user: any; // In a real app, you'd have a User type
  login: (email, password) => Promise<void>;
  register: (email, password) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // For initial auth check

  useEffect(() => {
    // Simulate an initial session check
    // In a real application, you would make an API call here
    // to check for an existing session (e.g., /auth/me endpoint)
    const checkSession = async () => {
      try {
        // For now, we assume if cookies are present, the session might be valid
        // A proper check would involve a backend call that returns user info
        // if the session cookie is valid.
        // If the backend returns user data, setUser(data.user);
        // If not, setUser(null);
      } catch (error) {
        console.error("Initial session check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/signin', { email, password });
    console.log('AuthContext: Data from signin API:', data);
    console.log('AuthContext: User object to set:', data.data.user);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (email, password) => {
    const { data } = await api.post('/auth/signup', { email, password });
    // Maybe log them in automatically after registration, or let them log in manually
    // For now, we won't automatically log them in.
    console.log('Registration successful:', data);
  };

  const logout = async () => {
    // Invalidate session on the backend
    try {
      await api.post('/auth/logout'); // Assuming a logout endpoint exists
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a custom hook for easy consumption of the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
