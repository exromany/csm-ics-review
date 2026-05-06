import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { toast } from "sonner";
import type { AdminIdentity } from "../types/api";

export const useAccountSync = () => {
  const { address, status } = useAccount();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { mutate: logout } = useLogout();

  useEffect(() => {
    if (status !== "connected" && status !== "disconnected") return;
    if (!identity?.address) return;

    if (status === "disconnected") {
      toast.info("Wallet disconnected. Please sign in again.");
      logout({ redirectPath: "/login" });
      return;
    }

    if (address && address.toLowerCase() !== identity.address.toLowerCase()) {
      toast.info("Wallet account changed. Please sign in again.");
      logout({ redirectPath: "/login" });
    }
  }, [status, address, identity?.address, logout]);
};
