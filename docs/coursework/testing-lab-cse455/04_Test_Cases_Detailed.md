# 📋 LAB MANUAL PAGES 22-25: TEST CASES & BUG REPORTING

---

## 📄 PAGE 22-23: TEST CASE DESIGN FORMAT

### 🎯 What is a Test Case?

**Definition:**  
A test case is a set of conditions/steps to verify whether a software feature works correctly.

**Purpose:**
- Document expected behavior
- Ensure comprehensive testing
- Enable reproducible testing
- Facilitate defect tracking

---

## 📊 STANDARD TEST CASE FORMAT

### Required Fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Test Case ID** | Unique identifier | TC-MPUT-001 |
| **Module** | Feature being tested | User Registration |
| **Test Title** | Brief description | Valid user registration with all fields |
| **Priority** | Importance level | High / Medium / Low |
| **Preconditions** | Setup before test | Database cleared, API running |
| **Test Steps** | Actions to perform | 1. Open form<br>2. Enter data<br>3. Click submit |
| **Test Data** | Input values | Email: test@mail.com<br>Password: Pass1234 |
| **Expected Result** | What should happen | User created, redirected to dashboard |
| **Actual Result** | What actually happened | User created successfully |
| **Status** | Test outcome | Pass / Fail / Blocked |
| **Tested By** | Tester name | Waqar Ul Mulk |
| **Date** | Execution date | 2024-02-02 |
| **Comments** | Additional notes | None |

---

## 📝 DETAILED TEST CASES: USER PROFILE MANAGEMENT MODULE

### TEST CASE #1: User Registration - Valid Data

```
╔═══════════════════════════════════════════════════════════╗
║                    TEST CASE DETAILS                      ║
╚═══════════════════════════════════════════════════════════╝

Test Case ID:      TC-MPUT-001
Module:            User Registration
Test Title:        Register new user with valid data
Priority:          🔴 High
Test Type:         Functional (Black-Box)
Technique:         ECP (Valid Class)

╔═══════════════════════════════════════════════════════════╗
║                     PRECONDITIONS                         ║
╚═══════════════════════════════════════════════════════════╝
✓ Backend API is running (localhost:8000)
✓ Frontend is accessible (localhost:3000)
✓ Database is connected (Turso)
✓ Email verification service is active
✓ No existing user with test email

╔═══════════════════════════════════════════════════════════╗
║                      TEST STEPS                           ║
╚═══════════════════════════════════════════════════════════╝
Step 1: Navigate to http://localhost:3000/signup
Step 2: Enter Full Name: "Waqar Ul Mulk"
Step 3: Enter Email: "waqar.test@megilance.com"
Step 4: Enter Password: "SecurePass2024!"
Step 5: Enter Confirm Password: "SecurePass2024!"
Step 6: Select Role: "Freelancer"
Step 7: Enter Age: 25
Step 8: Check "I agree to Terms & Conditions"
Step 9: Click "Sign Up" button

╔═══════════════════════════════════════════════════════════╗
║                      TEST DATA                            ║
╚═══════════════════════════════════════════════════════════╝
Full Name:         Waqar Ul Mulk
Email:             waqar.test@megilance.com
Password:          SecurePass2024!
Confirm Password:  SecurePass2024!
Role:              Freelancer
Age:               25

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✓ Registration successful
✓ User record created in database
✓ Password hashed (not plaintext)
✓ Verification email sent
✓ Success message displayed: "Account created! Check email."
✓ Redirected to login page or email verification page

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✅ User registered successfully
✅ Email: waqar.test@megilance.com created
✅ Password stored as bcrypt hash
✅ Verification email sent
✅ Redirected to /verify-email page

╔═══════════════════════════════════════════════════════════╗
║                    TEST RESULT                            ║
╚═══════════════════════════════════════════════════════════╝
Status:     ✅ PASS
Tested By:  Waqar Ul Mulk
Date:       2024-02-02
Duration:   2 minutes
```

---

### TEST CASE #2: User Registration - Invalid Email (BVA)

