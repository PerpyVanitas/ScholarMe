# ScholarMe — Honor Society RBAC Reference

> This document is the **authoritative access control reference** for ScholarMe.  
> When implementing route guards, sidebar items, or API permissions, **this file wins**.  
> Last updated: 2026-07-13

---

## Role Architecture Overview

### Two-Layer Role Model

ScholarMe uses a **two-layer role model**:

| Layer            | Roles                                                                                                                                | Description                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **System Roles** | `super_admin`, `administrator`                                                                                                       | Assigned on top of any org position. Not tied to committee membership. Can be held by any person. Only **one** `super_admin` can exist at a time. |
| **Org Roles**    | `president`, `vice_president`, `secretary`, `treasurer`, `auditor`, `committee_head`, `assistant_committee_head`, `tutor`, `learner` | Reflect a person's actual position in the Honor Society or their status as an external learner.                                                   |

System roles **override and supersede** org roles. A person can be, for example, a `committee_head` in the org AND be assigned `administrator` for system access — they hold both simultaneously, and the higher privilege applies.

### Hierarchy (Highest → Lowest)

```text
super_admin
    └── administrator
          └── president
                └── vice_president
                      └── secretary / treasurer / auditor
                            └── committee_head
                                  └── assistant_committee_head
                                        └── tutor (Regular Member / ESAS)
                                              └── learner (External)
```

---

## Concurrent Status Model — How Many Statuses Can a User Hold?

A single user in ScholarMe is **not just one thing**. Their full identity is assembled from **up to four independent status layers**, all tracked separately in the database. Understanding this is critical for correctly implementing UI visibility, route guards, and feature access.

---

### The Four Status Layers

| Layer                            | Field in DB                                                    | Values                                                                                                                    | Stacks with others?                                                                 |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **1. Account Type**              | `roles.name` (primary)                                         | `learner` or any Honor Society role                                                                                       | Mutually exclusive at the account level                                             |
| **2. Membership Classification** | `profiles.membership_classification` / `profiles.esas_scholar` | `regular_member`, `esas_scholar`                                                                                          | ✅ Stacks on top of any tutor-tier role                                             |
| **3. Org Position**              | `profiles.role_id` → org roles                                 | `tutor`, `committee_head`, `assistant_committee_head`, `president`, `vice_president`, `secretary`, `treasurer`, `auditor` | One active at a time; **expires June 30**                                           |
| **4. System Role Overlay**       | `profiles.role_id` → system roles                              | `administrator`, `super_admin`                                                                                            | ✅ Layered on top of any org position (tracked via highest-privilege role_id in DB) |

> **Database reality:** `profiles.role_id` stores a **single** role at a time. When a system role overlay is assigned (e.g., `administrator`), it becomes the stored role. The org position is tracked via `org_assignments`. Both are used together to compute the full user identity.

---

### Position Exclusivity — Who Can Hold Each Role?

#### Singleton Positions (Only One Person at a Time, System-Wide)

These positions can only be held by exactly one person. Assigning a new person auto-clears the previous holder.

| Position                | Max Count | Notes                                                                                              |
| ----------------------- | :-------: | -------------------------------------------------------------------------------------------------- |
| `super_admin`           |   **1**   | Hard enforced via DB unique partial index. Cannot self-resign; must be transferred by super_admin. |
| `president`             |   **1**   | Expires June 30. Set via Org Structure page.                                                       |
| `vice_president`        |   **1**   | Expires June 30.                                                                                   |
| `secretary` (Executive) |   **1**   | Expires June 30. Different from committee secretaries.                                             |
| `treasurer`             |   **1**   | Expires June 30.                                                                                   |
| `auditor`               |   **1**   | Expires June 30.                                                                                   |

#### Per-Committee Singleton Positions (One Person per Committee)

These roles are exclusive within each committee, but multiple people can hold the same role across different committees.

| Position                   |          Max Count           | Notes                                                               |
| -------------------------- | :--------------------------: | ------------------------------------------------------------------- |
| `committee_head`           | **1 per committee** (18 max) | 11 Main + 7 ESAS committees = up to 18 committee heads system-wide. |
| `assistant_committee_head` | **1 per committee** (18 max) | Same structure.                                                     |

#### Multi-Person Positions (Many People Can Hold)

