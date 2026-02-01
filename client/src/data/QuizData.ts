export interface Quiz {
    id: string;
    title: string;
    description: string;
    category: string;
    questionCount: number;
}

const quizzes: Quiz[] = [
    {
        id: 'math-1',
        title: 'Penjumlahan Cepat 20!',
        description: 'Latih kemampuan penjumlahanmu di bawah 20 dengan cepat!',
        category: 'Matematika',
        questionCount: 10
    },
    {
        id: 'math-2',
        title: 'Asah Otak Penjumlahan Cepat',
        description: 'Tantangan penjumlahan tingkat lanjut untuk mengasah otakmu.',
        category: 'Matematika',
        questionCount: 10
    },
    {
        id: 'tech-1',
        title: 'Dasar Frontend: HTML, CSS, JS',
        description: 'Uji pengetahuan dasarmu tentang tiga pilar pengembangan web frontend.',
        category: 'Teknologi',
        questionCount: 50
    },
    {
        id: 'tech-2',
        title: 'Dasar Backend: Node, PostgreSQL',
        description: 'Seberapa dalam pemahamanmu tentang backend development?',
        category: 'Teknologi',
        questionCount: 20
    },
    {
        id: 'tech-3',
        title: 'Flutter Supabase Master',
        description: 'Kuis untuk para pengembang aplikasi mobile dengan Flutter.',
        category: 'Teknologi',
        questionCount: 49
    },
    {
        id: 'science-1',
        title: 'Sains SMK: Uji Pengetahuanmu!',
        description: 'Materi sains level SMK untuk menguji wawasan ilmiahmu.',
        category: 'Sains',
        questionCount: 10
    },
    {
        id: 'math-3',
        title: 'Penjumlahan dan Pengurangan Dasar',
        description: 'Operasi dasar matematika yang wajib dikuasai.',
        category: 'Matematika',
        questionCount: 5
    },
    {
        id: 'general-1',
        title: 'Kuis Ilmu Sosial Menarik',
        description: 'Jelajahi fakta-fakta sosial yang menarik dan menambah wawasan.',
        category: 'Umum',
        questionCount: 50
    },
    {
        id: 'general-2',
        title: 'Pengetahuan Umum Dasar',
        description: 'Tes pengetahuan umum sehari-hari yang mungkin kamu lewatkan.',
        category: 'Umum',
        questionCount: 30
    },
    {
        id: 'math-4',
        title: 'Perkalian 1-10',
        description: 'Hafalan perkalian dasar 1 sampai 10.',
        category: 'Matematika',
        questionCount: 20
    },
    {
        id: 'tech-4',
        title: 'Python Dasar',
        description: 'Pengenalan bahasa pemrograman Python untuk pemula.',
        category: 'Teknologi',
        questionCount: 15
    },
    {
        id: 'science-2',
        title: 'Tata Surya Kita',
        description: 'Mengenal planet-planet dan benda langit di tata surya.',
        category: 'Sains',
        questionCount: 10
    },
    {
        id: 'general-3',
        title: 'Ibukota Negara',
        description: 'Tebak ibukota negara-negara di dunia.',
        category: 'Umum',
        questionCount: 25
    }
];

export const getQuizzes = (): Quiz[] => {
    return quizzes;
};

export const getCategories = (): string[] => {
    const categories = new Set(quizzes.map(q => q.category));
    return Array.from(categories);
};
