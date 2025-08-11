// @AI-HINT: Premium Contact page: validated form, a11y, theme-aware styles, and animated entry.
'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

import Button from '@/app/components/Button/Button';
import { Input } from '@/app/components/Input/Input';
import { Select } from '@/app/components/Select/Select';
import { Textarea } from '@/app/components/Textarea/Textarea';
import { useToast } from '@/app/components/Toast/use-toast';

import common from './Contact.common.module.css';
import light from './Contact.light.module.css';
import dark from './Contact.dark.module.css';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  topic: z.enum(['support', 'sales', 'partnerships'], {
    errorMap: () => ({ message: 'Please select a topic.' }),
  }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  { icon: Mail, text: 'support@megilance.com', href: 'mailto:support@megilance.com' },
  { icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: MapPin, text: '123 Innovation Drive, Silicon Valley, CA', href: '#' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const Contact: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const styles = React.useMemo(() => {
    const themeStyles = theme === 'dark' ? dark : light;
    return {
      page: cn(common.page, themeStyles.page),
      container: cn(common.container),
      header: cn(common.header, themeStyles.header),
      title: cn(common.title, themeStyles.title),
      subtitle: cn(common.subtitle, themeStyles.subtitle),
      contentGrid: cn(common.contentGrid),
      infoPanel: cn(common.infoPanel, themeStyles.infoPanel),
      infoItem: cn(common.infoItem, themeStyles.infoItem),
      infoIcon: cn(common.infoIcon, themeStyles.infoIcon),
      infoText: cn(common.infoText, themeStyles.infoText),
      formPanel: cn(common.formPanel, themeStyles.formPanel),
      form: cn(common.form),
    };
  }, [theme]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Form submitted:', data);
    toast({
      title: 'Message Sent!',
      description: "Thanks for reaching out. We'll get back to you shortly.",
      variant: 'success',
    });
    reset();
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.header className={styles.header} variants={itemVariants}>
          <h1 className={styles.title}>Get in Touch</h1>
          <p className={styles.subtitle}>
            Have a question or a project in mind? We'd love to hear from you.
          </p>
        </motion.header>

        <div className={styles.contentGrid}>
          <motion.div className={styles.infoPanel} variants={itemVariants}>
            {contactInfo.map((item, index) => (
              <a key={index} href={item.href} className={styles.infoItem}>
                <item.icon className={styles.infoIcon} />
                <span className={styles.infoText}>{item.text}</span>
              </a>
            ))}
          </motion.div>

          <motion.div className={styles.formPanel} variants={itemVariants}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
              <Input
                id="name"
                label="Full Name"
                placeholder="John Doe"
                {...register('name')}
                error={errors.name?.message}
                disabled={isSubmitting}
              />
              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isSubmitting}
              />
              <Select
                id="topic"
                label="Topic"
                {...register('topic')}
                error={errors.topic?.message}
                disabled={isSubmitting}
                defaultValue=""
              >
                <option value="" disabled>Select a topic...</option>
                <option value="support">General Support</option>
                <option value="sales">Sales Inquiry</option>
                <option value="partnerships">Partnerships</option>
              </Select>
              <Textarea
                id="message"
                label="Your Message"
                placeholder="Tell us about your project or question..."
                {...register('message')}
                error={errors.message?.message}
                disabled={isSubmitting}
                rows={5}
              />
              <Button type="submit" isLoading={isSubmitting} iconBefore={<Send size={18} />}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
