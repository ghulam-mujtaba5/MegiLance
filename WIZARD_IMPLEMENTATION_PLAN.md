# MegiLance Wizard Interface Implementation Plan

## 🎯 Objective
Transform all static pages and single-form interfaces into user-friendly, step-by-step wizard experiences across the entire MegiLance platform.

---

## 📋 Pages/Features Requiring Wizard Treatment

### ✅ Already Have Wizards (Complete)
1. ✅ **Profile Completion** - ProfileWizard (4 steps)
2. ✅ **Project Creation** - ProjectWizard (4 steps)
3. ✅ **Proposal Builder** - ProposalBuilder (with templates)

### 🔴 Critical - Need Wizard Implementation

#### 1. **Contract Creation Wizard** ⭐ HIGH PRIORITY
**Current State**: Static/non-existent  
**Location**: `/contracts/create` or within project acceptance flow  
**Steps Needed**:
- Step 1: Contract Terms (scope, deliverables, timeline)
- Step 2: Payment Structure (fixed/hourly, milestones)
- Step 3: Legal Terms (IP rights, confidentiality, termination)
- Step 4: Review & Sign (digital signature)

**Features**:
- Template selection (standard, NDA, hourly, milestone-based)
- Auto-populate from project/proposal
- Milestone breakdown with dates
- Escrow setup integration
- Digital signature capture

---

#### 2. **Payment/Withdrawal Wizard** ⭐ HIGH PRIORITY
**Current State**: Static placeholder (`wallet/page.tsx` has "coming soon")  
**Location**: `/freelancer/withdraw`, `/payments/add-funds`  
**Steps Needed**:

**Withdrawal Flow**:
- Step 1: Amount & Method (bank, PayPal, Stripe, crypto)
- Step 2: Account Verification (if first time)
- Step 3: Tax Information (if required)
- Step 4: Review & Confirm

**Add Funds Flow**:
- Step 1: Amount Selection (quick amounts or custom)
- Step 2: Payment Method (card, bank, crypto)
- Step 3: Billing Details
- Step 4: Confirmation

**Features**:
- Saved payment methods
- Fee calculation preview
- Processing time estimates
- Receipt generation
- 2FA verification step

---

#### 3. **Messaging/Chat Initiation Wizard** ⭐ MEDIUM PRIORITY
**Current State**: RealtimeChat exists but no onboarding for new conversations  
**Location**: `/messages/new`  
**Steps Needed**:
- Step 1: Select Recipient (search freelancers/clients)
- Step 2: Message Purpose (project inquiry, follow-up, support)
- Step 3: Initial Message (templates available)
- Step 4: Attach Files (optional, project brief, requirements)

**Features**:
- Recent contacts quick-select
- Message templates by type
- Project context linking
- File attachment preview
- Privacy settings (read receipts, typing indicators)

---

#### 4. **Dispute Resolution Wizard** ⭐ HIGH PRIORITY
**Current State**: Non-existent  
**Location**: `/contracts/[id]/dispute`, linked from EscrowTracker  
**Steps Needed**:
- Step 1: Dispute Type (payment, quality, timeline, other)
- Step 2: Evidence Upload (screenshots, files, correspondence)
- Step 3: Detailed Explanation (what happened, timeline)
- Step 4: Desired Resolution (refund, revision, mediation)
- Step 5: Review & Submit

**Features**:
- Auto-include contract details
- Timeline builder for events
- Evidence categorization
- Suggested resolutions based on type
- Mediator assignment (admin view)

---

#### 5. **Skill Assessment Wizard** ⭐ MEDIUM PRIORITY
**Current State**: Non-existent  
**Location**: `/freelancer/skills/assessment`  
**Steps Needed**:
- Step 1: Choose Skill Category (web dev, design, writing, etc.)
- Step 2: Difficulty Level Selection (beginner, intermediate, expert)
- Step 3: Timed Assessment (multiple choice + coding/practical)
- Step 4: Results & Badge

**Features**:
- Category-based question banks
- Code editor for technical assessments
- Time limits per section
- Score calculation
- Badge/certification issuance
- Profile integration (display verified skills)

---

#### 6. **Onboarding Tour Wizard** ⭐ HIGH PRIORITY
**Current State**: Non-existent  
**Location**: Triggered on first login, `/onboarding/tour`  
**Steps Needed**:
- Step 1: Welcome & Role Confirmation (freelancer/client)
- Step 2: Platform Overview (key features walkthrough)
- Step 3: Profile Setup Prompt (link to ProfileWizard)
- Step 4: First Action (post project / browse jobs)
- Step 5: Help Resources (support, tutorials, community)

**Features**:
- Role-specific content
- Interactive tooltips on actual UI
- Skip option with reminder
- Progress save (resume later)
- Completion badge

---

#### 7. **Milestone Creation Wizard** ⭐ MEDIUM PRIORITY
**Current State**: Part of contract but needs dedicated flow  
**Location**: `/contracts/[id]/milestones/create`  
**Steps Needed**:
- Step 1: Milestone Details (title, description, deliverables)
- Step 2: Payment Amount & Due Date
- Step 3: Acceptance Criteria (checklist)
- Step 4: Review & Create

**Features**:
- Template milestones (design approval, development, testing, launch)
- Auto-calculate percentages of total
- Due date calendar with dependencies
- Deliverable file upload requirements

---