| Position        |   Max Count   | Notes                                                                          |
| --------------- | :-----------: | ------------------------------------------------------------------------------ |
| `administrator` | **Unlimited** | Assigned by `super_admin` only. No cap.                                        |
| `tutor`         | **Unlimited** | Base role for all Honor Society members.                                       |
| `learner`       | **Unlimited** | External students only. **Cannot be upgraded to admin or any other position.** |

---

### Concurrent Status Combinations — What Can Stack?

This table maps every valid combination a single user can hold simultaneously.

| Combination                                         |     Valid?     | Example Scenario                                                                                |
| --------------------------------------------------- | :------------: | ----------------------------------------------------------------------------------------------- |
| `learner` alone                                     |       ✅       | External student using PLC services                                                             |
| `learner` + `administrator`                         | ❌ **BLOCKED** | Learners are non-members; cannot hold system positions                                          |
| `learner` + any org role                            | ❌ **BLOCKED** | Learners must stay learners; joining the org requires account conversion                        |
| `tutor` alone                                       |       ✅       | Regular Member with no committee leadership role                                                |
| `tutor` + `esas_scholar`                            |       ✅       | ESAS Scholar — the most common combo for ESAS committee members                                 |
| `tutor` + `esas_scholar` + `administrator`          |       ✅       | ESAS scholar who was additionally assigned admin by super_admin                                 |
| `committee_head` alone                              |       ✅       | Regular Member serving as committee head (exempt from 90hr if ESAS)                             |
| `committee_head` + `esas_scholar`                   |       ✅       | ESAS Scholar serving as committee head — exempt from 90hr requirement                           |
| `committee_head` + `esas_scholar` + `administrator` |       ✅       | **Maximum combo for a non-executive member**                                                    |
| `president` alone                                   |       ✅       | President with no system role                                                                   |
| `president` + `administrator`                       |       ✅       | President also assigned admin for system management                                             |
| `president` + `esas_scholar`                        |       ✅       | Unusual but valid if president holds ESAS classification                                        |
| `president` + `esas_scholar` + `administrator`      |       ✅       | **Maximum combo for an executive**                                                              |
| `super_admin` alone                                 |       ✅       | The system super_admin (typically a dedicated account)                                          |
| `super_admin` + any other role                      |   ⚠️ Unique    | `super_admin` supersedes all. The system treats super_admin as if they inherit all other roles. |

---

### Maximum Simultaneous Status Combinations

```text
Regular Tutor:
  └── [Tutor] + [ESAS Scholar] + [Administrator]
      = 3 statuses max

Committee Head:
  └── [Committee Head] + [ESAS Scholar] + [Administrator]
      = 3 statuses max

Executive:
  └── [President / VP / Secretary / Treasurer / Auditor] + [ESAS Scholar] + [Administrator]
      = 3 statuses max

Super Admin:
  └── [Super Admin] (inherits all capabilities — treated as Tutor + Admin diagnostically)
      = 1 stored role, infinite effective access
```

---

### The Learner Firewall

> [!CAUTION]
> **Learner accounts have a hard identity lock.** The system must enforce the following rules at both the API and UI layers:
>
> - A `learner` role **cannot be assigned** `administrator` or `super_admin`.
> - A `learner` **cannot be placed** in any `org_assignments` row.
> - A `learner` **cannot hold** `committee_head`, `assistant_committee_head`, or any executive role.
> - A learner who joins the Honor Society must have their account **manually converted** to `tutor` by a `super_admin` or `administrator`. This is not automatic.
> - Until conversion, the user retains all learner restrictions even if they are physically present in the org.

---

### Visual Status Card (How Profiles Should Display)

When rendering a user's profile or ID card, assemble the display from all active layers:

```text
[Full Name]
[Primary Role Label]         ← Highest active role (e.g., "Committee Head")
[Committee Name]             ← If committee_head/asst, show which committee
[ESAS Scholar]               ← Badge shown if esas_scholar = true
[Administrator]              ← Secondary badge if system role is admin
[Member Since: ...]
```

Example:

```text
Van Woodroe Perpetua
Committee Head
Committee on Finance (COF)
🎓 ESAS Scholar  ⚙️ Administrator
Member Since: 2024
```

---

## Role Definitions

### 🔴 Super Admin (`super_admin`)

