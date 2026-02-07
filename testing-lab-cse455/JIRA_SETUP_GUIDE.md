# 📋 JIRA PROJECT SETUP GUIDE
## MegiLance User Profile Management Testing

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Create Jira Account
1. Go to: https://www.atlassian.com/software/jira/free
2. Sign up with your email
3. Verify email address
4. Choose **Free Plan** (up to 10 users)

### Step 2: Create New Project
1. Click **"Create Project"**
2. Select template: **Scrum** ✅
3. Project Type: **Team-managed**
4. Project Name: `MegiLance User Profile Testing`
5. Project Key: `MPUT`
6. Click **Create**

---

## 📥 IMPORT DATA TO JIRA

### Option A: CSV Import (Recommended)

#### Import Test Cases (50 test cases)

1. Navigate to your project board
2. Click **"..."** menu → **Import**
3. Select **CSV**
4. Upload: `jira-import/test-cases-import.csv`
5. Map fields:
   - Summary → Summary
   - Issue Type → Issue Type (Test)
   - Priority → Priority
   - Description → Description
   - Labels → Labels
6. Click **Begin Import**
7. Wait for confirmation (50 issues imported)

#### Import User Stories (15 stories)

1. Click **"..."** menu → **Import**
2. Upload: `jira-import/user-stories-import.csv`
3. Map fields:
   - Summary → Summary
   - Issue Type → Issue Type (Story)
   - Story Points → Story Points
   - Acceptance Criteria → Description (append)
4. Click **Begin Import**
5. Confirm: 15 user stories imported

#### Import Bugs (20 bugs)

1. Click **"..."** menu → **Import**
2. Upload: `jira-import/bugs-import.csv`
3. Map fields:
   - Summary → Summary
   - Issue Type → Issue Type (Bug)
   - Priority → Priority
   - Severity → Custom Field or Labels
   - Steps to Reproduce → Description
4. Click **Begin Import**
5. Confirm: 20 bugs imported

**Total Issues Imported: 85** ✅

---

### Option B: Manual Creation (If CSV Import Unavailable)

#### Create Issue Types:

**1. Create Story Example:**
```
Issue Type: Story
Summary: User Registration System
Priority: High
Story Points: 8
Description: As a new user I want to register an account
             So that I can access the platform
Acceptance Criteria:
  - Registration form with email/password
  - Email validation
  - Password strength check (8-128 chars)
  - Success/error messages
Labels: user-story, authentication, mvp
```

**2. Create Test Case Example:**
```
Issue Type: Test
Summary: User Registration - Valid Data (ECP)
Priority: High
Description: Test user registration with all valid inputs
             using Equivalence Class Partitioning
Test Steps:
  1. Navigate to signup page
  2. Enter valid data
  3. Submit form
Expected: User registered successfully
Labels: black-box, ecp, registration
```

**3. Create Bug Example:**
```
Issue Type: Bug
Summary: Password reset endpoint returns 500 error
Priority: Highest
Severity: Critical
Environment: Production
Steps to Reproduce:
  1. Go to /forgot-password
  2. Enter email
  3. Click send
Expected: Reset email sent
Actual: 500 error returned
Labels: bug, critical, authentication
```

---

## 🗂️ CONFIGURE PROJECT STRUCTURE

### Create Components:

1. Go to **Project Settings** → **Components**
2. Add these components:
   - **Authentication**
   - **Profile Management**
   - **Settings**
   - **Security**
   - **File Upload**
   - **UI/UX**
   - **Performance**
   - **Compatibility**

### Create Sprints:

1. Go to **Backlog**
2. Click **Create Sprint**
3. Create 3 sprints:
   - **Sprint 1:** Critical & Security Fixes (2 weeks)
   - **Sprint 2:** Profile Features (2 weeks)
   - **Sprint 3:** Enhancements & Polish (2 weeks)

### Assign Issues to Sprints:

**Sprint 1 - Critical (Week 1-2):**
- SQL Injection bug (BUG-006)
- XSS Attack bug (BUG-007)
- CORS Error bug (BUG-015)
- Password Reset bug (BUG-001)
- All Authentication test cases (TC-001 to TC-013)

