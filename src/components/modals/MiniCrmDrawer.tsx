import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Plus,
  Mail,
  Globe,
  Briefcase,
  FileText,
  Calendar,
  Trash2,
} from 'lucide-react';
import type { Lead, OutreachTemplate, LeadStatus, LeadChannel } from '../../types';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface MiniCrmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  templates: OutreachTemplate[];
}

export const MiniCrmDrawer: React.FC<MiniCrmDrawerProps> = ({
  isOpen,
  onClose,
  leads,
  templates,
}) => {
  const { t, language } = useTranslation();

  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  // New Lead Form state
  const [newName, setNewName] = useState('');
  const [newChannel, setNewChannel] = useState<LeadChannel>('LinkedIn');
  const [newNotes, setNewNotes] = useState('');

  // New Template Form state
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplBody, setNewTplBody] = useState('');

  if (!isOpen) return null;

  const handleCopyTemplate = (template: OutreachTemplate) => {
    navigator.clipboard.writeText(template.body);
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setCopiedTemplateId(template.id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await db.leads.update(leadId, {
      status,
      lastContactDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Delete this lead?')) {
      await db.leads.delete(leadId);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: newName.trim(),
      channel: newChannel,
      status: 'To Contact',
      notes: newNotes.trim(),
      lastContactDate: new Date().toISOString().split('T')[0],
    };

    await db.leads.add(newLead);
    setNewName('');
    setNewNotes('');
    setShowAddLead(false);
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplTitle.trim() || !newTplBody.trim()) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const newTpl: OutreachTemplate = {
      id: `tpl-${Date.now()}`,
      title: newTplTitle.trim(),
      body: newTplBody.trim(),
    };

    await db.templates.add(newTpl);
    setNewTplTitle('');
    setNewTplBody('');
    setShowAddTemplate(false);
  };

  const handleDeleteTemplate = async (tplId: string) => {
    if (confirm(language === 'ar' ? 'حذف هذا القالب؟' : 'Delete this template?')) {
      await db.templates.delete(tplId);
    }
  };

  const getChannelIcon = (channel: LeadChannel) => {
    switch (channel) {
      case 'LinkedIn':
        return (
          <svg className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 0 0-1.64 1.64c0 .9.74 1.64 1.64 1.64.9 0 1.64-.74 1.64-1.64 0-.9-.74-1.64-1.64-1.64Z" />
          </svg>
        );
      case 'Upwork':
        return <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'To Contact':
        return 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700';
      case 'Contacted':
        return 'bg-sky-50 dark:bg-cyan-950/50 text-sky-800 dark:text-cyan-300 border-sky-300 dark:border-cyan-800/60';
      case 'Replied':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60';
      case 'Closed':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/60';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in transition-colors duration-200">
      <div className="w-full max-w-2xl xl:max-w-3xl h-full bg-white dark:bg-zinc-950 border-s border-slate-200 dark:border-zinc-800 p-6 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {t('crm_drawer_title')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {t('crm_drawer_sub')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pre-saved Outreach Message Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{t('crm_templates_title')}</span>
              </h4>

              <button
                onClick={() => setShowAddTemplate(!showAddTemplate)}
                className="text-[11px] text-purple-700 dark:text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t('add_template_btn')}</span>
              </button>
            </div>

            {/* Add Template Form */}
            {showAddTemplate && (
              <form
                onSubmit={handleAddTemplate}
                className="p-3 rounded-xl bg-purple-50/50 dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/50 space-y-2.5 shadow-xs animate-fade-in"
              >
                <input
                  type="text"
                  placeholder={t('tpl_title_placeholder')}
                  value={newTplTitle}
                  onChange={(e) => setNewTplTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500 shadow-2xs"
                  required
                />
                <textarea
                  placeholder={t('tpl_body_placeholder')}
                  value={newTplBody}
                  onChange={(e) => setNewTplBody(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500 shadow-2xs resize-none"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTemplate(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {t('save_template')}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all space-y-2 shadow-2xs relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200">{tpl.title}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyTemplate(tpl)}
                        className="px-2.5 py-1 rounded-md bg-purple-100 hover:bg-purple-200 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-800 dark:text-purple-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        {copiedTemplateId === tpl.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-300">{t('copied_success')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t('copy_clipboard')}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title={t('delete_template')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-3">
                    {tpl.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Pipeline List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('crm_leads_title')} ({leads.length})</span>
              </h4>

              <button
                onClick={() => setShowAddLead(!showAddLead)}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_lead')}</span>
              </button>
            </div>

            {/* Add Lead Form */}
            {showAddLead && (
              <form
                onSubmit={handleAddLead}
                className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 space-y-2.5 shadow-xs animate-fade-in"
              >
                <input
                  type="text"
                  placeholder={t('client_name_placeholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500 shadow-2xs"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as LeadChannel)}
                    className="px-2 py-1.5 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-300 focus:outline-none shadow-2xs"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Upwork">Upwork</option>
                    <option value="Email">Email</option>
                    <option value="Other">Other</option>
                  </select>

                  <input
                    type="text"
                    placeholder={t('notes_placeholder')}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="px-3 py-1.5 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none shadow-2xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddLead(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {t('save_lead')}
                  </button>
                </div>
              </form>
            )}

            {/* Leads Cards */}
            <div className="space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                        {getChannelIcon(lead.channel)}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-zinc-200">{lead.name}</h5>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{lead.lastContactDate}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white dark:bg-zinc-950 focus:outline-none cursor-pointer shadow-2xs ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        <option value="To Contact">To Contact</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Replied">Replied</option>
                        <option value="Closed">Closed</option>
                      </select>

                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title={t('delete_lead_btn')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {lead.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-950/40 p-2 rounded border border-slate-200 dark:border-zinc-800/50">
                      {lead.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            {language === 'ar' ? 'تذكر: هدفك ليس بيع المشروع فوراً، بل فتح محادثة حقيقية ومفيدة.' : 'Focus on starting meaningful conversations, not transactional pitching.'}
          </p>
        </div>
      </div>
    </div>
  );
};
