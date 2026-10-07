import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CommunityPoll, PollOption } from '../../types';
import { PieChart, BarChart2, CheckCircle2, Users, Award } from 'lucide-react';

interface PollD3ChartProps {
  poll: CommunityPoll;
  userVotedOptionId?: string;
}

export const PollD3Chart: React.FC<PollD3ChartProps> = ({ poll, userVotedOptionId }) => {
  const [chartType, setChartType] = useState<'donut' | 'bars'>('donut');
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const totalVotes = Math.max(0, poll.totalVotes);
  const quorumPercent = Math.min(100, Math.round((totalVotes / (poll.quorumTarget || 60)) * 100));
  const isQuorumMet = totalVotes >= poll.quorumTarget;

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 420;
    const height = chartType === 'donut' ? 260 : Math.max(220, poll.options.length * 52 + 50);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (totalVotes === 0) {
      // Empty state
      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      g.append('circle')
        .attr('r', 60)
        .attr('fill', 'none')
        .attr('stroke', '#E2E8F0')
        .attr('stroke-width', 16)
        .attr('stroke-dasharray', '4 4');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('class', 'text-xs font-semibold fill-slate-400')
        .text('No Votes Cast Yet');
      return;
    }

    if (chartType === 'donut') {
      const radius = Math.min(width, height) / 2 - 16;
      const innerRadius = radius * 0.58;

      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

      const pie = d3
        .pie<PollOption>()
        .value((d) => d.votes)
        .sort(null)
        .padAngle(0.03);

      const arc = d3
        .arc<d3.PieArcDatum<PollOption>>()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .cornerRadius(6);

      const hoverArc = d3
        .arc<d3.PieArcDatum<PollOption>>()
        .innerRadius(innerRadius - 2)
        .outerRadius(radius + 7)
        .cornerRadius(7);

      const arcs = g
        .selectAll('.arc')
        .data(pie(poll.options))
        .enter()
        .append('g')
        .attr('class', 'arc cursor-pointer');

      // Animated slice path
      arcs
        .append('path')
        .attr('d', arc)
        .attr('fill', (d) => d.data.color || '#0d9488')
        .attr('opacity', (d) => {
          if (!hoveredOptionId) return 0.95;
          return d.data.id === hoveredOptionId ? 1 : 0.45;
        })
        .attr('stroke', (d) => (d.data.id === userVotedOptionId ? '#0F172A' : '#FFFFFF'))
        .attr('stroke-width', (d) => (d.data.id === userVotedOptionId ? 3 : 2))
        .on('mouseenter', (_, d) => setHoveredOptionId(d.data.id))
        .on('mouseleave', () => setHoveredOptionId(null))
        .transition()
        .duration(650)
        .attrTween('d', function (d) {
          const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function (t) {
            return arc(interpolate(t)) || '';
          };
        });

      // Hover enlargement
      arcs
        .filter((d) => d.data.id === hoveredOptionId)
        .select('path')
        .transition()
        .duration(200)
        .attr('d', hoverArc as any)
        .attr('opacity', 1);

      // Center Information Group
      const centerG = g.append('g').attr('class', 'center-text');

      centerG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.5em')
        .attr('class', 'font-sans text-[11px] font-bold fill-slate-400 uppercase tracking-wider')
        .text('Total Votes');

      centerG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.65em')
        .attr('class', 'font-mono text-3xl font-black fill-slate-900')
        .text(totalVotes);

      centerG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '2.2em')
        .attr('class', `text-[10px] font-bold ${isQuorumMet ? 'fill-emerald-600' : 'fill-amber-600'}`)
        .text(`${quorumPercent}% Quorum`);
    } else {
      // Horizontal Bars Visualization
      const margin = { top: 20, right: 65, bottom: 20, left: 16 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

      const yScale = d3
        .scaleBand()
        .domain(poll.options.map((d) => d.id))
        .range([0, innerH])
        .padding(0.35);

      const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);
      const xScale = d3.scaleLinear().domain([0, maxVotes]).range([0, innerW]);

      // Background Track
      g.selectAll('.track')
        .data(poll.options)
        .enter()
        .append('rect')
        .attr('class', 'track')
        .attr('y', (d) => yScale(d.id) || 0)
        .attr('x', 0)
        .attr('height', yScale.bandwidth())
        .attr('width', innerW)
        .attr('rx', 6)
        .attr('fill', '#F1F5F9');

      // Animated Fill Bars
      g.selectAll('.bar')
        .data(poll.options)
        .enter()
        .append('rect')
        .attr('class', 'bar cursor-pointer')
        .attr('y', (d) => yScale(d.id) || 0)
        .attr('x', 0)
        .attr('height', yScale.bandwidth())
        .attr('rx', 6)
        .attr('fill', (d) => d.color || '#0d9488')
        .attr('opacity', (d) => {
          if (!hoveredOptionId) return 0.95;
          return d.id === hoveredOptionId ? 1 : 0.45;
        })
        .attr('stroke', (d) => (d.id === userVotedOptionId ? '#0F172A' : 'none'))
        .attr('stroke-width', (d) => (d.id === userVotedOptionId ? 2.5 : 0))
        .on('mouseenter', (_, d) => setHoveredOptionId(d.id))
        .on('mouseleave', () => setHoveredOptionId(null))
        .attr('width', 0)
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr('width', (d) => xScale(d.votes));

      // Bar Value Labels (Votes + Percentage)
      g.selectAll('.value-label')
        .data(poll.options)
        .enter()
        .append('text')
        .attr('class', 'value-label font-mono text-[11px] font-bold fill-slate-800')
        .attr('x', innerW + 10)
        .attr('y', (d) => (yScale(d.id) || 0) + yScale.bandwidth() / 2 + 4)
        .text((d) => {
          const pct = totalVotes > 0 ? Math.round((d.votes / totalVotes) * 100) : 0;
          return `${d.votes} (${pct}%)`;
        });
    }
  }, [poll, chartType, hoveredOptionId, userVotedOptionId, totalVotes, quorumPercent, isQuorumMet]);

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
      {/* Chart Control Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Real-Time D3 Visual Analytics
          </span>
          {isQuorumMet ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
              <Award className="w-3 h-3" />
              <span>Quorum Achieved</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
              {poll.quorumTarget - totalVotes} More Votes to Quorum
            </span>
          )}
        </div>

        {/* Visualization Type Toggle */}
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            onClick={() => setChartType('donut')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              chartType === 'donut'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Switch to Radial Donut Breakdown"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Donut</span>
          </button>
          <button
            onClick={() => setChartType('bars')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              chartType === 'bars'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Switch to Comparative Horizontal Bars"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Bars</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="flex justify-center items-center py-1">
        <svg
          ref={svgRef}
          className="w-full max-w-[420px] overflow-visible drop-shadow-2xs transition-all duration-300"
        />
      </div>

      {/* Dynamic Interactive Legend */}
      <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
        {poll.options.map((opt) => {
          const isVotedByMe = opt.id === userVotedOptionId;
          const isHovered = opt.id === hoveredOptionId;
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

          return (
            <div
              key={opt.id}
              onMouseEnter={() => setHoveredOptionId(opt.id)}
              onMouseLeave={() => setHoveredOptionId(null)}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                isVotedByMe
                  ? 'bg-white border-2 border-teal-600 shadow-xs'
                  : isHovered
                  ? 'bg-white border border-slate-300 shadow-2xs'
                  : 'bg-white/60 hover:bg-white border border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color || '#0d9488' }}
                />
                <span
                  className={`truncate ${
                    isVotedByMe ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                  }`}
                >
                  {opt.label}
                </span>
                {isVotedByMe && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Your Flat's Vote</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                <span className="font-bold text-slate-900">{opt.votes} votes</span>
                <span className="text-[11px] font-semibold text-slate-400 w-10 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