```
╔═══════════════════════════════════════════════════════════╗
║                    TEST CASE DETAILS                      ║
╚═══════════════════════════════════════════════════════════╝

Test Case ID:      TC-MPUT-002
Module:            User Registration
Test Title:        Register with invalid email format
Priority:          🟡 Medium
Test Type:         Negative Testing (Black-Box)
Technique:         ECP (Invalid Class)

╔═══════════════════════════════════════════════════════════╗
║                      TEST STEPS                           ║
╚═══════════════════════════════════════════════════════════╝
Step 1: Navigate to signup page
Step 2: Enter Full Name: "Test User"
Step 3: Enter Email: "invalidemail@" (Missing domain)
Step 4: Enter Password: "SecurePass2024!"
Step 5: Click "Sign Up"

╔═══════════════════════════════════════════════════════════╗
║                      TEST DATA                            ║
╚═══════════════════════════════════════════════════════════╝
Email: invalidemail@

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✗ Registration blocked
✗ Error message: "Please enter a valid email address"
✗ Email field highlighted in red
✗ User NOT created in database
✗ No API call made to backend

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✅ Validation error shown
✅ Message: "Invalid email format"
✅ No database entry created
✅ Form not submitted

╔═══════════════════════════════════════════════════════════╗
║                    TEST RESULT                            ║
╚═══════════════════════════════════════════════════════════╝
Status:     ✅ PASS
Tested By:  Waqar Ul Mulk
Date:       2024-02-02
```

---

### TEST CASE #3: Password Change - Boundary Value (BVA)

```
╔═══════════════════════════════════════════════════════════╗
║                    TEST CASE DETAILS                      ║
╚═══════════════════════════════════════════════════════════╝

Test Case ID:      TC-MPUT-003
Module:            User Settings - Password Change
Test Title:        Change password with minimum length (8 chars)
Priority:          🔴 High
Test Type:         Boundary Value Analysis
Technique:         BVA (Minimum Boundary)

╔═══════════════════════════════════════════════════════════╗
║                     PRECONDITIONS                         ║
╚═══════════════════════════════════════════════════════════╝
✓ User is logged in
✓ User has existing password
✓ Password policy: 8-128 characters

╔═══════════════════════════════════════════════════════════╗
║                      TEST STEPS                           ║
╚═══════════════════════════════════════════════════════════╝
Step 1: Navigate to /settings/security
Step 2: Click "Change Password"
Step 3: Enter Current Password: "OldPass123"
Step 4: Enter New Password: "NewPass1" (exactly 8 chars)
Step 5: Enter Confirm Password: "NewPass1"
Step 6: Click "Update Password"

╔═══════════════════════════════════════════════════════════╗
║                      TEST DATA                            ║
╚═══════════════════════════════════════════════════════════╝
Current Password:  OldPass123
New Password:      NewPass1 (8 characters - boundary value)
Confirm Password:  NewPass1

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✓ Password changed successfully
✓ New password accepted (8 chars is valid)
✓ Success message shown
✓ User can login with new password
✓ Old password no longer works

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✅ Password updated in database
✅ Success message: "Password changed successfully"
✅ Login successful with new password

╔═══════════════════════════════════════════════════════════╗
║                    TEST RESULT                            ║
╚═══════════════════════════════════════════════════════════╝
Status:     ✅ PASS
Tested By:  Waqar Ul Mulk
Date:       2024-02-02
Comments:   Boundary value test - minimum length accepted
```

---

### TEST CASE #4: Profile Avatar Upload - Max Size (BVA)

```
╔═══════════════════════════════════════════════════════════╗
║                    TEST CASE DETAILS                      ║
╚═══════════════════════════════════════════════════════════╝

Test Case ID:      TC-MPUT-004
Module:            Profile Management - Avatar Upload
Test Title:        Upload avatar exceeding max size (10MB)
Priority:          🟡 Medium
Test Type:         Negative Testing - Boundary Value
Technique:         BVA (Above Maximum)

╔═══════════════════════════════════════════════════════════╗
║                     PRECONDITIONS                         ║
╚═══════════════════════════════════════════════════════════╝
✓ User logged in
✓ Max file size: 10MB (10,485,760 bytes)
✓ Allowed formats: JPG, PNG, WebP

╔═══════════════════════════════════════════════════════════╗
║                      TEST STEPS                           ║
╚═══════════════════════════════════════════════════════════╝
Step 1: Navigate to /profile/edit
Step 2: Click "Upload Avatar"
Step 3: Select file: avatar_12mb.jpg (12MB)
Step 4: Click "Upload"

╔═══════════════════════════════════════════════════════════╗
║                      TEST DATA                            ║
╚═══════════════════════════════════════════════════════════╝
File: avatar_12mb.jpg
Size: 12,582,912 bytes (12MB)
Format: JPG

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✗ Upload rejected
✗ Error message: "File size must be less than 10MB"
✗ File not uploaded to server
✗ Avatar not changed in profile

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✅ Upload blocked
✅ Error: "Maximum file size is 10MB"
✅ No server request made
✅ Avatar unchanged

╔═══════════════════════════════════════════════════════════╗
║                    TEST RESULT                            ║
╚═══════════════════════════════════════════════════════════╝
Status:     ✅ PASS
Tested By:  Waqar Ul Mulk
Date:       2024-02-02
Comments:   BVA test - correctly rejects files above 10MB limit
```

