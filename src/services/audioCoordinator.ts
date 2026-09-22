// ============================================================================
// منسق الصوت الذكي لمنع التضارب الصوتي (Smart Audio Concurrency Coordinator)
// يضمن تشغيل مصدر صوتي واحد حصرياً (القرآن، أثير السيرة، الضوضاء البيئية، النطق)
// ============================================================================

export type AudioChannelId = 'quran' | 'gym_faith' | 'ambient' | 'speech';

class AudioCoordinator {
  private channels: Map<AudioChannelId, () => void> = new Map();

  public register(id: AudioChannelId, stopOrPause: () => void) {
    this.channels.set(id, stopOrPause);
  }

  public unregister(id: AudioChannelId) {
    this.channels.delete(id);
  }

  /**
   * تفعيل القفل الحصري: إيقاف أي قنوات صوتية أخرى فوراً بسلاسة
   */
  public requestExclusive(activeId: AudioChannelId) {
    this.channels.forEach((pauseFn, id) => {
      if (id !== activeId) {
        try {
          pauseFn();
        } catch (e) {
          console.warn(`AudioCoordinator: failed to pause channel ${id}:`, e);
        }
      }
    });
  }
}

export const audioCoordinator = new AudioCoordinator();
