import React, { useState } from 'react';
import {
  X,
  Target,
  CheckCircle,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Goal, GoalCategory, MicroStep } from '../../types';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface GoalVelocityModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  selectedAnchorId?: string;
  onSelectTodayAnchor: (microStepId: string) => void;
}

export const GoalVelocityModal: React.FC<GoalVelocityModalProps> = ({
  isOpen,
  onClose,
  goals,
  selectedAnchorId,
  onSelectTodayAnchor,
}) => {
  const { t, language, isRTL } = useTranslation();
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(goals[0]?.id || null);

  // New Goal Form
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>('career');
  const [newTarget, setNewTarget] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // New Micro-Step state for active goal
  const [newMicroTitle, setNewMicroTitle] = useState('');
  const [addingMicroForGoalId, setAddingMicroForGoalId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    await db.goals.update(goalId, { milestones: updatedMilestones });
  };

  const handleToggleMicroStep = async (goalId: string, microStepId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const updatedMicro = goal.microSteps.map((s) =>
      s.id === microStepId ? { ...s, completed: !s.completed } : s
    );

    await db.goals.update(goalId, { microSteps: updatedMicro });
  };

  const handleIncrementGoalProgress = async (goalId: string, amount: number = 1) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const newVal = Math.min(goal.targetValue, goal.currentValue + amount);
    await db.goals.update(goalId, { currentValue: newVal });
  };

  const handleSelectAnchor = (stepId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectTodayAnchor(stepId);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTarget || !newUnit.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    const targetVal = parseFloat(newTarget) || 10;
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetValue: targetVal,
      currentValue: 0,
      unit: newUnit.trim(),
      startDate: new Date().toISOString().split('T')[0],
      etaDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: [
        { id: `m1-${Date.now()}`, title: `${Math.round(targetVal * 0.5)} ${newUnit.trim()}`, completed: false },
        { id: `m2-${Date.now()}`, title: `${targetVal} ${newUnit.trim()}`, completed: false },
      ],
      microSteps: [
        { id: `s1-${Date.now()}`, title: `${newTitle.trim()} (جلسة تركيز 20 دقيقة)`, durationMin: 20, completed: false },
      ],
    };

    await db.goals.add(newGoal);
    setExpandedGoalId(newGoal.id);
    setNewTitle('');
    setNewTarget('');
    setNewUnit('');
    setShowAddGoal(false);
  };

  const handleAddMicroStep = async (goalId: string) => {
    if (!newMicroTitle.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const newStep: MicroStep = {
      id: `step-${Date.now()}`,
      title: newMicroTitle.trim(),
      durationMin: 20,
      completed: false,
    };

    await db.goals.update(goalId, {
      microSteps: [...goal.microSteps, newStep],
    });

    setNewMicroTitle('');
    setAddingMicroForGoalId(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذا الهدف؟' : 'Are you sure you want to delete this goal?')) {
      await db.goals.delete(goalId);
    }
  };

  const calculateVelocityEta = (goal: Goal) => {
    const remaining = Math.max(0, goal.targetValue - goal.currentValue);
    if (remaining === 0) return language === 'ar' ? 'تم تحقيق الهدف بالكامل! 🎉' : 'Goal fully completed! 🎉';

    const ratePerDay = 1.2;
    const daysNeeded = Math.ceil(remaining / ratePerDay);

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);

    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateFormatted = projectedDate.toLocaleDateString(locale, options);

    if (language === 'ar') {
      return `بمعدلك الحالي، متوقع الإنجاز في: ${dateFormatted} (${daysNeeded} يوماً)`;
    } else {
      return `At your current velocity, estimated completion: ${dateFormatted} (${daysNeeded} days)`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in transition-colors duration-200">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-4xl xl:max-w-5xl rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t('goals_modal_title')}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {t('goals_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-700/50 cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('add_goal_btn')}</span>
          </button>
        </div>

        {/* Add Goal Form */}
        {showAddGoal && (
          <form
            onSubmit={handleAddGoal}
            className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-800/50 space-y-3 shadow-sm animate-fade-in"
          >
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              {t('add_goal_btn')}
            </h4>

            <input
              type="text"
              placeholder={t('goal_title_placeholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
              required
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
                className="px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none shadow-2xs"
              >
                <option value="career">{language === 'ar' ? 'مهني وتقني' : 'Career'}</option>
                <option value="learning">{language === 'ar' ? 'تعلم ومعرفة' : 'Learning'}</option>
                <option value="spiritual">{language === 'ar' ? 'روحي وقرآني' : 'Spiritual'}</option>
                <option value="fitness">{language === 'ar' ? 'لياقة وصحة' : 'Fitness'}</option>
                <option value="general">{language === 'ar' ? 'عام' : 'General'}</option>
              </select>

              <input
                type="number"
                placeholder={t('goal_target_placeholder')}
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                required
              />

              <input
                type="text"
                placeholder={t('goal_unit_placeholder')}
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t('save_lead')}
              </button>
            </div>
          </form>
        )}

        {/* Daily Anchor Selection Directive */}
        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 leading-relaxed">
          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-emerald-500" />
            <span>{t('morning_anchor_title')}</span>
          </span>
          <p className="text-slate-600 dark:text-zinc-400">
            {t('morning_anchor_desc')}
          </p>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {goals.map((goal) => {
            const isExpanded = expandedGoalId === goal.id;
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3 transition-all shadow-2xs"
              >
                {/* Goal Title & Progress Bar */}
                <div
                  onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{goal.title}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 font-medium">
                        {goal.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      {goal.currentValue} / {goal.targetValue} {goal.unit} ({percent}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-400">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{percent}%</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Progress bar with Quick Progress Button */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIncrementGoalProgress(goal.id, 1);
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold cursor-pointer shadow-2xs"
                      >
                        +1 {goal.unit}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIncrementGoalProgress(goal.id, 5);
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold cursor-pointer shadow-2xs"
                      >
                        +5
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title={t('delete_goal_btn')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Velocity ETA Projection */}
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 text-[11px] text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-2xs">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
                  <span>{calculateVelocityEta(goal)}</span>
                </div>

                {/* Expanded Details: Milestones & Micro-Steps */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {/* Milestones Column */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block pb-1 border-b border-slate-100 dark:border-zinc-800">
                        {t('milestones_label')}
                      </span>
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(goal.id, m.id)}
                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              m.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                            }`}
                          >
                            {m.completed && <CheckCircle className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={m.completed ? 'line-through text-slate-400 dark:text-zinc-500' : ''}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Micro-Steps Column */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block">
                          {t('micro_steps_label')}
                        </span>
                        <button
                          onClick={() => setAddingMicroForGoalId(addingMicroForGoalId === goal.id ? null : goal.id)}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          {t('add_micro_step_btn')}
                        </button>
                      </div>

                      {addingMicroForGoalId === goal.id && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                          <input
                            type="text"
                            placeholder={t('micro_step_placeholder')}
                            value={newMicroTitle}
                            onChange={(e) => setNewMicroTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs bg-transparent border-0 focus:outline-none text-slate-900 dark:text-zinc-100"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddMicroStep(goal.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddMicroStep(goal.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {goal.microSteps.map((step) => {
                        const isAnchor = selectedAnchorId === step.id;

                        return (
                          <div
                            key={step.id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                              isAnchor
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-300 shadow-2xs'
                                : 'bg-white dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div
                              onClick={() => handleToggleMicroStep(goal.id, step.id)}
                              className="flex items-center gap-2 text-xs cursor-pointer flex-1"
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  step.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                                }`}
                              >
                                {step.completed && <CheckCircle className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={step.completed ? 'line-through text-slate-400 dark:text-zinc-500' : ''}>
                                {step.title}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                ({step.durationMin}m)
                              </span>
                            </div>

                            {/* Select as Anchor Button */}
                            <button
                              onClick={() => handleSelectAnchor(step.id)}
                              className={`text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                                isAnchor
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                              }`}
                            >
                              {isAnchor ? t('anchor_selected_badge') : t('select_as_anchor')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
