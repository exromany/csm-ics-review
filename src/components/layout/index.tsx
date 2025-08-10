import type { PropsWithChildren } from "react";
import { Menu } from "../menu";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Menu />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  );
};
