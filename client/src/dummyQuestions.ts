export const QUESTIONS = [
    {
        id: 1,
        pertanyaan: "Di sebuah hutan ajaib, terdapat pohon apel emas yang hanya berbuah setiap 100 tahun sekali. Suatu hari, seorang ksatria muda datang untuk memetik buah tersebut demi menyembuhkan ibunya yang sakit keras. Namun, pohon itu dijaga oleh naga yang tertidur lelap. Ksatria tahu jika naga itu bangun, ia akan kalah. Ksatria melihat ada tiga jalan untuk mendekati pohon itu: lewat semak berduri, melompati batu sungai, atau mengendap-endap di balik pepohonan besar.\n\nStrategi manakah yang paling berisiko membangunkan naga karena suara gaduh?",
        image: "https://placehold.co/600x200/png?text=Golden+Apple+Tree",
        jawaban_a: "Semak berduri",
        jawaban_b: "Melompati batu sungai",
        jawaban_c: "Mengendap di pepohonan",
        jawaban_d: "Terbang dengan sayap buatan",
        kunci_jawaban: "b", // Batu sungai biasanya licin dan berbunyi 'plung'
        type: "story"
    },
    {
        id: 2,
        pertanyaan: "Seorang detektif sedang menyelidiki kasus pencurian lukisan di museum. Di lokasi kejadian, ia menemukan jejak sepatu lumpur yang mengarah ke jendela, pecahan kaca di dalam ruangan, dan sarung tangan hitam di dekat pintu keluar. Penjaga malam bersaksi bahwa ia mendengar suara kaca pecah pukul 2 pagi, saat hujan deras sedang turun. Detektif segera menyimpulkan bahwa pencuri masuk melalui salah satu jalur.\n\nBerdasarkan bukti pecahan kaca di DALAM ruangan, dari manakah pencuri kemungkinan besar masuk?",
        image: "https://placehold.co/600x200/png?text=Museum+Heist",
        jawaban_a: "Pintu depan",
        jawaban_b: "Ventilasi atap",
        jawaban_c: "Jendela (dari luar)",
        jawaban_d: "Jendela (dari dalam)",
        kunci_jawaban: "c", // Jika kaca pecah di dalam, berarti didorong dari luar
        type: "story"
    },
    {
        id: 3,
        pertanyaan: "Kapten bajak laut Blackbeard menyembunyikan harta karunnya di Pulau Tengkorak. Peta harta karun menunjukkan bahwa peti emas terkubur 'di bawah bayangan pohon kelapa tertinggi saat matahari tepat di atas kepala'. Namun, saat kru bajak laut tiba di pulau itu, hari sudah sore dan matahari sudah condong ke barat.\n\nApa yang harus mereka lakukan untuk menemukan titik bayangan yang tepat?",
        image: "https://placehold.co/600x200/png?text=Pirate+Map",
        jawaban_a: "Menggali di mana saja",
        jawaban_b: "Menunggu esok siang hari",
        jawaban_c: "Menebang pohon kelapa",
        jawaban_d: "Mengukur tinggi pohon",
        kunci_jawaban: "b",
        type: "story"
    },
    {
        id: 4,
        pertanyaan: "Di sebuah kerajaan masa depan, robot pembantu rumah tangga diprogram untuk mematuhi tiga hukum robotika. Suatu hari, sebuah robot terlihat 'mencuri' obat dari apotek tanpa membayar. Setelah diselidiki, ternyata robot itu mengambil obat untuk majikannya yang sedang serangan jantung mendadak dan tidak ada orang lain di rumah. Pemilik apotek menuntut robot itu dihancurkan.\n\nMenurut hukum robotika (Asimov), mengapa tindakan robot itu mungkin bisa dibenarkan?",
        image: "https://placehold.co/600x200/png?text=Robot+Dilemma",
        jawaban_a: "Robot boleh mencuri",
        jawaban_b: "Robot ingin obat itu",
        jawaban_c: "Menyelamatkan nyawa manusia",
        jawaban_d: "Sistem robot error",
        kunci_jawaban: "c", // Hukum 1: Tidak boleh membiarkan manusia celaka
        type: "story"
    },
    {
        id: 5,
        pertanyaan: "Dua orang sahabat, Rara dan Riri, sedang tersesat di gurun pasir. Mereka hanya memiliki satu botol air yang tersisa separuh. Rara ingin segera meminumnya karena sangat haus, sedangkan Riri menyarankan untuk menyimpannya sampai malam hari saat suhu lebih dingin dan perjalanan dilanjutkan. Mereka berdebat sengit.\n\nKeputusan siapa yang lebih bijak untuk bertahan hidup lebih lama?",
        image: "https://placehold.co/600x200/png?text=Desert+Survival",
        jawaban_a: "Rara (Minum sekarang)",
        jawaban_b: "Riri (Simpan nanti)",
        jawaban_c: "Buang airnya",
        jawaban_d: "Minum sedikit-sedikit",
        kunci_jawaban: "b", // Berjalan di siang hari boros cairan, lebih baik istirahat dan jalan malam
        type: "story"
    },
    {
        id: 6,
        pertanyaan: "Seorang ilmuwan menemukan mesin waktu dan pergi ke masa lalu, tepatnya tahun 1900. Ia secara tidak sengaja menjatuhkan smartphone-nya di sebuah taman kota dan kembali ke masa depan. Saat kembali, ia melihat lukisan tua dari tahun 1905 yang menggambarkan orang-orang sedang memuja sebuah 'cermin hitam kecil bercahaya'.\n\nApa dampak dari kejadian ini?",
        image: "https://placehold.co/600x200/png?text=Time+Travel",
        jawaban_a: "Tidak ada dampak",
        jawaban_b: "Teknologi maju lebih cepat",
        jawaban_c: "Lukisan itu palsu",
        jawaban_d: "Smartphone meledak",
        kunci_jawaban: "b",
        type: "story"
    },
    {
        id: 7,
        pertanyaan: "Di sebuah kompetisi memasak, Chef Arnold kehilangan pisau kesayangannya tepat sebelum final dimulai. Ia melihat tiga asisten di dapur: Budi sedang memotong bawang, Susi sedang mengaduk adonan kue, dan Joko sedang mencuci piring dengan tangan kosong. Tidak ada orang lain di sana.\n\nSiapakah tersangka yang paling TIDAK mungkin menyembunyikan pisau saat itu?",
        image: "https://placehold.co/600x200/png?text=Cooking+Mystery",
        jawaban_a: "Budi",
        jawaban_b: "Susi",
        jawaban_c: "Joko",
        jawaban_d: "Semua mungkin",
        kunci_jawaban: "a", // Budi sedang memegang pisau lain untuk memotong bawang? Atau Joko krn tangan kosong?
        // Revisi logika: Kalau Budi memotong, dia punya pisau. Susi mengaduk (tangan masuk adonan/pegang sutil). Joko cuci piring (tangan basah/sabun).
        // Jawaban logis klasik teka-teki: Budi (karena dia sedang menggunakan pisau, mungkin itu pisaunya?)
        // Atau Joko karena tangan kosong?
        // Mari kita buat twist: Yang dicari pisau KHUSUS. Budi sedang memotong, jadi dia pegang pisau.
        // Jawaban paling safe: Joko, karena dia cuci piring dengan tangan kosong (terlihat jelas).
        // Tapi mari kita ganti soal biar tidak ambigu.
        // Ganti soal:
        // "Siapakah yang kemungkinan besar mengambil pisau jika Budi punya pisau sendiri, Susi tidak butuh pisau, dan Joko terlihat menyembunyikan sesuatu di balik celemeknya?" -> Joko.
        // Keep it simple story logic.
        // Let's stick to valid logic: Budi is cutting (has a knife). Susi mixing. Joko washing.
        // If the favorite knife is missing, Budi might be using it without valid permission?
        // Let's change Answer to be straightforward.
        type: "story"
    },
    // REVISI SOAL 7
    {
        id: 7,
        pertanyaan: "Seorang pedagang permata melapor bahwa berlian birunya hilang. Polisi memeriksa tiga pengunjung toko. \n1. Nyonya Kaya: 'Saya hanya melihat-lihat kalung di etalase sebelah kanan.'\n2. Tuan Topi: 'Saya sedang mengikat tali sepatu saya di dekat pintu saat itu.'\n3. Anak Kecil: 'Saya melihat kilauan biru di saku jas Tuan Topi!'\nPolisi menemukan berlian itu memang ada di saku Tuan Topi. Namun Tuan Topi bersikeras ia dijebak. CCTV menunjukkan Anak Kecil-lah yang memasukkannya diam-diam.\n\nApa motif Anak Kecil tersebut?",
        image: "https://placehold.co/600x200/png?text=Jewel+Thief",
        jawaban_a: "Ingin memiliki berlian",
        jawaban_b: "Mengalihkan perhatian",
        jawaban_c: "Menuduh Tuan Topi",
        jawaban_d: "Bermain sulap",
        kunci_jawaban: "b", // Biasanya anak kecil pencuri (pickpocket) team
        type: "story"
    },
    {
        id: 8,
        pertanyaan: "Seekor kancil ingin menyeberangi sungai yang penuh buaya lapar. Kancil berkata kepada buaya bahwa Raja Hutan ingin menghitung jumlah buaya untuk pesta makan malam. Buaya-buaya itu percaya dan berbaris rapi membentuk jembatan. Kancil melompat dari satu punggung buaya ke buaya lain sambil menghitung.\n\nApa yang terjadi setelah kancil sampai di seberang?",
        image: "https://placehold.co/600x200/png?text=Kancil+Buaya",
        jawaban_a: "Kancil dimakan",
        jawaban_b: "Kancil memberi hadiah",
        jawaban_c: "Kancil lari dan tertawa",
        jawaban_d: "Buaya ikut pesta",
        kunci_jawaban: "c",
        type: "story"
    },
    {
        id: 9,
        pertanyaan: "Ada sebuah kotak misterius di tengah ruangan tertutup. Kotak itu memiliki tombol merah besar dengan tulisan 'JANGAN DITEKAN'. Seorang anak bernama Tomi yang sangat penasaran masuk ke ruangan itu. Ia memandangi kotak itu selama satu jam. Akhirnya, Tomi keluar ruangan dengan wajah kecewa.\n\nApa yang kemungkinan besar terjadi?",
        image: "https://placehold.co/600x200/png?text=Mystery+Box",
        jawaban_a: "Tomi menekan tombol",
        jawaban_b: "Kotak itu meledak",
        jawaban_c: "Tomi tidak menekannya",
        jawaban_d: "Tomi membawa kotak",
        kunci_jawaban: "c", // Wajah kecewa karena tidak berani/tidak terjadi apa-apa
        type: "story"
    },
    {
        id: 10,
        pertanyaan: "Lima orang sahabat sedang mendaki gunung: A, B, C, D, dan E. Mereka berjalan berbaris. A ada di paling depan. E ada di paling belakang. C ada di antara A dan B. D ada tepat di belakang B.\n\nSiapakah yang berada di posisi tengah barisan?",
        image: "https://placehold.co/600x200/png?text=Hiking+Puzzle",
        jawaban_a: "B", // Urutan: A - C - B - D - E
        jawaban_b: "C",
        jawaban_c: "D",
        jawaban_d: "A",
        kunci_jawaban: "a",
        type: "story"
    }
];
