// @AI-HINT: This file defines a reusable, high-quality Table component system, fully refactored to use theme-aware CSS Modules. It provides a set of composable components to build complex and styled data tables that align with the MegiLance brand guidelines and support both light and dark themes.

import * as React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
// The CSS module imports are now relative to the new file location.
import commonStyles from './Table.common.module.css';
import lightStyles from './Table.light.module.css';
import darkStyles from './Table.dark.module.css';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.tableWrapper, styles.tableWrapper)}>
      <table
        ref={ref}
        className={cn(commonStyles.table, className)}
        {...props}
      />
    </div>
  );
});
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <thead
      ref={ref}
      className={cn(styles.header, className)}
      {...props}
    />
  );
});
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <tfoot
      ref={ref}
      className={cn(commonStyles.footer, styles.footer, className)}
      {...props}
    />
  );
});
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <tr
      ref={ref}
      className={cn(commonStyles.row, styles.row, className)}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <th
      ref={ref}
      className={cn(commonStyles.head, styles.head, className)}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <td
      ref={ref}
      className={cn(commonStyles.cell, styles.cell, className)}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <caption
      ref={ref}
      className={cn(commonStyles.caption, styles.caption, className)}
      {...props}
    />
  );
});
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
