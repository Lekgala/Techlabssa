# TechLabs Academy Staff Guide

This guide explains the day-to-day use of the TechLabs Academy operations system. It is intended for administrators, admissions staff, finance staff, and instructors.

## 1. Staff access and responsibilities

Open the website's administrator page and sign in with your individual staff email address and password. Do not share accounts or passwords. Individual accounts allow the audit log to identify who performed each action.

There are two staff roles:

- **Administrator:** full operational access, including application decisions, student record changes, payment verification, cohorts, payment plans, staff accounts, and platform settings.
- **Instructor:** read and workflow access, including reviewing applications, viewing student documents and timelines, adding internal notes, assigning work, and managing relevant learning activities. Financial approvals and configuration changes remain restricted to administrators.

Sign out when using a shared computer. Ask an administrator to remove an account immediately when a staff member leaves or no longer requires access.

## 2. Daily operating routine

Start each working day in **Operations Overview**. Review the action centre in this order:

1. POPs awaiting verification.
2. Applications awaiting hardware review.
3. Students with overdue balances.
4. Failed or bounced emails.
5. Overdue follow-up tasks.
6. Cohorts approaching capacity.

Open an alert to move to the relevant student or operational section. Before ending the day, check that urgent tasks have an owner and due date.

## 3. Recruitment CRM

Use **Leads CRM** as the recruitment team's daily workspace. Website enquiries enter as **New Lead**, while people who submit a full application are linked by email to their application record.

1. Start with **Follow-up due** to see active leads whose next-contact date is today or overdue.
2. Search by name, phone, email, source, or course interest, or filter by recruitment stage.
3. Select **Open** to view the lead workspace.
4. Contact the prospect through WhatsApp or email and record the outcome as an internal note.
5. Move the recruitment stage forward and set the next follow-up date before closing the record.
6. If the person has applied, use **Open Application** to continue in the admissions workflow.

Recruitment stages should reflect actual progress: **New Lead → Contacted → Interested → Application Started → Application Submitted → Approved → Payment Pending → Enrolled**. Do not mark a lead enrolled merely because they expressed interest; enrollment is controlled by verified payment and cohort capacity.

Recruitment notes and follow-up changes are audited. Keep notes factual, concise, and relevant. Use **Export Leads CSV** only for an authorised business purpose and protect the exported file because it contains personal information.

## 4. Application workflow

The admissions pipeline is:

`New → Hardware Review → Approved → Awaiting Deposit → POP Submitted → Enrolled → Completed`

Use **Student Applications** to search by student name, email, phone number, or application reference. The stage buttons show counts and provide quick filtering. Use **More filters** when you need to filter by cohort, payment state, or application date.

Select **Open Profile** to work on an application. The profile is the authoritative staff workspace and contains:

- contact, background, laptop, course, cohort, and payment information;
- application ownership, internal notes, and follow-up tasks;
- invoice, balance, instalment plan, and reminder status;
- original POP files, POP record PDFs, and payment receipts;
- application summary, course schedule, admission confirmation, and certificate PDFs;
- the chronological student timeline.

### Hardware review and approval

1. Confirm the operating system, processor, RAM, storage, available space, and hardware-virtualisation support.
2. Correct inaccurate laptop information only when the student has supplied reliable evidence.
3. Approve the application only after the laptop requirements are satisfied.
4. Confirm that the approval email appears in the timeline or email delivery records.

Approval does not by itself secure a seat. The student must submit proof of payment and an administrator must verify the required deposit.

### Application ownership, notes, and tasks

- Assign each application to a named administrator or instructor.
- Use **Internal Notes** for operational context. Notes are not shown to students, but they form part of the permanent staff history.
- Create follow-up tasks with a clear title, owner, priority, and due date.
- Mark tasks complete only after the work has actually been performed.
- Never place passwords, banking credentials, or unnecessary sensitive information in a note.

### Rejecting, waitlisting, or withdrawing

A clear reason of at least 10 characters is mandatory when rejecting, waitlisting, or withdrawing an application, or cancelling an enrollment. The reason is recorded in the audit log and emailed to the student.

Before confirming a decision:

1. Check the application, notes, and timeline.
2. Write a factual and respectful reason that the student can understand.
3. Confirm the selected decision is correct.
4. Record the decision and verify the email delivery result.

Do not use ordinary record editing to force a controlled status change.

## 5. Payment and POP verification

The deposit workflow is:

`Student uploads POP → Awaiting Verification → Admin checks bank statement → Admin confirms amount → Balance recalculated → Seat secured or student waitlisted`

An uploaded POP is evidence submitted for review; it is not proof that funds were received. Only verify a payment after matching it against the academy's actual bank statement.

### Reviewing a POP

1. Open the student profile or **Invoices**, then select **Review POP**.
2. Confirm the student's name, application reference, invoice, cohort, banking details, submitted amount, and current balance.
3. Preview the file. Images can be zoomed and rotated; PDFs can be viewed in the preview panel.
4. Compare the POP with the bank statement, including the received amount, date, reference, and originating account where available.
5. Check any duplicate-file warning. A duplicate hash blocks approval and must be investigated.
6. Enter the amount actually received. Do not simply accept the amount claimed on the POP.
7. Select **Confirm Payment & Recalculate Balance** only when the bank transaction is verified.

Verification records the confirmed amount, previous and new paid totals, previous and new balance, staff identity, and timestamp. When the required seat deposit is reached, the system enrolls the student if capacity is available. If the cohort is full, the student is waitlisted instead.

### Rejecting a POP

A rejection reason is mandatory and is emailed to the student. State what is wrong and what the student should submit next—for example, an unreadable image, incorrect beneficiary, mismatched amount, or transaction not found. Do not accuse a student of fraud unless the matter has been formally investigated.

### Invoices, receipts, and balances

- Use **Email Invoice** to send the student the branded invoice PDF.
- Confirm the delivery result rather than assuming that “sent” means delivered.
- A receipt PDF becomes available only for a verified payment.
- The balance changes only after payment verification.
- For a student who selected full payment and paid in full, do not create an instalment plan.
- Keep reminder pauses exceptional and documented in an internal note.

## 6. Cohorts and seat capacity

The system maintains cohort enrollment counts automatically.

- Verifying the required deposit occupies a seat when capacity is available.
- A student is waitlisted when the cohort has no remaining seat.
- Withdrawing or cancelling an enrolled student releases the seat.
- Completed students retain their historical cohort placement.

Use **Cohorts** to maintain dates, schedule, delivery mode, location, capacity, and operational status. Confirm capacity before reducing it. Do not move a student by directly editing the cohort field.

### Cohort transfers

Use **Transfer Cohort** inside the application profile. Select an open destination cohort and enter a meaningful reason. The controlled transfer preserves payments, invoices, POPs, documents, notes, tasks, and timeline history, while updating capacity in both cohorts. The student receives a transfer confirmation email.

## 7. Student records and documents

Administrators can use **Edit Record** to correct contact details, course tier, and laptop information. Review all changes before selecting **Save Audited Changes**. Use the dedicated cohort-transfer and instalment-plan workflows for those changes.

Available documents depend on the student's progress:

- Application Summary: available after application submission.
- Invoice PDF: available after invoice creation.
- Course Schedule: available when a cohort is assigned.
- Original POP and POP Record PDF: available after upload.
- Payment Receipt: available after payment verification.
- Admission Confirmation: available after enrollment.
- Certificate: available after successful completion and certificate issue.

Documents contain personal and financial information. Download or share them only for an authorised operational purpose. Prefer the secure application profile over copies stored on personal devices.

### Curriculum management

Administrators can use **Curriculum** to add or edit the content shared by the public course page, enrolled-student portal, and course-schedule PDFs. Select **Add Module** to append a module with the next available number. Select an existing module to update its title, duration, summary, learning outcomes, practical labs, example support tickets, or technologies, and then select **Save Audited Changes**.

Enter list items one per line. Module numbers cannot be changed because assessments and student progress use them as stable references. Cohort-specific dates are generated automatically and must be managed through the cohort dates rather than module content. Clear **Published** only when a module must be hidden consistently from the public curriculum, student portal, and generated schedules.

The student portal includes a cohort lesson calendar. Student induction is scheduled seven days before the cohort start date, and Module 1 begins on the cohort start date. Updating cohort dates or published curriculum modules automatically updates both the portal calendar and course-schedule PDF.

## 8. Communications and reminders

