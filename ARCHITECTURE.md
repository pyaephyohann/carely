# Carely - Healthcare Appointment & Pharmacy Platform

## Architecture Document v1.0

---

## 1. Current Project State

The repository is a fresh Next.js 16.3.2 project created with `create-next-app`:

**Installed:**
- Next.js 16.3.2 with App Router
- React 19.2.8
- TypeScript 5.x (strict mode)
- Tailwind CSS v4
- ESLint with core-web-vitals + TypeScript rules

**Not Yet Installed (required for platform):**
- `prisma` + `@prisma/client` (ORM + database client)
- `next-redux-wrapper` or manual Redux store setup
- `@reduxjs/toolkit` + `rtk-query` (state management)
- `framer-motion` (animations)
- `axios` (HTTP client)
- `bcryptjs` (password hashing)
- `jsonwebtoken` or `next-auth` (authentication)
- `zod` (input validation)
- `date-fns` or `dayjs` (date/time handling)
- `@heroicons/react` or `lucide-react` (icons)

---

## 2. Recommended Folder Structure

```
carely/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Public landing page routes
│   │   │   ├── layout.tsx        # Marketing layout (header, footer)
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── about/
│   │   │   ├── features/
│   │   │   └── contact/
│   │   │
│   │   ├── (auth)/               # Authentication routes
│   │   │   ├── layout.tsx        # Auth layout (centered, minimal)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── (patient)/            # Patient application
│   │   │   ├── layout.tsx        # Patient dashboard layout
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── doctors/
│   │   │   ├── appointments/
│   │   │   ├── prescriptions/
│   │   │   └── records/
│   │   │
│   │   ├── (doctor)/             # Doctor application
│   │   │   ├── layout.tsx        # Doctor dashboard layout
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── consultations/
│   │   │   └── prescriptions/
│   │   │
│   │   ├── (admin)/              # Admin application
│   │   │   ├── layout.tsx        # Admin dashboard layout
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── doctors/
│   │   │   ├── pharmacies/
│   │   │   ├── appointments/
│   │   │   ├── medicines/
│   │   │   └── settings/
│   │   │
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── logout/
│   │   │   │   └── refresh/
│   │   │   ├── users/
│   │   │   ├── doctors/
│   │   │   ├── appointments/
│   │   │   ├── prescriptions/
│   │   │   ├── medicines/
│   │   │   └── pharmacies/
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Root redirect
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── table.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   ├── forms/                # Form components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── appointment-form.tsx
│   │   │
│   │   └── features/             # Feature-specific components
│   │       ├── auth/
│   │       ├── doctors/
│   │       ├── appointments/
│   │       └── dashboard/
│   │
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # Authentication utilities
│   │   ├── validation.ts         # Zod schemas
│   │   └── constants.ts          # App constants
│   │
│   ├── store/
│   │   ├── index.ts              # Redux store configuration
│   │   ├── api/
│   │   │   ├── baseApi.ts        # RTK Query base API
│   │   │   ├── authApi.ts        # Auth API slice
│   │   │   ├── usersApi.ts       # Users API slice
│   │   │   ├── doctorsApi.ts     # Doctors API slice
│   │   │   ├── appointmentsApi.ts
│   │   │   └── prescriptionsApi.ts
│   │   └── slices/
│   │       ├── authSlice.ts      # Auth state
│   │       └── uiSlice.ts        # UI state (sidebar, theme)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProtectedRoute.ts
│   │   └── useDebounce.ts
│   │
│   ├── types/
│   │   ├── index.ts              # Shared types
│   │   ├── api.ts                # API response types
│   │   └── models.ts             # Database model types
│   │
│   └── utils/
│       ├── date.ts               # Date formatting utilities
│       ├── format.ts             # General formatting
│       └── cn.ts                 # clsx + tailwind-merge
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-illustration.svg
│   │   └── icons/
│   └── favicon.ico
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts            # If needed for custom theme
├── .env.example
└── README.md
```

---

## 3. Major Database Entities