- **Uniqueness:** Only **one** super_admin account may exist in the system at any time.
- **Nature:** A system-level override role. Can be assigned to any person regardless of their org position.
- **Purpose:** Absolute failsafe. Full access to every feature for debugging, recovery, and compliance.
- **As Learner/Tutor:** Must be able to act as both a learner and a tutor for diagnostic purposes. All workspace routes must allow super_admin.

### 🟠 Administrator (`administrator`)

- **Uniqueness:** Multiple admins may exist.
- **Nature:** A system-level management role. Can be assigned to any person regardless of their org position.
- **Purpose:** Day-to-day platform management, user support, configuration. Does NOT have destructive-level access (cannot delete users, read private messages, or perform database-level operations).
- **Cannot:** Delete user accounts, read DMs/audit private messages, access system integration secrets, provision new super_admin accounts.

### 🟡 Executives

Five roles with distinct authorities:

- **`president`** — Full org authority. Final approver on finance, member status, and committee actions.
- **`vice_president`** — Operational oversight. Assumes president duties in their absence.
- **`secretary`** — Records, notices, attendance. Heads the Secretariat Committee.
- **`treasurer`** — Financial custodian. Co-signs budget proposals and SCARDS.
- **`auditor`** — Financial auditor. Audits all expenditures. Co-signs SCARDS.

### 🟢 Committee Leadership

- **`committee_head`** — Leads a specific committee. Can append service hours, manage team workspace for their committee. ESAS Committee Heads are exempt from the 90-hour tutoring requirement.
- **`assistant_committee_head`** — Assists the Committee Head. Same access as committee_head within their committee.

### 🔵 Tutor (`tutor`)

- Honor Society member (Regular or ESAS). Required to maintain a Tutor Account.
- Can serve as both tutor and learner simultaneously.
- ESAS tutors must accumulate 90 service hours/semester by being present in the PLC.

### ⚪ Learner (`learner`)

- External student. Not a member of the Honor Society.
- Read-only access to PLC services (browse tutors, book sessions, access resources).
- If they join the Honor Society, their account must be upgraded to `tutor`.

---

## Feature Access Matrix

Legend: `✅ Full` · `👁 View Only` · `✏️ Own Only` · `🔒 No Access` · `⚙️ Configure`

### 🏠 Core & Profile

| Feature                                | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| -------------------------------------- | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| Dashboard (Home)                       |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| View own profile                       |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Edit own profile                       |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| View other user's public profile       |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Notifications                          |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Site Settings (general preferences)    |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Change global primary color / branding |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Update Landing Page hero text / logo   |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |

---

### 📚 Study & Learning Tools

| Feature                              | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| ------------------------------------ | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| Quizzes & Flashcards (create, study) |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| AI-Generated Flashcards              |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| AI Tutor (WebLLM chat)               |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Flag inaccurate quiz question        |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Review / dismiss flagged questions   |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Export study set (Quizlet/Anki CSV)  |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |

---

### 📁 Library & Resources

| Feature                              | super_admin | administrator | president | vp / secretary | treasurer / auditor |  committee_head  | tutor | learner |
| ------------------------------------ | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :--------------: | :---: | :-----: |
| Browse digital resources             |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |        ✅        |  ✅   |   ✅    |
| Preview & download digital resources |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |        ✅        |  ✅   |   ✅    |
| Upload digital resources             |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |        ✅        |  ✅   |   🔒    |
| Delete any resource                  |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |        🔒        |  🔒   |   🔒    |
| Delete own uploaded resource         |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |        ✅        |  ✅   |   🔒    |
| Browse physical library catalog      |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |        ✅        |  ✅   |   ✅    |
| Checkout physical book to learner    |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          | ✅ _(CFMR only)_ |  🔒   |   🔒    |
| Scan ISBN to add/find physical book  |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          | ✅ _(CFMR only)_ |  🔒   |   🔒    |

---

### 📅 Sessions & Scheduling

| Feature                              | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| ------------------------------------ | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| Browse available tutors              |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Book a 1-on-1 session                |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Book a group session                 |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Cancel own upcoming session          |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Cancel any session (admin override)  |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| View own sessions                    |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| View all sessions (system-wide)      |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       🔒       |  🔒   |   🔒    |
| Submit peer review for a session     |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Submit Mastery Verification document |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   🔒    |
| Approve Mastery Verifications        |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| View Events Calendar                 |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |

