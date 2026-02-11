export const SUBJECTS = [
    "matematika",
    "biologi",
    "sejarah",
    "fisika",
    "kimia",
    "geografi"
];

// Story-based questions containing optional images
export interface Question {
    id: number;
    pertanyaan: string;
    image?: string; // Optional image URL
    jawaban_a: string;
    jawaban_b: string;
    jawaban_c: string;
    jawaban_d: string;
    kunci_jawaban: "a" | "b" | "c" | "d";
}

export const QUESTIONS: Record<string, Question[]> = {
    matematika: [
        {
            id: 1,
            pertanyaan: "Pak Budi memiliki kebun apel seluas 2 hektar. Setiap hektar menghasilkan 1.500 apel. Jika ia menjual 500 apel ke pasar dan memberikan 200 apel ke panti asuhan, berapa sisa apel Pak Budi sekarang?",
            image: "/assets/ui/apple_basket.png", // Dummy placeholder
            jawaban_a: "2200",
            jawaban_b: "2300",
            jawaban_c: "2400",
            jawaban_d: "2500",
            kunci_jawaban: "b"
        },
        {
            id: 2,
            pertanyaan: "Sebuah kereta api berangkat dari stasiun A pukul 08.00 dengan kecepatan 80 km/jam. Kereta tersebut sampai di stasiun B pukul 11.00. Jika kereta berhenti istirahat selama 30 menit di tengah perjalanan, berapakah jarak total antara stasiun A dan stasiun B?",
            jawaban_a: "200 km",
            jawaban_b: "240 km",
            jawaban_c: "280 km",
            jawaban_d: "160 km",
            kunci_jawaban: "a"
        },
        {
            id: 3,
            pertanyaan: "Ibu membeli 3 karung beras. Setiap karung beratnya 25 kg. Ibu kemudian membagikan beras tersebut ke dalam kantong plastik kecil yang masing-masing berisi 2,5 kg. Berapa banyak kantong plastik yang dibutuhkan Ibu?",
            image: "/assets/ui/rice_sack.png", // Dummy placeholder
            jawaban_a: "20 kantong",
            jawaban_b: "25 kantong",
            jawaban_c: "30 kantong",
            jawaban_d: "35 kantong",
            kunci_jawaban: "c"
        },
        {
            id: 4,
            pertanyaan: "Di sebuah kelas terdapat 40 siswa. 60% siswa adalah perempuan. Dari seluruh siswa perempuan, 50% mengikuti ekstrakurikuler tari. Berapa banyak siswa perempuan yang mengikuti strakurikuler tari?",
            jawaban_a: "10 siswa",
            jawaban_b: "12 siswa",
            jawaban_c: "15 siswa",
            jawaban_d: "8 siswa",
            kunci_jawaban: "b"
        },
        {
            id: 5,
            pertanyaan: "Sebuah bak mandi berbentuk kubus dengan panjang rusuk 1 meter berisi air penuh. Jika air tersebut dipindahkan ke dalam ember berkapasitas 10 liter, berapa kali ember tersebut harus diisi penuh untuk mengosongkan bak mandi?",
            jawaban_a: "10 kali",
            jawaban_b: "50 kali",
            jawaban_c: "100 kali",
            jawaban_d: "1000 kali",
            kunci_jawaban: "d"
        }
    ],
    // Keep other subjects simple for now or update similarly if requested
    biologi: [
        {
            id: 1,
            pertanyaan: "Pak Tani menemukan bahwa tanaman padinya banyak yang mati karena dimakan tikus. Ia kemudian memelihara burung hantu di sawahnya. Beberapa bulan kemudian, hasil panen padinya meningkat. Hubungan antara burung hantu dan tikus dalam ekosistem sawah tersebut adalah...",
            jawaban_a: "Simbiosis Mutulisme",
            jawaban_b: "Predasi",
            jawaban_c: "Kompetisi",
            jawaban_d: "Simbiosis Parasitisme",
            kunci_jawaban: "b"
        },
        {
            id: 2,
            pertanyaan: "Dina mengamati sel tumbuhan di bawah mikroskop. Ia melihat adanya dinding sel yang kaku dan kloroplas yang berwarna hijau. Berdasarkan pengamatan tersebut, apa fungsi utama dari kloroplas yang dilihat Dina?",
            image: "/assets/ui/cell_structure.png",
            jawaban_a: "Tempat respirasi sel",
            jawaban_b: "Tempat fotosintesis",
            jawaban_c: "Mengatur kegiatan sel",
            jawaban_d: "Menyimpan cadangan makanan",
            kunci_jawaban: "b"
        }
    ],
    // Empty/Simple for others to save space
    sejarah: [],
    fisika: [],
    kimia: [],
    geografi: []
};