---

## 🐛 PAGE 24-25: BUG REPORTING BASICS

### 🎯 What is a Bug?

**Definition:**  
A **bug** (defect) is when actual behavior differs from expected behavior.

**Bug vs Issue:**
- **Bug:** Software doesn't work as expected
- **Issue:** Enhancement request or question

---

## 📊 BUG REPORT FORMAT

### Required Fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Bug ID** | Unique identifier | BUG-MPUT-001 |
| **Summary** | One-line description | Profile update fails for long bio |
| **Module** | Affected feature | Profile Management |
| **Severity** | Impact level | Critical / High / Medium / Low |
| **Priority** | Fix urgency | P1 (Immediate) / P2 / P3 / P4 |
| **Status** | Current state | Open / In Progress / Fixed / Closed |
| **Environment** | Where found | Dev / Staging / Production |
| **Steps to Reproduce** | How to recreate | 1. Login<br>2. Edit bio<br>3. Save |
| **Expected Result** | What should happen | Bio saved successfully |
| **Actual Result** | What happened | Error 500 returned |
| **Attachments** | Screenshots/logs | error_screenshot.png |
| **Reported By** | Tester name | Waqar Ul Mulk |
| **Date** | Report date | 2024-02-02 |

---

### 🔴 SEVERITY LEVELS

| Level | Description | Example |
|-------|-------------|---------|
| **Critical** | System crash, data loss | Database wipe on logout |
| **High** | Major feature broken | Cannot login |
| **Medium** | Feature works but with issues | Slow page load |
| **Low** | Minor issue, cosmetic | Button text typo |

### ⚡ PRIORITY LEVELS

| Level | Description | When to Fix |
|-------|-------------|-------------|
| **P1** | Immediate | Hotfix (same day) |
| **P2** | High | Next sprint |
| **P3** | Medium | Backlog (2-3 sprints) |
| **P4** | Low | If time permits |

---

## 🐛 SAMPLE BUG REPORTS

### BUG REPORT #1: Critical Bug

```
╔═══════════════════════════════════════════════════════════╗
║                      BUG REPORT                           ║
╚═══════════════════════════════════════════════════════════╝

Bug ID:        BUG-MPUT-001
Summary:       Password reset endpoint returns 500 error
Module:        User Authentication
Severity:      🔴 CRITICAL
Priority:      P1 (Immediate)
Status:        🔴 OPEN
Environment:   Production
Reporter:      Waqar Ul Mulk
Date:          2024-02-02

╔═══════════════════════════════════════════════════════════╗
║                  STEPS TO REPRODUCE                       ║
╚═══════════════════════════════════════════════════════════╝
1. Navigate to /forgot-password
2. Enter email: "waqar@megilance.com"
3. Click "Send Reset Link"
4. Observe API response

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✓ Reset email sent successfully
✓ API returns 200 OK
✓ User receives reset link via email
✓ Success message: "Check your email for reset link"

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✗ API returns 500 Internal Server Error
✗ No email sent
✗ Error message: "Something went wrong"
✗ Console error: "SMTP connection failed"

╔═══════════════════════════════════════════════════════════╗
║                      ERROR LOGS                           ║
╚═══════════════════════════════════════════════════════════╝
Traceback (most recent call last):
  File "backend/app/api/v1/auth.py", line 145
  SMTPException: Connection refused (smtp.gmail.com:587)

╔═══════════════════════════════════════════════════════════╗
║                  IMPACT ANALYSIS                          ║
╚═══════════════════════════════════════════════════════════╝
• Users cannot reset forgotten passwords
• Customer support tickets increasing
• Login blocked for affected users
• Potential revenue loss

╔═══════════════════════════════════════════════════════════╗
║                 SUGGESTED FIX                             ║
╚═══════════════════════════════════════════════════════════╝
1. Verify SMTP credentials in .env file
2. Check firewall rules (port 587)
3. Add better error handling
4. Implement email queue fallback

╔═══════════════════════════════════════════════════════════╗
║                    ATTACHMENTS                            ║
╚═══════════════════════════════════════════════════════════╝
📎 error_screenshot.png
📎 backend_logs.txt
📎 network_trace.har
```

---

### BUG REPORT #2: Medium Severity Bug