**Sprint 2 - Features (Week 3-4):**
- Profile Update stories
- Avatar Upload stories
- All Profile Management tests (TC-014 to TC-030)
- Bio Truncation bug (BUG-002)
- Rate Limiting bug (BUG-008)

**Sprint 3 - Polish (Week 5-6):**
- Settings stories
- Account Deletion stories
- UI/UX tests (TC-040 to TC-050)
- Low priority bugs (BUG-003, BUG-013, etc.)

---

## 🎨 CUSTOMIZE BOARD

### Create Columns:

1. **Backlog** → New issues
2. **To Do** → Planned for sprint
3. **In Progress** → Currently being worked on
4. **Testing** → Ready for QA
5. **Done** → Completed & verified

### Add Swimlanes:

1. Go to **Board Settings** → **Swimlanes**
2. Group by: **Priority**
3. Order: Highest → High → Medium → Low

### Create Filters:

**Filter 1: My Test Cases**
```
project = MPUT AND 
issuetype = Test AND 
assignee = currentUser()
```

**Filter 2: Critical Bugs**
```
project = MPUT AND 
issuetype = Bug AND 
priority IN (Highest, High)
```

**Filter 3: Sprint 1 Items**
```
project = MPUT AND 
sprint = "Sprint 1"
```

---

## 📊 CREATE DASHBOARD

1. Go to **Dashboards** → **Create Dashboard**
2. Name: "User Profile Testing Dashboard"
3. Add these gadgets:

### Gadget 1: Sprint Burndown Chart
- Shows: Progress in current sprint
- Tracks: Remaining work vs ideal

### Gadget 2: Issue Statistics
- Shows: Issues by type (Story/Test/Bug)
- Chart Type: Pie chart

### Gadget 3: Test Execution Report
- Shows: Passed/Failed test cases
- Filters: Issue Type = Test

### Gadget 4: Bug Distribution
- Shows: Bugs by severity
- Chart Type: Bar chart

### Gadget 5: Velocity Chart
- Shows: Story points completed per sprint
- Tracks: Team velocity

---

## 🔔 CONFIGURE NOTIFICATIONS

1. Go to **Profile** → **Personal Settings** → **Email**
2. Enable notifications for:
   - ✅ Issue assigned to me
   - ✅ Issue commented
   - ✅ Issue status changed
   - ✅ Sprint started/completed

---

## 👥 ADD TEAM MEMBERS (Optional)

1. Go to **Project Settings** → **People**
2. Click **Add People**
3. Enter email addresses:
   - Teammates
   - Instructor (as viewer)
4. Set roles:
   - **Administrator:** You
   - **Member:** Teammates
   - **Viewer:** Instructor

---

## 🎯 WORKFLOW SETUP

### Test Execution Workflow:

```
TO DO → IN PROGRESS → TESTING → DONE
         (Running)    (Verify)   (Passed)
                         ↓
                     BLOCKED
                     (Failed)
```

### Bug Workflow:

```
OPEN → IN PROGRESS → CODE REVIEW → TESTING → CLOSED
                          ↓            ↓
                       REJECTED    REOPENED
```

---

## 📝 QUICK ACTIONS

### Create New Test Case:
1. Click **"+"** button
2. Select **Test**
3. Fill summary and description
4. Add to backlog or sprint
5. Assign to yourself

### Log Test Results:
1. Open test case
2. Add comment with result
3. Update status:
   - ✅ Pass → Move to Done
   - ❌ Fail → Create Bug, link it
4. Add attachments (screenshots)

### Track Bug:
1. Create bug from failed test
2. Link to test case
3. Set severity and priority
4. Assign to developer
5. Track through workflow

---

## 📊 REPORT GENERATION

### Test Summary Report:

1. Go to **Reports** → **Create Report**
2. Select **Test Summary**
3. Configure:
   - Date range: Last 2 weeks
   - Test type: All
   - Status: Pass/Fail
