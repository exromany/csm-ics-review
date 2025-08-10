import type { AuthProvider } from "@refinedev/core";
import { SiweMessage } from "siwe";
import { getAccount, signMessage } from "@wagmi/core";
import type { AdminAuthSignInDto, AdminAuthPayloadDto } from "../types/api";

export const TOKEN_KEY = "admin-jwt-token";
export const ADMIN_DATA_KEY = "admin-data";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

export const authProvider: AuthProvider = {
  login: async () => {
    try {
      const account = getAccount();

      if (!account.address || !account.isConnected) {
        return {
          success: false,
          error: {
            name: "WalletNotConnected",
            message: "Please connect your wallet first",
          },
        };
      }

      // Create SIWE message
      const domain = import.meta.env.VITE_SIWE_DOMAIN || window.location.host;
      const origin = window.location.origin;
      const statement =
        import.meta.env.VITE_SIWE_STATEMENT || "Sign in to CSM ICS Admin Panel";

      const message = new SiweMessage({
        domain,
        address: account.address,
        statement,
        uri: origin,
        version: "1",
        chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "1"),
      });

      const messageToSign = message.prepareMessage();

      // Sign the message
      const signature = await signMessage({
        message: messageToSign,
      });

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/admin/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSign,
          signature: signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            name: "AuthenticationError",
            message: errorData.message || "Failed to authenticate with server",
          },
        };
      }

      const data: AdminAuthSignInDto = await response.json();

      // Store JWT token and admin info
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(
        ADMIN_DATA_KEY,
        JSON.stringify({
          address: account.address,
          role: data.role,
        })
      );

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: {
          name: "LoginError",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    console.log("Auth check - token:", token ? "present" : "not present");

    if (!token) {
      console.log("Auth check - redirecting to login");
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    try {
      // Verify token with backend
      const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("Auth check - token valid");
        return {
          authenticated: true,
        };
      } else {
        console.log("Auth check - token invalid, redirecting to login");
        // Token is invalid, clean up
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_DATA_KEY);
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
    } catch (error) {
      console.error("Auth check error:", error);
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  getPermissions: async () => {
    const adminDataStr = localStorage.getItem(ADMIN_DATA_KEY);
    if (adminDataStr) {
      const adminData = JSON.parse(adminDataStr);
      return adminData.role;
    }
    return null;
  },

  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const adminDataStr = localStorage.getItem(ADMIN_DATA_KEY);

    if (token && adminDataStr) {
      try {
        // Get fresh admin data from backend
        const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: AdminAuthPayloadDto = await response.json();
          return {
            id: data.adminId,
            name: data.address,
            address: data.address,
            role: data.role,
            avatar: `https://effigy.im/a/${data.address}.png`, // Use effigy for Ethereum avatars
          };
        }
      } catch (error) {
        console.error("Get identity error:", error);
      }

      // Fallback to stored data
      const adminData = JSON.parse(adminDataStr);
      return {
        id: 1,
        name: adminData.address,
        address: adminData.address,
        role: adminData.role,
        avatar: `https://effigy.im/a/${adminData.address}.png`,
      };
    }

    return null;
  },

  onError: async (error) => {
    console.error("Auth provider error:", error);

    // Handle 401/403 errors by logging out
    if (error?.status === 401 || error?.status === 403) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
      return {
        error,
        logout: true,
        redirectTo: "/login",
      };
    }

    return { error };
  },
};