---

### ⏱️ Timesheets & Service Hours

| Feature                             | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| ----------------------------------- | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| Clock in / Clock out (My Timesheet) |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   🔒    |
| View own timesheet entries          |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   🔒    |
| View all tutor timesheets           |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       🔒       |  🔒   |   🔒    |
| Manually append hours to a tutor    |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       ✅       |  🔒   |   🔒    |
| Create / close payroll periods      |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Export payroll data                 |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |

---

### 👥 Community & Collaboration

| Feature                       | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| ----------------------------- | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| View forums / posts           |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Create / reply to forum posts |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Delete any forum post         |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Delete own post               |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Create / join study groups    |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Chat in study groups          |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Send direct messages          |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Leaderboard                   |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   ✅    |
| Voting                        |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |  ✅   |   🔒    |

> **Voting** is restricted to Honor Society members only. Learners (external) cannot vote.

---

### 🏅 Peer Reviews & Tutor Tools

| Feature                              | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head |   tutor   | learner |
| ------------------------------------ | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :-------: | :-----: |
| View peer reviews (about self)       |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |    ✅     |   🔒    |
| Submit peer review for another tutor |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       ✅       | Lead only |   🔒    |
| Set tutor availability               |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |    ✅     |   🔒    |
| View Team Workspace                  |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |    ✅     |   🔒    |
| Manage team workspace (post, etc.)   |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       ✅       |    ✅     |   🔒    |

> **Peer Reviews:** Only Lead Tutors, Committee Heads, and above can evaluate others. Regular tutors can only view reviews about themselves.

---

### 💰 Finance & Audit

| Feature                                  | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| ---------------------------------------- | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| View Finance Dashboard                   |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Submit Budget Request                    |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Approve Budget Request (up to threshold) |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Final approval on large budget requests  |     ✅      |      🔒       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Submit Petty Cash                        |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Submit Liquidation                       |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| AI OCR Receipt Extraction                |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Create & Co-sign SCARDS                  |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Export SCARDS to PDF                     |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Export Finance Tables to CSV             |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Audit Finance Records (Reports Hub)      |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |
| Cash Register (Petty Cash register view) |     ✅      |      ✅       |    ✅     |       🔒       |         ✅          |       🔒       |  🔒   |   🔒    |

> **Administrator note:** Admins can access finance dashboards and assist with submissions, but the **final approval on large expenditures is the President's exclusive authority**. This cannot be delegated to an admin.

---

### 🛡️ Administration & Operations

| Feature                             | super_admin | administrator | president | vp / secretary | treasurer / auditor | committee_head | tutor | learner |
| ----------------------------------- | :---------: | :-----------: | :-------: | :------------: | :-----------------: | :------------: | :---: | :-----: |
| Admin Dashboard Overview            |     ✅      |      ✅       |    ✅     |       ✅       |         ✅          |       🔒       |  🔒   |   🔒    |
| User Management (view, search)      |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       🔒       |  🔒   |   🔒    |
| Edit user roles                     |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Assign role expiration dates        |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Suspend / unsuspend user account    |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| **Delete user account permanently** |     ✅      |      🔒       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| **Impersonate user (login as)**     |     ✅      |      🔒       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| **Provision new super_admin**       |     ✅      |      🔒       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Create new administrator account    |     ✅      |      🔒       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| QR Scanner (attendance)             |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       ✅       |  🔒   |   🔒    |
| Data Export (users, sessions, CSV)  |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       🔒       |  🔒   |   🔒    |
| Analytics Dashboard                 |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       🔒       |  🔒   |   🔒    |
| Tutor Analytics & Stats             |     ✅      |      ✅       |    ✅     |       ✅       |         🔒          |       🔒       |  🔒   |   🔒    |
| View Audit Logs                     |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Export Audit Logs as CSV            |     ✅      |      ✅       |    ✅     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| **Audit / Read private DMs**        |     ✅      |      🔒       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Kanban Feedback Board (triage)      |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |
| Manage Support Tickets              |     ✅      |      ✅       |    🔒     |       🔒       |         🔒          |       🔒       |  🔒   |   🔒    |

---

### ⚙️ IT Administration (Technical)

