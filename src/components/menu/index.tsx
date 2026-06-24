import { useLogout, useGetIdentity, useNavigation, useResourceParams } from "@refinedev/core";
import { useDisconnect } from "wagmi";
import { LogOut, Users, FileText, Network, Settings, type LucideIcon } from "lucide-react";
import type { AdminIdentity } from "../../types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { appConfig } from "@/config/env";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  label: string;
  icon: LucideIcon;
  supervisorOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { name: "ics-forms", label: "ICS Forms", icon: FileText },
  { name: "idvtc-forms", label: "IDVTC Forms", icon: Network },
  { name: "admin-users", label: "Users", icon: Users, supervisorOnly: true },
  { name: "settings", label: "Settings", icon: Settings },
];

export const Menu = () => {
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { disconnect } = useDisconnect();
  const { list } = useNavigation();
  const { identifier: activeIdentifier } = useResourceParams();

  // Shared styling for nav affordances — the relative underline indicator that
  // animates in for the active item.
  const navItemClass = (active: boolean) =>
    cn(
      "relative after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:transition-opacity",
      active
        ? "text-foreground after:opacity-100"
        : "text-muted-foreground hover:text-foreground after:opacity-0"
    );

  const handleLogout = () => {
    disconnect();
    logout();
  };

  return (
    <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold">
              {appConfig.appName}
            </h1>
            
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-1">
              {NAV_ITEMS.map((item) => {
                if (item.supervisorOnly && identity?.role !== "SUPERVISOR") {
                  return null;
                }

                const isActive = activeIdentifier === item.name;
                const Icon = item.icon;

                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => list(item.name)}
                    aria-current={isActive ? "page" : undefined}
                    className={navItemClass(isActive)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          
          {identity ? (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={identity?.avatar || `https://effigy.im/a/${identity?.address || '0x'}.png`}
                    alt="Admin avatar" 
                  />
                  <AvatarFallback>
                    {identity?.address?.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">
                    {identity?.address?.slice(0, 6)}...{identity?.address?.slice(-4)}
                  </div>
                  <div className="text-muted-foreground text-xs">{identity?.role}</div>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
