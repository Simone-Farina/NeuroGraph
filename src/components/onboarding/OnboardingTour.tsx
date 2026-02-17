'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

type OnboardingContextType = {
  startTour: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const driverObj = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = () => {
    const steps: DriveStep[] = [
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: 'Navigation',
          description: 'Access your chats, review sessions, and settings here.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="chat-input"]',
        popover: {
          title: 'Ask Anything',
          description: 'Start a conversation to explore ideas. Paste YouTube links for video context.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="graph-panel"]',
        popover: {
          title: 'Knowledge Graph',
          description: 'Watch your knowledge crystallize into connected nodes as you chat.',
          side: 'left',
          align: 'center',
        },
      },
    ];

    if (document.querySelector('.react-flow__node')) {
      steps.push({
        element: '.react-flow__node',
        popover: {
          title: 'Crystal Node',
          description: 'Click on any node to see details, edit content, or explore connections.',
          side: 'right',
          align: 'center',
        },
      });
    }

    steps.push({
      element: '[data-tour="review-badge"]',
      popover: {
        title: 'Spaced Repetition',
        description: 'Review your crystals to strengthen your memory pathways.',
        side: 'bottom',
        align: 'end',
      },
    });

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: 'Done',
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      steps,
      onDestroyStarted: () => {
        driverInstance.destroy();
        localStorage.setItem('neurograph_tour_completed', 'true');
      },
    });

    driverObj.current = driverInstance;
    driverInstance.drive();
  };

  useEffect(() => {
    const tourCompleted = localStorage.getItem('neurograph_tour_completed');
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <OnboardingContext.Provider value={{ startTour }}>
      {children}
      <style jsx global>{`
        .driver-popover.driverjs-theme {
          background-color: #171717;
          color: #f5f5f5;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
        }
        .driver-popover.driverjs-theme .driver-popover-title {
          font-size: 16px;
          font-weight: 600;
          color: #22d3ee;
          margin-bottom: 8px;
        }
        .driver-popover.driverjs-theme .driver-popover-description {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(245, 245, 245, 0.8);
        }
        .driver-popover.driverjs-theme button {
          background-color: rgba(255, 255, 255, 0.05);
          color: #f5f5f5;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          text-shadow: none;
          transition: all 0.2s;
        }
        .driver-popover.driverjs-theme button:hover {
          background-color: rgba(34, 211, 238, 0.1);
          border-color: rgba(34, 211, 238, 0.3);
          color: #22d3ee;
        }
        .driver-popover.driverjs-theme .driver-popover-navigation-btns {
          justify-content: space-between;
          gap: 8px;
        }
        .driver-popover.driverjs-theme .driver-popover-close-btn {
          color: rgba(245, 245, 245, 0.4);
        }
        .driver-popover.driverjs-theme .driver-popover-close-btn:hover {
          color: #f5f5f5;
        }
        .driver-popover.driverjs-theme .driver-popover-arrow-side-left.driver-popover-arrow {
          border-left-color: #171717;
        }
        .driver-popover.driverjs-theme .driver-popover-arrow-side-right.driver-popover-arrow {
          border-right-color: #171717;
        }
        .driver-popover.driverjs-theme .driver-popover-arrow-side-top.driver-popover-arrow {
          border-top-color: #171717;
        }
        .driver-popover.driverjs-theme .driver-popover-arrow-side-bottom.driver-popover-arrow {
          border-bottom-color: #171717;
        }
      `}</style>
    </OnboardingContext.Provider>
  );
}