The system records application, payment, invoice, reminder, and account emails. Review failed, bounced, or suppressed deliveries in the action centre and delivery records.

Applicants use the admissions WhatsApp hotline. Once a student is enrolled, the portal replaces that admissions action with **Student Support Chat** and includes the student's name, application reference, and cohort in the pre-filled WhatsApp message. Administrators can configure the enrolled-student support number separately in **Settings**.

Automated reminders cover approaching deposit dates, overdue deposits, balances due before Week 4, rejected POPs, and confirmed full payment. Administrators can run the reminder process and pause reminders for an individual student.

Before resending or contacting a student manually:

1. Confirm the email address in the student record.
2. Read the most recent delivery status and reason.
3. Check the student's timeline to avoid duplicate or conflicting messages.
4. Record important manual follow-up as a note or task.

## 9. Learning records and completion

Record attendance and assessment changes against the correct student and cohort. These changes appear in the student timeline. Share live-session links through an approved cohort communication channel until persistent session scheduling is available in the platform. Issue a completion certificate only after the academy's completion requirements have been met and the student's name, course, cohort, completion date, and grade have been checked.

## 10. Staff accounts and settings

Only administrators can create or remove staff accounts.

When creating an account:

- use the staff member's own email address;
- assign the least-privileged suitable role;
- create a temporary password of at least 10 characters with uppercase, lowercase, and numeric characters;
- communicate the password separately and require the staff member to keep it private.

Use **Settings** carefully. Banking details appear on invoices and payment documents, while academy contact details appear in public and student communications. Confirm changes with an authorised second person where possible, save once, and inspect the audit log afterward.

## 11. Audit log and dispute handling

The **Audit Log** is the primary record of who changed what and when. It records application decisions, payment decisions and amounts, balance changes, invoice emails, banking changes, staff actions, and student-record edits.

For a payment or admissions dispute:

1. Do not edit records to make the history appear different.
2. Open the student profile and review the timeline, POP, invoice, receipts, notes, and tasks.
3. Search the audit log using the reference, student email, action, or staff email.
4. Compare the verified payment with the bank statement.
5. Escalate discrepancies to the authorised administrator and preserve the relevant evidence.

## 12. Data protection and safe operation

- Access only records needed for your work.
- Never send passwords, API keys, or the system `.env` file to students or other staff.
- Never place secrets in application notes or support tickets.
- Never describe TechLabs courses as accredited, registered qualifications, university awards, Microsoft/vendor certifications, or guaranteed routes to employment. Use **independent, non-accredited practical skills training** and **Certificate of Completion** consistently.
- Confirm the recipient before emailing an invoice or student document.
- Treat POPs, contact details, invoices, grades, and attendance as confidential.
- Do not delete or directly edit the database file.
- Report suspected unauthorised access, incorrect banking details, duplicate POPs, or unexplained balance changes immediately.

## 13. Common problems

### A payment cannot be verified

Confirm that the POP status is **Submitted**, the file is not flagged as a duplicate, the amount is positive, and you are signed in as an administrator. Verify that the related invoice, application, and cohort still exist.

### The student did not receive an email

Check the email address and delivery record. A provider status of sent does not guarantee inbox delivery. Review bounce or suppression information and ask the student to check junk mail. Correct the cause before resending.

### The student was waitlisted after payment verification

The selected cohort was full when the deposit was verified. Do not manually force enrollment. Release or increase capacity through an authorised process, or use the controlled cohort-transfer workflow.

### A document is unavailable

Confirm the prerequisite event occurred. For example, a receipt requires a verified payment, admission confirmation requires enrollment, and a certificate requires an issued certificate record.

### Incorrect student information

An administrator should use **Edit Record** for corrections. Use **Transfer Cohort** for cohort changes. Add an internal note when context is important, and confirm the change appears in the timeline and audit log.

## 14. Staff handover checklist

At shift or responsibility handover, provide the next staff member with:

- urgent POPs and applications still awaiting review;
- disputed payments or unresolved delivery failures;
- overdue and high-priority tasks;
- cohorts at or near capacity;
- reminder pauses and the reasons for them;
- any issue requiring administrator-only action.

Use assignments, notes, and tasks inside the system for the handover. Avoid relying only on private messages or verbal instructions.
