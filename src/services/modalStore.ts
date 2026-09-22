import { useState, useEffect } from 'react';

export type ModalId =
  | 'onboarding'
  | 'historyArchive'
  | 'settingsBackup'
  | 'prayerLocation'
  | 'notificationPermission'
  | 'dailyPrideTicket'
  | 'sleepRest'
  | 'quranPageGrid'
  | 'smartTasbih'
  | 'zeroInertia'
  | 'retrospectiveNotes'
  | 'evaluationReport'
  | 'aiCoach'
  | 'languageQuiz'
  | 'warmupPyramid'
  | 'scheduleAnomaly'
  | 'quickCommandPalette'
  | 'faithAudioSanctuary';

interface ModalState {
  activeModal: ModalId | null;
  props: Record<string, any>;
}

type ModalListener = (state: ModalState) => void;

class ModalStore {
  private state: ModalState = {
    activeModal: null,
    props: {},
  };
  private listeners: Set<ModalListener> = new Set();

  public getState(): ModalState {
    return this.state;
  }

  public open(modalId: ModalId, props: Record<string, any> = {}) {
    this.state = { activeModal: modalId, props };
    this.notify();
  }

  public close() {
    this.state = { activeModal: null, props: {} };
    this.notify();
  }

  public isOpen(modalId: ModalId): boolean {
    return this.state.activeModal === modalId;
  }

  public subscribe(listener: ModalListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.state);
      } catch (e) {
        console.error('ModalStore notify error:', e);
      }
    });
  }
}

export const modalStore = new ModalStore();

export const useModalStore = () => {
  const [modalState, setModalState] = useState<ModalState>(() => modalStore.getState());

  useEffect(() => {
    return modalStore.subscribe(setModalState);
  }, []);

  return {
    activeModal: modalState.activeModal,
    modalProps: modalState.props,
    openModal: (id: ModalId, props?: Record<string, any>) => modalStore.open(id, props),
    closeModal: () => modalStore.close(),
    isOpen: (id: ModalId) => modalState.activeModal === id,
  };
};
