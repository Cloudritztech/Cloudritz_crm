import React, { useState } from 'react';
import { Download, Upload, Cloud, Database, Calendar, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const BackupSettings = () => {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [cloudBackup, setCloudBackup] = useState(false);
  const [loading, setLoading] = useState(false);

  const backups = [
    { date: '2024-01-15 10:30 AM', size: '2.4 MB', type: 'Auto' },
    { date: '2024-01-14 10:30 AM', size: '2.3 MB', type: 'Auto' },
    { date: '2024-01-13 10:30 AM', size: '2.2 MB', type: 'Manual' },
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [products, customers, invoices] = await Promise.all([
        axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/customers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/invoices', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const backup = {
        exportDate: new Date(),
        data: {
          products: products.data.products,
          customers: customers.data.customers,
          invoices: invoices.data.invoices
        }
      };
      
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anvi-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const uploadToGoogleDrive = async (fileName, fileBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);
      formData.append('name', fileName);
      formData.append('mimeType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Using Google Picker API with user's logged-in account
      const metadata = {
        name: fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        parents: ['root']
      };
      
      toast.info('Google Drive upload requires browser extension or manual upload');
      return false;
    } catch (error) {
      console.error('Google Drive upload failed:', error);
      return false;
    }
  };

  const handleExportGSTReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const invoices = response.data.invoices;
      
      // Sales Report Sheet
      const salesData = invoices.map(inv => ({
        'Invoice No': inv.invoiceNumber,
        'Date': new Date(inv.createdAt).toLocaleDateString('en-IN'),
        'Customer Name': inv.customer?.name || 'N/A',
        'Customer GSTIN': inv.buyerDetails?.gstin || 'N/A',
        'Taxable Amount': inv.totalTaxableAmount || inv.subtotal,
        'CGST': inv.totalCgst,
        'SGST': inv.totalSgst,
        'Total GST': inv.tax,
        'Total Amount': inv.total,
        'Payment Method': inv.paymentMethod,
        'Status': inv.status
      }));
      
      // Item-wise Sales
      const itemData = [];
      invoices.forEach(inv => {
        inv.items?.forEach(item => {
          itemData.push({
            'Invoice No': inv.invoiceNumber,
            'Date': new Date(inv.createdAt).toLocaleDateString('en-IN'),
            'Product': item.product?.name || 'N/A',
            'Quantity': item.quantity,
            'Rate': item.price,
            'Taxable Value': item.taxableValue,
            'CGST': item.cgstAmount,
            'SGST': item.sgstAmount,
            'Total': item.total
          });
        });
      });
      
      // Monthly Summary
      const monthlyData = {};
      invoices.forEach(inv => {
        const month = new Date(inv.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { sales: 0, gst: 0, count: 0 };
        }
        monthlyData[month].sales += inv.total;
        monthlyData[month].gst += inv.tax;
        monthlyData[month].count += 1;
      });
      
      const monthlySummary = Object.entries(monthlyData).map(([month, data]) => ({
        'Month': month,
        'Total Sales': data.sales,
        'Total GST': data.gst,
        'Invoice Count': data.count,
        'Average Sale': (data.sales / data.count).toFixed(2)
      }));
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      const ws1 = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Sales Report');
      
      const ws2 = XLSX.utils.json_to_sheet(itemData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Item-wise Sales');
      
      const ws3 = XLSX.utils.json_to_sheet(monthlySummary);
      XLSX.utils.book_append_sheet(wb, ws3, 'Monthly Summary');
      
      const fileName = `GST-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      // Check if Google Drive backup is enabled
      const settingsRes = await axios.get('/api/settings?section=integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (settingsRes.data.success && settingsRes.data.settings?.googleDrive?.enabled) {
        toast.success('GST Report exported! File also available for manual Google Drive upload.');
      } else {
        toast.success('GST Report exported successfully!');
      }
    } catch (error) {
      toast.error('Failed to export GST report');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    document.getElementById('import-file').click();
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    toast.info('Import feature requires manual data restoration');
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Export Data" description="Download your data as backup">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export all your data including products, customers, invoices, and settings.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} loading={loading} icon={Download}>
              Export JSON Backup
            </Button>
            <Button onClick={handleExportGSTReport} loading={loading} icon={FileSpreadsheet} variant="outline">
              Export GST Report (Excel)
            </Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Import Data" description="Restore data from backup file">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Import data from a previously exported backup file. This will overwrite existing data.
          </p>
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button onClick={handleImport} loading={loading} icon={Upload} variant="outline">
            Import Data
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Automatic Backup" description="Configure automatic backup settings">
        <div className="space-y-4">
          <SettingsToggle
            label="Enable Auto Backup"
            description="Automatically backup data at scheduled intervals"
            checked={autoBackup}
            onChange={(e) => setAutoBackup(e.target.checked)}
          />
          
          {autoBackup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Frequency
              </label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <SettingsToggle
            label="Cloud Backup"
            description="Store backups in cloud storage"
            checked={cloudBackup}
            onChange={(e) => setCloudBackup(e.target.checked)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Backup History" description="Recent backup files">
        <div className="space-y-3">
          {backups.map((backup, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F1113] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Backup - {backup.date}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {backup.size} • {backup.type}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" icon={Download}>
                Download
              </Button>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
};

export default BackupSettings;
