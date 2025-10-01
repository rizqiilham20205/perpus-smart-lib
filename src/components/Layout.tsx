import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Home, Book, Users, ArrowLeftRight, LogOut, Menu, X } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout = ({ children, activeTab, onTabChange }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Logout berhasil");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "books", label: "Buku", icon: Book },
    { id: "members", label: "Anggota", icon: Users },
    { id: "transactions", label: "Transaksi", icon: ArrowLeftRight },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PerpusMakarya</h1>
              <p className="text-xs text-muted-foreground">SMK Makarya 1 Jakarta</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                onClick={() => onTabChange(item.id)}
                className="gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLogout} className="gap-2 hidden md:flex">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-card">
            <nav className="container py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
              <Button variant="outline" onClick={handleLogout} className="justify-start gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 PerpusMakarya - Sistem Perpustakaan Digital SMK Makarya 1 Jakarta</p>
        </div>
      </footer>
    </div>
  );
};
