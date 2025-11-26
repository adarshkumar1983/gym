# Product Roadmap

## MVP (Weeks 1-4) - Launch Fast

### Core Features
- [x] Owner authentication & gym creation
- [x] Owner: Add members manually
- [x] Owner: Create simple workout templates (2-day starter plan)
- [x] Owner: Assign workout template to member
- [x] Member: Authentication (mobile + web)
- [x] Member: View "Today's Workout" screen
- [x] Member: Mark exercises/sets as complete
- [x] Member: View simple workout history
- [x] Payments: Manual payment recording OR Stripe one-time checkout
- [x] Notifications: Basic push/email reminders for assigned workouts
- [x] Admin web UI: Member list, assign templates, payment status
- [x] Background worker: Generate assigned_workouts when template assigned

### Technical Deliverables
- [x] Database schema & migrations
- [x] REST API with authentication
- [x] Basic web admin portal
- [x] Mobile app (Today screen + exercise logging)
- [x] Background job scheduler
- [x] Basic error tracking (Sentry)
- [x] Docker Compose for local dev
- [x] CI/CD pipeline (GitHub Actions)

### Acceptance Criteria
- Owner can add members and assign 2-day starter plan
- Member receives assigned workouts for next 2 days
- Member can mark exercises/sets as done; logs saved
- Owner can view member list and payment status
- Notifications sent at scheduled times

---

## v1 (Weeks 5-10) - Grow Features

### New Features
- [ ] Membership subscriptions with automated renewals (Stripe Subscriptions)
- [ ] Workout template library with import/export
- [ ] Recurring plans (weekly, monthly) with auto-assignment
- [ ] Detailed exercise logs with progress charts
- [ ] Trainer role & trainer assignment flow
- [ ] File uploads for exercise media (S3 integration)
- [ ] Demo videos inline in workout view
- [ ] Payment webhooks & automated receipt generation
- [ ] Resend invoice / PDF receipts
- [ ] Analytics dashboard for owners (attendance, completion rates)
- [ ] Mobile app offline caching for workouts
- [ ] Search functionality (templates, members)

### Technical Improvements
- [ ] Database read replicas for analytics
- [ ] Advanced caching strategy
- [ ] Media transcoding pipeline
- [ ] Enhanced monitoring & alerting
- [ ] Performance optimization
- [ ] Comprehensive test coverage

---

## Scale / Future (Post v1)

### Advanced Features
- [ ] Multi-tenant isolation with advanced metrics per gym
- [ ] Advanced RBAC (custom roles, permissions)
- [ ] In-app payments with promos, discount codes, coupons
- [ ] Recommendation engine (auto-suggest progressions)
- [ ] Live class bookings & calendar sync
- [ ] Localization & multi-currency support
- [ ] Advanced search (workouts, tags, trainers)
- [ ] Bulk actions (CSV import/export)
- [ ] GDPR/PCI/HIPAA compliance features
- [ ] Mobile app: Social features, challenges, leaderboards
- [ ] API for third-party integrations

### Infrastructure
- [ ] Multi-region deployment
- [ ] Advanced auto-scaling
- [ ] Database sharding if needed
- [ ] CDN optimization
- [ ] Advanced security features (2FA, SSO)

---

## Timeline Estimate (2-person team)

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| **Week 0-1** | 2 weeks | Requirements, UX sketches, DB design, API contracts |
| **Week 2-4** | 3 weeks | Backend skeleton, auth, core endpoints, web admin |
| **Week 5-7** | 3 weeks | Mobile Today screen, workout flow, notifications |
| **Week 8** | 1 week | Payments integration, staging deploy |
| **Week 9-10** | 2 weeks | Alpha testing, bug fixes, production deploy |
| **MVP Launch** | Week 10 | 🚀 |
| **v1 Development** | Weeks 11-20 | Feature expansion, subscriptions, analytics |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Payment complexity | Start with manual payments or single checkout; add subscriptions in v1 |
| Media hosting costs | Use S3 with lifecycle policies; add CDN when needed |
| Scheduling complexity | Simple generation logic first; move to robust cron/worker later |
| Data model changes | Design for extension; version templates; keep assigned_workouts immutable |

