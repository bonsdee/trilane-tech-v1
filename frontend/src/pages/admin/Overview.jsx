import { Link } from 'react-router-dom';
import { getSummary } from '../../api/dashboard';
import { LoadingBlock } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { formatDate, formatPercent } from '../../utils/format';
import a from './Admin.module.css';
import styles from './Overview.module.css';

function Stat({ label, value, sub, to, tone }) {
  const body = (
    <>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} ${tone === 'danger' ? styles.danger : ''}`}>{value}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </>
  );
  return to ? (
    <Link to={to} className={`${styles.stat} ${styles.statLink}`}>
      {body}
    </Link>
  ) : (
    <div className={styles.stat}>{body}</div>
  );
}

function Bars({ title, items, linkFor }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className={styles.panel}>
      <h2 className={a.sectionTitle}>{title}</h2>
      {items.length === 0 ? (
        <p className={a.muted}>No leads yet.</p>
      ) : (
        <ul className={styles.bars}>
          {items.map((item) => (
            <li key={item.key}>
              <Link to={linkFor(item)} className={styles.barRow}>
                <span className={styles.barLabel}>{item.label}</span>
                <span className={styles.barTrack} aria-hidden="true">
                  <span className={styles.barFill} style={{ width: `${(item.count / max) * 100}%` }} />
                </span>
                <span className={styles.barCount}>{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Overview() {
  const { data, loading, error, reload } = useFetch(getSummary, []);
  if (loading) return <LoadingBlock label="Loading overview…" />;
  if (error) return <ErrorState error={error} onRetry={reload} title="The overview could not load." />;

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Overview</h1>
          <p className={a.pageIntro}>{data.totalLeads} leads in total.</p>
        </div>
      </div>
      <div className={styles.stats}>
        <Stat label="New this week" value={data.newThisWeek} sub={`Since ${formatDate(data.weekStart)}`} to={`/admin/leads?from=${data.weekStart}`} />
        <Stat label="New this month" value={data.newThisMonth} sub={`Since ${formatDate(data.monthStart)}`} to={`/admin/leads?from=${data.monthStart}`} />
        <Stat label="Conversion rate" value={formatPercent(data.conversionRate)} sub={`${data.won} won · ${data.lost} lost`} />
        <Stat label="Overdue follow-ups" value={data.overdueFollowUps} tone={data.overdueFollowUps > 0 ? 'danger' : undefined} to="/admin/leads?overdue=true" />
      </div>

      {data.totalLeads === 0 ? (
        <EmptyState title="No leads yet.">When someone sends the contact form, they'll appear here.</EmptyState>
      ) : (
        <div className={styles.grid}>
          <Bars title="Leads by status" items={data.byStatus} linkFor={(i) => `/admin/leads?status=${i.key}`} />
          <Bars title="Leads by source" items={data.bySource} linkFor={(i) => `/admin/leads?source=${encodeURIComponent(i.key)}`} />
          <Bars title="Leads by service" items={data.byService} linkFor={(i) => `/admin/leads?serviceId=${encodeURIComponent(i.key)}`} />
          <section className={styles.panel}>
            <h2 className={a.sectionTitle}>Overdue follow-ups</h2>
            {data.overdue.length === 0 ? (
              <p className={a.muted}>Nothing overdue. Nice.</p>
            ) : (
              <ul className={styles.overdueList}>
                {data.overdue.map((lead) => (
                  <li key={lead.id}>
                    <Link to={`/admin/leads/${lead.id}`} className={styles.overdueItem}>
                      <span className={a.cellMain}>{lead.fullName}</span>
                      <span className={a.cellSub}>
                        {lead.status} · due {formatDate(lead.followUpOn)}
                        {lead.assignedToName ? ` · ${lead.assignedToName}` : ' · unassigned'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
