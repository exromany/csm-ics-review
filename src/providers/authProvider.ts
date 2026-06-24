import type { AuthProvider } from "@refinedev/core";
import { SiweMessage } from "siwe";
import { getAccount, signMessage } from "@wagmi/core";
import { adminAuthGetNonce, adminAuthSignIn, adminAuthVerify } from "@/client/sdk.gen";
import { config as wagmiConfig } from "./wagmiConfig";
import { appConfig } from "@/config/env";
import { TOKEN_KEY, ADMIN_DATA_KEY } from "./authTokens";
// Configure the shared hey-api client (baseUrl + bearer auth) before any call.
import "./apiClient";

export { TOKEN_KEY, ADMIN_DATA_KEY };

export const authProvider: AuthProvider = {
  login: async () => {
    try {
      const account = getAccount(wagmiConfig);

      if (!account.address || !account.isConnected) {
        return {
          success: false,
          error: {
            name: "WalletNotConnected",
            message: "Please connect your wallet first",
          },
        };
      }

      // Fetch a server-issued nonce to embed in the SIWE message (prevents replay)
      const { data: nonceData, response: nonceResponse } =
        await adminAuthGetNonce();

      if (!nonceResponse?.ok || !nonceData?.nonce) {
        return {
          success: false,
          error: {
            name: "AuthenticationError",
            message: "Failed to obtain sign-in nonce. Please try again.",
          },
        };
      }

      // Create SIWE message
      const domain = appConfig.siweDomain || window.location.host;
      const origin = window.location.origin;
      const statement = appConfig.siweStatement;

      const message = new SiweMessage({
        domain,
        address: account.address,
        statement,
        uri: origin,
        version: "1",
        chainId: appConfig.chainId,
        nonce: nonceData.nonce,
      });

      const messageToSign = message.prepareMessage();

      // Sign the message
      const signature = await signMessage(wagmiConfig, {
        message: messageToSign,
      });

      // Exchange the signed message for a JWT
      const { data, error, response } = await adminAuthSignIn({
        body: { message: messageToSign, signature },
      });

      if (!response?.ok || !data) {
        const status = response?.status;
        const apiMessage = (error as { message?: string } | undefined)?.message;

        // Enhanced error handling based on status codes and error messages
        let errorMessage = "Failed to authenticate with server";

        if (status === 401) {
          errorMessage =
            apiMessage ||
            "Invalid signature or wallet not authorized for admin access";
        } else if (status === 403) {
          errorMessage = "This wallet does not have admin privileges";
        } else if (status === 400) {
          if (apiMessage?.includes("signature")) {
            errorMessage = "Invalid signature format. Please try again.";
          } else if (apiMessage?.includes("nonce")) {
            errorMessage = "Message expired. Please refresh and try again.";
          } else {
            errorMessage = apiMessage || "Invalid request format";
          }
        } else if (status && status >= 500) {
          errorMessage = "Server error. Please try again in a moment.";
        } else {
          errorMessage =
            apiMessage || `Server returned error ${status ?? "(network)"}`;
        }

        return {
          success: false,
          error: {
            name: "AuthenticationError",
            message: errorMessage,
          },
        };
      }

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

    if (!token) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    try {
      // Verify token with backend (bearer header injected by the client)
      const { response } = await adminAuthVerify();

      if (response?.ok) {
        return {
          authenticated: true,
        };
      }

      // Token is invalid, clean up
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    } catch {
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
        const { data, response } = await adminAuthVerify();

        if (response?.ok && data) {
          return {
            id: data.adminId,
            name: data.address,
            address: data.address,
            role: data.role,
            avatar: `https://effigy.im/a/${data.address}.png`, // Use effigy for Ethereum avatars
          };
        }
      } catch {
        // Silent fail, fallback to stored data
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