### Core Entities

```prisma
// User & Authentication
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(PATIENT)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  patient       Patient?
  doctor        Doctor?
  admin         Admin?
  notifications Notification[]
}

enum UserRole {
  PATIENT
  DOCTOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

// Patient Profile
model Patient {
  id          String  @id @default(cuid())
  userId      String  @unique
  firstName   String
  lastName    String
  phone       String?
  dateOfBirth DateTime?
  gender      Gender?
  address     String?
  avatar      String?
  
  // Relations
  user            User            @relation(fields: [userId], references: [id])
  appointments    Appointment[]
  prescriptions   Prescription[]
  medicalRecords  MedicalRecord[]
  reviews         Review[]
}

// Doctor Profile
model Doctor {
  id              String   @id @default(cuid())
  userId          String   @unique
  firstName       String
  lastName        String
  phone           String?
  avatar          String?
  specialization  String
  licenseNumber   String   @unique
  bio             String?
  consultationFee Decimal  @db.Decimal(10, 2)
  yearsExperience Int?
  verified        Boolean  @default(false)
  verifiedAt      DateTime?
  rating          Decimal? @db.Decimal(3, 2)
  totalReviews    Int      @default(0)
  
  // Relations
  user              User              @relation(fields: [userId], references: [id])
  specializations   DoctorSpecialization[]
  workingHours      WorkingHour[]
  availability      Availability[]
  appointments      Appointment[]
  consultations     Consultation[]
  prescriptions     Prescription[]
  reviews           Review[]
}

// Doctor Specialization (many-to-many)
model Specialization {
  id       String @id @default(cuid())
  name     String @unique
  slug     String @unique
  doctors  DoctorSpecialization[]
}

model DoctorSpecialization {
  doctorId          String
  specializationId  String
  
  doctor          Doctor          @relation(fields: [doctorId], references: [id])
  specialization  Specialization  @relation(fields: [specializationId], references: [id])
  
  @@id([doctorId, specializationId])
}

// Doctor Working Hours
model WorkingHour {
  id        String   @id @default(cuid())
  doctorId  String
  dayOfWeek Int      // 0 = Sunday, 6 = Saturday
  startTime String   // "09:00"
  endTime   String   // "17:00"
  active    Boolean  @default(true)
  
  doctor Doctor @relation(fields: [doctorId], references: [id])
  
  @@unique([doctorId, dayOfWeek])
}

// Doctor Availability (specific date overrides)
model Availability {
  id        String    @id @default(cuid())
  doctorId  String
  date      DateTime  @db.Date
  startTime String    // "09:00"
  endTime   String    // "17:00"
  available Boolean   @default(true)
  reason    String?   // e.g., "On vacation"
  
  doctor Doctor @relation(fields: [doctorId], references: [id])
  
  @@unique([doctorId, date])
}

// Admin Profile
model Admin {
  id        String @id @default(cuid())
  userId    String @unique
  firstName String
  lastName  String
  phone     String?
  avatar    String?
  
  user User @relation(fields: [userId], references: [id])
}

// Appointments
model Appointment {
  id            String            @id @default(cuid())
  patientId     String
  doctorId      String
  date          DateTime          @db.Date
  startTime     String            // "09:00"
  endTime       String            // "09:30"
  duration      Int               // in minutes
  status        AppointmentStatus @default(SCHEDULED)
  type          AppointmentType   @default(CONSULTATION)
  reason        String?
  notes         String?
  cancelReason  String?
  rescheduledTo String?           // ID of new appointment if rescheduled
  
  // Relations
  patient       Patient           @relation(fields: [patientId], references: [id])
  doctor        Doctor            @relation(fields: [doctorId], references: [id])
  consultation  Consultation?
  
  @@unique([doctorId, date, startTime]) // Prevent double booking
  @@index([patientId, date])
  @@index([doctorId, date])
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum AppointmentType {
  CONSULTATION
  FOLLOW_UP
  EMERGENCY
  VIRTUAL
}

// Consultations
model Consultation {
  id              String      @id @default(cuid())
  appointmentId   String      @unique
  doctorId        String
  patientId       String
  diagnosis       String?
  symptoms        String?
  notes           String?
  followUpDate    DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  appointment     Appointment @relation(fields: [appointmentId], references: [id])
  doctor          Doctor      @relation(fields: [doctorId], references: [id])
  patient         Patient     @relation(fields: [patientId], references: [id])
  prescriptions   Prescription[]
  medicalRecords  MedicalRecord[]
}

// Prescriptions
model Prescription {
  id              String    @id @default(cuid())
  consultationId  String
  doctorId        String
  patientId       String
  diagnosis       String
  notes           String?
  validUntil      DateTime?
  createdAt       DateTime  @default(now())
  
  // Relations
  consultation  Consultation  @relation(fields: [consultationId], references: [id])
  doctor        Doctor        @relation(fields: [doctorId], references: [id])
  patient       Patient       @relation(fields: [patientId], references: [id])
  items         PrescriptionItem[]
}

// Prescription Items
model PrescriptionItem {
  id              String    @id @default(cuid())
  prescriptionId  String
  medicineId      String
  dosage          String    // e.g., "500mg"
  frequency       String    // e.g., "Twice daily"
  duration        String    // e.g., "7 days"
  instructions    String?
  
  // Relations
  prescription  Prescription  @relation(fields: [prescriptionId], references: [id])
  medicine      Medicine      @relation(fields: [medicineId], references: [id])
}

// Medicine (catalog)
model Medicine {
  id              String    @id @default(cuid())
  name            String
  genericName     String?
  category        String
  manufacturer    String?
  description     String?
  dosageForms     String[]  // ["tablet", "capsule", "syrup"]
  sideEffects     String?
  contraindications String?
  requiresPrescription Boolean @default(true)
  
  // Relations
  prescriptions  PrescriptionItem[]
  inventories    PharmacyInventory[]
}

// Medical Records
model MedicalRecord {
  id              String    @id @default(cuid())
  patientId       String
  consultationId  String?
  type            RecordType
  title           String
  description     String?
  attachments     String[]  // File URLs
  createdAt       DateTime  @default(now())
  
  // Relations
  patient       Patient       @relation(fields: [patientId], references: [id])
  consultation  Consultation? @relation(fields: [consultationId], references: [id])
}

enum RecordType {
  LAB_RESULT
  IMAGING
  PRESCRIPTION
  REFERRAL
  OTHER
}

// Reviews
model Review {
  id        String  @id @default(cuid())
  patientId String
  doctorId  String
  rating    Int     // 1-5
  comment   String?
  createdAt DateTime @default(now())
  
  patient Patient @relation(fields: [patientId], references: [id])
  doctor  Doctor  @relation(fields: [doctorId], references: [id])
  
  @@unique([patientId, doctorId]) // One review per patient per doctor
}

// Notifications
model Notification {
  id        String           @id @default(cuid())
  userId    String
  title     String
  message   String
  type      NotificationType
  read      Boolean          @default(false)
  metadata  Json?
  createdAt DateTime         @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

enum NotificationType {
  APPOINTMENT_REMINDER
  APPOINTMENT_CANCELLED
  APPOINTMENT_CONFIRMED
  PRESCRIPTION_READY
  SYSTEM
}

// Pharmacy (future)
model Pharmacy {
  id          String  @id @default(cuid())
  name        String
  address     String
  phone       String?
  email       String?
  licenseNumber String @unique
  latitude    Float?
  longitude   Float?
  active      Boolean @default(true)
  
  inventories PharmacyInventory[]
}

// Pharmacy Inventory (future)
model PharmacyInventory {
  id           String   @id @default(cuid())
  pharmacyId   String
  medicineId   String
  stock        Int      @default(0)
  price        Decimal  @db.Decimal(10, 2)
  inStock      Boolean  @default(true)
  
  pharmacy Pharmacy @relation(fields: [pharmacyId], references: [id])
  medicine Medicine @relation(fields: [medicineId], references: [id])
  
  @@unique([pharmacyId, medicineId])
}

// Audit Log
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  entity    String
  entityId  String?
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())
}
```

