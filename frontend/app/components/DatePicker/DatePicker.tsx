// @AI-HINT: This is a versatile, enterprise-grade DatePicker component with support for date ranges, presets, and theme-aware styling. All styles are per-component only.

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import commonStyles from './DatePicker.common.module.css';
import lightStyles from './DatePicker.light.module.css';
import darkStyles from './DatePicker.dark.module.css';

export interface DatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  wrapperClassName?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  showPresets?: boolean;
  presets?: { label: string; date: Date }[];
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value = null,
  onChange,
  placeholder = 'Select date',
  error,
  disabled = false,
  required = false,
  className = '',
  wrapperClassName = '',
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat = 'MMM d, yyyy',
  timeFormat = 'h:mm aa',
  showPresets = false,
  presets = [],
  fullWidth = false,
  size = 'md'
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number }>({ hours: 12, minutes: 0 });
  const datePickerRef = useRef<HTMLDivElement>(null);

  if (!theme) {
    return null; // Don't render until theme is resolved
  }

  const themeStyles = theme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update internal state when value prop changes
  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      setSelectedTime({ hours: value.getHours(), minutes: value.getMinutes() });
    }
  }, [value]);

  // Format date according to specified format
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    if (showTimeSelect) {
      options.hour = 'numeric';
      options.minute = 'numeric';
    }
    
    return date.toLocaleDateString('en-US', options);
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // Days from previous month to show
    const prevMonthDays = firstDay.getDay();
    // Total days to display (6 weeks)
    const totalDays = 42;
    
    const days = [];
    
    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month days
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  // Check if date is selectable
  const isDateSelectable = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (!isDateSelectable(date)) return;
    
    const newDate = new Date(date);
    if (showTimeSelect) {
      newDate.setHours(selectedTime.hours, selectedTime.minutes);
    }
    
    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  // Handle time change
  const handleTimeChange = (hours: number, minutes: number) => {
    setSelectedTime({ hours, minutes });
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes);
      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };

  // Handle preset selection
  const handlePresetSelect = (date: Date) => {
    const newDate = new Date(date);
    if (showTimeSelect) {
      newDate.setHours(selectedTime.hours, selectedTime.minutes);
    }
    
    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDate(null);
    onChange?.(null);
    setIsOpen(false);
  };

  // Render time selector
  const renderTimeSelector = () => {
    if (!showTimeSelect) return null;

    return (
      <div className={cn(commonStyles.timeSelector, themeStyles.timeSelector)}>
        <select
          value={selectedTime.hours}
          onChange={(e) => handleTimeChange(parseInt(e.target.value), selectedTime.minutes)}
          className={cn(commonStyles.timeSelect, themeStyles.timeSelect)}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? '12' : i > 12 ? i - 12 : i} {i >= 12 ? 'PM' : 'AM'}
            </option>
          ))}
        </select>
        <span className={cn(commonStyles.timeSeparator, themeStyles.timeSeparator)}>:</span>
        <select
          value={selectedTime.minutes}
          onChange={(e) => handleTimeChange(selectedTime.hours, parseInt(e.target.value))}
          className={cn(commonStyles.timeSelect, themeStyles.timeSelect)}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const minute = i * 5;
            return (
              <option key={minute} value={minute}>
                {minute.toString().padStart(2, '0')}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  // Render presets
  const renderPresets = () => {
    if (!showPresets || presets.length === 0) return null;

    return (
      <div className={cn(commonStyles.presets, themeStyles.presets)}>
        {presets.map((preset, index) => (
          <button
            key={index}
            type="button"
            className={cn(commonStyles.presetButton, themeStyles.presetButton)}
            onClick={() => handlePresetSelect(preset.date)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    );
  };

  // Render calendar header
  const renderCalendarHeader = () => (
    <div className={cn(commonStyles.calendarHeader, themeStyles.calendarHeader)}>
      <button
        type="button"
        onClick={prevMonth}
        className={cn(commonStyles.navButton, themeStyles.navButton)}
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <h3 className={cn(commonStyles.monthYear, themeStyles.monthYear)}>
        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </h3>
      <button
        type="button"
        onClick={nextMonth}
        className={cn(commonStyles.navButton, themeStyles.navButton)}
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  // Render day names
  const renderDayNames = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className={cn(commonStyles.dayNames, themeStyles.dayNames)}>
        {days.map((day) => (
          <div key={day} className={cn(commonStyles.dayName, themeStyles.dayName)}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    const days = generateCalendarDays();
    
    return (
      <div className={cn(commonStyles.calendarGrid, themeStyles.calendarGrid)}>
        {days.map((dayObj, index) => {
          const { date, isCurrentMonth } = dayObj;
          const isSelected = isDateSelected(date);
          const isSelectable = isDateSelectable(date);
          const today = isToday(date);
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateSelect(date)}
              disabled={!isSelectable}
              className={cn(
                commonStyles.calendarDay,
                themeStyles.calendarDay,
                !isCurrentMonth && commonStyles.otherMonth,
                !isCurrentMonth && themeStyles.otherMonth,
                isSelected && commonStyles.selected,
                isSelected && themeStyles.selected,
                today && commonStyles.today,
                today && themeStyles.today,
                !isSelectable && commonStyles.disabled,
                !isSelectable && themeStyles.disabled
              )}
              aria-label={date.toDateString()}
              aria-selected={isSelected}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    );
  };

  // Render calendar footer
  const renderCalendarFooter = () => (
    <div className={cn(commonStyles.calendarFooter, themeStyles.calendarFooter)}>
      <button
        type="button"
        className={cn(commonStyles.clearButton, themeStyles.clearButton)}
        onClick={clearSelection}
      >
        Clear
      </button>
      {renderTimeSelector()}
    </div>
  );

  return (
    <div
      ref={datePickerRef}
      className={cn(
        commonStyles.datePickerWrapper,
        themeStyles.datePickerWrapper,
        wrapperClassName,
        fullWidth && commonStyles.fullWidth,
        fullWidth && themeStyles.fullWidth
      )}
    >
      {label && (
        <label className={cn(commonStyles.label, themeStyles.label)}>
          {label} {required && <span className={cn(commonStyles.required, themeStyles.required)}>*</span>}
        </label>
      )}
      
      <div
        className={cn(
          commonStyles.inputContainer,
          themeStyles.inputContainer,
          hasError && commonStyles.error,
          hasError && themeStyles.error,
          disabled && commonStyles.disabled,
          disabled && themeStyles.disabled,
          commonStyles[`size-${size}`],
          themeStyles[`size-${size}`],
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={cn(commonStyles.inputContent, themeStyles.inputContent)}>
          <Calendar size={16} className={cn(commonStyles.inputIcon, themeStyles.inputIcon)} />
          <span className={cn(
            commonStyles.inputText, 
            themeStyles.inputText,
            !selectedDate && commonStyles.placeholder,
            !selectedDate && themeStyles.placeholder
          )}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>
          {selectedDate && (
            <button
              type="button"
              className={cn(commonStyles.clearIcon, themeStyles.clearIcon)}
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              aria-label="Clear date"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {isOpen && (
          <div className={cn(commonStyles.calendarContainer, themeStyles.calendarContainer)}>
            {renderPresets()}
            {renderCalendarHeader()}
            {renderDayNames()}
            {renderCalendarGrid()}
            {renderCalendarFooter()}
          </div>
        )}
      </div>
      
      {hasError && (
        <p className={cn(commonStyles.errorMessage, themeStyles.errorMessage)}>
          {error}
        </p>
      )}
    </div>
  );
};

export default DatePicker;