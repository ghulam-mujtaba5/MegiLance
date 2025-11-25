// @AI-HINT: Admin Calendar component with monthly view and event display
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Video } from 'lucide-react';
import Button from '@/app/components/Button/Button';

import common from './Calendar.common.module.css';
import light from './Calendar.light.module.css';
import dark from './Calendar.dark.module.css';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'meeting' | 'deadline' | 'review' | 'maintenance';
  description?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Team Standup', date: new Date(2025, 10, 25), time: '9:00 AM', type: 'meeting', description: 'Daily sync with dev team' },
  { id: '2', title: 'Platform Maintenance', date: new Date(2025, 10, 26), time: '2:00 AM', type: 'maintenance', description: 'Scheduled database optimization' },
  { id: '3', title: 'Q4 Review Meeting', date: new Date(2025, 10, 28), time: '3:00 PM', type: 'review', description: 'Quarterly performance review' },
  { id: '4', title: 'Feature Release', date: new Date(2025, 10, 30), time: '10:00 AM', type: 'deadline', description: 'AI matching v2 release' },
  { id: '5', title: 'Client Onboarding', date: new Date(2025, 11, 2), time: '11:00 AM', type: 'meeting', description: 'Enterprise client demo' },
  { id: '6', title: 'Security Audit', date: new Date(2025, 11, 5), time: '9:00 AM', type: 'review', description: 'Monthly security review' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 25)); // November 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 10, 25));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    return MOCK_EVENTS.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const today = new Date();

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return themed.event_meeting;
      case 'deadline': return themed.event_deadline;
      case 'review': return themed.event_review;
      case 'maintenance': return themed.event_maintenance;
      default: return themed.event_meeting;
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return <Video size={14} />;
      case 'deadline': return <Clock size={14} />;
      case 'review': return <Users size={14} />;
      case 'maintenance': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <main className={cn(common.main, themed.main)}>
      <header className={common.header}>
        <div>
          <h1 className={cn(common.title, themed.title)}>Calendar</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>
            Manage your schedule, meetings, and important deadlines.
          </p>
        </div>
        <Button variant="primary">
          <Plus size={16} /> New Event
        </Button>
      </header>

      <div className={common.content}>
        <div className={cn(common.calendar_container, themed.calendar_container)}>
          {/* Calendar Header */}
          <div className={common.calendar_header}>
            <button 
              onClick={() => navigateMonth('prev')} 
              className={cn(common.nav_button, themed.nav_button)}
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className={cn(common.month_year, themed.month_year)}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button 
              onClick={() => navigateMonth('next')} 
              className={cn(common.nav_button, themed.nav_button)}
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className={common.weekdays}>
            {WEEKDAYS.map(day => (
              <div key={day} className={cn(common.weekday, themed.weekday)}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={common.calendar_grid}>
            {/* Empty cells for days before the first of month */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className={cn(common.day_cell, common.empty_cell, themed.empty_cell)} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const events = getEventsForDate(cellDate);
              const isToday = cellDate.toDateString() === today.toDateString();
              const isSelected = selectedDate?.toDateString() === cellDate.toDateString();

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(cellDate)}
                  className={cn(
                    common.day_cell,
                    themed.day_cell,
                    isToday && common.today,
                    isToday && themed.today,
                    isSelected && common.selected,
                    isSelected && themed.selected
                  )}
                >
                  <span className={common.day_number}>{dayNum}</span>
                  {events.length > 0 && (
                    <div className={common.event_dots}>
                      {events.slice(0, 3).map(event => (
                        <span 
                          key={event.id} 
                          className={cn(common.event_dot, getEventTypeColor(event.type))}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Details Panel */}
        <div className={cn(common.events_panel, themed.events_panel)}>
          <h3 className={cn(common.panel_title, themed.panel_title)}>
            {selectedDate 
              ? `Events for ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`
              : 'Select a date'
            }
          </h3>

          {selectedEvents.length === 0 ? (
            <p className={cn(common.no_events, themed.no_events)}>
              No events scheduled for this day.
            </p>
          ) : (
            <div className={common.events_list}>
              {selectedEvents.map(event => (
                <div 
                  key={event.id} 
                  className={cn(common.event_card, themed.event_card, getEventTypeColor(event.type))}
                >
                  <div className={common.event_header}>
                    <span className={cn(common.event_icon, themed.event_icon)}>
                      {getEventIcon(event.type)}
                    </span>
                    <span className={cn(common.event_time, themed.event_time)}>
                      {event.time}
                    </span>
                  </div>
                  <h4 className={cn(common.event_title, themed.event_title)}>
                    {event.title}
                  </h4>
                  {event.description && (
                    <p className={cn(common.event_description, themed.event_description)}>
                      {event.description}
                    </p>
                  )}
                  <span className={cn(common.event_type_badge, themed.event_type_badge)}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Events */}
          <div className={common.upcoming_section}>
            <h3 className={cn(common.panel_title, themed.panel_title)}>Upcoming Events</h3>
            <div className={common.upcoming_list}>
              {MOCK_EVENTS.slice(0, 4).map(event => (
                <div key={event.id} className={cn(common.upcoming_item, themed.upcoming_item)}>
                  <span className={cn(common.upcoming_date, themed.upcoming_date)}>
                    {MONTHS[event.date.getMonth()].slice(0, 3)} {event.date.getDate()}
                  </span>
                  <span className={cn(common.upcoming_title, themed.upcoming_title)}>
                    {event.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Calendar;
