import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter } from 'lucide-react';

interface DashboardFiltersProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onExport: () => void;
}

export function DashboardFilters({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onExport
}: DashboardFiltersProps) {
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filtros:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={selectedMonth.toString()} onValueChange={(value) => onMonthChange(parseInt(value))}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-4 w-px bg-gray-300" />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExport}
        className="flex items-center gap-2 h-8 px-3 text-sm"
      >
        <Download className="h-3 w-3" />
        Exportar
      </Button>
    </div>
  );
}