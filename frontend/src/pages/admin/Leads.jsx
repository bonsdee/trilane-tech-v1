import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { exportLeads, listLeads } from '../../api/leads';
import { listServices } from '../../api/services';
import { listUsers } from '../../api/users';
import { StatusBadge } from '../../components/Badge';
import Button from '../../components/Button';
import Field, { Checkbox } from '../../components/Field';
import { LoadingBlock } from '../../components/Spinner';
import { EmptyState, ErrorState, Notice } from '../../components/States';
import Table from '../../components/Table';
import { useFetch } from '../../hooks/useFetch';
import { formatDate, formatDateTime, LEAD_STATUSES } from '../../utils/format';
import a from './Admin.module.css';

const FILTER_KEYS = ['q', 'status', 'serviceId', 'assignedTo', 'source', 'from', 'to', 'overdue', 'sort'];
const PAGE_SIZE = 20;

const SORTS = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'createdAt,asc', label: 'Oldest first' },
  { value: 'followUpOn,asc', label: 'Follow-up date' },
  { value: 'fullName,asc', label: 'Name A–Z' },
  { value: 'status,asc', label: 'Status' },
];

export default function Leads() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const page = Math.max(0, Number(params.get('page') || 0));
  const [search, setSearch] = useState(filters.q);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  // On phones the filters start folded away so the leads are visible first.
  const [filtersOpen, setFiltersOpen] = useState(() => !window.matchMedia?.('(max-width: 700px)').matches);

  const services = useFetch(listServices, []);
  const users = useFetch(listUsers, []);
  const apiParams = { ...filters, overdue: filters.overdue === 'true', page, size: PAGE_SIZE };
  const { data, loading, error, reload } = useFetch(() => listLeads(apiParams), [params.toString()]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  };

  // Search after the person stops typing for a moment.
  useEffect(() => {
    if (search === filters.q) return undefined;
    const id = setTimeout(() => setFilter('q', search.trim()), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const goToPage = (p) => {
    const next = new URLSearchParams(params);
    if (p > 0) next.set('page', String(p));
    else next.delete('page');
    setParams(next);
  };

  const hasFilters = FILTER_KEYS.some((k) => k !== 'sort' && filters[k]);
  const meta = data?.meta;
  const leads = data?.data || [];

  const doExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await exportLeads({ ...filters, overdue: filters.overdue === 'true' });
    } catch (e) {
      setExportError(errorMessage(e, 'The export could not be created.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Leads</h1>
          <p className={a.pageIntro}>{meta ? `${meta.totalElements} ${meta.totalElements === 1 ? 'lead' : 'leads'}${hasFilters ? ' match these filters' : ''}` : ' '}</p>
        </div>
        <div className={a.toolbarActions}>
          <Button variant="secondary" onClick={doExport} loading={exporting} disabled={!meta || meta.totalElements === 0}>
            Export CSV
          </Button>
        </div>
      </div>
      {exportError && <Notice tone="danger">{exportError}</Notice>}

      <div className={a.filterToggle}>
        <Button variant="secondary" size="sm" aria-expanded={filtersOpen} aria-controls="lead-filters" onClick={() => setFiltersOpen((o) => !o)}>
          {filtersOpen ? 'Hide filters' : `Filters${hasFilters ? ' (on)' : ''}`}
        </Button>
      </div>
      <form id="lead-filters" className={a.toolbar} role="search" onSubmit={(e) => e.preventDefault()} hidden={!filtersOpen}>
        <Field className={a.toolbarWide} label="Search" type="search" placeholder="Name, email, company or message" value={search} onChange={(e) => setSearch(e.target.value)} optionalLabel={false} />
        <Field as="select" label="Status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} optionalLabel={false}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Field>
        <Field as="select" label="Service" value={filters.serviceId} onChange={(e) => setFilter('serviceId', e.target.value)} optionalLabel={false}>
          <option value="">All services</option>
          <option value="none">Not specified</option>
          {(services.data || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Field>
        <Field as="select" label="Assigned to" value={filters.assignedTo} onChange={(e) => setFilter('assignedTo', e.target.value)} optionalLabel={false}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {(users.data || []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </Field>
        <Field label="Source" placeholder="e.g. google.com, direct" value={filters.source} onChange={(e) => setFilter('source', e.target.value.trim())} optionalLabel={false} />
        <Field label="From" type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} optionalLabel={false} />
        <Field label="To" type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} optionalLabel={false} />
        <Field as="select" label="Sort by" value={filters.sort || 'createdAt,desc'} onChange={(e) => setFilter('sort', e.target.value === 'createdAt,desc' ? '' : e.target.value)} optionalLabel={false}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Field>
        <div className={a.toolbarActions}>
          <Checkbox label="Overdue only" checked={filters.overdue === 'true'} onChange={(e) => setFilter('overdue', e.target.checked ? 'true' : '')} />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setParams(filters.sort ? { sort: filters.sort } : {}, { replace: true });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </form>

      {loading && !data && <LoadingBlock label="Loading leads…" />}
      {error && <ErrorState error={error} onRetry={reload} title="Leads could not load." />}
      {!error && data && leads.length === 0 && (
        <EmptyState title={hasFilters ? 'No leads match these filters.' : 'No leads yet.'}>
          {hasFilters ? 'Try removing a filter.' : 'Leads appear here when someone sends the contact form.'}
        </EmptyState>
      )}
      {!error && leads.length > 0 && (
        <>
          <Table caption="Leads">
            <thead>
              <tr>
                <th scope="col">Lead</th>
                <th scope="col">Service</th>
                <th scope="col">Status</th>
                <th scope="col">Assigned to</th>
                <th scope="col">Follow-up</th>
                <th scope="col">Source</th>
                <th scope="col">Received</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1 }}>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link to={`/admin/leads/${lead.id}`} className={a.cellMain}>
                      {lead.fullName}
                    </Link>
                    <div className={a.cellSub}>{lead.company || lead.email}</div>
                  </td>
                  <td>{lead.serviceName || <span className={a.cellSub}>Not specified</span>}</td>
                  <td>
                    <StatusBadge status={lead.status} label={lead.statusLabel} />
                  </td>
                  <td>{lead.assignedToName || <span className={a.cellSub}>Unassigned</span>}</td>
                  <td className={lead.overdue ? a.overdue : undefined}>
                    {lead.followUpOn ? `${formatDate(lead.followUpOn)}${lead.overdue ? ' (overdue)' : ''}` : '—'}
                  </td>
                  <td>{lead.source}</td>
                  <td className={a.cellSub}>{formatDateTime(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {meta && meta.totalPages > 1 && (
            <nav className={a.pagination} aria-label="Pages">
              <span>
                Page {meta.page + 1} of {meta.totalPages}
              </span>
              <div className={a.toolbarActions}>
                <Button variant="secondary" size="sm" disabled={meta.page === 0} onClick={() => goToPage(meta.page - 1)}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={meta.page + 1 >= meta.totalPages} onClick={() => goToPage(meta.page + 1)}>
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </>
  );
}
