'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Keyboard,
  Search,
  Terminal,
  Settings,
  Palette,
} from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/db';
import { Button } from '@/components/ui';
import styles from './Onboarding.module.css';

// ── Steps ──────────────────────────────────────────────────

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  hints?: { keys: string[]; label: string }[];
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to ProjectShelf',
    description:
      'Your developer command center. Organize, search, and launch all your software projects from one place. Everything is stored locally and works offline.',
    icon: <FolderKanban size={18} />,
  },
  {
    title: 'Add Your Projects',
    description:
      'Click "New Project" or press Ctrl+N to add a project. Provide the local path and any metadata. Projects can be tagged, filtered, and sorted.',
    icon: <FolderKanban size={18} />,
    hints: [
      { keys: ['Ctrl', 'N'], label: 'New project' },
    ],
  },
  {
    title: 'Keyboard-First Workflow',
    description:
      'Every action has a keyboard shortcut. Open the command palette with Ctrl+K to search commands, or press ? to see all shortcuts.',
    icon: <Keyboard size={18} />,
    hints: [
      { keys: ['Ctrl', 'K'], label: 'Command palette' },
      { keys: ['?'], label: 'Shortcuts cheat sheet' },
    ],
  },
  {
    title: 'Search and Navigate',
    description:
      'Press / to focus the search bar. Filter by status, sort by name or date, and switch between grid and list views.',
    icon: <Search size={18} />,
    hints: [
      { keys: ['/'], label: 'Focus search' },
      { keys: ['Ctrl', 'Shift', 'V'], label: 'Toggle grid/list' },
    ],
  },
  {
    title: 'Quick Actions and Terminals',
    description:
      'Hover any project card for quick actions: open in your editor, launch a terminal, or open the file explorer. Multi-select with Ctrl+Click for batch operations.',
    icon: <Terminal size={18} />,
    hints: [
      { keys: ['Ctrl', 'E'], label: 'Open in editor' },
      { keys: ['Ctrl', 'T'], label: 'Open terminal' },
    ],
  },
  {
    title: 'Customize Everything',
    description:
      'Head to Settings (Ctrl+,) to configure themes, fonts, terminals, editors, commands, and shortcuts. Choose from 12 themes and 5 font families.',
    icon: <Settings size={18} />,
    hints: [
      { keys: ['Ctrl', ','], label: 'Open settings' },
      { keys: ['F1'], label: 'User manual' },
    ],
  },
];

// ── Onboarding Modal ───────────────────────────────────────

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    getSettings().then((settings) => {
      if (!settings.firstRunCompleted) {
        setOpen(true);
      }
    });
  }, []);

  const handleComplete = async () => {
    await updateSettings({ firstRunCompleted: true });
    setOpen(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!open) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className={styles.onboardingOverlay}>
      <div className={styles.onboardingCard}>
        <div className={styles.onboardingHeader}>
          <div className={styles.onboardingLogo}>PS</div>
          <h2 className={styles.onboardingTitle}>{currentStep.title}</h2>
          <p className={styles.onboardingSubtitle}>{currentStep.description}</p>
        </div>

        {currentStep.hints && currentStep.hints.length > 0 && (
          <div className={styles.onboardingBody}>
            {currentStep.hints.map((hint, i) => (
              <div key={i} className={styles.onboardingStep}>
                <div className={styles.onboardingStepIcon}>
                  {currentStep.icon}
                </div>
                <div className={styles.onboardingStepContent}>
                  <div className={styles.onboardingStepTitle}>{hint.label}</div>
                  <div className={styles.onboardingStepKbd}>
                    {hint.keys.map((k, j) => (
                      <kbd key={j}>{k}</kbd>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.onboardingFooter}>
          <div className={styles.onboardingDots}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`${styles.onboardingDot} ${i === step ? styles.onboardingDotActive : ''}`}
              />
            ))}
          </div>
          <div className={styles.onboardingActions}>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            <Button variant="primary" size="sm" onClick={handleNext}>
              {isLast ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
