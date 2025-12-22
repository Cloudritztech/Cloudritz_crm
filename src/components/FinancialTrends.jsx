import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';
import Button from './ui/Button';
import Loading from './ui/Loading';

const FinancialTrends = () => {
  const [period, setPeriod] = useState('monthly');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    fetchTrends();
  }, [period]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getFinancialTrends({ period });
      if (response.data?.success) {
        setTrends(response.data.trends || []);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;
  
  const formatPeriod = (periodStr) => {
    if (period === 'monthly') {
      const [year, month] = periodStr.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short' 
      });
    }
    return periodStr;
  };

  const getMaxValue = () => {
    if (!trends.length) return 100;
    return Math.max(...trends.map(t => Math.max(t.revenue, t.cogs, t.extraExpenses, Math.abs(t.netProfit))));
  };

  const maxValue = getMaxValue();

  if (loading) {
    return <Loading text="Loading financial trends..." />;
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
          Financial Trends
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={period === 'monthly' ? 'primary' : 'outline'}
            size="sm"
            icon={Calendar}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={period === 'yearly' ? 'primary' : 'outline'}
            size="sm"
            icon={TrendingUp}
            onClick={() => setPeriod('yearly')}
          >
            Yearly
          </Button>
          <Button
            variant={chartType === 'line' ? 'primary' : 'outline'}
            size="sm"
            icon={TrendingUp}
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'primary' : 'outline'}
            size="sm"
            icon={BarChart3}
            onClick={() => setChartType('bar')}
          >
            Bar
          </Button>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No financial data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <svg width="100%" height="400" viewBox="0 0 800 400" className="overflow-visible">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <g key={i}>
                  <line
                    x1="60"
                    y1={60 + (i * 70)}
                    x2="740"
                    y2={60 + (i * 70)}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x="50"
                    y={65 + (i * 70)}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {formatCurrency(maxValue - (i * maxValue / 4))}
                  </text>
                </g>
              ))}

              {/* X-axis labels */}
              {trends.map((trend, index) => (
                <text
                  key={index}
                  x={80 + (index * (660 / (trends.length - 1 || 1)))}
                  y="380"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {formatPeriod(trend.period)}
                </text>
              ))}

              {chartType === 'line' ? (
                // Line Chart
                <>
                  {/* Revenue Line */}
                  <polyline
                    points={trends.map((trend, index) => 
                      `${80 + (index * (660 / (trends.length - 1 || 1)))},${340 - (trend.revenue / maxValue * 280)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                  />
                  
                  {/* COGS Line */}
                  <polyline
                    points={trends.map((trend, index) => 
                      `${80 + (index * (660 / (trends.length - 1 || 1)))},${340 - (trend.cogs / maxValue * 280)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                  />
                  
                  {/* Expenses Line */}
                  <polyline
                    points={trends.map((trend, index) => 
                      `${80 + (index * (660 / (trends.length - 1 || 1)))},${340 - (trend.extraExpenses / maxValue * 280)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                  />
                  
                  {/* Net Profit Line */}
                  <polyline
                    points={trends.map((trend, index) => 
                      `${80 + (index * (660 / (trends.length - 1 || 1)))},${340 - (Math.max(0, trend.netProfit) / maxValue * 280)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />

                  {/* Data points */}
                  {trends.map((trend, index) => {
                    const x = 80 + (index * (660 / (trends.length - 1 || 1)));
                    return (
                      <g key={index}>
                        <circle cx={x} cy={340 - (trend.revenue / maxValue * 280)} r="4" fill="#22c55e" />
                        <circle cx={x} cy={340 - (trend.cogs / maxValue * 280)} r="4" fill="#f97316" />
                        <circle cx={x} cy={340 - (trend.extraExpenses / maxValue * 280)} r="4" fill="#ef4444" />
                        <circle cx={x} cy={340 - (Math.max(0, trend.netProfit) / maxValue * 280)} r="4" fill={trend.netProfit >= 0 ? '#3b82f6' : '#ef4444'} />
                      </g>
                    );
                  })}
                </>
              ) : (
                // Bar Chart
                trends.map((trend, index) => {
                  const x = 80 + (index * (660 / trends.length));
                  const barWidth = Math.min(40, 660 / trends.length - 10);
                  
                  return (
                    <g key={index}>
                      {/* Revenue Bar */}
                      <rect
                        x={x - barWidth * 1.5}
                        y={340 - (trend.revenue / maxValue * 280)}
                        width={barWidth * 0.7}
                        height={trend.revenue / maxValue * 280}
                        fill="#22c55e"
                        opacity="0.8"
                      />
                      
                      {/* COGS Bar */}
                      <rect
                        x={x - barWidth * 0.5}
                        y={340 - (trend.cogs / maxValue * 280)}
                        width={barWidth * 0.7}
                        height={trend.cogs / maxValue * 280}
                        fill="#f97316"
                        opacity="0.8"
                      />
                      
                      {/* Expenses Bar */}
                      <rect
                        x={x + barWidth * 0.5}
                        y={340 - (trend.extraExpenses / maxValue * 280)}
                        width={barWidth * 0.7}
                        height={trend.extraExpenses / maxValue * 280}
                        fill="#ef4444"
                        opacity="0.8"
                      />
                      
                      {/* Net Profit Bar */}
                      <rect
                        x={x + barWidth * 1.5}
                        y={340 - (Math.max(0, trend.netProfit) / maxValue * 280)}
                        width={barWidth * 0.7}
                        height={Math.max(0, trend.netProfit) / maxValue * 280}
                        fill={trend.netProfit >= 0 ? '#3b82f6' : '#ef4444'}
                        opacity="0.8"
                      />
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">COGS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Expenses</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Net Profit</span>
            </div>
          </div>

          {/* Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 font-medium text-gray-900 dark:text-gray-100">Period</th>
                  <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Revenue</th>
                  <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">COGS</th>
                  <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Expenses</th>
                  <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Net Profit</th>
                  <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Margin</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((trend, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-900 dark:text-gray-100">{formatPeriod(trend.period)}</td>
                    <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(trend.revenue)}</td>
                    <td className="py-2 text-right text-orange-600">{formatCurrency(trend.cogs)}</td>
                    <td className="py-2 text-right text-red-600">{formatCurrency(trend.extraExpenses)}</td>
                    <td className={`py-2 text-right font-medium ${trend.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(trend.netProfit)}
                    </td>
                    <td className={`py-2 text-right text-sm ${trend.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {trend.revenue > 0 ? ((trend.netProfit / trend.revenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialTrends;