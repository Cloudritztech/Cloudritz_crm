import React, { useState, useEffect } from 'react';
import { Calculator, Percent, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { calculateInvoice, formatCurrency, GST_RATE } from '../utils/gstCalculator';

const InvoiceGSTCalculator = ({ items = [], onChange }) => {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstCompensated, setGstCompensated] = useState(false);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [calculations, setCalculations] = useState({});

  // Recalculate whenever inputs change
  useEffect(() => {
    const result = calculateInvoice(items, gstEnabled, gstCompensated, manualDiscount);
    setCalculations(result);
    
    // Pass data to parent component
    if (onChange) {
      onChange({
        ...result,
        gstEnabled,
        gstCompensated,
        manualDiscount
      });
    }
  }, [items, gstEnabled, gstCompensated, manualDiscount]);

  const handleGstToggle = () => {
    const newGstEnabled = !gstEnabled;
    setGstEnabled(newGstEnabled);
    
    // If disabling GST, also disable compensation
    if (!newGstEnabled) {
      setGstCompensated(false);
    }
  };

  const handleCompensationToggle = () => {
    if (!gstEnabled) return; // Can't compensate if GST not enabled
    setGstCompensated(!gstCompensated);
  };

  return (
    <div className="space-y-6">
      {/* GST Controls */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-blue-600" />
          GST & Discount Controls
        </h3>

        <div className="space-y-4">
          {/* Apply GST Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Apply GST (18%)</p>
              <p className="text-sm text-gray-600">CGST 9% + SGST 9%</p>
            </div>
            <button
              onClick={handleGstToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                gstEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {gstEnabled ? (
                <>
                  <ToggleRight className="h-5 w-5" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-5 w-5" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>

          {/* Compensate GST Toggle (only if GST enabled) */}
          {gstEnabled && (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Compensate GST with Discount</p>
                <p className="text-sm text-gray-600">
                  Auto-discount of {formatCurrency(calculations.totalGst || 0)} to keep total same
                </p>
              </div>
              <button
                onClick={handleCompensationToggle}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  gstCompensated
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {gstCompensated ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    <span>ON</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    <span>OFF</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Discount Input */}
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual Discount (₹)
            </label>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualDiscount}
                onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter discount amount"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
        
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">Subtotal (Taxable Value)</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(calculations.subtotal || 0)}
            </span>
          </div>

          {/* GST Breakdown (only if enabled) */}
          {gstEnabled && (
            <>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-gray-600">CGST @ {GST_RATE.CGST}%</span>
                <span className="text-gray-900">
                  {formatCurrency(calculations.cgst || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-gray-600">SGST @ {GST_RATE.SGST}%</span>
                <span className="text-gray-900">
                  {formatCurrency(calculations.sgst || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Total GST</span>
                <span className="font-semibold text-green-600">
                  + {formatCurrency(calculations.totalGst || 0)}
                </span>
              </div>
            </>
          )}

          {/* Discount Breakdown */}
          {(manualDiscount > 0 || calculations.autoDiscount > 0) && (
            <>
              {manualDiscount > 0 && (
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">Manual Discount</span>
                  <span className="text-red-600">
                    - {formatCurrency(manualDiscount)}
                  </span>
                </div>
              )}
              {calculations.autoDiscount > 0 && (
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">Auto Discount (GST Compensation)</span>
                  <span className="text-red-600">
                    - {formatCurrency(calculations.autoDiscount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Total Discount</span>
                <span className="font-semibold text-red-600">
                  - {formatCurrency(calculations.totalDiscount || 0)}
                </span>
              </div>
            </>
          )}

          {/* Final Total */}
          <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4 mt-4">
            <span className="text-lg font-bold text-gray-900">Final Total</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(calculations.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Calculation Formula Info */}
      <div className="card bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Calculation Formula:</h4>
        <div className="text-xs text-gray-600 space-y-1 font-mono">
          <p>Subtotal = Σ(Item Quantity × Item Price)</p>
          {gstEnabled && (
            <>
              <p>CGST = Subtotal × 9%</p>
              <p>SGST = Subtotal × 9%</p>
              <p>Total GST = CGST + SGST</p>
            </>
          )}
          {gstCompensated && (
            <p>Auto Discount = Total GST (to compensate)</p>
          )}
          <p className="font-bold text-gray-900 mt-2">
            Final Total = Subtotal + Total GST - Total Discount
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGSTCalculator;