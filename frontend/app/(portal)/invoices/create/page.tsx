// @AI-HINT: Route page for invoice creation wizard
import { Metadata } from 'next';
import InvoiceWizard from '@/src/components/wizards/InvoiceWizard';

export const metadata: Metadata = {
  title: 'Create Invoice - MegiLance',
  description: 'Create and send a new invoice'
};

export default function CreateInvoicePage() {
  // Get user ID from session (replace with actual auth)
  const userId = 'current-user-id';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <InvoiceWizard userId={userId} />
    </div>
  );
}
