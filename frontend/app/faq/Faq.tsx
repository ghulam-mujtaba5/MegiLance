// @AI-HINT: FAQ page with theme-aware styling, animations, and accessible accordion semantics.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import commonStyles from './Faq.common.module.css';
import lightStyles from './Faq.light.module.css';
import darkStyles from './Faq.dark.module.css';

const faqData = [
  {
    question: 'What is MegiLance?',
    answer: 'MegiLance is a next-generation freelance platform that uses AI for intelligent project matching and blockchain for secure, transparent payments in USDC.',
  },
  {
    question: 'How does the AI ranking work?',
    answer: 'Our proprietary AI analyzes your skills, project history, client feedback, and other data points to generate an objective ranking. A higher rank increases your visibility to top clients.',
  },
  {
    question: 'What are the fees?',
    answer: 'It is free for freelancers to join and apply for jobs. We charge clients a competitive 5% platform fee on all payments, which is handled securely through our smart contract escrow system.',
  },
  {
    question: 'What is USDC and why do you use it?',
    answer: 'USDC is a stablecoin pegged to the US Dollar. We use it for payments to ensure low transaction fees, fast settlement times, and global accessibility without the volatility of other cryptocurrencies.',
  },
  {
    question: 'Is my money safe?',
    answer: 'Yes. When a client funds a project, the USDC is held in a secure, audited smart contract escrow. Funds are only released to the freelancer upon successful completion and approval of the work.',
  },
];

interface FaqItemProps {
  item: { question: string; answer: string; };
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem = ({ item, isOpen, onClick, index }: FaqItemProps & { index: number }) => {
  const contentId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className={commonStyles.faqItem}>
      <button
        id={buttonId}
        className={commonStyles.faqItemQuestion}
        onClick={onClick}
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={contentId}
      >
        <span>{item.question}</span>
        <span
          className={cn(commonStyles.faqItemIcon, isOpen && commonStyles.faqItemIconOpen)}
          aria-hidden="true"
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(commonStyles.faqItemAnswer, isOpen && commonStyles.faqItemAnswerOpen)}
      >
        <p>{item.answer}</p>
      </div>
    </div>
  );
};

const Faq: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleClick = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const Header = useMemo(() => (
    <ScrollReveal>
      <header
        className={cn(commonStyles.faqHeader)}
      >
        <h1 id="faq-title">Frequently Asked Questions</h1>
        <p>Find answers to common questions about MegiLance.</p>
      </header>
    </ScrollReveal>

  ), []);

  return (
    <PageTransition>
      <main id="main-content" role="main" aria-labelledby="faq-title" className={cn(commonStyles.faq, themed.themeWrapper)}>
        <div className={commonStyles.faqContainer}>
          {Header}
          <StaggerContainer
            className={cn(commonStyles.faqList)}
            delay={0.1}
          >
            {faqData.map((item, index) => (
              <FaqItem
                key={index}
                index={index}
                item={item}
                isOpen={openIndex === index}
                onClick={() => handleClick(index)}
              />
            ))}
          </StaggerContainer>
        </div>
      </main>
    </PageTransition>
  );
};

export default Faq;
