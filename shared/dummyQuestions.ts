export const SUBJECTS = [
    "matematika",
    "biologi",
    "sejarah",
    "fisika",
    "kimia",
    "geografi"
];

export interface Question {
    id: number;
    pertanyaan: string;
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
            pertanyaan: "Berapa hasil dari 7 × 8?",
            jawaban_a: "54",
            jawaban_b: "56",
            jawaban_c: "58",
            jawaban_d: "60",
            kunci_jawaban: "b"
        },
        {
            id: 2,
            pertanyaan: "Jika x + 5 = 12, berapakah nilai x?",
            jawaban_a: "6",
            jawaban_b: "7",
            jawaban_c: "8",
            jawaban_d: "5",
            kunci_jawaban: "b"
        },
        {
            id: 3,
            pertanyaan: "Berapa sisi yang dimiliki segi enam?",
            jawaban_a: "5",
            jawaban_b: "6",
            jawaban_c: "7",
            jawaban_d: "8",
            kunci_jawaban: "b"
        },
        {
            id: 4,
            pertanyaan: "15% dari 200 adalah...",
            jawaban_a: "20",
            jawaban_b: "25",
            jawaban_c: "30",
            jawaban_d: "35",
            kunci_jawaban: "c"
        },
        {
            id: 5,
            pertanyaan: "Akar kuadrat dari 144 adalah...",
            jawaban_a: "10",
            jawaban_b: "11",
            jawaban_c: "12",
            jawaban_d: "13",
            kunci_jawaban: "c"
        }
    ],
    biologi: [
        {
            id: 1,
            pertanyaan: "Organ yang berfungsi memompa darah adalah...",
            jawaban_a: "Paru-paru",
            jawaban_b: "Jantung",
            jawaban_c: "Ginjal",
            jawaban_d: "Hati",
            kunci_jawaban: "b"
        },
        {
            id: 2,
            pertanyaan: "Bagian sel yang berfungsi sebagai pengatur kegiatan sel adalah...",
            jawaban_a: "Sitoplasma",
            jawaban_b: "Inti sel",
            jawaban_c: "Membran sel",
            jawaban_d: "Ribosom",
            kunci_jawaban: "b"
        },
        {
            id: 3,
            pertanyaan: "Hewan pemakan daging disebut...",
            jawaban_a: "Herbivora",
            jawaban_b: "Karnivora",
            jawaban_c: "Omnivora",
            jawaban_d: "Insektivora",
            kunci_jawaban: "b"
        },
        {
            id: 4,
            pertanyaan: "Proses pembuatan makanan pada tumbuhan disebut...",
            jawaban_a: "Respirasi",
            jawaban_b: "Fotosintesis",
            jawaban_c: "Transpirasi",
            jawaban_d: "Ekskresi",
            kunci_jawaban: "b"
        },
        {
            id: 5,
            pertanyaan: "Tulang yang melindungi otak adalah...",
            jawaban_a: "Tulang rusuk",
            jawaban_b: "Tulang tengkorak",
            jawaban_c: "Tulang belakang",
            jawaban_d: "Tulang panggul",
            kunci_jawaban: "b"
        }
    ],
    sejarah: [
        {
            id: 1,
            pertanyaan: "Proklamasi kemerdekaan Indonesia dibacakan pada tanggal...",
            jawaban_a: "17 Agustus 1945",
            jawaban_b: "18 Agustus 1945",
            jawaban_c: "17 Agustus 1944",
            jawaban_d: "16 Agustus 1945",
            kunci_jawaban: "a"
        },
        {
            id: 2,
            pertanyaan: "Presiden pertama Indonesia adalah...",
            jawaban_a: "Soeharto",
            jawaban_b: "B.J. Habibie",
            jawaban_c: "Ir. Soekarno",
            jawaban_d: "Megawati",
            kunci_jawaban: "c"
        },
        {
            id: 3,
            pertanyaan: "Kerajaan Hindu tertua di Indonesia adalah...",
            jawaban_a: "Majapahit",
            jawaban_b: "Kutai",
            jawaban_c: "Tarumanegara",
            jawaban_d: "Sriwijaya",
            kunci_jawaban: "b"
        },
        {
            id: 4,
            pertanyaan: "Sumpah Pemuda diikrarkan pada tanggal...",
            jawaban_a: "28 Oktober 1928",
            jawaban_b: "20 Mei 1908",
            jawaban_c: "1 Juni 1945",
            jawaban_d: "10 November 1945",
            kunci_jawaban: "a"
        },
        {
            id: 5,
            pertanyaan: "Gedung tempat perumusan naskah proklamasi adalah rumah laksamana...",
            jawaban_a: "Maeda",
            jawaban_b: "Kalbuadi",
            jawaban_c: "Chou",
            jawaban_d: "Takeshi",
            kunci_jawaban: "a"
        }
    ],
    fisika: [
        {
            id: 1,
            pertanyaan: "Satuan SI untuk gaya adalah...",
            jawaban_a: "Joule",
            jawaban_b: "Watt",
            jawaban_c: "Newton",
            jawaban_d: "Pascal",
            kunci_jawaban: "c"
        },
        {
            id: 2,
            pertanyaan: "Rumus kecepatan (v) adalah...",
            jawaban_a: "s / t",
            jawaban_b: "s x t",
            jawaban_c: "m x a",
            jawaban_d: "F / m",
            kunci_jawaban: "a"
        },
        {
            id: 3,
            pertanyaan: "Alat untuk mengukur suhu adalah...",
            jawaban_a: "Barometer",
            jawaban_b: "Termometer",
            jawaban_c: "Speedometer",
            jawaban_d: "Higrometer",
            kunci_jawaban: "b"
        },
        {
            id: 4,
            pertanyaan: "Energi yang dimiliki benda karena posisinya disebut energi...",
            jawaban_a: "Kinetik",
            jawaban_b: "Potensial",
            jawaban_c: "Mekanik",
            jawaban_d: "Kimia",
            kunci_jawaban: "b"
        },
        {
            id: 5,
            pertanyaan: "Bunyi tidak dapat merambat melalui...",
            jawaban_a: "Udara",
            jawaban_b: "Air",
            jawaban_c: "Besi",
            jawaban_d: "Ruang hampa",
            kunci_jawaban: "d"
        }
    ],
    kimia: [
        {
            id: 1,
            pertanyaan: "Rumus kimia air adalah...",
            jawaban_a: "H2O",
            jawaban_b: "CO2",
            jawaban_c: "NaCl",
            jawaban_d: "O2",
            kunci_jawaban: "a"
        },
        {
            id: 2,
            pertanyaan: "Lambang unsur Emas adalah...",
            jawaban_a: "Ag",
            jawaban_b: "Au",
            jawaban_c: "Fe",
            jawaban_d: "Cu",
            kunci_jawaban: "b"
        },
        {
            id: 3,
            pertanyaan: "Gas yang kita hirup saat bernapas adalah...",
            jawaban_a: "Nitrogen",
            jawaban_b: "Oksigen",
            jawaban_c: "Karbon Dioksida",
            jawaban_d: "Hidrogen",
            kunci_jawaban: "b"
        },
        {
            id: 4,
            pertanyaan: "PH untuk larutan netral adalah...",
            jawaban_a: "3",
            jawaban_b: "5",
            jawaban_c: "7",
            jawaban_d: "9",
            kunci_jawaban: "c"
        },
        {
            id: 5,
            pertanyaan: "Partikel atom yang bermuatan positif disebut...",
            jawaban_a: "Elektron",
            jawaban_b: "Proton",
            jawaban_c: "Neutron",
            jawaban_d: "Ion",
            kunci_jawaban: "b"
        }
    ],
    geografi: [
        {
            id: 1,
            pertanyaan: "Ibu kota Indonesia saat ini (2024) adalah...",
            jawaban_a: "Surabaya",
            jawaban_b: "Jakarta",
            jawaban_c: "Bandung",
            jawaban_d: "Nusantara",
            kunci_jawaban: "b"
        },
        {
            id: 2,
            pertanyaan: "Samudra terluas di dunia adalah...",
            jawaban_a: "Atlantik",
            jawaban_b: "Hindia",
            jawaban_c: "Pasifik",
            jawaban_d: "Arktik",
            kunci_jawaban: "c"
        },
        {
            id: 3,
            pertanyaan: "Gunung tertinggi di dunia adalah...",
            jawaban_a: "Semeru",
            jawaban_b: "Everest",
            jawaban_c: "Fujiyama",
            jawaban_d: "Kilimanjaro",
            kunci_jawaban: "b"
        },
        {
            id: 4,
            pertanyaan: "Garis khayal yang membagi bumi menjadi belahan utara dan selatan adalah...",
            jawaban_a: "Khatulistiwa",
            jawaban_b: "Bujur",
            jawaban_c: "Lintang",
            jawaban_d: "Meridian",
            kunci_jawaban: "a"
        },
        {
            id: 5,
            pertanyaan: "Benua terbesar di dunia adalah...",
            jawaban_a: "Afrika",
            jawaban_b: "Amerika",
            jawaban_c: "Asia",
            jawaban_d: "Eropa",
            kunci_jawaban: "c"
        }
    ]
};
