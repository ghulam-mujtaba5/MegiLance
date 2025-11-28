// @AI-HINT: This is a Pagination component, a molecular element for navigating through pages of data.
'use client';

import React, { useId, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import commonStyles from './Pagination.common.module.css';
import lightStyles from './Pagination.light.module.css';
import darkStyles from './Pagination.dark.module.css';

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of page numbers to show */
  siblingCount?: number;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Accessible label for navigation */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  siblingCount = 1,
  showFirstLast = true,
  ariaLabel = 'Pagination',
  className,
  disabled = false,
}) => {
  const paginationId = useId();
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme || totalPages <= 1) {
    return null;
  }

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;
    
    if (!showLeftEllipsis && showRightEllipsis) {
      // Show first few pages
      for (let i = 1; i <= Math.min(3 + 2 * siblingCount, totalPages); i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (showLeftEllipsis && !showRightEllipsis) {
      // Show last few pages
      pages.push(1);
      pages.push('ellipsis');
      for (let i = Math.max(totalPages - 2 - 2 * siblingCount, 1); i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (showLeftEllipsis && showRightEllipsis) {
      // Show middle pages
      pages.push(1);
      pages.push('ellipsis');
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, siblingCount]);

  const handlePageChange = useCallback((page: number) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }, [disabled, totalPages, currentPage, onPageChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, page: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePageChange(page);
    }
  }, [handlePageChange]);

  return (
    <nav 
      className={cn(commonStyles.pagination, themeStyles.pagination, className)} 
      aria-label={ariaLabel}
      role="navigation"
    >
      {showFirstLast && (
        <button 
          type="button"
          onClick={() => handlePageChange(1)} 
          disabled={disabled || currentPage === 1} 
          className={cn(commonStyles.paginationButton, themeStyles.paginationButton)}
          aria-label="Go to first page"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>
      )}
      <button 
        type="button"
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={disabled || currentPage === 1} 
        className={cn(commonStyles.paginationButton, themeStyles.paginationButton)}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span className={commonStyles.buttonText}>Previous</span>
      </button>
      
      <ul className={cn(commonStyles.pageList, themeStyles.pageList)} role="list">
        {pageNumbers.map((page, index) => (
          page === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} className={commonStyles.ellipsis} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                onClick={() => handlePageChange(page)}
                onKeyDown={(e) => handleKeyDown(e, page)}
                disabled={disabled}
                className={cn(
                  commonStyles.pageButton,
                  themeStyles.pageButton,
                  page === currentPage && commonStyles.active,
                  page === currentPage && themeStyles.active
                )}
                aria-label={`Page ${page}${page === currentPage ? ', current page' : ''}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          )
        ))}
      </ul>
      
      <button 
        type="button"
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={disabled || currentPage === totalPages} 
        className={cn(commonStyles.paginationButton, themeStyles.paginationButton)}
        aria-label="Go to next page"
      >
        <span className={commonStyles.buttonText}>Next</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      {showFirstLast && (
        <button 
          type="button"
          onClick={() => handlePageChange(totalPages)} 
          disabled={disabled || currentPage === totalPages} 
          className={cn(commonStyles.paginationButton, themeStyles.paginationButton)}
          aria-label="Go to last page"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      )}
      
      <span className={cn(commonStyles.paginationInfo, themeStyles.paginationInfo)} aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
};

export default Pagination;
