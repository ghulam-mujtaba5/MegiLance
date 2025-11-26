// @AI-HINT: Client Reviews management. Theme-aware, accessible editor and animated reviews list.
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useClientData } from '@/hooks/useClient';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import StarRating from '@/app/components/StarRating/StarRating';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Textarea from '@/app/components/Textarea/Textarea';
import api from '@/lib/api';
import common from './Reviews.common.module.css';
import light from './Reviews.light.module.css';
import dark from './Reviews.dark.module.css';

interface Review {
  avatarUrl?: string;
  id: string;
  project: string;
  freelancer: string;
  created: string;
  rating: number; // 1..5
  text: string;
}

const Reviews: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { reviews, loading, error } = useClientData();

  const rows: Review[] = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    return (reviews as any[]).map((r, idx) => ({
      id: String(r.id ?? idx),
      project: r.project_title ?? r.projectTitle ?? r.project ?? 'Unknown Project',
      freelancer: r.reviewed_user_name ?? r.freelancerName ?? r.freelancer ?? 'Unknown',
      avatarUrl: r.avatarUrl ?? '',
      created: r.created_at ?? r.date ?? r.createdAt ?? r.created ?? '',
      rating: Number(r.rating) || 0,
      text: r.review_text ?? r.comment ?? r.text ?? '',
    }));
  }, [reviews]);

  const [query, setQuery] = useState('');
  const [rating, setRating] = useState<number | 'All'>('All');

  const [newText, setNewText] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [eligibleContracts, setEligibleContracts] = useState<any[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const listVisible = useIntersectionObserver(listRef, { threshold: 0.1 });
  const editorVisible = useIntersectionObserver(editorRef, { threshold: 0.1 });

  useEffect(() => {
    async function loadEligible() {
      try {
        const me = await api.auth.me();
        // Fetch my reviews to know what I've already reviewed
        const myReviews = await api.reviews.list({ reviewer_id: me.id });
        const contracts = await api.contracts.list({ status: 'completed' });
        
        const reviewedContractIds = new Set(myReviews.map((r: any) => String(r.contract_id)));
        
        const eligible = contracts.filter((c: any) => 
          !reviewedContractIds.has(String(c.id)) && 
          (c.client_id === me.id) // Ensure I am the client
        );
        setEligibleContracts(eligible);
      } catch (e) {
        console.error("Failed to load eligible contracts", e);
      }
    }
    loadEligible();
  }, [reviews]); // Re-run when reviews list updates

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r =>
      (rating === 'All' || r.rating === rating) &&
      (!q || r.project.toLowerCase().includes(q) || r.freelancer.toLowerCase().includes(q) || r.text.toLowerCase().includes(q))
    );
  }, [rows, query, rating]);

  // Sorting
  type SortKey = 'project' | 'freelancer' | 'created' | 'rating';
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'project': av = a.project; bv = b.project; break;
        case 'freelancer': av = a.freelancer; bv = b.freelancer; break;
        case 'created': av = a.created; bv = b.created; break;
        case 'rating': av = a.rating; bv = b.rating; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  React.useEffect(() => { setPage(1); }, [sortKey, sortDir, query, rating, pageSize]);

  const setStar = (value: number) => setNewRating(value);

  const canSubmit = newText.trim().length > 10 && newRating > 0 && selectedContractId !== '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const contract = eligibleContracts.find(c => String(c.id) === selectedContractId);
      if (!contract) throw new Error("Contract not found");

      await api.reviews.create({
        contract_id: contract.id,
        reviewed_user_id: contract.freelancer_id,
        rating: newRating,
        review_text: newText,
        is_public: true
      });

      setNewText('');
      setNewRating(0);
      setSelectedContractId('');
      // Force reload to refresh lists
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <section ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="review-controls-title">
          <h2 id="review-controls-title" className={common.srOnly}>Review Controls</h2>
          <div>
            <h1 className={common.title}>Reviews</h1>
            <p className={common.subtitle}>Manage and respond to client feedback.</p>
          </div>
        </section>

        <section ref={listRef} className={cn(common.list, listVisible ? common.isVisible : common.isNotVisible)} aria-live="polite">
          <h2 className={common.srOnly}>Review List</h2>
          {loading && (
            <div className={common.grid}>
              {[...Array(6)].map((_, i) => (
                <article key={i} className={cn(common.card, themed.card, common.skeleton)}>
                  <div className={common.cardHeader}>
                    <Skeleton height={40} width={40} className={common.avatarSkeleton} />
                    <div className={common.headerText}>
                      <Skeleton height={16} width={'60%'} />
                      <Skeleton height={12} width={'40%'} />
                    </div>
                  </div>
                  <Skeleton height={20} width={'80%'} className={common.ratingSkeleton} />
                  <Skeleton height={12} width={'90%'} />
                  <Skeleton height={12} width={'70%'} />
                </article>
              ))}
            </div>
          )}
          {error && <div className={common.error}>Failed to load reviews.</div>}
          {!loading && sorted.length > 0 && (
            <div className={common.grid}>
              {paged.map(r => (
                <article key={r.id} className={cn(common.card, themed.card)}>
                  <header className={common.cardHeader}>
                    <UserAvatar src={r.avatarUrl} name={r.freelancer} size={40} />
                    <div className={common.headerText}>
                      <h3 className={common.freelancerName}>{r.freelancer}</h3>
                      <p className={common.projectName}>{r.project}</p>
                    </div>
                  </header>
                  <div className={common.cardBody}>
                    <StarRating rating={r.rating} />
                    <p className={common.reviewText}>{r.text}</p>
                  </div>
                  <footer className={common.cardFooter}>
                    <time dateTime={r.created}>{new Date(r.created).toLocaleDateString()}</time>
                  </footer>
                </article>
              ))}
            </div>
          )}
          {sorted.length === 0 && !loading && (
            <div className={common.emptyState} role="status" aria-live="polite">
              <h3>No reviews found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </section>

        {sorted.length > 0 && !loading && (
          <div className={common.paginationBar} role="navigation" aria-label="Pagination">
            <Button
              variant='secondary'
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pageSafe === 1}
              aria-label="Previous page"
            >Prev</Button>
            <span className={common.paginationInfo} aria-live="polite">Page {pageSafe} of {totalPages}</span>
            <Button
              variant='secondary'
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={pageSafe === totalPages}
              aria-label="Next page"
            >Next</Button>
          </div>
        )}

        <section ref={editorRef} className={cn(common.editor, themed.editor, editorVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="new-title">
          <h2 id="new-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Leave a Review</h2>
          <div className={common.editorForm}>
            
            {eligibleContracts.length > 0 ? (
              <div style={{ marginBottom: '1rem' }}>
                <label className={common.ratingLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Select Contract to Review:</label>
                <Select
                  id="contract-select"
                  options={eligibleContracts.map(c => ({ 
                    value: String(c.id), 
                    label: `${c.job_title} - ${c.client_name || 'Freelancer'}` 
                  }))}
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                No completed contracts pending review.
              </div>
            )}

            <div className={common.ratingSelector}>
              <span className={common.ratingLabel}>Your rating:</span>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={cn(common.ratingStarButton, n <= newRating ? common.ratingStarActive : common.ratingStarInactive)}
                  onClick={() => setStar(n)}
                  aria-label={`Set rating to ${n} star${n>1?'s':''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea 
              id="review-text"
              placeholder="Share your experience and the outcomes of the project..."
              value={newText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewText(e.target.value)}
              helpText="Describe the quality, communication, and overall satisfaction. Minimum 10 characters."
            />
            <div className={common.editorActions}>
              <Button variant="secondary" onClick={() => { setNewText(''); setNewRating(0); }} title="Clear review form">Clear</Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                disabled={!canSubmit || submitting} 
                aria-disabled={!canSubmit || submitting} 
                title="Submit your review"
                isLoading={submitting}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Reviews;
