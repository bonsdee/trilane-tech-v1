import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useInView';
import styles from './LeadFlowDemo.module.css';

const STEP_MS = 3400;
const HOLD_LAST_MS = 5200;

// An example of how one inquiry can move from the contact form to a won client.
// Steps 2 and 3 are what this website does on its own; the rest is the
// operations support the team offers.
const STEPS = [
  { title: 'An inquiry comes in', text: 'A visitor fills in the contact form on your site and picks what they need.' },
  { title: 'They hear back right away', text: 'An automatic note confirms the message arrived, so nobody wonders.' },
  { title: 'Your team is told', text: 'The inquiry lands in your inbox with the service and where the visitor came from.' },
  { title: 'Sorted and answered', text: 'The lead is checked for fit and a first reply is drafted for you to send.' },
  { title: 'A call gets booked', text: 'If it is a good fit, a time is agreed and goes on the calendar.' },
  { title: 'Nobody slips through', text: 'Follow-ups are lined up, so a quiet lead still gets a second message.' },
  { title: 'The pipeline stays current', text: 'Each change is logged, all the way to a won client.' },
];

function Panel({ index, active, children }) {
  return (
    <div className={`${styles.panel} ${active ? styles.on : ''}`} data-step={index} aria-hidden="true">
      {children}
    </div>
  );
}

function Lines({ widths }) {
  return widths.map((w, i) => <span key={i} className={styles.textLine} style={{ width: w }} />);
}

/**
 * An animated walkthrough of what happens after someone gets in touch. Plays on
 * its own while on screen, pauses on hover or focus, and every step can be
 * opened by hand. With reduced motion it does not play by itself.
 */
export default function LeadFlowDemo() {
  const rootRef = useRef(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false); // Pointer or keyboard focus inside.
  const running = playing && visible && !held;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const last = step === STEPS.length - 1;
    const timer = window.setTimeout(() => setStep(last ? 0 : step + 1), last ? HOLD_LAST_MS : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [running, step]);

  const choose = useCallback((i) => {
    setStep(i);
    setPlaying(false);
  }, []);

  const replay = () => {
    setStep(0);
    setPlaying(true);
  };

  const onBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
  };

  return (
    <div
      ref={rootRef}
      className={styles.demo}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={onBlur}
    >
      <div className={styles.side}>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => {
            const state = i === step ? styles.current : i < step ? styles.done : '';
            return (
              <li key={s.title}>
                <button
                  type="button"
                  className={`${styles.step} ${state}`}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => choose(i)}
                >
                  <span className={styles.stepDot} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.stepBody}>
                    <span className={styles.stepTitle}>{s.title}</span>
                    <span className={styles.stepText}>{s.text}</span>
                    {i === step && (
                      <span
                        key={`${step}-${running}`}
                        className={styles.progress}
                        style={{
                          '--ms': `${i === STEPS.length - 1 ? HOLD_LAST_MS : STEP_MS}ms`,
                          animationPlayState: running ? 'running' : 'paused',
                          visibility: playing ? 'visible' : 'hidden',
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 3.5v9M11 3.5v9" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 3.2v9.6L12.5 8z" className={styles.solid} />
              </svg>
            )}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className={styles.control} onClick={replay}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" />
            </svg>
            Replay
          </button>
          <span className={styles.counter} aria-live="off">
            {step + 1} / {STEPS.length}
          </span>
        </div>
      </div>

      <div className={styles.stage}>
        <span className={styles.example}>Example</span>

        <Panel index={0} active={step === 0}>
          <div className={`${styles.window} ${styles.form}`}>
            <p className={styles.windowTitle}>Get in touch</p>
            <span className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <span className={styles.typing} />
            </span>
            <span className={styles.field}>
              <span className={styles.fieldLabel}>I need</span>
              <span className={styles.select}>Launch Bundle</span>
            </span>
            <span className={`${styles.field} ${styles.fieldTall}`}>
              <span className={styles.fieldLabel}>Message</span>
              <Lines widths={['90%', '72%']} />
            </span>
            <span className={styles.send}>Send message</span>
            <span className={styles.cursor} />
          </div>
        </Panel>

        <Panel index={1} active={step === 1}>
          <div className={`${styles.window} ${styles.mail}`}>
            <div className={styles.mailHead}>
              <span className={styles.avatar}>T</span>
              <span>
                <strong>Thanks, we got your message</strong>
                <span className={styles.meta}>Sent automatically</span>
              </span>
              <span className={styles.check}>✓</span>
            </div>
            <Lines widths={['94%', '88%', '60%']} />
          </div>
        </Panel>

        <Panel index={2} active={step === 2}>
          <div className={styles.toast}>
            <span className={styles.toastIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4" />
              </svg>
            </span>
            <span>
              <strong>New inquiry</strong>
              <span className={styles.meta}>Launch Bundle · from Google search</span>
            </span>
          </div>
          <div className={`${styles.window} ${styles.inbox}`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`${styles.inboxRow} ${i === 0 ? styles.inboxNew : ''}`}>
                <span className={styles.inboxDot} />
                <Lines widths={[i === 0 ? '46%' : '38%']} />
              </span>
            ))}
          </div>
        </Panel>

        <Panel index={3} active={step === 3}>
          <div className={`${styles.window} ${styles.triage}`}>
            <div className={styles.tags}>
              <span className={styles.tag}>Good fit</span>
              <span className={styles.tag}>Budget shared</span>
              <span className={styles.tag}>Wants a call</span>
            </div>
            <p className={styles.draftLabel}>Draft reply</p>
            <Lines widths={['92%', '84%', '66%']} />
          </div>
        </Panel>

        <Panel index={4} active={step === 4}>
          <div className={`${styles.window} ${styles.calendar}`}>
            <div className={styles.calHead}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className={styles.calGrid}>
              {/* 14 open or busy slots; the booked call fills the fifteenth. */}
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className={`${styles.slot} ${[1, 5, 11].includes(i) ? styles.busy : ''}`} />
              ))}
              <span className={styles.booked}>Intro call</span>
            </div>
          </div>
        </Panel>

        <Panel index={5} active={step === 5}>
          <div className={`${styles.window} ${styles.sequence}`}>
            {['First reply', 'Follow-up', 'Second follow-up'].map((label, i) => (
              <span key={label} className={styles.seqRow} style={{ '--d': `${i * 380}ms` }}>
                <span className={styles.seqMark} />
                <span className={styles.seqLabel}>{label}</span>
                <span className={styles.seqState}>{i === 0 ? 'Sent' : 'Scheduled'}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel index={6} active={step === 6}>
          <div className={`${styles.window} ${styles.board}`}>
            {['New', 'Contacted', 'Call booked', 'Won'].map((col) => (
              <span key={col} className={styles.column}>
                <span className={styles.columnName}>{col}</span>
                <span className={styles.ghost} />
              </span>
            ))}
            <span className={styles.card}>
              <span className={styles.cardLine} />
              <span className={`${styles.cardLine} ${styles.cardLineShort}`} />
              <span className={styles.cardCheck}>✓</span>
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
