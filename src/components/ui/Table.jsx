import React, { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';

const Table = ({ children, className, ...props }) => (
  <div className={clsx('table-container', className)} {...props}>
    <div className="mobile-scroll">
      <table className="min-w-full divide-y divide-secondary-200">
        {children}
      </table>
    </div>
  </div>
);

const TableHeader = ({ children, className, ...props }) => (
  <thead className={clsx('bg-secondary-50', className)} {...props}>
    {children}
  </thead>
);

const TableBody = ({ children, className, ...props }) => (
  <tbody className={clsx('bg-white divide-y divide-secondary-100', className)} {...props}>
    {children}
  </tbody>
);

const TableRow = ({ children, className, clickable = false, onClick, ...props }) => (
  <tr 
    className={clsx(
      'table-row',
      clickable && 'cursor-pointer',
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </tr>
);

const TableHead = ({ 
  children, 
  className, 
  sortable = false, 
  sortDirection,
  onSort,
  ...props 
}) => (
  <th 
    className={clsx(
      'table-cell font-semibold text-secondary-900 text-left',
      sortable && 'cursor-pointer hover:bg-secondary-100 select-none',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center space-x-1">
      <span>{children}</span>
      {sortable && (
        <div className="flex flex-col">
          <ChevronUp className={clsx(
            'h-3 w-3',
            sortDirection === 'asc' ? 'text-primary-600' : 'text-secondary-400'
          )} />
          <ChevronDown className={clsx(
            'h-3 w-3 -mt-1',
            sortDirection === 'desc' ? 'text-primary-600' : 'text-secondary-400'
          )} />
        </div>
      )}
    </div>
  </th>
);

const TableCell = ({ children, className, ...props }) => (
  <td className={clsx('table-cell', className)} {...props}>
    {children}
  </td>
);

// Mobile-optimized responsive table
const ResponsiveTable = ({ 
  data = [], 
  columns = [], 
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  className 
}) => {
  if (loading) {
    return (
      <div className={clsx('table-container', className)}>
        <div className="p-8 text-center">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-secondary-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={clsx('table-container', className)}>
        <div className="p-8 text-center">
          <p className="text-secondary-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table className={className}>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  sortable={column.sortable}
                  sortDirection={column.sortDirection}
                  onSort={column.onSort}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                clickable={!!onRowClick}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.render ? column.render(row, rowIndex) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <div 
            key={index}
            className={clsx(
              'card-compact',
              onRowClick && 'cursor-pointer hover:shadow-medium'
            )}
            onClick={() => onRowClick?.(row, index)}
          >
            {columns.map((column, colIndex) => {
              if (column.hideOnMobile) return null;
              
              return (
                <div key={colIndex} className={clsx(
                  'flex justify-between items-center',
                  colIndex > 0 && 'mt-3 pt-3 border-t border-secondary-100'
                )}>
                  <span className="text-sm font-medium text-secondary-600">
                    {column.header}
                  </span>
                  <span className="text-sm text-secondary-900 text-right">
                    {column.render ? column.render(row, index) : row[column.key]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

// Status badge component for tables
export const StatusBadge = ({ status, variant }) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    secondary: 'badge-secondary',
  };

  const statusVariants = {
    active: 'success',
    inactive: 'secondary',
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
    paid: 'success',
    unpaid: 'danger',
    draft: 'secondary',
  };

  const badgeVariant = variant || statusVariants[status?.toLowerCase()] || 'secondary';

  return (
    <span className={variants[badgeVariant]}>
      {status}
    </span>
  );
};

// Action menu for table rows
export const TableActions = ({ actions = [], row, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-lg hover:bg-secondary-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4 text-secondary-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl shadow-strong border border-secondary-200 py-2">
            {actions.map((action, actionIndex) => (
              <button
                key={actionIndex}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(row, index);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center px-4 py-2 text-sm text-left transition-colors',
                  action.variant === 'danger' 
                    ? 'text-danger-600 hover:bg-danger-50' 
                    : 'text-secondary-700 hover:bg-secondary-50'
                )}
              >
                {action.icon && (
                  <action.icon className="mr-3 h-4 w-4" />
                )}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ResponsiveTable
};

export default Table;