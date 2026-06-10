'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

// Color palette matching the reference styles
const CHART_COLORS = {
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0891B2',
  purple: '#8B5CF6',
  gray: '#64748B',
  teal: '#14B8A6',
};

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.info,
  CHART_COLORS.gray,
  '#EC4899',
  CHART_COLORS.teal,
];

interface BarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
  }[];
  height?: number;
}

interface DonutChartProps {
  labels: string[];
  data: number[];
  height?: number;
}

export function BarChart({ labels, datasets, height = 300 }: BarChartProps) {
  // Transform data format: [{ name: 'Jan', 'Dataset 1': 100, 'Dataset 2': 200 }, ...]
  const chartData = labels.map((label, index) => {
    const item: Record<string, string | number> = { name: label };
    datasets.forEach(ds => {
      item[ds.label] = ds.data[index] !== undefined ? ds.data[index] : 0;
    });
    return item;
  });

  return (
    <div style={{ width: '100%', height }} className="text-[10px] font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'Inter',
              fontSize: '11px',
              borderRadius: '8px',
              border: '1px solid #E2E6EA',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend
            iconSize={10}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter', paddingTop: '10px' }}
          />
          {datasets.map((ds, idx) => (
            <Bar
              key={ds.label}
              dataKey={ds.label}
              fill={ds.backgroundColor || PALETTE[idx % PALETTE.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({ labels, data, height = 240 }: DonutChartProps) {
  const chartData = labels.map((label, index) => ({
    name: label,
    value: data[index] !== undefined ? data[index] : 0,
  }));

  return (
    <div style={{ width: '100%', height }} className="text-[10px] font-sans flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontFamily: 'Inter',
              fontSize: '11px',
              borderRadius: '8px',
              border: '1px solid #E2E6EA',
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconSize={8}
            iconType="circle"
            wrapperStyle={{
              fontSize: '10px',
              fontFamily: 'Inter',
              paddingLeft: '10px',
              lineHeight: '18px',
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
