import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  tanggal_pinjam: string;
  tanggal_jatuh_tempo: string;
  tanggal_kembali: string | null;
  status: "dipinjam" | "kembali";
  books: { judul: string; pengarang: string } | null;
  members: { nama: string; kelas: string } | null;
}

export const TransactionsManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          books(judul, pengarang),
          members(nama, kelas)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "kembali", tanggal_kembali: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Buku berhasil dikembalikan");
    },
    onError: () => toast.error("Gagal mengembalikan buku"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transaksi Peminjaman</h2>
          <p className="text-muted-foreground">Kelola peminjaman dan pengembalian buku</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Pinjam Buku
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pinjam Buku Baru</DialogTitle>
            </DialogHeader>
            <BorrowForm onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Memuat data...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Buku</TableHead>
                    <TableHead>Tgl Pinjam</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Tgl Kembali</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.members?.nama}</p>
                          <p className="text-sm text-muted-foreground">{transaction.members?.kelas}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.books?.judul}</p>
                          <p className="text-sm text-muted-foreground">{transaction.books?.pengarang}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.tanggal_pinjam).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.tanggal_jatuh_tempo).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {transaction.tanggal_kembali
                          ? new Date(transaction.tanggal_kembali).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === "dipinjam" ? "default" : "secondary"}>
                          {transaction.status === "dipinjam" ? "Dipinjam" : "Dikembalikan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status === "dipinjam" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => returnMutation.mutate(transaction.id)}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Kembalikan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BorrowForm = ({ onClose }: { onClose: () => void }) => {
  const [memberId, setMemberId] = useState("");
  const [bookId, setBookId] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["members-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("id, nama, kelas");
      if (error) throw error;
      return data;
    },
  });

  const { data: availableBooks } = useQuery({
    queryKey: ["available-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, judul, pengarang, jumlah_tersedia")
        .gt("jumlah_tersedia", 0);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transactions").insert([
        {
          id_member: memberId,
          id_book: bookId,
          tanggal_pinjam: new Date().toISOString().split("T")[0],
          tanggal_jatuh_tempo: dueDate,
          status: "dipinjam",
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Peminjaman berhasil dicatat");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mencatat peminjaman");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !bookId) {
      toast.error("Pilih anggota dan buku terlebih dahulu");
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="member">Pilih Anggota *</Label>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih anggota" />
          </SelectTrigger>
          <SelectContent>
            {members?.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.nama} ({member.kelas})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="book">Pilih Buku *</Label>
        <Select value={bookId} onValueChange={setBookId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih buku" />
          </SelectTrigger>
          <SelectContent>
            {availableBooks?.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.judul} - {book.pengarang} (Tersedia: {book.jumlah_tersedia})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="dueDate">Tanggal Jatuh Tempo *</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          min={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Memproses..." : "Pinjam"}
        </Button>
      </div>
    </form>
  );
};
