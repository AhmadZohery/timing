import React, { useState } from 'react';
import {
  X,
  Gift,
  Sparkles,
  ShoppingBag,
  History,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Clock,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_REAL_LIFE_REWARDS } from '../../db/db';
import type { RealLifeRewardItem, RedeemedRewardRecord, RewardCategory, UserState } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import {
  getSpendablePoints,
  redeemReward,
  addCustomReward,
  deleteCustomReward,
  triggerCelebrationConfetti,
} from '../../utils/gamification';

interface RealLifeRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState | null;
}

type ModalTab = 'available' | 'history' | 'add';

const PRESET_EMOJIS = ['🍔', '👕', '☕', '📚', '🎮', '🍿', '🌴', '👟', '🎧', '🎁', '🍕', '🍦'];
const PRESET_POINTS = [30, 50, 100, 150, 250, 350, 500];

export const RealLifeRewardsModal: React.FC<RealLifeRewardsModalProps> = ({
  isOpen,
  onClose,
  userState,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ModalTab>('available');
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | 'all'>('all');
  const [redeemingReward, setRedeemingReward] = useState<RealLifeRewardItem | null>(null);
  const [redemptionNote, setRedemptionNote] = useState('');
  const [voucherRecord, setVoucherRecord] = useState<RedeemedRewardRecord | null>(null);

  // Form states for new custom reward
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RewardCategory>('meal');
  const [newEmoji, setNewEmoji] = useState('🎁');
  const [newPointsCost, setNewPointsCost] = useState<number>(100);
  const [newDescription, setNewDescription] = useState('');

  // Live query for custom rewards in Dexie
  const customRewards = useLiveQuery(
    async () => {
      const items = await db.custom_rewards.toArray();
      if (items.length === 0) {
        // Fallback to default presets if table is empty
        return DEFAULT_REAL_LIFE_REWARDS;
      }
      return items;
    },
    [],
    DEFAULT_REAL_LIFE_REWARDS
  );

  // Live query for redeemed history in Dexie
  const redeemedRecords = useLiveQuery(
    async () => {
      const records = await db.redeemed_rewards.toArray();
      return records.sort(
        (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
      );
    },
    [],
    []
  );

  // Live user state for instant balance reactive updates
  const liveUser = useLiveQuery(async () => {
    return await db.user_state.get('current_user');
  }, []);

  const currentUser = liveUser || userState;
  const spendablePoints = getSpendablePoints(currentUser);
  const lifetimePoints = currentUser?.totalPoints || 0;

  if (!isOpen) return null;

  // Filter rewards by category
  const filteredRewards = (customRewards || []).filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  // Handle redemption click
  const handleRedeemClick = (reward: RealLifeRewardItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setRedeemingReward(reward);
    setRedemptionNote('');
  };

  // Confirm redemption
  const handleConfirmRedeem = async () => {
    if (!redeemingReward) return;
    const res = await redeemReward(redeemingReward, redemptionNote);
    if (res.success && res.record) {
      setVoucherRecord(res.record);
      setRedeemingReward(null);
    }
  };

  // Add custom reward
  const handleCreateCustomReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addCustomReward({
      title: newTitle.trim(),
      description:
        newDescription.trim() ||
        (isAr ? 'مكافأة واقعية مخصصة استحققتها بجهدك' : 'Custom real-life reward'),
      pointsCost: Math.max(10, newPointsCost),
      category: newCategory,
      emoji: newEmoji,
    });

    // Reset and switch to available tab
    setNewTitle('');
    setNewDescription('');
    setNewPointsCost(100);
    setActiveTab('available');
    triggerCelebrationConfetti();
  };

  const handleDeleteReward = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه المكافأة من قائمة أمنياتك؟' : 'Delete this reward?')) {
      await deleteCustomReward(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Top Floating Glow Accent */}
        <div className="absolute -top-10 inset-x-0 h-24 bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent pointer-events-none blur-xl" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-start justify-between gap-3 relative z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'متجر المكافآت الواقعية (اشتري لنفسك كذا 🎁)' : 'Real-Life Reward Marketplace 🎁'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {isAr ? 'مكافآت ملموسة' : 'Dopamine Store'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                {isAr
                  ? 'كافئ نفسك بوجبة، ملابس جديدة، قهوة، أو أجهزة دون أدنى تأنيب ضمير!'
                  : 'Treat yourself to cheat meals, clothes, coffee, or gadgets without guilt!'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spendable Points Wallet Summary Bar */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-zinc-900 border-b border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block">
                {isAr ? 'رصيد المكافآت المتاح للصرف الآن' : 'Available Spendable Balance'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {spendablePoints}
                </span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-500">
                  {isAr ? 'نقطة جاهزة للصرف 💎' : 'pts ready to spend'}
                </span>
              </div>
            </div>
          </div>

          {/* Reassurance Badge */}
          <div className="text-start sm:text-end">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
              {isAr ? 'إجمالي فخرك التراكمي:' : 'Lifetime Total:'} <strong className="text-slate-800 dark:text-zinc-200 font-mono">{lifetimePoints} {isAr ? 'نقطة' : 'pts'}</strong>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              🛡️ {isAr ? 'صرف النقاط لا ينقص رصيدك التراكمي أو الشعلة أبداً' : 'Spending never reduces lifetime score or streaks'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('available');
            }}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'available'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isAr ? 'المكافآت المتاحة للتنفيذ 🎁' : 'Rewards Marketplace'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              {customRewards?.length || 0}
            </span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('history');
            }}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isAr ? 'المكافآت المستمتع بها 📜' : 'Redeemed History'}</span>
            {redeemedRecords && redeemedRecords.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                {redeemedRecords.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('add');
            }}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'add'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isAr ? 'إضافة أمنية جديدة ➕' : 'Add Custom Wish'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Available Rewards */}
          {activeTab === 'available' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs no-scrollbar">
                {[
                  { id: 'all', label: isAr ? 'الكل 🌟' : 'All 🌟' },
                  { id: 'meal', label: isAr ? 'وجبات ومطاعم 🍔' : 'Meals 🍔' },
                  { id: 'clothes', label: isAr ? 'ملابس وأناقة 👕' : 'Clothes 👕' },
                  { id: 'coffee', label: isAr ? 'قهوة وحلوى ☕' : 'Coffee ☕' },
                  { id: 'books', label: isAr ? 'كتب ودورات 📚' : 'Books 📚' },
                  { id: 'gadget', label: isAr ? 'تقنية وألعاب 🎮' : 'Tech 🎮' },
                  { id: 'leisure', label: isAr ? 'ترفيه وسينما 🍿' : 'Leisure 🍿' },
                  { id: 'custom', label: isAr ? 'مخصص 🏷️' : 'Custom 🏷️' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setSelectedCategory(cat.id as RewardCategory | 'all');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                        : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Rewards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredRewards.map((reward) => {
                  const canAfford = spendablePoints >= reward.pointsCost;
                  const progressPct = Math.min(100, Math.round((spendablePoints / reward.pointsCost) * 100));
                  const remaining = Math.max(0, reward.pointsCost - spendablePoints);

                  return (
                    <div
                      key={reward.id}
                      className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                        canAfford
                          ? 'bg-gradient-to-b from-white to-emerald-50/40 dark:from-zinc-900 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm hover:shadow-md'
                          : 'bg-white dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 opacity-80'
                      }`}
                    >
                      {/* Top Row: Emoji, Title, Points Pill */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-3xl p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 select-none shadow-2xs">
                              {reward.emoji}
                            </span>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 leading-snug">
                                {reward.title}
                              </h3>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                                {reward.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-2xs ${
                                canAfford
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}
                            >
                              {reward.pointsCost} {isAr ? 'نقطة' : 'pts'}
                            </span>
                            {reward.isCustom && (
                              <button
                                onClick={(e) => handleDeleteReward(reward.id, e)}
                                title={isAr ? 'حذف من القائمة' : 'Delete'}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                          {reward.description}
                        </p>
                      </div>

                      {/* Bottom Action / Progress Row */}
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                        {canAfford ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isAr ? 'جاهزة للاستبدال فوراً!' : 'Ready to redeem!'}
                            </span>
                            <button
                              onClick={() => handleRedeemClick(reward)}
                              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/25"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>{isAr ? 'استبدل واستمتع الآن 🎁' : 'Redeem & Enjoy 🎁'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                              <span>{isAr ? `متبقي ${remaining} نقطة فقط` : `${remaining} pts needed`}</span>
                              <span>{progressPct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <button
                              disabled
                              className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-500 text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed"
                            >
                              <span>{isAr ? `تحتاج إنجاز ${remaining} نقطة لفتحها` : `Locked (${remaining} pts to go)`}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Motivational Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs">
                <span className="text-xl shrink-0">💡</span>
                <div className="space-y-1">
                  <strong className="font-bold block">
                    {isAr ? 'مبدأ اللذة المؤجلة المستحقة (Dopamine Reset):' : 'Earned Dopamine Principle:'}
                  </strong>
                  <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                    {isAr
                      ? 'عندما تربط متعة حقيقية (عشاء فاخر، ملابس جديدة، جهاز كنت ترغب به) بإنجاز نقاطك اليومية، يتبرمج عقلك الباطن على أن العمل الشاق والانضباط يؤتي ثماره، ويزول أي شعور خفي بتأنيب الضمير!'
                      : 'Linking tangible pleasures with earned points teaches your brain that discipline yields real rewards, eliminating guilt entirely!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Redeemed History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {redeemedRecords && redeemedRecords.length > 0 ? (
                <div className="space-y-2.5">
                  {redeemedRecords.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl sm:text-3xl p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                          {item.emoji}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100 truncate">
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(item.redeemedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {item.note && (
                              <span className="italic text-emerald-600 dark:text-emerald-400 font-medium">
                                "{item.note}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black font-mono text-xs shadow-2xs">
                          -{item.pointsSpent} {isAr ? 'نقطة' : 'pts'}
                        </span>
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          ✓ {isAr ? 'تم الاستمتاع بها' : 'Enjoyed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-dashed border-slate-300 dark:border-zinc-800">
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl">
                    🎁
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                    {isAr ? 'سجل المكافآت المستمتع بها فارغ حالياً' : 'No rewards redeemed yet'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                    {isAr
                      ? 'عندما تستبدل نقاطك بوجبة لذيذة أو ملابس جديدة أو كتاب، ستُخلد تلك اللحظة هنا تذكيراً بنجاحك وانضباطك!'
                      : 'When you redeem points for a meal or clothes, it will be recorded here as a badge of your discipline!'}
                  </p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer shadow-xs"
                  >
                    {isAr ? 'تصفح المكافآت المتاحة 🚀' : 'Browse Available Rewards 🚀'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Add Custom Reward */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateCustomReward} className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1 text-center pb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'أضف أمنية واقعية جديدة لقائمة رغباتك 🌟' : 'Add Custom Real-Life Reward 🌟'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isAr
                    ? 'اكتب شيئاً تتمنى شراءه لنفسك أو تجربة تريد خوضها عندما تكمل أهدافك'
                    : 'Add an item or experience you want to reward yourself with when hitting your goals.'}
                </p>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isAr ? 'اسم المكافأة أو الشيء الذي ستشتريه لنفسك:' : 'Reward Title / What you want to buy:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isAr
                      ? 'مثال: حذاء جري للجيم، وجبة سوشي مع الأصدقاء، سماعة رأس...'
                      : 'e.g., Running shoes, Sushi with friends, Wireless headphones...'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Category & Emoji */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isAr ? 'التصنيف:' : 'Category:'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RewardCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="meal">{isAr ? 'وجبة أو مطعم 🍔' : 'Meal / Restaurant 🍔'}</option>
                    <option value="clothes">{isAr ? 'ملابس أو مظهر 👕' : 'Clothes / Fashion 👕'}</option>
                    <option value="coffee">{isAr ? 'قهوة أو كافيه ☕' : 'Coffee / Cafe ☕'}</option>
                    <option value="books">{isAr ? 'كتاب أو كورس 📚' : 'Book / Course 📚'}</option>
                    <option value="gadget">{isAr ? 'تقنية أو ملحق إلكتروني 🎮' : 'Tech / Gadget 🎮'}</option>
                    <option value="leisure">{isAr ? 'ترفيه أو فيلم 🍿' : 'Leisure / Movie 🍿'}</option>
                    <option value="custom">{isAr ? 'مخصص / أخرى 🎁' : 'Custom / Other 🎁'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isAr ? 'الأيقونة التعبيرية:' : 'Emoji:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                      {newEmoji}
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar flex-1">
                      {PRESET_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewEmoji(em)}
                          className={`p-1.5 rounded-lg text-lg transition-transform hover:scale-110 cursor-pointer ${
                            newEmoji === em
                              ? 'bg-emerald-100 dark:bg-emerald-950 ring-2 ring-emerald-500'
                              : 'bg-slate-50 dark:bg-zinc-900'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Points Cost */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isAr ? 'تكلفة الاستبدال (بالنقاط):' : 'Points Cost:'}
                  </label>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {newPointsCost} {isAr ? 'نقطة' : 'pts'}
                  </span>
                </div>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={newPointsCost}
                  onChange={(e) => setNewPointsCost(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">{isAr ? 'اقتراحات سريعة:' : 'Presets:'}</span>
                  {PRESET_POINTS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setNewPointsCost(pts)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                        newPointsCost === pts
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isAr ? 'وصف أو تفاصيل المكافأة (اختياري):' : 'Description (optional):'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    isAr
                      ? 'مثال: سأذهب للمول يوم السبت بعد إنهاء مهام الأسبوع وأشتري هذا التيشرت...'
                      : 'e.g., I will visit the mall on Saturday after completing all weekly tasks...'
                  }
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25 transition-transform active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAr ? 'حفظ المكافأة في قائمة أمنياتي 🌟' : 'Save to My Wishlist 🌟'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>
            {isAr ? 'نظام الحوافز الواقعية — Midmar LifeOS' : 'Midmar Real-Life Rewards'}
          </span>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      {/* CONFIRMATION POPUP FOR REDEMPTION */}
      {redeemingReward && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-emerald-300 dark:border-emerald-800 p-6 shadow-2xl space-y-4 text-center"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              {redeemingReward.emoji}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                {isAr ? `تأكيد استبدال: ${redeemingReward.title}` : `Confirm: ${redeemingReward.title}`}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                {isAr
                  ? `سيتم خصم ${redeemingReward.pointsCost} نقطة من رصيدك المتاح (${spendablePoints} نقطة).`
                  : `${redeemingReward.pointsCost} points will be deducted from your available balance (${spendablePoints} pts).`}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-start space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                {isAr ? 'تصريح الاستمتاع الذاتي:' : 'Psychological Permission Slip:'}
              </span>
              <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {isAr
                  ? 'أنت أنجزت مهامك والتزمت بمواعيد صلاتك وعملك وجيمك. شراء هذه المكافأة الآن هو حقك الطبيعي بدون أي لوم ذاتي!'
                  : 'You completed your stations and daily habits. Enjoying this reward now is 100% guilt-free!'}
              </p>
            </div>

            {/* Optional note */}
            <input
              type="text"
              placeholder={isAr ? 'ملاحظة شخصية (مثال: عشاء بعد انتهاء أسبوع المبرمج)...' : 'Personal note (optional)...'}
              value={redemptionNote}
              onChange={(e) => setRedemptionNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-emerald-500 text-start"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmRedeem}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 transition-transform active:scale-98"
              >
                <Gift className="w-4 h-4" />
                <span>{isAr ? 'تأكيد واستبدال الآن 🎁' : 'Confirm & Redeem 🎁'}</span>
              </button>
              <button
                onClick={() => setRedeemingReward(null)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATORY VOUCHER / PSYCHOLOGICAL PERMISSION SLIP DIALOG */}
      {voucherRecord && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-lg bg-gradient-to-b from-amber-50 via-white to-amber-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-3xl border-2 border-amber-400 dark:border-amber-500/80 p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Corner Decorative Ribbons */}
            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
              <div className="bg-amber-500 text-white text-[9px] font-black py-1 w-32 text-center rotate-45 translate-x-7 translate-y-3 shadow-md">
                {isAr ? 'مستحق بجدارة' : 'WELL DESERVED'}
              </div>
            </div>

            {/* Glowing Trophy / Emoji Badge */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center text-4xl shadow-lg shadow-amber-500/40 animate-pulse">
                {voucherRecord.emoji}
              </div>
              <span className="absolute -bottom-2 -right-2 p-2 rounded-full bg-emerald-600 text-white shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                {isAr ? '📜 قسيمة استمتاع رسمي بدون تأنيب ضمير' : 'OFFICIAL PERMISSION SLIP'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
                {isAr ? `🎉 مبارك! حان وقت: ${voucherRecord.title}` : `🎉 Treat Time: ${voucherRecord.title}`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-md mx-auto">
                {isAr
                  ? 'اخرج الآن واشترِها، أو اطلبها فوراً! أنت بذلت جهداً حقيقياً وتغلبت على الكسل والفتور واستحققت هذه المكافأة بنسبة 100%!'
                  : 'Go ahead and buy it or order it now! You put in real effort, defeated laziness, and earned this 100%!'}
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>{isAr ? 'النقاط المستبدلة:' : 'Points Spent:'}</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  -{voucherRecord.pointsSpent} {isAr ? 'نقطة' : 'pts'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>{isAr ? 'الرصيد المتاح المتبقي:' : 'Remaining Balance:'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {spendablePoints} {isAr ? 'نقطة' : 'pts'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>{isAr ? 'وقت الإصدار:' : 'Issued at:'}</span>
                <span className="font-mono text-[11px]">
                  {new Date(voucherRecord.redeemedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {voucherRecord.note && (
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-start">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'ملاحظتك:' : 'Your note:'}</span>
                  <p className="text-xs text-slate-800 dark:text-zinc-200 italic font-medium">
                    "{voucherRecord.note}"
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateSprintCelebration();
                  setVoucherRecord(null);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/30 transition-transform active:scale-98"
              >
                <span>{isAr ? 'أنا ذاهب للاستمتاع بها الآن! 🚀' : 'Going to enjoy it now! 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
