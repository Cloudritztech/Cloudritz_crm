import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import FinancialTrends from '../components/FinancialTrends';

const FinancialTrendsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/')}
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Trends</h1>
          <p className="text-gray-600">Monthly and yearly financial performance analysis</p>
        </div>
      </div>

      {/* Financial Trends Component */}
      <FinancialTrends />
    </div>
  );
};

export default FinancialTrendsPage;