| Feature                                    | super_admin | administrator | president |  Others  |
| ------------------------------------------ | :---------: | :-----------: | :-------: | :------: |
| System Health Dashboard                    |     ✅      |      ✅       |  👁 View   |    🔒    |
| System Logs (raw audit trail)              |     ✅      |      ✅       |    🔒     |    🔒    |
| Integrations Config (Webhooks, Canvas LMS) |     ✅      |      ✅       |    🔒     |    🔒    |
| **View / Edit Integration API Secrets**    |     ✅      |      🔒       |    🔒     |    🔒    |
| Export Payroll (integration)               |     ✅      |      ✅       |    🔒     |    🔒    |
| Public Roadmap (upvote)                    |     ✅      |      ✅       |    ✅     | ✅ (all) |
| Manage Roadmap Items (create/edit)         |     ✅      |      ✅       |    🔒     |    🔒    |

---

## Committee Head Access Scope

Committee Heads hold elevated access **only within the scope of their committee's function**. The table below maps each committee to its corresponding system feature access.

| Committee                                            | System Access Granted to Head                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Secretariat**                                      | Secretary-level access; can manage notices, records, meeting logs                      |
| **Committee on Finance (COF)**                       | Can submit budget requests, access finance dashboard, export financial reports         |
| **Committee on Internal Affairs (CIA)**              | Can access Events Calendar management, internal activity records                       |
| **Committee on Member Success & Scholarship (CMSS)** | Can access PLC session management, tutor analytics, attendance records                 |
| **Committee on Public Relations (CPR)**              | Can manage forum announcements, upload resources                                       |
| **Committee on Rules & Regulations (CRAR)**          | Can view member attendance, issue warnings, track inactivity. Can append service hours |
| **Committee on Documentations (COD)**                | Can upload and manage resources, access session records for documentation              |
| **Committee on Facility Mgmt & Reception (CFMR)**    | Can access physical library (checkout/return), QR scanner for attendance               |
| **Committee on Research (COR)**                      | View-only access to analytics, session statistics, tutor stats                         |
| **Committee on Knowledge & Archives (CKA)**          | Can upload and manage digital resources, manage the digital library                    |
| **CHR (ESAS)**                                       | Can view member records, manage complaints/petitions within system                     |
| **COM (ESAS)**                                       | Can access peer reviews, submit evaluations, manage mentorship tracking                |
| **CEP (ESAS)**                                       | Can manage events calendar entries                                                     |
| **CMP (ESAS)**                                       | Can access finance dashboard for procurement/canvassing data                           |
| **CBAMM (ESAS)**                                     | Can manage public-facing resource uploads and branding materials                       |
| **COI (ESAS)**                                       | Can access audit logs for investigation purposes (view-only)                           |
| **CNL (ESAS)**                                       | No special system access beyond standard tutor workspace                               |

---

## Critical Access Rules (Enforcement Notes)

These rules MUST be respected in all route guards and API middleware:

1. **NEVER use `roleName === "tutor"` as a gate.** Always use `hasAnyRole(roleName, TUTOR_ROLES)` which correctly includes all roles above tutor.

2. **`super_admin` must always pass every gate.** No route should ever block a super_admin.

3. **Only `super_admin` can delete users, read private messages, provision new admins, or access raw integration secrets.**

4. **`administrator` is a management assistant, not a co-super_admin.** They handle day-to-day operations but not destructive or privacy-sensitive actions.

5. **Final financial approval for large budget requests belongs exclusively to the `president`.** Admins cannot override this.

6. **Honor Society members (all roles from `tutor` and above) may act as learners.** They must be shown the "Find a Tutor" and "Book Session" UI. Use `LEARNER_ELIGIBLE_ROLES` which includes all roles.

7. **If a `super_admin` or `administrator` has no `tutors` DB row, auto-provision one via `ensureTutorRow()` before rendering tutor-specific pages.** This supports their diagnostic access requirement.

8. **Voting is restricted to Honor Society members (`tutor` and above). Learners cannot vote.**

9. **There can only be one `super_admin`.** The system must enforce uniqueness at the DB level (unique partial index or application-level check before provisioning).

10. **Committee Head access is scoped to their committee.** A CMSS head should not have CRAR access and vice versa. The `committee` field on the `profiles` table determines the committee assignment.