---

## 4. Entity Relationships

```
User (1) ──> (1) Patient
User (1) ──> (1) Doctor
User (1) ──> (1) Admin

Doctor (many) ◇──> (many) Specialization  [through DoctorSpecialization]
Doctor (1) ──> (many) WorkingHour
Doctor (1) ──> (many) Availability

Patient (many) ──> (many) Doctor  [through Appointment]
Doctor (many) ──> (many) Patient  [through Appointment]

Appointment (1) ──> (1) Consultation

Consultation (1) ──> (many) Prescription
Prescription (1) ──> (many) PrescriptionItem

Medicine (1) ──> (many) PrescriptionItem
Medicine (many) ◇──> (many) Pharmacy  [through PharmacyInventory]

Patient (1) ──> (many) MedicalRecord
Consultation (1) ──> (many) MedicalRecord

Patient (1) ──> (many) Review
Doctor (1) ──> (many) Review

User (1) ──> (many) Notification
```

---

## 5. Authentication & RBAC Strategy

### Approach: Custom JWT Authentication

**Why custom over NextAuth:**
- Full control over role-based access
- Simpler for API-only authentication
- No provider dependency
- Easier to extend for multi-role users

**Implementation:**

```typescript
// Token Strategy
- Access Token: JWT, 15-minute expiry, stored in memory/cookie
- Refresh Token: JWT, 7-day expiry, stored in HttpOnly cookie
- Token Rotation: Refresh on each access token expiry

// Password Security
- bcryptjs with salt rounds = 12
- Password strength validation (min 8 chars, uppercase, lowercase, number)

// Session Management
- Stateless JWT (no server session store)
- Token refresh endpoint
- Logout: Clear refresh token cookie

// Role-Based Access Control (RBAC)
roles = {
  PATIENT: {
    can: [
      'view:doctors',
      'book:appointments',
      'view:own:appointments',
      'view:own:prescriptions',
      'view:own:records',
      'write:reviews'
    ]
  },
  DOCTOR: {
    can: [
      'view:own:profile',
      'edit:own:profile',
      'view:own:appointments',
      'manage:own:appointments',
      'view:own:patients',
      'write:prescriptions',
      'write:consultations'
    ]
  },
  ADMIN: {
    can: [
      'manage:users',
      'manage:doctors',
      'verify:doctors',
      'manage:pharmacies',
      'manage:appointments',
      'manage:medicines',
      'view:analytics',
      'manage:settings'
    ]
  }
}

// Protected Routes
- Middleware checks JWT validity
- Route-level RBAC via role checks
- Component-level via useAuth hook
```

