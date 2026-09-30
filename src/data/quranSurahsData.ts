export interface QuranSurahMetadata {
  number: number;
  nameAr: string;
  nameEn: string;
  ayahCount: number;
  startPage: number;
  endPage: number;
  juz: number;
  revelation: 'مكية' | 'مدنية';
}

export const QURAN_SURAHS: QuranSurahMetadata[] = [
  { number: 1, nameAr: 'الفاتحة', nameEn: 'Al-Fatihah', ayahCount: 7, startPage: 1, endPage: 1, juz: 1, revelation: 'مكية' },
  { number: 2, nameAr: 'البقرة', nameEn: 'Al-Baqarah', ayahCount: 286, startPage: 2, endPage: 49, juz: 1, revelation: 'مدنية' },
  { number: 3, nameAr: 'آل عمران', nameEn: 'Ali \'Imran', ayahCount: 200, startPage: 50, endPage: 76, juz: 3, revelation: 'مدنية' },
  { number: 4, nameAr: 'النساء', nameEn: 'An-Nisa', ayahCount: 176, startPage: 77, endPage: 106, juz: 4, revelation: 'مدنية' },
  { number: 5, nameAr: 'المائدة', nameEn: 'Al-Ma\'idah', ayahCount: 120, startPage: 106, endPage: 127, juz: 6, revelation: 'مدنية' },
  { number: 6, nameAr: 'الأنعام', nameEn: 'Al-An\'am', ayahCount: 165, startPage: 128, endPage: 150, juz: 7, revelation: 'مكية' },
  { number: 7, nameAr: 'الأعراف', nameEn: 'Al-A\'raf', ayahCount: 206, startPage: 151, endPage: 176, juz: 8, revelation: 'مكية' },
  { number: 8, nameAr: 'الأنفال', nameEn: 'Al-Anfal', ayahCount: 75, startPage: 177, endPage: 186, juz: 9, revelation: 'مدنية' },
  { number: 9, nameAr: 'التوبة', nameEn: 'At-Tawbah', ayahCount: 129, startPage: 187, endPage: 207, juz: 10, revelation: 'مدنية' },
  { number: 10, nameAr: 'يونس', nameEn: 'Yunus', ayahCount: 109, startPage: 208, endPage: 220, juz: 11, revelation: 'مكية' },
  { number: 11, nameAr: 'هود', nameEn: 'Hud', ayahCount: 123, startPage: 221, endPage: 235, juz: 11, revelation: 'مكية' },
  { number: 12, nameAr: 'يوسف', nameEn: 'Yusuf', ayahCount: 111, startPage: 235, endPage: 248, juz: 12, revelation: 'مكية' },
  { number: 13, nameAr: 'الرعد', nameEn: 'Ar-Ra\'d', ayahCount: 43, startPage: 249, endPage: 255, juz: 13, revelation: 'مدنية' },
  { number: 14, nameAr: 'إبراهيم', nameEn: 'Ibrahim', ayahCount: 52, startPage: 255, endPage: 261, juz: 13, revelation: 'مكية' },
  { number: 15, nameAr: 'الحجر', nameEn: 'Al-Hijr', ayahCount: 99, startPage: 262, endPage: 267, juz: 14, revelation: 'مكية' },
  { number: 16, nameAr: 'النحل', nameEn: 'An-Nahl', ayahCount: 128, startPage: 267, endPage: 281, juz: 14, revelation: 'مكية' },
  { number: 17, nameAr: 'الإسراء', nameEn: 'Al-Isra', ayahCount: 111, startPage: 282, endPage: 293, juz: 15, revelation: 'مكية' },
  { number: 18, nameAr: 'الكهف', nameEn: 'Al-Kahf', ayahCount: 110, startPage: 293, endPage: 304, juz: 15, revelation: 'مكية' },
  { number: 19, nameAr: 'مريم', nameEn: 'Maryam', ayahCount: 98, startPage: 305, endPage: 312, juz: 16, revelation: 'مكية' },
  { number: 20, nameAr: 'طه', nameEn: 'Ta-Ha', ayahCount: 135, startPage: 312, endPage: 321, juz: 16, revelation: 'مكية' },
  { number: 21, nameAr: 'الأنبياء', nameEn: 'Al-Anbiya', ayahCount: 112, startPage: 322, endPage: 331, juz: 17, revelation: 'مكية' },
  { number: 22, nameAr: 'الحج', nameEn: 'Al-Hajj', ayahCount: 78, startPage: 332, endPage: 341, juz: 17, revelation: 'مدنية' },
  { number: 23, nameAr: 'المؤمنون', nameEn: 'Al-Mu\'minun', ayahCount: 118, startPage: 342, endPage: 349, juz: 18, revelation: 'مكية' },
  { number: 24, nameAr: 'النور', nameEn: 'An-Nur', ayahCount: 64, startPage: 350, endPage: 359, juz: 18, revelation: 'مدنية' },
  { number: 25, nameAr: 'الفرقان', nameEn: 'Al-Furqan', ayahCount: 77, startPage: 359, endPage: 366, juz: 18, revelation: 'مكية' },
  { number: 26, nameAr: 'الشعراء', nameEn: 'Ash-Shu\'ara', ayahCount: 227, startPage: 367, endPage: 376, juz: 19, revelation: 'مكية' },
  { number: 27, nameAr: 'النمل', nameEn: 'An-Naml', ayahCount: 93, startPage: 377, endPage: 385, juz: 19, revelation: 'مكية' },
  { number: 28, nameAr: 'القصص', nameEn: 'Al-Qasas', ayahCount: 88, startPage: 385, endPage: 396, juz: 20, revelation: 'مكية' },
  { number: 29, nameAr: 'العنكبوت', nameEn: 'Al-\'Ankabut', ayahCount: 69, startPage: 396, endPage: 404, juz: 20, revelation: 'مكية' },
  { number: 30, nameAr: 'الروم', nameEn: 'Ar-Rum', ayahCount: 60, startPage: 404, endPage: 410, juz: 21, revelation: 'مكية' },
  { number: 31, nameAr: 'لقمان', nameEn: 'Luqman', ayahCount: 34, startPage: 411, endPage: 414, juz: 21, revelation: 'مكية' },
  { number: 32, nameAr: 'السجدة', nameEn: 'As-Sajdah', ayahCount: 30, startPage: 415, endPage: 417, juz: 21, revelation: 'مكية' },
  { number: 33, nameAr: 'الأحزاب', nameEn: 'Al-Ahzab', ayahCount: 73, startPage: 418, endPage: 427, juz: 21, revelation: 'مدنية' },
  { number: 34, nameAr: 'سبأ', nameEn: 'Saba', ayahCount: 54, startPage: 428, endPage: 433, juz: 22, revelation: 'مكية' },
  { number: 35, nameAr: 'فاطر', nameEn: 'Fatir', ayahCount: 45, startPage: 434, endPage: 440, juz: 22, revelation: 'مكية' },
  { number: 36, nameAr: 'يس', nameEn: 'Ya-Sin', ayahCount: 83, startPage: 440, endPage: 445, juz: 22, revelation: 'مكية' },
  { number: 37, nameAr: 'الصافات', nameEn: 'As-Saffat', ayahCount: 182, startPage: 446, endPage: 452, juz: 23, revelation: 'مكية' },
  { number: 38, nameAr: 'ص', nameEn: 'Sad', ayahCount: 88, startPage: 453, endPage: 458, juz: 23, revelation: 'مكية' },
  { number: 39, nameAr: 'الزمر', nameEn: 'Az-Zumar', ayahCount: 75, startPage: 458, endPage: 467, juz: 23, revelation: 'مكية' },
  { number: 40, nameAr: 'غافر', nameEn: 'Ghafir', ayahCount: 85, startPage: 467, endPage: 476, juz: 24, revelation: 'مكية' },
  { number: 41, nameAr: 'فصلت', nameEn: 'Fussilat', ayahCount: 54, startPage: 477, endPage: 482, juz: 24, revelation: 'مكية' },
  { number: 42, nameAr: 'الشورى', nameEn: 'Ash-Shura', ayahCount: 53, startPage: 483, endPage: 489, juz: 25, revelation: 'مكية' },
  { number: 43, nameAr: 'الزخرف', nameEn: 'Az-Zukhruf', ayahCount: 89, startPage: 489, endPage: 495, juz: 25, revelation: 'مكية' },
  { number: 44, nameAr: 'الدخان', nameEn: 'Ad-Dukhan', ayahCount: 59, startPage: 496, endPage: 498, juz: 25, revelation: 'مكية' },
  { number: 45, nameAr: 'الجاثية', nameEn: 'Al-Jathiyah', ayahCount: 37, startPage: 499, endPage: 502, juz: 25, revelation: 'مكية' },
  { number: 46, nameAr: 'الأحقاف', nameEn: 'Al-Ahqaf', ayahCount: 35, startPage: 502, endPage: 506, juz: 26, revelation: 'مكية' },
  { number: 47, nameAr: 'محمد', nameEn: 'Muhammad', ayahCount: 38, startPage: 507, endPage: 510, juz: 26, revelation: 'مدنية' },
  { number: 48, nameAr: 'الفتح', nameEn: 'Al-Fath', ayahCount: 29, startPage: 511, endPage: 515, juz: 26, revelation: 'مدنية' },
  { number: 49, nameAr: 'الحجرات', nameEn: 'Al-Hujurat', ayahCount: 18, startPage: 515, endPage: 517, juz: 26, revelation: 'مدنية' },
  { number: 50, nameAr: 'ق', nameEn: 'Qaf', ayahCount: 45, startPage: 518, endPage: 520, juz: 26, revelation: 'مكية' },
  { number: 51, nameAr: 'الذاريات', nameEn: 'Adh-Dhariyat', ayahCount: 60, startPage: 520, endPage: 523, juz: 26, revelation: 'مكية' },
  { number: 52, nameAr: 'الطور', nameEn: 'At-Tur', ayahCount: 49, startPage: 523, endPage: 525, juz: 27, revelation: 'مكية' },
  { number: 53, nameAr: 'النجم', nameEn: 'An-Najm', ayahCount: 62, startPage: 526, endPage: 528, juz: 27, revelation: 'مكية' },
  { number: 54, nameAr: 'القمر', nameEn: 'Al-Qamar', ayahCount: 55, startPage: 528, endPage: 531, juz: 27, revelation: 'مكية' },
  { number: 55, nameAr: 'الرحمن', nameEn: 'Ar-Rahman', ayahCount: 78, startPage: 531, endPage: 534, juz: 27, revelation: 'مدنية' },
  { number: 56, nameAr: 'الواقعة', nameEn: 'Al-Waqi\'ah', ayahCount: 96, startPage: 534, endPage: 537, juz: 27, revelation: 'مكية' },
  { number: 57, nameAr: 'الحديد', nameEn: 'Al-Hadid', ayahCount: 29, startPage: 537, endPage: 541, juz: 27, revelation: 'مدنية' },
  { number: 58, nameAr: 'المجادلة', nameEn: 'Al-Mujadilah', ayahCount: 22, startPage: 542, endPage: 545, juz: 28, revelation: 'مدنية' },
  { number: 59, nameAr: 'الحشر', nameEn: 'Al-Hashr', ayahCount: 24, startPage: 545, endPage: 548, juz: 28, revelation: 'مدنية' },
  { number: 60, nameAr: 'الممتحنة', nameEn: 'Al-Mumtahanah', ayahCount: 13, startPage: 549, endPage: 551, juz: 28, revelation: 'مدنية' },
  { number: 61, nameAr: 'الصف', nameEn: 'As-Saff', ayahCount: 14, startPage: 551, endPage: 552, juz: 28, revelation: 'مدنية' },
  { number: 62, nameAr: 'الجمعة', nameEn: 'Al-Jumu\'ah', ayahCount: 11, startPage: 553, endPage: 554, juz: 28, revelation: 'مدنية' },
  { number: 63, nameAr: 'المنافقون', nameEn: 'Al-Munafiqun', ayahCount: 11, startPage: 554, endPage: 555, juz: 28, revelation: 'مدنية' },
  { number: 64, nameAr: 'التغابن', nameEn: 'At-Taghabun', ayahCount: 18, startPage: 556, endPage: 557, juz: 28, revelation: 'مدنية' },
  { number: 65, nameAr: 'الطلاق', nameEn: 'At-Talaq', ayahCount: 12, startPage: 558, endPage: 559, juz: 28, revelation: 'مدنية' },
  { number: 66, nameAr: 'التحريم', nameEn: 'At-Tahrim', ayahCount: 12, startPage: 560, endPage: 561, juz: 28, revelation: 'مدنية' },
  { number: 67, nameAr: 'الملك', nameEn: 'Al-Mulk', ayahCount: 30, startPage: 562, endPage: 564, juz: 29, revelation: 'مكية' },
  { number: 68, nameAr: 'القلم', nameEn: 'Al-Qalam', ayahCount: 52, startPage: 564, endPage: 566, juz: 29, revelation: 'مكية' },
  { number: 69, nameAr: 'الحاقة', nameEn: 'Al-Haqqah', ayahCount: 52, startPage: 566, endPage: 568, juz: 29, revelation: 'مكية' },
  { number: 70, nameAr: 'المعارج', nameEn: 'Al-Ma\'arij', ayahCount: 44, startPage: 568, endPage: 570, juz: 29, revelation: 'مكية' },
  { number: 71, nameAr: 'نوح', nameEn: 'Nuh', ayahCount: 28, startPage: 570, endPage: 571, juz: 29, revelation: 'مكية' },
  { number: 72, nameAr: 'الجن', nameEn: 'Al-Jinn', ayahCount: 28, startPage: 572, endPage: 573, juz: 29, revelation: 'مكية' },
  { number: 73, nameAr: 'المزمل', nameEn: 'Al-Muzzammil', ayahCount: 20, startPage: 574, endPage: 575, juz: 29, revelation: 'مكية' },
  { number: 74, nameAr: 'المدثر', nameEn: 'Al-Muddaththir', ayahCount: 56, startPage: 575, endPage: 577, juz: 29, revelation: 'مكية' },
  { number: 75, nameAr: 'القيامة', nameEn: 'Al-Qiyamah', ayahCount: 40, startPage: 577, endPage: 578, juz: 29, revelation: 'مكية' },
  { number: 76, nameAr: 'الإنسان', nameEn: 'Al-Insan', ayahCount: 31, startPage: 578, endPage: 580, juz: 29, revelation: 'مدنية' },
  { number: 77, nameAr: 'المرسلات', nameEn: 'Al-Mursalat', ayahCount: 50, startPage: 580, endPage: 581, juz: 29, revelation: 'مكية' },
  { number: 78, nameAr: 'النبأ', nameEn: 'An-Naba', ayahCount: 40, startPage: 582, endPage: 583, juz: 30, revelation: 'مكية' },
  { number: 79, nameAr: 'النازعات', nameEn: 'An-Nazi\'at', ayahCount: 46, startPage: 583, endPage: 584, juz: 30, revelation: 'مكية' },
  { number: 80, nameAr: 'عبس', nameEn: '\'Abasa', ayahCount: 42, startPage: 585, endPage: 586, juz: 30, revelation: 'مكية' },
  { number: 81, nameAr: 'التكوير', nameEn: 'At-Takwir', ayahCount: 29, startPage: 586, endPage: 586, juz: 30, revelation: 'مكية' },
  { number: 82, nameAr: 'الانفطار', nameEn: 'Al-Infitar', ayahCount: 19, startPage: 587, endPage: 587, juz: 30, revelation: 'مكية' },
  { number: 83, nameAr: 'المطففين', nameEn: 'Al-Mutaffifin', ayahCount: 36, startPage: 587, endPage: 589, juz: 30, revelation: 'مكية' },
  { number: 84, nameAr: 'الانشقاق', nameEn: 'Al-Inshiqaq', ayahCount: 25, startPage: 589, endPage: 590, juz: 30, revelation: 'مكية' },
  { number: 85, nameAr: 'البروج', nameEn: 'Al-Buruj', ayahCount: 22, startPage: 590, endPage: 590, juz: 30, revelation: 'مكية' },
  { number: 86, nameAr: 'الطارق', nameEn: 'At-Tariq', ayahCount: 17, startPage: 591, endPage: 591, juz: 30, revelation: 'مكية' },
  { number: 87, nameAr: 'الأعلى', nameEn: 'Al-A\'la', ayahCount: 19, startPage: 591, endPage: 592, juz: 30, revelation: 'مكية' },
  { number: 88, nameAr: 'الغاشية', nameEn: 'Al-Ghashiyah', ayahCount: 26, startPage: 592, endPage: 593, juz: 30, revelation: 'مكية' },
  { number: 89, nameAr: 'الفجر', nameEn: 'Al-Fajr', ayahCount: 30, startPage: 593, endPage: 594, juz: 30, revelation: 'مكية' },
  { number: 90, nameAr: 'البلد', nameEn: 'Al-Balad', ayahCount: 20, startPage: 594, endPage: 595, juz: 30, revelation: 'مكية' },
  { number: 91, nameAr: 'الشمس', nameEn: 'Ash-Shams', ayahCount: 15, startPage: 595, endPage: 595, juz: 30, revelation: 'مكية' },
  { number: 92, nameAr: 'الليل', nameEn: 'Al-Layl', ayahCount: 21, startPage: 595, endPage: 596, juz: 30, revelation: 'مكية' },
  { number: 93, nameAr: 'الضحى', nameEn: 'Ad-Duha', ayahCount: 11, startPage: 596, endPage: 596, juz: 30, revelation: 'مكية' },
  { number: 94, nameAr: 'الشرح', nameEn: 'Ash-Sharh', ayahCount: 8, startPage: 596, endPage: 597, juz: 30, revelation: 'مكية' },
  { number: 95, nameAr: 'التين', nameEn: 'At-Tin', ayahCount: 8, startPage: 597, endPage: 597, juz: 30, revelation: 'مكية' },
  { number: 96, nameAr: 'العلق', nameEn: 'Al-\'Alaq', ayahCount: 19, startPage: 597, endPage: 598, juz: 30, revelation: 'مكية' },
  { number: 97, nameAr: 'القدر', nameEn: 'Al-Qadr', ayahCount: 5, startPage: 598, endPage: 598, juz: 30, revelation: 'مكية' },
  { number: 98, nameAr: 'البينة', nameEn: 'Al-Bayyinah', ayahCount: 8, startPage: 598, endPage: 599, juz: 30, revelation: 'مدنية' },
  { number: 99, nameAr: 'الزلزلة', nameEn: 'Az-Zalzalah', ayahCount: 8, startPage: 599, endPage: 599, juz: 30, revelation: 'مدنية' },
  { number: 100, nameAr: 'العاديات', nameEn: 'Al-\'Adiyat', ayahCount: 11, startPage: 599, endPage: 600, juz: 30, revelation: 'مكية' },
  { number: 101, nameAr: 'القارعة', nameEn: 'Al-Qari\'ah', ayahCount: 11, startPage: 600, endPage: 600, juz: 30, revelation: 'مكية' },
  { number: 102, nameAr: 'التكاثر', nameEn: 'At-Takathur', ayahCount: 8, startPage: 600, endPage: 600, juz: 30, revelation: 'مكية' },
  { number: 103, nameAr: 'العصر', nameEn: 'Al-\'Asr', ayahCount: 3, startPage: 601, endPage: 601, juz: 30, revelation: 'مكية' },
  { number: 104, nameAr: 'الهمزة', nameEn: 'Al-Humazah', ayahCount: 9, startPage: 601, endPage: 601, juz: 30, revelation: 'مكية' },
  { number: 105, nameAr: 'الفيل', nameEn: 'Al-Fil', ayahCount: 5, startPage: 601, endPage: 602, juz: 30, revelation: 'مكية' },
  { number: 106, nameAr: 'قريش', nameEn: 'Quraysh', ayahCount: 4, startPage: 602, endPage: 602, juz: 30, revelation: 'مكية' },
  { number: 107, nameAr: 'الماعون', nameEn: 'Al-Ma\'un', ayahCount: 7, startPage: 602, endPage: 602, juz: 30, revelation: 'مكية' },
  { number: 108, nameAr: 'الكوثر', nameEn: 'Al-Kawthar', ayahCount: 3, startPage: 602, endPage: 602, juz: 30, revelation: 'مكية' },
  { number: 109, nameAr: 'الكافرون', nameEn: 'Al-Kafirun', ayahCount: 6, startPage: 603, endPage: 603, juz: 30, revelation: 'مكية' },
  { number: 110, nameAr: 'النصر', nameEn: 'An-Nasr', ayahCount: 3, startPage: 603, endPage: 603, juz: 30, revelation: 'مدنية' },
  { number: 111, nameAr: 'المسد', nameEn: 'Al-Masad', ayahCount: 5, startPage: 603, endPage: 603, juz: 30, revelation: 'مكية' },
  { number: 112, nameAr: 'الإخلاص', nameEn: 'Al-Ikhlas', ayahCount: 4, startPage: 604, endPage: 604, juz: 30, revelation: 'مكية' },
  { number: 113, nameAr: 'الفلق', nameEn: 'Al-Falaq', ayahCount: 5, startPage: 604, endPage: 604, juz: 30, revelation: 'مكية' },
  { number: 114, nameAr: 'الناس', nameEn: 'An-Nas', ayahCount: 6, startPage: 604, endPage: 604, juz: 30, revelation: 'مكية' },
];

export const POPULAR_WIRD_SURAHS: number[] = [
  2,   // البقرة
  3,   // آل عمران
  18,  // الكهف
  36,  // يس
  56,  // الواقعة
  67,  // الملك
  32,  // السجدة
  44,  // الدخان
  55,  // الرحمن
  1,   // الفاتحة
];

export function getSurahByNumber(num: number): QuranSurahMetadata | undefined {
  return QURAN_SURAHS.find((s) => s.number === num);
}

export function getSurahByName(name: string): QuranSurahMetadata | undefined {
  const cleanName = name.replace(/^(سورة|Surah)\s+/i, '').trim();
  return QURAN_SURAHS.find(
    (s) =>
      s.nameAr === cleanName ||
      s.nameAr === name.trim() ||
      s.nameEn.toLowerCase() === cleanName.toLowerCase() ||
      s.nameEn.toLowerCase() === name.toLowerCase()
  );
}

export function getSurahForPage(page: number): QuranSurahMetadata | undefined {
  return QURAN_SURAHS.find((s) => page >= s.startPage && page <= s.endPage);
}

export function calculateEstimatedHasanat(pages: number): number {
  return Math.max(0, pages) * 5500;
}
