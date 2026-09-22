import React, { useState } from 'react';
import {
  X,
  Users,
  UserCheck,
  Plus,
  Trash2,
  Share2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Laptop,
  GraduationCap,
  Briefcase,
  Sliders,
} from 'lucide-react';
import type { UserProfile, LifeRoleTemplate, UserState } from '../../types';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState | undefined;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({
  isOpen,
  onClose,
  userState,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const profiles = useLiveQuery(() => db.profiles.toArray()) || [];
  const activeProfileId = userState?.activeProfileId || 'profile_default';

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<LifeRoleTemplate>('software_engineer');
  const [selectedEmoji, setSelectedEmoji] = useState('⚡');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const emojiOptions = ['⚡', '💻', '🎓', '💼', '🎯', '🚀', '💡', '🛡️', '🏋️', '📚'];

  const templateDescriptions: Record<LifeRoleTemplate, { title: string; desc: string; icon: any }> = {
    software_engineer: {
      title: isAr ? 'المبرمج والمهندس' : 'Software Engineer',
      desc: isAr
        ? 'جلسات عمل عميق (50 دقيقة)، تتبع مشاريع الكود، وتواصل مستمر مع العملاء.'
        : 'Deep focus sessions (50m), code project backlog, and technical sprints.',
      icon: Laptop,
    },
    student_researcher: {
      title: isAr ? 'الطالب والباحث' : 'Student & Researcher',
      desc: isAr
        ? 'جلسات استذكار متكررة (25 دقيقة)، قراءة مكثفة، ورد قرآني ومراجعة دورية.'
        : 'Pomodoro study blocks (25m), literature reading, and structured review checks.',
      icon: GraduationCap,
    },
    freelancer_creator: {
      title: isAr ? 'المستقل وصانع المحتوى' : 'Freelancer & Creator',
      desc: isAr
        ? 'إدارة خطوط التواصل المباشر (CRM)، إنتاجية مرنة، وجلسات تدفق إبداعي (90 دقيقة).'
        : 'Direct client outreach CRM, agile workflows, and 90-min creative flow sprints.',
      icon: Briefcase,
    },
    custom_general: {
      title: isAr ? 'قالب مخصص مرن' : 'Custom Flexible Profile',
      desc: isAr
        ? 'تصميم جدول يومي مخصص وفق أولوياتك الحياتية وأهدافك الشخصية.'
        : 'Fully customizable daily rhythms, habits, and target milestones.',
      icon: Sliders,
    },
  };

  const handleSelectProfile = async (profileId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (userState) {
      await db.user_state.update(userState.id, {
        activeProfileId: profileId,
      });
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const newId = `profile_${Date.now()}`;
    const newProfile: UserProfile = {
      id: newId,
      name: newProfileName.trim(),
      roleTemplate: selectedTemplate,
      createdAt: new Date().toISOString(),
      avatarEmoji: selectedEmoji,
      isDefault: false,
    };

    await db.profiles.add(newProfile);

    // Switch to new profile
    if (userState) {
      await db.user_state.update(userState.id, {
        activeProfileId: newId,
      });
    }

    setNewProfileName('');
    setShowAddForm(false);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (profileId === 'profile_default') return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا الملف الشخصي؟' : 'Are you sure you want to delete this profile?')) {
      await db.profiles.delete(profileId);
      if (activeProfileId === profileId && userState) {
        await db.user_state.update(userState.id, {
          activeProfileId: 'profile_default',
        });
      }
    }
  };

  const handleCopyShareLink = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const appUrl = window.location.origin;
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                {t('profile_switcher_title')}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                  {profiles.length} {isAr ? 'حسابات' : 'Profiles'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('profile_switcher_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Profiles Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                {t('current_active_profile')}
              </h4>

              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800/50 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('create_profile_btn')}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((prof) => {
                const isActive = prof.id === activeProfileId;
                const tmpl = templateDescriptions[prof.roleTemplate] || templateDescriptions.custom_general;
                const TmplIcon = tmpl.icon;

                return (
                  <div
                    key={prof.id}
                    onClick={() => handleSelectProfile(prof.id)}
                    className={`p-4 rounded-xl border text-start flex flex-col justify-between transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
                          {prof.avatarEmoji || '⚡'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                              {prof.name}
                            </span>
                            {prof.isDefault && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                {isAr ? 'الأساسي' : 'Default'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <TmplIcon className="w-3 h-3 text-indigo-500" />
                            {tmpl.title}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="p-1 rounded-full bg-indigo-600 text-white">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        !prof.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfile(prof.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={isAr ? 'حذف الملف' : 'Delete Profile'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                      {tmpl.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Profile Form */}
          {showAddForm && (
            <form onSubmit={handleCreateProfile} className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/50 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  {t('create_profile_btn')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              {/* Profile Name & Emoji */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {t('profile_name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('profile_name_placeholder')}
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                    {isAr ? 'الأيقونة التعبيرية:' : 'Avatar Emoji:'}
                  </label>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {emojiOptions.slice(0, 5).map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setSelectedEmoji(em)}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-all ${
                          selectedEmoji === em
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Life Template Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  {t('profile_role_label')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(templateDescriptions) as LifeRoleTemplate[]).map((key) => {
                    const item = templateDescriptions[key];
                    const isSel = selectedTemplate === key;
                    const Icon = item.icon;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTemplate(key)}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSel
                            ? 'bg-white dark:bg-zinc-800 border-indigo-500 shadow-xs'
                            : 'bg-slate-100/60 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isSel ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight block mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {t('save_profile_btn')}
                </button>
              </div>
            </form>
          )}

          {/* Share with Friends Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-zinc-900 border border-teal-200 dark:border-teal-800/40 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                <Share2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {t('share_with_friends_title')}
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t('share_with_friends_desc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{isAr ? 'خصوصية تامة: لا تُرسل أي بيانات إلى السحابة أو طرف ثالث.' : '100% Private & Local Storage.'}</span>
              </div>

              <button
                onClick={handleCopyShareLink}
                className="w-full sm:w-auto py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? t('link_copied') : t('copy_share_link')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
          <span className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {isAr ? 'التبديل بين الحسابات فوري وبدون أي إعادة تحميل للصفحة' : 'Instant 0ms local switching'}
          </span>

          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