4. Export as PDF

### Bug Status Report:

1. Go to **Reports** → **Bug Status**
2. Filter:
   - Priority: High & Critical
   - Status: Open & In Progress
3. Group by: Component
4. Export for submission

---

## 🎓 FOR LAB SUBMISSION

### Deliverables in Jira:

1. ✅ **Project Board Screenshot**
   - Show all 85 issues
   - Organized by sprints
   - Color-coded by priority

2. ✅ **Test Case List**
   - Export: All 50 test cases
   - Format: PDF or Excel
   - Include: ID, Summary, Status

3. ✅ **Bug Report Summary**
   - Export: All 20 bugs
   - Show: Severity distribution
   - Include: Steps to reproduce

4. ✅ **Dashboard View**
   - Screenshot of dashboard
   - Show: Charts and metrics
   - Include: Burndown chart

5. ✅ **Sprint Board**
   - Show current sprint
   - Display: In Progress items
   - Include: Team velocity

---

## 🚀 DEMO PREPARATION

### Before Demo:

1. **Update Test Results**
   - Mark 40+ tests as Passed
   - Mark 5 tests as Failed (create bugs)
   - Update status in Jira

2. **Link Issues**
   - Link bugs to failed tests
   - Link tests to user stories
   - Show traceability

3. **Add Comments**
   - Document findings
   - Add test evidence
   - Upload screenshots

4. **Generate Reports**
   - Sprint report
   - Bug report
   - Test coverage report

### Demo Flow:

1. **Show Board** (2 min)
   - Explain structure
   - Show sprints
   - Highlight priorities

2. **Show Test Cases** (3 min)
   - Open example test
   - Explain ECP/BVA
   - Show results

3. **Show Bugs** (3 min)
   - Open critical bug
   - Explain severity
   - Show workflow

4. **Show Reports** (2 min)
   - Dashboard overview
   - Test coverage
   - Bug distribution

---

## 📞 TROUBLESHOOTING

### Issue: CSV Import Fails
**Solution:** Check CSV format, ensure comma-separated, no special characters in headers

### Issue: Cannot Create Test Issue Type
**Solution:** Install **Zephyr for Jira** add-on (free version) or use Story type with "TEST" label

### Issue: Custom Fields Not Showing
**Solution:** Go to Issue Type → Screen → Add custom fields

### Issue: Cannot Add Team Members (Free Plan Limit)
**Solution:** Free plan allows 3 users. Upgrade to Standard ($7.50/user/month) if needed

---

## ✅ FINAL CHECKLIST

Before Lab Submission:

- [ ] Jira project created with MPUT key
- [ ] Scrum template selected
- [ ] 85 issues imported (50 tests + 15 stories + 20 bugs)
- [ ] Components configured (8 components)
- [ ] 3 Sprints created and populated
- [ ] Board customized with columns and swimlanes
- [ ] Dashboard created with charts
- [ ] Test results documented
- [ ] Bugs linked to failed tests
- [ ] Screenshots captured
- [ ] Reports generated
- [ ] Ready for demo

---

## 🎯 EXPECTED OUTCOMES

After following this guide:

✅ **Fully functional Jira Scrum project**  
✅ **85 issues organized and tracked**  
✅ **Visual board for sprint planning**  
✅ **Professional reports for lab submission**  
✅ **Traceability from requirements to tests to bugs**  
✅ **Ready for FYP evaluation & viva**

---

## 📚 ADDITIONAL RESOURCES

- **Jira Documentation:** https://support.atlassian.com/jira/
- **Scrum Guide:** https://scrumguides.org/
- **Agile Testing:** https://www.atlassian.com/agile/software-development/testing
- **CSV Import Guide:** https://support.atlassian.com/jira-cloud-administration/docs/import-data-from-a-csv-file/

---

**Status:** ✅ COMPLETE - Jira Setup Guide Ready

**Time to Complete:** 30-45 minutes  
**Difficulty:** Easy  
**Result:** Production-ready test management system

---

**For Questions:** Check Jira Community or Atlassian Support
