import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EventsTable } from '../components/events/EventsTable';
import type { SecurityEvent } from '../lib/types';

const PAGE_SIZE = 15;

export function EventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filterType !== 'ALL') {
      query = query.eq('event_type', filterType);
    }

    const { data, count, error } = await query;
    if (!error) {
      setEvents((data ?? []) as SecurityEvent[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [page, filterType]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setPage(1);
  };

  return (
    <div className="p-8">
      <EventsTable
        events={events}
        loading={loading}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        filterType={filterType}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
