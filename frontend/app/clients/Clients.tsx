// @AI-HINT: Clients page with real data from API, theme-aware styling, animated sections, accessible structure.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
// Lazy load cards to keep initial bundle lean
const ClientLogoCard = dynamic(() => import('./components/ClientLogoCard'));
const CaseStudyCard = dynamic(() => import('./components/CaseStudyCard'));
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Clients.common.module.css';
import light from './Clients.light.module.css';
import dark from './Clients.dark.module.css';

const ALL = 'All';

// Client data interface matching backend PublicClientResponse
interface ClientData {
  id: string;
  name: string;
  company_name: string | null;
  industry: string;
  logo_url: string | null;
  description: string | null;
  project_count: number;
  joined_date: string;
}

// Stats interface matching backend ClientStatsResponse
interface ClientStats {
  total_clients: number;
  total_projects: number;
  industries: string[];
  avg_project_value: number;
  satisfaction_rate: number;
}

// Fallback demo data when API is unavailable
const fallbackLogos: ClientData[] = [
  { id: '1', name: 'AtlasAI', company_name: 'AtlasAI Corp', industry: 'AI', logo_url: '/images/clients/placeholder.svg', description: 'AI research company', project_count: 12, joined_date: '2024-01-15' },
  { id: '2', name: 'NovaBank', company_name: 'NovaBank Inc', industry: 'Fintech', logo_url: '/images/clients/placeholder.svg', description: 'Digital banking platform', project_count: 8, joined_date: '2024-02-20' },
  { id: '3', name: 'PixelMint', company_name: 'PixelMint LLC', industry: 'E-commerce', logo_url: '/images/clients/placeholder.svg', description: 'E-commerce solutions', project_count: 15, joined_date: '2024-03-10' },
  { id: '4', name: 'CureWell', company_name: 'CureWell Health', industry: 'Healthcare', logo_url: '/images/clients/placeholder.svg', description: 'Healthcare technology', project_count: 6, joined_date: '2024-04-05' },
  { id: '5', name: 'CortexCloud', company_name: 'CortexCloud AI', industry: 'AI', logo_url: '/images/clients/placeholder.svg', description: 'Cloud AI services', project_count: 20, joined_date: '2024-01-25' },
  { id: '6', name: 'VoltPay', company_name: 'VoltPay Systems', industry: 'Fintech', logo_url: '/images/clients/placeholder.svg', description: 'Payment processing', project_count: 10, joined_date: '2024-02-28' },
  { id: '7', name: 'ShopSphere', company_name: 'ShopSphere Global', industry: 'E-commerce', logo_url: '/images/clients/placeholder.svg', description: 'Global marketplace', project_count: 18, joined_date: '2024-03-15' },
  { id: '8', name: 'Medisphere', company_name: 'Medisphere Labs', industry: 'Healthcare', logo_url: '/images/clients/placeholder.svg', description: 'Medical diagnostics', project_count: 9, joined_date: '2024-04-12' },
];

const cases = [
  {
    title: 'AI-assisted onboarding reduced time-to-value by 42%',
    desc: 'Enterprise-grade workflows and fine-tuned models improved user activation and retention.',
    media: '/images/cases/placeholder.jpg',
  },
  {
    title: 'Payments reliability at 99.99% with audited contracts',
    desc: 'Escrow releases, milestone tracking, and dispute resolution led to higher trust and volume.',
    media: '/images/cases/placeholder.jpg',
  },
  {
    title: 'Design system refresh accelerated shipping by 3x',
    desc: 'A premium, accessible component library unified teams and improved build velocity.',
    media: '/images/cases/placeholder.jpg',
  },
];

interface Metric {
  label: string;
  value: string;
  detail: string;
}

const defaultMetrics: Metric[] = [
  { label: 'Avg. Activation Lift', value: '+42%', detail: 'AI-guided onboarding flows' },
  { label: 'Payment Reliability', value: '99.99%', detail: 'Audited escrow contracts' },
  { label: 'Shipping Velocity', value: '3×', detail: 'Unified component system' },
  { label: 'Talent Match Accuracy', value: '92%', detail: 'ML-powered ranking' },
];