---

## 6. API Architecture

### RESTful API Design

**Base URL:** `/api/v1`

**Response Format:**
```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

// Error Response
{
  success: false,
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  }
}
```

**Key API Endpoints:**

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password

GET    /api/v1/users/me
PUT    /api/v1/users/me
PATCH  /api/v1/users/me/password

GET    /api/v1/doctors              # Public: list/search
GET    /api/v1/doctors/:id          # Public: profile
GET    /api/v1/doctors/:id/slots    # Public: available slots
PUT    /api/v1/doctors/me           # Doctor: update profile
GET    /api/v1/doctors/me/appointments
POST   /api/v1/doctors/me/availability

GET    /api/v1/appointments
POST   /api/v1/appointments
GET    /api/v1/appointments/:id
PUT    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id/cancel
PATCH  /api/v1/appointments/:id/reschedule

GET    /api/v1/prescriptions
GET    /api/v1/prescriptions/:id
POST   /api/v1/prescriptions        # Doctor only

GET    /api/v1/admin/users
GET    /api/v1/admin/doctors
PATCH  /api/v1/admin/doctors/:id/verify
GET    /api/v1/admin/analytics
```

**Middleware Pipeline:**
```
Request → CORS → Rate Limit → Auth Middleware → RBAC Check → Validation → Handler
```

---

## 7. Route Structure

### Route Groups (Next.js App Router)

| Route Group | Purpose | Auth Required | Role |
|-------------|---------|---------------|------|
| `(marketing)` | Public landing, features, about | No | Public |
| `(auth)` | Login, register, forgot password | No | Public |
| `(patient)` | Patient dashboard & features | Yes | PATIENT |
| `(doctor)` | Doctor dashboard & features | Yes | DOCTOR |
| `(admin)` | Admin dashboard & features | Yes | ADMIN |

**Key Routes:**

```
/                          → Redirect to /login or dashboard based on role
/login                     → Login page
/register                  → Registration page
/register/doctor           → Doctor registration

