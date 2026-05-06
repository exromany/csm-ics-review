import type { PropsWithChildren } from "react";
import { Menu } from "../menu";
import { useAccountSync } from "../../hooks/useAccountSync";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  useAccountSync();

  return (
    <div className="min-h-screen bg-background">
      <Menu />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  );
};
