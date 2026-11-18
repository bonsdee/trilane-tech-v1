import { useEffect, useState } from 'react';
import { prefersReducedMotion, useInView } from '../hooks/useInView';

/**
 * Counts every number inside `value` up from zero the first time it scrolls
 * into view, e.g. "10–14" or "$95". Screen readers get the final value.
 */
export default function CountUp({ value, duration = 1400, className }) {
  const [ref, inView] = useInView({ threshold: 0.6 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (prefersReducedMotion()) {
      setProgress(1);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - t, 3)); // ease-out
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, duration]);

  const shown = value.replace(/\d+/g, (n) => String(Math.round(Number(n) * progress)));
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="visually-hidden">{value}</span>
    </span>
  );
}