/patient/dashboard         → Patient home
/patient/doctors           → Find doctors
/patient/doctors/:id       → Doctor profile & booking
/patient/appointments      → My appointments
/patient/prescriptions     → My prescriptions
/patient/profile           → My profile

/doctor/dashboard          → Doctor home
/doctor/appointments       → Manage appointments
/doctor/patients           → My patients
/doctor/prescriptions      → Prescriptions issued
/doctor/profile            → My professional profile

/admin/dashboard           → Admin home with analytics
/admin/users               → User management
/admin/doctors             → Doctor management & verification
/admin/appointments        → Appointment overview
/admin/medicines           → Medicine catalog
/admin/settings            → Platform settings
```

---

## 8. Development Milestones

### Milestone 1: Project Foundation (Week 1)
**Goal:** Core infrastructure and database

- [ ] Install dependencies (Prisma, Redux, Axios, Framer Motion, Zod, bcryptjs)
- [ ] Configure environment variables
- [ ] Design and implement Prisma schema
- [ ] Set up PostgreSQL connection
- [ ] Create initial migration
- [ ] Implement Prisma client singleton
- [ ] Set up Redux store with RTK Query
- [ ] Create base API slice
- [ ] Implement authentication utilities (JWT, password hashing)
- [ ] Set up API response format and error handling
- [ ] Create base UI components (Button, Input, Card, Modal, Badge)
- [ ] Implement theme and Tailwind configuration for healthcare design

### Milestone 2: Authentication System (Week 2)
**Goal:** Complete auth flow with role-based access

- [ ] Register API endpoint (with validation)
- [ ] Login API endpoint
- [ ] Logout API endpoint
- [ ] Token refresh mechanism
- [ ] Auth middleware for protected routes
- [ ] RBAC middleware
- [ ] Login page with form
- [ ] Register page with role selection
- [ ] Auth state management in Redux
- [ ] Protected route component
- [ ] Redirect logic based on role

### Milestone 3: Public Marketing Pages (Week 2-3)
**Goal:** Professional landing page

- [ ] Marketing layout (header, footer)
- [ ] Hero section with CTA
- [ ] Features/benefits section
- [ ] How it works section
- [ ] Statistics/social proof
- [ ] Testimonials (placeholder)
- [ ] CTA section
- [ ] Footer with links
- [ ] Responsive design
- [ ] Framer Motion animations

### Milestone 4: Patient Application (Week 3-4)
**Goal:** Patient can find doctors and book appointments

- [ ] Patient dashboard layout
- [ ] Dashboard with upcoming appointments
- [ ] Doctor search with filters
- [ ] Doctor profile page
- [ ] Available time slots display
- [ ] Appointment booking flow
- [ ] Appointment confirmation
- [ ] My appointments list
- [ ] Appointment details
- [ ] Cancel appointment
- [ ] Patient profile page
- [ ] Prescriptions list

### Milestone 5: Doctor Application (Week 4-5)
**Goal:** Doctor can manage practice

- [ ] Doctor dashboard layout
- [ ] Dashboard with today's schedule
- [ ] Manage working hours
- [ ] Manage availability
- [ ] View appointments
- [ ] Update appointment status
- [ ] Patient list
- [ ] Patient details
- [ ] Start consultation
- [ ] Write prescriptions
- [ ] Professional profile management

### Milestone 6: Admin Application (Week 5-6)
**Goal:** Admin can manage platform

- [ ] Admin dashboard layout
- [ ] Dashboard with analytics
- [ ] User management (list, view, suspend)
- [ ] Doctor management
- [ ] Doctor verification workflow
- [ ] Appointment overview
- [ ] Medicine catalog management
- [ ] Platform settings
- [ ] Audit log viewer

### Milestone 7: Advanced Features (Week 6-7)
**Goal:** Polish and advanced features

- [ ] Notification system
- [ ] Email notifications (optional)
- [ ] Advanced search/filter
- [ ] Pagination
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive polish
- [ ] Accessibility audit
- [ ] Performance optimization

---

## 9. Technical Risks

### High Risk
1. **Appointment Scheduling Complexity**
   - Double booking prevention
   - Timezone handling
   - Concurrent booking conflicts
   - *Mitigation:* Database-level constraints, transactions, optimistic locking

2. **Authentication Security**
   - Token theft
   - Session fixation
   - CSRF attacks
   - *Mitigation:* HttpOnly cookies, CSRF tokens, short-lived access tokens

3. **Data Integrity**
   - Prescription accuracy
   - Appointment state consistency
   - *Mitigation:* Database transactions, state machine for appointments

### Medium Risk
4. **Performance at Scale**
   - Doctor search with filters
   - Appointment queries
   - *Mitigation:* Proper indexing, pagination, query optimization

5. **State Management Complexity**
   - Redux store organization
   - RTK Query cache invalidation
   - *Mitigation:* Clear store structure, automatic cache invalidation

6. **Timezone Handling**
   - Doctor working hours
   - Appointment scheduling
   - *Mitigation:* Store in UTC, convert for display, use date-fns-tz

### Low Risk
7. **UI/UX Consistency**
   - Multiple role-based layouts
   - Component reuse
   - *Mitigation:* Design system, component library, shared components

---

## 10. Decisions Required Before Implementation

### Database & Infrastructure
1. **PostgreSQL Hosting:** Local development vs Docker vs cloud (Supabase, Neon, Railway)?
2. **Environment Setup:** How to manage `.env` files across environments?
3. **Database Seeding:** Seed data strategy for development?

### Authentication
4. **Token Storage:** Access token in memory vs HttpOnly cookie vs both?
5. **Email Verification:** Required on registration or optional?
6. **Password Reset:** Email-based or admin-assisted?

### UI/UX
7. **Design System:** Use a component library (shadcn/ui) or build from scratch?
8. **Icon Library:** Heroicons, Lucide, or Phosphor?
9. **Animation Level:** Minimal utility animations or rich page transitions?

### API Design
10. **API Versioning:** `/api/v1` prefix or header-based?
11. **Pagination Style:** Cursor-based or offset-based?
12. **File Uploads:** How to handle medical records/documents?

### Development
13. **Testing Strategy:** Unit tests, integration tests, or E2E tests?
14. **Code Quality:** Additional linting (Prettier, Husky)?
15. **Documentation:** API docs (Swagger/OpenAPI)?

---

## 11. Technical Notes

### Next.js 16 Considerations
- LayoutProps type is used (breaking change from older versions)
- App Router with route groups for role-based layouts
- Server Components by default
- Route Handlers for API endpoints

### State Management Strategy
- Redux for client-side state (auth, UI state)
- RTK Query for server state (API data caching)
- Server Components for initial data fetching where possible

### Component Architecture
- Server Components for static/SEO content
- Client Components for interactive features
- Shared components in `/components/ui`
- Feature components in `/components/features`

### Error Handling Strategy
- API errors: Consistent error response format
- Form errors: Field-level validation messages
- Page errors: Error boundaries per route group
- Global errors: Toast notifications

---

*Document Version: 1.0*
*Last Updated: August 23, 2026*
