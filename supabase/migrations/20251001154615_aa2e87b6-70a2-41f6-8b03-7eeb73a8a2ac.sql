-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM ('dipinjam', 'kembali');

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  pengarang TEXT NOT NULL,
  penerbit TEXT,
  tahun INTEGER,
  kategori TEXT,
  kode_rak TEXT,
  jumlah_total INTEGER DEFAULT 1 CHECK (jumlah_total >= 0),
  jumlah_tersedia INTEGER DEFAULT 1 CHECK (jumlah_tersedia >= 0),
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  nomor_hp TEXT,
  email TEXT,
  tanggal_registrasi DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_member UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  id_book UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  tanggal_pinjam DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_jatuh_tempo DATE NOT NULL,
  tanggal_kembali DATE,
  status transaction_status DEFAULT 'dipinjam',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for books (public read, authenticated write)
CREATE POLICY "Allow public read access to books"
  ON public.books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert books"
  ON public.books FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update books"
  ON public.books FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete books"
  ON public.books FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for members
CREATE POLICY "Allow public read access to members"
  ON public.members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert members"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update members"
  ON public.members FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete members"
  ON public.members FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for transactions
CREATE POLICY "Allow public read access to transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_books_judul ON public.books(judul);
CREATE INDEX idx_books_pengarang ON public.books(pengarang);
CREATE INDEX idx_books_kategori ON public.books(kategori);
CREATE INDEX idx_members_nama ON public.members(nama);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_book ON public.transactions(id_book);
CREATE INDEX idx_transactions_member ON public.transactions(id_member);

-- Function to automatically update book availability on borrow
CREATE OR REPLACE FUNCTION public.handle_book_borrow()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease available count when borrowing
  IF NEW.status = 'dipinjam' AND (OLD.status IS NULL OR OLD.status != 'dipinjam') THEN
    UPDATE public.books
    SET jumlah_tersedia = jumlah_tersedia - 1
    WHERE id = NEW.id_book AND jumlah_tersedia > 0;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Buku tidak tersedia untuk dipinjam';
    END IF;
  END IF;
  
  -- Increase available count when returning
  IF NEW.status = 'kembali' AND OLD.status = 'dipinjam' THEN
    UPDATE public.books
    SET jumlah_tersedia = jumlah_tersedia + 1
    WHERE id = NEW.id_book;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for book borrow/return
CREATE TRIGGER on_transaction_change
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_book_borrow();

-- Insert sample data
INSERT INTO public.books (judul, pengarang, penerbit, tahun, kategori, kode_rak, jumlah_total, jumlah_tersedia, deskripsi) VALUES
('Pemrograman Web dengan HTML & CSS', 'Budi Raharjo', 'Informatika', 2022, 'Teknologi Informasi', 'A1-01', 5, 5, 'Panduan lengkap belajar web development dasar'),
('Algoritma dan Struktur Data', 'Rinaldi Munir', 'Informatika', 2021, 'Teknologi Informasi', 'A1-02', 4, 4, 'Buku dasar algoritma untuk pemrograman'),
('Database Management System', 'Andi Prasetyo', 'Andi Publisher', 2023, 'Teknologi Informasi', 'A1-03', 3, 3, 'Konsep dan implementasi database'),
('Jaringan Komputer', 'Soni Fajar', 'Elex Media', 2022, 'Teknologi Informasi', 'A2-01', 4, 4, 'Fundamental jaringan komputer'),
('Matematika Diskrit', 'Seymour Lipschutz', 'Erlangga', 2020, 'Matematika', 'B1-01', 6, 6, 'Teori matematika untuk informatika'),
('Fisika Dasar', 'Halliday & Resnick', 'Erlangga', 2021, 'Sains', 'C1-01', 5, 5, 'Buku fisika untuk SMK'),
('Bahasa Indonesia', 'Kemendikbud', 'Puskurbuk', 2022, 'Bahasa', 'D1-01', 10, 10, 'Buku wajib bahasa Indonesia'),
('Bahasa Inggris', 'Kemendikbud', 'Puskurbuk', 2022, 'Bahasa', 'D1-02', 10, 10, 'Buku wajib bahasa Inggris'),
('Kewirausahaan', 'Suryana', 'Salemba Empat', 2023, 'Ekonomi', 'E1-01', 4, 4, 'Panduan menjadi wirausaha sukses'),
('Design Thinking', 'Tim Brown', 'Bentang Pustaka', 2021, 'Desain', 'F1-01', 3, 3, 'Metode inovasi dan kreativitas');

INSERT INTO public.members (nama, kelas, nomor_hp, email) VALUES
('Ahmad Fauzi', 'XII RPL 1', '081234567890', 'ahmad.fauzi@smkmakarya.sch.id'),
('Siti Nurhaliza', 'XII RPL 1', '081234567891', 'siti.nur@smkmakarya.sch.id'),
('Budi Santoso', 'XII TKJ 1', '081234567892', 'budi.santoso@smkmakarya.sch.id'),
('Dewi Lestari', 'XI RPL 1', '081234567893', 'dewi.lestari@smkmakarya.sch.id'),
('Eko Prasetyo', 'XI TKJ 1', '081234567894', 'eko.prasetyo@smkmakarya.sch.id');