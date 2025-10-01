import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, BookMarked, TrendingUp } from "lucide-react";

export const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [booksRes, membersRes, transactionsRes] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("*", { count: "exact" }).eq("status", "dipinjam"),
      ]);

      const totalBooksAvailable = await supabase
        .from("books")
        .select("jumlah_tersedia")
        .then(({ data }) => data?.reduce((sum, book) => sum + (book.jumlah_tersedia || 0), 0) || 0);

      return {
        totalBooks: booksRes.count || 0,
        totalMembers: membersRes.count || 0,
        activeBorrows: transactionsRes.count || 0,
        availableBooks: totalBooksAvailable,
      };
    },
  });

  const statCards = [
    {
      title: "Total Buku",
      value: stats?.totalBooks || 0,
      icon: BookOpen,
      gradient: "from-primary to-primary/80",
    },
    {
      title: "Anggota Terdaftar",
      value: stats?.totalMembers || 0,
      icon: Users,
      gradient: "from-secondary to-secondary/80",
    },
    {
      title: "Sedang Dipinjam",
      value: stats?.activeBorrows || 0,
      icon: BookMarked,
      gradient: "from-accent to-accent/80",
    },
    {
      title: "Buku Tersedia",
      value: stats?.availableBooks || 0,
      icon: TrendingUp,
      gradient: "from-primary to-secondary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Ringkasan statistik perpustakaan SMK Makarya 1 Jakarta
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
