# PROJECT STATE SNAPSHOT – NowTrip

## 1. Project Overview
- **Status:** 🚀 LIVE (MVP Completed)
- **Architecture:** Monorepo (Next.js + Firebase)
- **Environment:** Production (Vercel + Firebase Cloud)

## 2. Deployment Info
- **Public Web:** [Link Vercel App Public của bạn]
- **Portal Web:** [Link Vercel App Portal của bạn]
- **Backend Region:** asia-southeast1

## 3. Features Delivered
### A. Customer Facing (Public)
- [x] Landing page optimization.
- [x] Lead capture form with CAPTCHA protection.
- [x] Phone number deduplication logic (7 days window).

### B. Internal Operations (Portal)
- [x] **Authentication:** Login secure, Role-based (Admin/Staff).
- [x] **Lead Management:**
  - Unassigned Queue (Sorted by SLA).
  - My Leads (Personal workspace).
  - Search & Filter.
- [x] **Lead Detail:**
  - Activity Timeline (Logs history).
  - Actions: Assign, Call, Zalo, Add Note.
- [x] **Admin Tools:**
  - Create Staff Accounts (`admin_createStaffUser`).
  - Export Data CSV (`admin_exportLeadsCsv`).

## 4. Pending / Future Improvements
- [ ] Email Notifications (Send email to Sale when Lead arrives).
- [ ] Dashboard Charts (Thống kê doanh số/lead theo ngày).
- [ ] Integration with Zalo OA API (Automated messages).