const Clients: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();

  const [selected, setSelected] = useState<string>(ALL);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [industries, setIndustries] = useState<string[]>([ALL, 'AI', 'Fintech', 'E-commerce', 'Healthcare']);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [apiError, setApiError] = useState(false);

  // Fetch real client data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch clients, stats, and industries in parallel
        const [clientsRes, statsRes, industriesRes] = await Promise.all([
          fetch('/backend/api/v1/public-clients/featured'),
          fetch('/backend/api/v1/public-clients/stats'),
          fetch('/backend/api/v1/public-clients/industries'),
        ]);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.length > 0 ? clientsData : fallbackLogos);
        } else {
          setClients(fallbackLogos);
          setApiError(true);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (industriesRes.ok) {
          const industriesData = await industriesRes.json();
          if (industriesData.length > 0) {
            setIndustries([ALL, ...industriesData]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch client data:', error);
        setClients(fallbackLogos);
        setApiError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dynamic metrics based on API stats
  const metrics: Metric[] = useMemo(() => {
    if (stats) {
      return [
        { label: 'Total Clients', value: stats.total_clients.toString(), detail: 'Trusted companies worldwide' },
        { label: 'Projects Completed', value: stats.total_projects.toString(), detail: 'Successfully delivered' },
        { label: 'Satisfaction Rate', value: `${stats.satisfaction_rate}%`, detail: 'Client happiness score' },
        { label: 'Talent Match Accuracy', value: '92%', detail: 'ML-powered ranking' },
      ];
    }
    return defaultMetrics;
  }, [stats]);

  const filtered = useMemo(
    () => (selected === ALL ? clients : clients.filter((c) => c.industry === selected)),
    [selected, clients]
  );

  const onSelect = useCallback((c: string) => {
    setSelected(c);
    notify({
      title: 'Filter applied',
      description: c === ALL ? 'Showing all industries' : `Showing ${c} clients`,
      variant: 'info',
      duration: 1800,
    });
  }, [notify]);

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="blue" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="purple" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={15} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <h1 className={common.title}>Our Clients</h1>
              <p className={common.subtitle}>Trusted by high-velocity teams across AI, fintech, e‑commerce, and healthcare.</p>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div
              className={common.controls}
              role="toolbar"
              aria-label="Filter clients by industry"
            >
              {industries.map((c) => {
                const active = selected === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={cn(common.chip, active && common.chipActive)}
                    aria-pressed={active ? 'true' : 'false'}
                    data-active={active || undefined}
                    onClick={() => onSelect(c)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          <section aria-label="Client logos">
            <StaggerContainer className={common.grid} delay={0.2}>
              {isLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={`s-${i}`} className={cn(common.logoCard, common.skeleton)} aria-hidden="true" />
                ))
              )}
              {!isLoading && filtered.length === 0 && (
                <div className={common.gridSpanAll}>
                  <EmptyState
                    title="No clients in this category"
                    description="Try a different industry or contact our team for a tailored walkthrough."
                    action={
                      <a href="/contact" className={common.button} aria-label="Contact sales">
                        Contact Sales
                      </a>
                    }
                  />
                </div>
              )}
              {!isLoading && filtered.length > 0 && (
                filtered.map((client) => (
                  <ClientLogoCard 
                    key={client.id} 
                    name={client.company_name || client.name} 
                    src={client.logo_url || '/images/clients/placeholder.svg'} 
                    industry={client.industry}
                    projectCount={client.project_count}
                    description={client.description}
                  />
                ))
              )}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Impact metrics">
            <h2 className={common.sectionTitle}>Impact Metrics</h2>
            <StaggerContainer className={common.metricGrid} role="list" delay={0.3}>
              {metrics.map(m => (
                <li key={m.label} className={common.metricCard}>
                  <div className={common.metricValue}>{m.value}</div>
                  <div className={common.metricLabel}>{m.label}</div>
                  <div className={common.metricDetail}>{m.detail}</div>
                </li>
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Case studies">
            <h2 className={common.sectionTitle}>Case Studies</h2>
            <StaggerContainer className={common.caseGrid} delay={0.4}>
              {cases.map((c) => (
                <CaseStudyCard key={c.title} title={c.title} description={c.desc} media={c.media} />
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Call to action">
            <ScrollReveal className={common.cta} delay={0.5}>
              <a
                href="/contact"
                className={common.button}
                aria-label="Contact sales"
                onClick={() =>
                  notify({ title: 'Opening contact', description: 'We’ll help you get started.', variant: 'success', duration: 2500 })
                }
              >
                Contact Sales
              </a>
              <a
                href="/jobs"
                className={cn(common.button, common.buttonSecondary)}
                aria-label="Find talent"
                onClick={() =>
                  notify({ title: 'Explore talent', description: 'Curated experts across domains.', variant: 'info', duration: 2500 })
                }
              >
                Find Talent
              </a>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Clients;