#### 8. **Invoice Creation Wizard** ⭐ MEDIUM PRIORITY
**Current State**: Placeholder (`admin/payments/invoices`)  
**Location**: `/invoices/create`  
**Steps Needed**:
- Step 1: Client Selection & Project Link
- Step 2: Line Items (services, hours, expenses)
- Step 3: Payment Terms (due date, methods)
- Step 4: Notes & Branding (logo, footer text)
- Step 5: Preview & Send

**Features**:
- Recurring invoice templates
- Tax calculation (VAT, GST)
- Multiple currency support
- PDF generation
- Email notification

---

#### 9. **Refund Request Wizard** ⭐ MEDIUM PRIORITY
**Current State**: Placeholder (`admin/payments/refunds`)  
**Location**: `/payments/[id]/refund`  
**Steps Needed**:
- Step 1: Refund Reason (quality issue, cancellation, error)
- Step 2: Amount (full, partial with justification)
- Step 3: Evidence (screenshots, correspondence)
- Step 4: Submit to Admin/Mediator

**Features**:
- Automatic eligibility check
- Partial refund calculator
- Evidence upload (categorized)
- Expected timeline display
- Admin approval workflow

---

#### 10. **Payout Method Setup Wizard** ⭐ HIGH PRIORITY
**Current State**: "Coming soon" (`wallet/page.tsx`)  
**Location**: `/settings/payout-methods/add`  
**Steps Needed**:
- Step 1: Method Type (Bank, PayPal, Stripe, Wise, Crypto)
- Step 2: Account Details (account #, routing, email, wallet address)
- Step 3: Verification (micro-deposits, document upload)
- Step 4: Default Settings (primary method, auto-withdraw)

**Features**:
- Country-specific requirements
- Document upload for verification
- Test transaction option
- Multiple methods management
- Fee comparison tool

---

### 🟡 Enhancement - Improve Existing Flows

#### 11. **Enhanced Search Wizard**
**Current**: AdvancedSearch with filters  
**Enhancement**: Add guided search wizard for new users  
**Steps**:
- Step 1: What are you looking for? (project, freelancer, skill)
- Step 2: Category & Budget Range
- Step 3: Specific Requirements (experience, location, rating)
- Step 4: Results with save search option

---

#### 12. **Review Submission Enhancement**
**Current**: ReviewForm exists  
**Enhancement**: Add context-aware prompts  
**Steps**:
- Pre-fill project details
- Suggest rating based on contract performance (auto-calculated)
- Template responses for common scenarios
- Preview how review appears on profile

---

### 🟢 Nice-to-Have Wizards

13. **Portfolio Item Upload Wizard** (currently in ProfileWizard)
14. **Job Alert Creation Wizard** (`/freelancer/job-alerts`)
15. **Team Invitation Wizard** (`/teams`)
16. **Support Ticket Wizard** (`/support`)
17. **Calendar Event Wizard** (`/admin/calendar`)

---

## 🏗️ Implementation Priority Queue

### Phase 1 - Critical Business Flows (Week 1)
1. Contract Creation Wizard
2. Payment/Withdrawal Wizard
3. Payout Method Setup Wizard
4. Onboarding Tour Wizard

### Phase 2 - User Experience (Week 2)
5. Dispute Resolution Wizard
6. Messaging Initiation Wizard
7. Milestone Creation Wizard
8. Invoice Creation Wizard

### Phase 3 - Platform Maturity (Week 3)
9. Skill Assessment Wizard
10. Refund Request Wizard
11. Enhanced Search Wizard
12. Support Ticket Wizard

---

## 🎨 Wizard Design System

### Common Components Needed
- `WizardContainer` - Shell with progress indicator
- `WizardStep` - Individual step wrapper
- `WizardNavigation` - Back/Next/Skip buttons
- `WizardProgressBar` - Visual progress (1 of 4)
- `StepIndicator` - Numbered circles with labels

### Standard Features
✅ Save progress (draft state)  
✅ Back navigation (preserve data)  
✅ Validation per step  
✅ Mobile responsive  
✅ Theme-aware (light/dark)  
✅ Accessibility (keyboard nav, ARIA)  
✅ Loading states  
✅ Error handling  
✅ Success confirmation  
✅ Help tooltips  

### File Structure (Per Wizard)
```
/components/Wizards/[WizardName]/
  ├── [WizardName]Wizard.tsx
  ├── [WizardName]Wizard.common.module.css
  ├── [WizardName]Wizard.light.module.css
  ├── [WizardName]Wizard.dark.module.css
  ├── steps/
  │   ├── Step1.tsx
  │   ├── Step2.tsx
  │   ├── Step3.tsx
  │   └── Step4.tsx
  └── index.ts
```

---

## 📊 Success Metrics

**User Experience**:
- ↓ Form abandonment rate (target: <15%)
- ↑ Completion rate (target: >85%)
- ↓ Support tickets for "how to" (target: -40%)
- ↑ User satisfaction (NPS improvement)

**Technical**:
- All wizards mobile-responsive
- <2s load time per step
- Save state every 30 seconds
- Zero data loss on navigation

---

## 🚀 Next Actions

1. ✅ Create this plan
2. ⏳ Implement Phase 1 wizards (4 wizards)
3. ⏳ Create shared WizardContainer component
4. ⏳ Backend API endpoints for draft states
5. ⏳ User testing & iteration

---

**Created**: ${new Date().toISOString()}  
**Status**: Ready for implementation  
**Estimated Effort**: 3 weeks (full-time)
