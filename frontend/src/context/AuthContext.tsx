"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, RegisterRequest, LoginRequest } from "@/types/auth";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // If we have a stored user and token, set the user immediately to prevent redirect
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const normalizedUser = {
            ...parsedUser,
            id: parsedUser._id || parsedUser.id,
          };

          // Set user immediately from localStorage to prevent redirect
          dispatch({ type: "AUTH_SUCCESS", payload: normalizedUser });
          return;
        } catch (parseError) {
          console.error("Failed to parse stored user data:", parseError);
        }
      }

      // If we have a token but no valid stored user, clear everything
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error) {
      console.error("Auth status check failed:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log(
        "procee.env.NEXT_PUBLIC_API_BASE_URL",
        process.env.NEXT_PUBLIC_API_BASE_URL
      );
      console.log("AuthContext login called with:", email); // Debug log
      dispatch({ type: "AUTH_START" });

      console.log("Making API call to authAPI.login"); // Debug log
      const response = await authAPI.login({ email, password });
      console.log("API response received:", response); // Debug log

      if (response.data.success && response.data.data) {
        const { user, accessToken, refreshToken } = response.data.data;

        // Ensure compatibility between _id and id
        const normalizedUser = {
          ...user,
          id: user._id || user.id,
        };

        console.log("Storing tokens and user data"); // Debug log
        // Store tokens and user data
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(normalizedUser));

        dispatch({ type: "AUTH_SUCCESS", payload: normalizedUser });
        toast.success("Logged in successfully");
      } else {
        console.log("Login failed: Invalid response", response.data); // Debug log
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.log("Login error caught:", error); // Debug log
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: "AUTH_START" });

      // Ensure recaptchaToken is provided
      const registrationData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        recaptchaToken: userData.recaptchaToken || "",
      };

      const response = await authAPI.register(registrationData);

      if (response.data.success) {
        // Registration successful, but user might need email verification
        if (response.data.data) {
          const { user, accessToken, refreshToken } = response.data.data;

          // Ensure compatibility between _id and id
          const normalizedUser = {
            ...user,
            id: user._id || user.id,
          };

          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }
          localStorage.setItem("user", JSON.stringify(normalizedUser));

          dispatch({ type: "AUTH_SUCCESS", payload: normalizedUser });
          toast.success(
            response.data.message || "Account created successfully"
          );
        } else {
          // Email verification required
          dispatch({ type: "SET_LOADING", payload: false });
          toast.success(
            response.data.message ||
              "Registration successful. Please check your email to verify your account."
          );
        }
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to logout on server
      await authAPI.logout();
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      dispatch({ type: "LOGOUT" });
      toast.success("Logged out successfully");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    const updatedUser = { ...state.user, ...userData } as User;
    dispatch({ type: "UPDATE_USER", payload: userData });
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
