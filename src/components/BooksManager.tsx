import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Book {
  id: string;
  judul: string;
  pengarang: string;
  penerbit: string | null;
  tahun: number | null;
  kategori: string | null;
  kode_rak: string | null;
  jumlah_total: number;
  jumlah_tersedia: number;
  deskripsi: string | null;
}

export const BooksManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ["books", searchTerm],
    queryFn: async () => {
      let query = supabase.from("books").select("*").order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%,kategori.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Book[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Buku berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus buku"),
  });

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingBook(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Buku</h2>
          <p className="text-muted-foreground">Kelola koleksi buku perpustakaan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Buku
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? "Edit Buku" : "Tambah Buku Baru"}</DialogTitle>
            </DialogHeader>
            <BookForm
              book={editingBook}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingBook(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Cari berdasarkan judul, pengarang, atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Buku</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Memuat data...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Pengarang</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Kode Rak</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Tersedia</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books?.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.judul}</TableCell>
                      <TableCell>{book.pengarang}</TableCell>
                      <TableCell>{book.kategori}</TableCell>
                      <TableCell>{book.kode_rak}</TableCell>
                      <TableCell className="text-center">{book.jumlah_total}</TableCell>
                      <TableCell className="text-center">{book.jumlah_tersedia}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(book)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(book.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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

const BookForm = ({ book, onClose }: { book: Book | null; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    judul: book?.judul || "",
    pengarang: book?.pengarang || "",
    penerbit: book?.penerbit || "",
    tahun: book?.tahun || new Date().getFullYear(),
    kategori: book?.kategori || "",
    kode_rak: book?.kode_rak || "",
    jumlah_total: book?.jumlah_total || 1,
    jumlah_tersedia: book?.jumlah_tersedia || 1,
    deskripsi: book?.deskripsi || "",
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (book) {
        const { error } = await supabase.from("books").update(formData).eq("id", book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success(book ? "Buku berhasil diupdate" : "Buku berhasil ditambahkan");
      onClose();
    },
    onError: () => toast.error("Gagal menyimpan buku"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="judul">Judul Buku *</Label>
          <Input
            id="judul"
            value={formData.judul}
            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="pengarang">Pengarang *</Label>
          <Input
            id="pengarang"
            value={formData.pengarang}
            onChange={(e) => setFormData({ ...formData, pengarang: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="penerbit">Penerbit</Label>
          <Input
            id="penerbit"
            value={formData.penerbit}
            onChange={(e) => setFormData({ ...formData, penerbit: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="tahun">Tahun</Label>
          <Input
            id="tahun"
            type="number"
            value={formData.tahun}
            onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="kategori">Kategori</Label>
          <Input
            id="kategori"
            value={formData.kategori}
            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="kode_rak">Kode Rak</Label>
          <Input
            id="kode_rak"
            value={formData.kode_rak}
            onChange={(e) => setFormData({ ...formData, kode_rak: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="jumlah_total">Jumlah Total</Label>
          <Input
            id="jumlah_total"
            type="number"
            min="1"
            value={formData.jumlah_total}
            onChange={(e) => setFormData({ ...formData, jumlah_total: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="jumlah_tersedia">Jumlah Tersedia</Label>
          <Input
            id="jumlah_tersedia"
            type="number"
            min="0"
            value={formData.jumlah_tersedia}
            onChange={(e) => setFormData({ ...formData, jumlah_tersedia: parseInt(e.target.value) })}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="deskripsi">Deskripsi</Label>
          <Textarea
            id="deskripsi"
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
};
