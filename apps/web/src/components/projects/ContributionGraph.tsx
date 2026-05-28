'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ContributionGraphProps {
  projectId: string;
}

export default function ContributionGraph({ projectId }: ContributionGraphProps) {
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraph();
  }, [projectId]);

  const fetchGraph = async () => {
    try {
      const res = await api.getContributionGraph(projectId);
      setGraph(res.data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = async () => {
    try {
      await api.logActivity(projectId, { activity_type: 'time_logged', metadata: { hours: 1 } });
      toast.success('Activity logged! 🔥');
      fetchGraph();
    } catch {
      toast.error('Failed to log activity');
    }
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-primary">Contribution Graph</h3>
          {graph && (
            <span className="text-xs text-text-muted">
              {graph.total} contributions in the last year
            </span>
          )}
        </div>
        <button
          onClick={handleLogActivity}
          className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-lg border border-accent/20 hover:bg-accent/20 transition-all"
        >
          + Log Activity
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex gap-1">
            {Array.from({ length: 52 }).map((_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, d) => (
                  <div key={d} className="w-3 h-3 rounded-sm bg-dark-700" />
                ))}
              </div>
            ))}
          </div>
        ) : graph?.weeks ? (
          <div className="flex items-start gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1 pt-5">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div key={i} className="w-8 h-3 text-[10px] text-text-muted leading-3">{d}</div>
              ))}
            </div>

            {/* Month labels */}
            <div>
              <div className="flex gap-1 mb-1">
                {graph.weeks
                  .map((week: any, idx: number) => ({ week, weekIndex: idx }))
                  .filter(({ weekIndex }: { weekIndex: number }) => weekIndex % 4 === 0)
                  .map(({ week, weekIndex }: { week: any; weekIndex: number }) => (
                    <div key={weekIndex} className="text-[10px] text-text-muted" style={{ width: '16px' }}>
                      {monthLabels[Math.floor(weekIndex / 4.3) % 12]}
                    </div>
                  ))}
              </div>

              {/* Graph cells */}
              <div className="flex gap-1">
                {graph.weeks.map((week: any[], wi: number) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((day: any, di: number) => (
                      <div
                        key={di}
                        className={`w-3 h-3 rounded-sm contribution-level-${day.level} transition-colors duration-200 hover:ring-1 hover:ring-accent/50 cursor-pointer`}
                        title={`${day.date}: ${day.count} contributions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted text-sm">
            No contribution data yet. Log your first activity!
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-text-muted mr-1">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`w-3 h-3 rounded-sm contribution-level-${level}`} />
        ))}
        <span className="text-[10px] text-text-muted ml-1">More</span>
      </div>
    </div>
  );
}
