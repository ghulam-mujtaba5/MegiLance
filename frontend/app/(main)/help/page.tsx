// @AI-HINT: Public help page that redirects to FAQ/Support
import { redirect } from 'next/navigation';

export default function HelpPage() {
  // Redirect to FAQ page for public users
  redirect('/faq');
}
