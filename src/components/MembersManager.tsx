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

interface Member {
  id: string;
  nama: string;
  kelas: string;
  nomor_hp: string | null;
  email: string | null;
  tanggal_registrasi: string;
}

export const MembersManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", searchTerm],
    queryFn: async () => {
      let query = supabase.from("members").select("*").order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`nama.ilike.%${searchTerm}%,kelas.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Member[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Anggota berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus anggota"),
  });

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Anggota</h2>
          <p className="text-muted-foreground">Kelola data anggota perpustakaan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Anggota" : "Tambah Anggota Baru"}</DialogTitle>
            </DialogHeader>
            <MemberForm
              member={editingMember}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingMember(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Cari berdasarkan nama atau kelas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Memuat data...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Nomor HP</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tanggal Registrasi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.nama}</TableCell>
                      <TableCell>{member.kelas}</TableCell>
                      <TableCell>{member.nomor_hp}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{new Date(member.tanggal_registrasi).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(member.id)}
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

const MemberForm = ({ member, onClose }: { member: Member | null; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    nama: member?.nama || "",
    kelas: member?.kelas || "",
    nomor_hp: member?.nomor_hp || "",
    email: member?.email || "",
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (member) {
        const { error } = await supabase.from("members").update(formData).eq("id", member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("members").insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(member ? "Anggota berhasil diupdate" : "Anggota berhasil ditambahkan");
      onClose();
    },
    onError: () => toast.error("Gagal menyimpan anggota"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nama">Nama Lengkap *</Label>
        <Input
          id="nama"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="kelas">Kelas *</Label>
        <Input
          id="kelas"
          placeholder="contoh: XII RPL 1"
          value={formData.kelas}
          onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="nomor_hp">Nomor HP</Label>
        <Input
          id="nomor_hp"
          type="tel"
          placeholder="08123456789"
          value={formData.nomor_hp}
          onChange={(e) => setFormData({ ...formData, nomor_hp: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nama@smkmakarya.sch.id"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
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