```
╔═══════════════════════════════════════════════════════════╗
║                      BUG REPORT                           ║
╚═══════════════════════════════════════════════════════════╝

Bug ID:        BUG-MPUT-002
Summary:       Profile bio truncated at 255 chars instead of 500
Module:        Profile Management
Severity:      🟡 MEDIUM
Priority:      P2 (Next Sprint)
Status:        🟠 IN PROGRESS
Environment:   Staging
Reporter:      Waqar Ul Mulk
Date:          2024-02-02

╔═══════════════════════════════════════════════════════════╗
║                  STEPS TO REPRODUCE                       ║
╚═══════════════════════════════════════════════════════════╝
1. Login as freelancer
2. Go to /profile/edit
3. Enter bio with 300 characters
4. Click "Save Profile"
5. Refresh page
6. Check bio length

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✓ Full 300-character bio saved
✓ All text visible on profile
✓ Max limit: 500 characters (as per requirements)

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✗ Only first 255 characters saved
✗ Text truncated without warning
✗ Remaining 45 characters lost

╔═══════════════════════════════════════════════════════════╗
║                    ROOT CAUSE                             ║
╚═══════════════════════════════════════════════════════════╝
Database column: VARCHAR(255)
Should be: VARCHAR(500)

File: backend/app/models/user.py
Line: 45

bio = Column(String(255))  # Should be 500

╔═══════════════════════════════════════════════════════════╗
║                 SUGGESTED FIX                             ║
╚═══════════════════════════════════════════════════════════╝
1. Update model: String(255) → String(500)
2. Create Alembic migration
3. Run migration on staging
4. Add frontend validation (500 char limit)
5. Test with edge cases
```

---

### BUG REPORT #3: Low Severity Bug

```
╔═══════════════════════════════════════════════════════════╗
║                      BUG REPORT                           ║
╚═══════════════════════════════════════════════════════════╝

Bug ID:        BUG-MPUT-003
Summary:       "Save" button text misaligned in dark mode
Module:        UI/UX - Profile Settings
Severity:      🟢 LOW
Priority:      P4 (Nice to have)
Status:        🔵 OPEN
Environment:   Development
Reporter:      Waqar Ul Mulk
Date:          2024-02-02

╔═══════════════════════════════════════════════════════════╗
║                  STEPS TO REPRODUCE                       ║
╚═══════════════════════════════════════════════════════════╝
1. Enable dark mode
2. Navigate to /settings
3. Observe "Save" button

╔═══════════════════════════════════════════════════════════╗
║                   EXPECTED RESULT                         ║
╚═══════════════════════════════════════════════════════════╝
✓ Button text centered
✓ Proper padding on all sides

╔═══════════════════════════════════════════════════════════╗
║                    ACTUAL RESULT                          ║
╚═══════════════════════════════════════════════════════════╝
✗ Text slightly off-center (2px to left)
✗ Noticeable only on dark theme

╔═══════════════════════════════════════════════════════════╗
║                    ROOT CAUSE                             ║
╚═══════════════════════════════════════════════════════════╝
CSS padding inconsistency in dark theme file

File: Button.dark.module.css
Missing: text-align: center;

╔═══════════════════════════════════════════════════════════╗
║                 SUGGESTED FIX                             ║
╚═══════════════════════════════════════════════════════════╝
Add to Button.dark.module.css:
.button {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

---

## 📊 BUG TRACKING SUMMARY TABLE

| Bug ID | Module | Summary | Severity | Priority | Status |
|--------|--------|---------|----------|----------|--------|
| BUG-MPUT-001 | Auth | Password reset fails | Critical | P1 | Open |
| BUG-MPUT-002 | Profile | Bio truncated at 255 | Medium | P2 | In Progress |
| BUG-MPUT-003 | UI/UX | Button misaligned | Low | P4 | Open |

---

## 🎓 Viva Preparation - Bug Reporting

**Q1: What is a bug?**  
**A:** Difference between expected and actual behavior.

**Q2: Difference between severity and priority?**  
**A:** 
- **Severity:** Impact on system (how bad)
- **Priority:** When to fix (how urgent)

Example: Typo = Low severity, High priority (if on homepage)

**Q3: What makes a good bug report?**  
**A:** 
- Clear summary
- Reproducible steps
- Expected vs Actual result
- Screenshots/logs
- Environment details

**Q4: Give example of Critical bug**  
**A:** Database wipe, system crash, data loss, security breach.

**Q5: Why attach screenshots?**  
**A:** Visual proof helps developers understand and reproduce issue faster.

---

**Status:** ✅ COMPLETE - All Test Cases & Bug Reports Ready

**Next:** Generate Jira CSV Import Files
