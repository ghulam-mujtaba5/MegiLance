# FYP Finalization Strategy: MegiLance

**Goal**: Prepare MegiLance for Final Year Project submission. Ensure all core features are robust, "half-done" tasks are completed, and the project is polished.

## 1. Scope Refinement & Cleanup
- **Objective**: Remove experimental/unstable features to ensure a crash-free demo.
- **Action**:
    - [x] **Exclude AI Module**: Completely disable/remove `ai/` folder and references in Backend (`routers.py`, `services/`).
    - [ ] **Exclude Blockchain Module**: If unstable, disable it to focus on core functionality (or ensure it works perfectly with mock data if real chain interaction is flaky).
    - [ ] **Verify Dependencies**: Remove unused packages (`openai`, `web3` if disabled) to speed up install/build.

## 2. Core Feature Completion ("Gap Filling")
- **Objective**: Ensure no "Not Implemented" errors during the demo.
- **Action**:
    - [ ] **Backend TODOs**: Scan and implement critical TODOs in `payments.py`, `upload.py`, `admin.py`.
    - [ ] **File Uploads**: Ensure local file upload works (profile pics, project attachments) if S3 is too complex for now.
    - [ ] **Notifications**: Ensure basic database notifications work for key events (proposal received, contract started).

## 3. Developer Experience & Demo Tools
- **Objective**: Make it easy to demonstrate all roles (Client, Freelancer, Admin) without constant logging in/out.
- **Action**:
    - [x] **Quick Login Widget**: Add a dev-only floating widget or sidebar in Frontend to switch users instantly.
        - *Roles*: Admin, Client, Freelancer.
        - *Mechanism*: Pre-defined JWT generation or auto-fill login forms.
    - [ ] **Database Seeding**: Ensure `turso` DB has rich sample data (users, projects, proposals) so the app doesn't look empty.

## 4. Turso & Infrastructure Verification
- **Objective**: Ensure the database connection is stable and CLI tools work.
- **Action**:
    - [x] **Turso Check**: Verify `turso db show` and connection strings. (Implemented robust `TursoHTTP` client with local fallback).
    - [ ] **Migrations**: Run `alembic upgrade head` to ensure schema is up to date.

## 5. Frontend Polish
- **Objective**: Professional look and feel.
- **Action**:
    - [ ] **Theme Check**: Verify Light/Dark mode consistency.
    - [ ] **Responsive Check**: Ensure layout doesn't break on smaller screens (though demo is likely Desktop).
    - [ ] **Error Handling**: Graceful error messages instead of white screens.

## 6. Final Testing
- **Objective**: Walkthrough of the "Happy Path".
- **Action**:
    - [ ] **User Flow 1**: Register -> Post Job (Client).
    - [ ] **User Flow 2**: Search Job -> Submit Proposal (Freelancer).
    - [ ] **User Flow 3**: Accept Proposal -> Create Contract (Client).
    - [ ] **User Flow 4**: Admin Dashboard review.

---
**Execution Order**:
1. Cleanup (AI/Blockchain removal).
2. Turso Verification.
3. Backend Gap Filling.
4. Quick Login Implementation.
5. Frontend Polish.
6. Final Walkthrough.
