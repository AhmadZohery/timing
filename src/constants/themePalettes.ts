import type { ThemePaletteId } from '../types';

export interface PaletteConfig {
  id: ThemePaletteId;
  nameAr: string;
  nameEn: string;
  badge: string;
  primaryColor: string;
  bgPreview: string;
  descAr: string;
}

export const PALETTE_CONFIGS: Record<ThemePaletteId, PaletteConfig> = {
  obsidian_gold: {
    id: 'obsidian_gold',
    nameAr: 'ذهب الأوبسيديان الملكي',
    nameEn: 'Obsidian Noir & Champagne Gold',
    badge: '👑 الفخامة المطلقة',
    primaryColor: '#d4af37',
    bgPreview: 'from-[#08090d] via-[#10121a] to-[#181c28]',
    descAr: 'أسطح مخملية داكنة مع بريق الذهب الشمبانيا عيار 24 لإحساس ملكي رفيع.',
  },
  damascus_sand: {
    id: 'damascus_sand',
    nameAr: 'الزمرد الدمشقي والرمل العتيق',
    nameEn: 'Damascus Emerald & Warm Sand',
    badge: '🌿 الدفء الإيماني',
    primaryColor: '#166534',
    bgPreview: 'from-[#faf7f2] via-[#f4eee4] to-[#e8ded0]',
    descAr: 'ورق كتاني دافئ مع زمرد صنوبري عتيق يبعث على السكينة والوقار.',
  },
  cosmic_titanium: {
    id: 'cosmic_titanium',
    nameAr: 'تيتانيوم الفضاء الأبل برو',
    nameEn: 'Cosmic Titanium Pro',
    badge: '🪐 التقنية العالية',
    primaryColor: '#0ea5e9',
    bgPreview: 'from-[#030712] via-[#090e1a] to-[#111827]',
    descAr: 'شيد معدني فضائي بلمسات أزور زرقاء فائقة الدقة لتركيز خالٍ من التشتت.',
  },
  nordic_slate: {
    id: 'nordic_slate',
    nameAr: 'الصلصال الشمالي النقي',
    nameEn: 'Nordic Slate Minimalist',
    badge: '❄️ صفاء أحادي',
    primaryColor: '#475569',
    bgPreview: 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
    descAr: 'هدوء رمادي مونوكروم خالص يزيل أي ضجيج بصري عن المحتوى الأساسي.',
  },
};
