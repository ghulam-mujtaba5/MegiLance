// @AI-HINT: Premium FAQ page with accessible accordion, theme-aware styles, and JSON-LD schema.
'use client';
import React from 'react';
import Script from 'next/script';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Accordion, { AccordionItem } from '@/app/components/Accordion/Accordion';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import common from './FAQ.common.module.css';
import light from './FAQ.light.module.css';
import dark from './FAQ.dark.module.css';

const faqData = [
  {
    value: 'item-1',
    question: 'What is MegiLance?',
    answer: 'MegiLance is a next-generation freelance platform that leverages AI for intelligent matching and blockchain for secure, transparent payments. We focus on providing an investor-grade user experience for both clients and freelancers.',
  },
  {
    value: 'item-2',
    question: 'How do the fees work?',
    answer: 'We believe in transparency. MegiLance operates on a simple, tiered fee structure with no hidden charges. Please visit our Pricing page for a detailed breakdown of our competitive rates.',
  },
  {
    value: 'item-3',
    question: 'Is my data and payment information secure?',
    answer: 'Absolutely. Security is our top priority. We employ enterprise-grade security measures, including end-to-end encryption for data and smart contracts for payments on the blockchain. Our platform is built to the highest security standards.',
  },
  {
    value: 'item-4',
    question: 'What kind of freelancers can I find?',
    answer: 'MegiLance hosts a curated network of elite talent across various fields, including software development, design, AI/ML engineering, marketing, and more. Our AI matching ensures you connect with the perfect expert for your project.',
  },
];

const FAQ: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? dark : light;
    return {
      root: cn(common.root, themeStyles.root),
      header: cn(common.header, themeStyles.header),
      title: cn(common.title, themeStyles.title),
      subtitle: cn(common.subtitle, themeStyles.subtitle),
      badge: cn(common.badge, themeStyles.badge),
      accordionContainer: cn(common.accordionContainer),
    };
  }, [resolvedTheme]);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <PageTransition>
      <main id="main-content" role="main" aria-labelledby="faq-title" className={styles.root}>
        <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        
        <ScrollReveal>
          <header className={styles.header}>
            <span className={styles.badge}>Answers you need</span>
            <h1 id="faq-title" className={styles.title}>Frequently Asked Questions</h1>
            <p className={styles.subtitle}>Quick, clear answers about our platform, security, and how to get started.</p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={styles.accordionContainer}>
            <Accordion type="single" defaultValue="item-1">
              {faqData.map((item) => (
                <AccordionItem key={item.value} value={item.value} title={item.question}>
                  <p>{item.answer}</p>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default FAQ;
