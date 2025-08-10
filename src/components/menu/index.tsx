import { useLogout, useGetIdentity, useNavigation } from "@refinedev/core";
import { useDisconnect } from "wagmi";
import { LogOut, Users, FileText } from "lucide-react";
import type { AdminIdentity } from "../../types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export const Menu = () => {
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { disconnect } = useDisconnect();
  const { list } = useNavigation();

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
              {import.meta.env.VITE_APP_NAME || "CSM ICS Admin Panel"}
            </h1>
            
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => list("ics-forms")}
                className="text-muted-foreground hover:text-foreground"
              >
                <FileText className="w-4 h-4 mr-2" />
                ICS Forms
              </Button>
              
              {identity?.role === 'SUPERVISOR' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => list("admin-users")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </Button>
              )}
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
