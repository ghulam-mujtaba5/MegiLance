// @AI-HINT: Advanced autocomplete search component with FTS5 integration, debouncing, and keyboard navigation
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import Input from '@/app/components/Input/Input';
import commonStyles from './AdvancedSearch.common.module.css';
import lightStyles from './AdvancedSearch.light.module.css';
import darkStyles from './AdvancedSearch.dark.module.css';

export interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  category?: string;
  icon?: React.ReactNode;
  data?: any;
}

interface AdvancedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelect: (result: SearchResult) => void;
  debounceMs?: number;
  minChars?: number;
  maxResults?: number;
  className?: string;
  showCategories?: boolean;
  autoFocus?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  placeholder = 'Search...',
  onSearch,
  onSelect,
  debounceMs = 300,
  minChars = 2,
  maxResults = 10,
  className,
  showCategories = true,
  autoFocus = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return {
      container: cn(commonStyles.container, themeStyles.container),
      inputWrapper: cn(commonStyles.inputWrapper, themeStyles.inputWrapper),
      searchIcon: cn(commonStyles.searchIcon, themeStyles.searchIcon),
      clearButton: cn(commonStyles.clearButton, themeStyles.clearButton),
      resultsDropdown: cn(commonStyles.resultsDropdown, themeStyles.resultsDropdown),
      resultItem: cn(commonStyles.resultItem, themeStyles.resultItem),
      resultItemSelected: cn(commonStyles.resultItemSelected, themeStyles.resultItemSelected),
      resultIcon: cn(commonStyles.resultIcon, themeStyles.resultIcon),
      resultContent: cn(commonStyles.resultContent, themeStyles.resultContent),
      resultTitle: cn(commonStyles.resultTitle, themeStyles.resultTitle),
      resultSubtitle: cn(commonStyles.resultSubtitle, themeStyles.resultSubtitle),
      resultCategory: cn(commonStyles.resultCategory, themeStyles.resultCategory),
      noResults: cn(commonStyles.noResults, themeStyles.noResults),
      loadingState: cn(commonStyles.loadingState, themeStyles.loadingState),
    };
  }, [resolvedTheme]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minChars) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults.slice(0, maxResults));
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch, minChars, maxResults]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query) {
      debounceTimerRef.current = setTimeout(() => {
        handleSearch(query);
      }, debounceMs);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, handleSearch, debounceMs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const groupedResults = useMemo(() => {
    if (!showCategories) return { All: results };
    
    return results.reduce((acc, result) => {
      const category = result.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [results, showCategories]);

  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.inputWrapper}>
        <FaSearch className={styles.searchIcon} />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        {loading && <FaSpinner className={`${styles.searchIcon} animate-spin`} />}
        {query && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {showResults && (
        <div ref={resultsRef} className={styles.resultsDropdown}>
          {loading ? (
            <div className={styles.loadingState}>
              <FaSpinner className="animate-spin" /> Searching...
            </div>
          ) : results.length > 0 ? (
            Object.entries(groupedResults).map(([category, categoryResults]) => (
              <div key={category}>
                {showCategories && Object.keys(groupedResults).length > 1 && (
                  <div className={styles.resultCategory}>{category}</div>
                )}
                {categoryResults.map((result, index) => {
                  const globalIndex = results.indexOf(result);
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        styles.resultItem,
                        globalIndex === selectedIndex && styles.resultItemSelected
                      )}
                      onClick={() => handleSelectResult(result)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {result.icon && <div className={styles.resultIcon}>{result.icon}</div>}
                      <div className={styles.resultContent}>
                        <div className={styles.resultTitle}>{result.title}</div>
                        {result.subtitle && (
                          <div className={styles.resultSubtitle}>{result.subtitle}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>No results found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
