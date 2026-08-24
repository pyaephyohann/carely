/**
 * Carely QA Seed Script
 *
 * Creates all test accounts, specializations, medicines, and pharmacy inventory
 * required for the local QA test plan.
 *
 * IDEMPOTENT: Safe to run multiple times — uses upsert/findOrCreate.
 *
 * Usage: npx tsx prisma/seed.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// =============================================================================
// Prisma Client Setup
// =============================================================================

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes("YOUR_DB_USER")) {
  console.error("❌ DATABASE_URL is not configured in .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const PASSWORD_HASH_ROUNDS = 12;
const DEFAULT_PASSWORD = "Test1234";

// =============================================================================
// Helpers
// =============================================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// =============================================================================
// Seed Data Definitions
// =============================================================================

const specializations = [
  { name: "Cardiology", slug: "cardiology" },
  { name: "Dermatology", slug: "dermatology" },
  { name: "General Practice", slug: "general-practice" },
  { name: "Neurology", slug: "neurology" },
  { name: "Pediatrics", slug: "pediatrics" },
];

const medicines = [
  {
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    category: "Antibiotic",
    manufacturer: "Generic Pharma",
    description: "Broad-spectrum antibiotic used to treat bacterial infections.",
    dosageForms: ["capsule", "tablet", "syrup"],
    requiresPrescription: true,
  },
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    category: "NSAID",
    manufacturer: "Generic Pharma",
    description: "Non-steroidal anti-inflammatory drug for pain and inflammation.",
    dosageForms: ["tablet", "capsule", "gel"],
    requiresPrescription: false,
  },
  {
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    category: "Antidiabetic",
    manufacturer: "Generic Pharma",
    description: "First-line medication for type 2 diabetes.",
    dosageForms: ["tablet", "extended-release tablet"],
    requiresPrescription: true,
  },
  {
    name: "Paracetamol",
    genericName: "Acetaminophen",
    category: "Analgesic",
    manufacturer: "Generic Pharma",
    description: "Common pain reliever and fever reducer.",
    dosageForms: ["tablet", "syrup", "suppository"],
    requiresPrescription: false,
  },
  {
    name: "Omeprazole",
    genericName: "Omeprazole",
    category: "Proton Pump Inhibitor",
    manufacturer: "Generic Pharma",
    description: "Reduces stomach acid production for GERD and ulcers.",
    dosageForms: ["capsule", "tablet"],
    requiresPrescription: false,
  },
  {
    name: "Azithromycin",
    genericName: "Azithromycin",
    category: "Macrolide Antibiotic",
    manufacturer: "Generic Pharma",
    description: "Antibiotic used for respiratory and skin infections.",
    dosageForms: ["tablet", "syrup"],
    requiresPrescription: true,
  },
  {
    name: "Cetirizine",
    genericName: "Cetirizine Hydrochloride",
    category: "Antihistamine",
    manufacturer: "Generic Pharma",
    description: "Antihistamine for allergies and urticaria.",
    dosageForms: ["tablet", "syrup"],
    requiresPrescription: false,
  },
  {
    name: "Amlodipine",
    genericName: "Amlodipine Besylate",
    category: "Calcium Channel Blocker",
    manufacturer: "Generic Pharma",
    description: "Used to treat high blood pressure and angina.",
    dosageForms: ["tablet"],
    requiresPrescription: true,
  },
  {
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    category: "Statin",
    manufacturer: "Generic Pharma",
    description: "Lipid-lowering medication for cholesterol management.",
    dosageForms: ["tablet"],
    requiresPrescription: true,
  },
  {
    name: "Losartan",
    genericName: "Losartan Potassium",
    category: "ARB",
    manufacturer: "Generic Pharma",
    description: "Angiotensin II receptor blocker for hypertension.",
    dosageForms: ["tablet"],
    requiresPrescription: true,
  },
];

// =============================================================================
// Main Seed Function
// =============================================================================

async function main() {
  console.log("🌱 Starting Carely QA seed...\n");

  // ---------------------------------------------------------------------------
  // 1. Specializations
  // ---------------------------------------------------------------------------
  console.log("📋 Seeding specializations...");
  for (const spec of specializations) {
    await prisma.specialization.upsert({
      where: { slug: spec.slug },
      update: {},
      create: spec,
    });
  }
  console.log(`   ✅ ${specializations.length} specializations ready\n`);

  // Fetch them back for IDs
  const allSpecs = await prisma.specialization.findMany();
  const specMap = new Map(allSpecs.map((s) => [s.slug, s.id]));

  // ---------------------------------------------------------------------------
  // 2. Medicines
  // ---------------------------------------------------------------------------
  console.log("💊 Seeding medicines...");
  for (const med of medicines) {
    // Upsert by name since there's no unique constraint on name alone
    const existing = await prisma.medicine.findFirst({ where: { name: med.name } });
    if (existing) {
      // Already exists, skip
    } else {
      await prisma.medicine.create({ data: med });
    }
  }
  const medicineCount = await prisma.medicine.count();
  console.log(`   ✅ ${medicineCount} medicines in catalog\n`);

  // Fetch all medicines for inventory
  const allMedicines = await prisma.medicine.findMany();

  // ---------------------------------------------------------------------------
  // 3. Shared password hash
  // ---------------------------------------------------------------------------
  console.log("🔐 Hashing passwords...");
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  console.log("   ✅ Password hash ready\n");

  // ---------------------------------------------------------------------------
  // 4. Helper: Create user with profile
  // ---------------------------------------------------------------------------
  async function findOrCreateUser(
    email: string,
    role: "PATIENT" | "DOCTOR" | "PHARMACY" | "ADMIN",
    profileData: {
      firstName: string;
      lastName: string;
      [key: string]: unknown;
    },
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" = "ACTIVE",
    softDelete: boolean = false,
  ) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`   ⏭️  ${email} already exists, updating status...`);
      // Update status if needed (but don't overwrite existing ACTIVE status with ACTIVE)
      if (status !== "ACTIVE" || softDelete) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ...(status !== existingUser.status ? { status } : {}),
            ...(softDelete ? { deletedAt: new Date() } : {}),
          },
        });
      }
      return existingUser;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status,
        emailVerified: true,
        ...(softDelete ? { deletedAt: new Date() } : {}),
      },
    });

    if (role === "PATIENT") {
      await prisma.patient.create({
        data: {
          userId: user.id,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: (profileData.phone as string) || null,
          dateOfBirth: (profileData.dateOfBirth as Date) || null,
          gender: (profileData.gender as "MALE" | "FEMALE") || null,
          address: (profileData.address as string) || null,
        },
      });
    } else if (role === "DOCTOR") {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          licenseNumber: profileData.licenseNumber as string,
          consultationFee: (profileData.consultationFee as number) || 150,
          specializationId: (profileData.specializationId as string) || undefined,
          verified: (profileData.verified as boolean) || false,
          verifiedAt: (profileData.verifiedAt as Date) || undefined,
          bio: (profileData.bio as string) || undefined,
          yearsExperience: (profileData.yearsExperience as number) || undefined,
          appointmentDuration: (profileData.appointmentDuration as number) || 30,
          timezone: "UTC",
        },
      });
    } else if (role === "ADMIN") {
      await prisma.admin.create({
        data: {
          userId: user.id,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        },
      });
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // 5. Patient A
  // ---------------------------------------------------------------------------
  console.log("👤 Creating Patient A...");
  const patientA = await findOrCreateUser(
    "patient-a@test.com",
    "PATIENT",
    {
      firstName: "Alice",
      lastName: "Johnson",
      phone: "+1-555-0101",
      dateOfBirth: new Date("1990-05-15"),
      gender: "FEMALE",
      address: "123 Main Street, Springfield, IL 62701",
    },
  );
  console.log(`   ✅ Patient A: ${patientA.id}\n`);

  // ---------------------------------------------------------------------------
  // 6. Patient B
  // ---------------------------------------------------------------------------
  console.log("👤 Creating Patient B...");
  const patientB = await findOrCreateUser(
    "patient-b@test.com",
    "PATIENT",
    {
      firstName: "Bob",
      lastName: "Smith",
      phone: "+1-555-0102",
      dateOfBirth: new Date("1985-08-22"),
      gender: "MALE",
      address: "456 Oak Avenue, Springfield, IL 62702",
    },
  );
  console.log(`   ✅ Patient B: ${patientB.id}\n`);

  // ---------------------------------------------------------------------------
  // 7. Doctor A (verified, cardiology, with schedule)
  // ---------------------------------------------------------------------------
  console.log("🩺 Creating Doctor A (verified, cardiology)...");
  const doctorAUser = await findOrCreateUser(
    "doctor-a@test.com",
    "DOCTOR",
    {
      firstName: "Sarah",
      lastName: "Williams",
      phone: "+1-555-0201",
      licenseNumber: "DOC-001",
      consultationFee: 200,
      specializationId: specMap.get("cardiology"),
      verified: true,
      verifiedAt: new Date(),
      bio: "Board-certified cardiologist with 12 years of experience in interventional cardiology.",
      yearsExperience: 12,
      appointmentDuration: 30,
    },
  );
  console.log(`   ✅ Doctor A: ${doctorAUser.id}\n`);

  // Fetch doctor A record
  const doctorA = await prisma.doctor.findUnique({ where: { userId: doctorAUser.id } });
  if (!doctorA) throw new Error("Doctor A profile not found after creation");

  // Doctor A schedule: Monday-Friday 09:00-17:00
  console.log("📅 Setting Doctor A schedule (Mon-Fri 09:00-17:00)...");
  for (let day = 1; day <= 5; day++) {
    await prisma.doctorSchedule.upsert({
      where: { doctorId_dayOfWeek: { doctorId: doctorA.id, dayOfWeek: day } },
      update: { startTime: "09:00", endTime: "17:00", active: true },
      create: { doctorId: doctorA.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00", active: true },
    });
  }
  console.log("   ✅ 5 schedule entries (Mon-Fri)\n");

  // ---------------------------------------------------------------------------
  // 8. Doctor B (unverified, dermatology, no schedule)
  // ---------------------------------------------------------------------------
  console.log("🩺 Creating Doctor B (unverified, dermatology)...");
  const doctorBUser = await findOrCreateUser(
    "doctor-b@test.com",
    "DOCTOR",
    {
      firstName: "Michael",
      lastName: "Chen",
      phone: "+1-555-0202",
      licenseNumber: "DOC-002",
      consultationFee: 175,
      specializationId: specMap.get("dermatology"),
      verified: false,
      bio: "Dermatologist specializing in cosmetic and medical dermatology.",
      yearsExperience: 5,
      appointmentDuration: 30,
    },
  );
  console.log(`   ✅ Doctor B: ${doctorBUser.id}\n`);

  // ---------------------------------------------------------------------------
  // 9. Pharmacy A (verified, with inventory)
  // ---------------------------------------------------------------------------
  console.log("🏥 Creating Pharmacy A (verified)...");
  const existingPharmacyA = await prisma.pharmacy.findUnique({ where: { licenseNumber: "PHARM-001" } });
  let pharmacyA = existingPharmacyA;
  if (!pharmacyA) {
    pharmacyA = await prisma.pharmacy.create({
      data: {
        name: "HealthPlus Pharmacy",
        description: "Full-service pharmacy providing prescription and OTC medications.",
        address: "789 Medical Drive, Springfield, IL 62703",
        phone: "+1-555-0301",
        email: "pharmacy-a@test.com",
        licenseNumber: "PHARM-001",
        verified: true,
        verifiedAt: new Date(),
        active: true,
        openingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "18:00" },
          saturday: { open: "09:00", close: "14:00" },
          sunday: null,
        },
      },
    });
  }
  console.log(`   ✅ Pharmacy A: ${pharmacyA.id}\n`);

  // Create pharmacy staff user for Pharmacy A
  console.log("👤 Creating Pharmacy A staff user...");
  const pharmacyAUser = await findOrCreateUser(
    "pharmacy-a@test.com",
    "PHARMACY",
    {
      firstName: "Jennifer",
      lastName: "Martinez",
      phone: "+1-555-0302",
    },
  );
  // Create or update PharmacyStaff record
  const existingPharmacyStaff = await prisma.pharmacyStaff.findUnique({ where: { userId: pharmacyAUser.id } });
  if (!existingPharmacyStaff) {
    await prisma.pharmacyStaff.create({
      data: {
        userId: pharmacyAUser.id,
        pharmacyId: pharmacyA.id,
        firstName: "Jennifer",
        lastName: "Martinez",
        phone: "+1-555-0302",
        role: "MANAGER",
      },
    });
  }
  console.log(`   ✅ Pharmacy A staff: ${pharmacyAUser.id}\n`);

  // Pharmacy A inventory: seed at least 5 medicines
  console.log("📦 Seeding Pharmacy A inventory...");
  const inventoryPrices: Record<string, { price: number; stock: number }> = {
    Amoxicillin: { price: 12.99, stock: 200 },
    Ibuprofen: { price: 6.49, stock: 500 },
    Paracetamol: { price: 4.99, stock: 600 },
    Omeprazole: { price: 15.99, stock: 150 },
    Cetirizine: { price: 7.99, stock: 300 },
    Metformin: { price: 11.49, stock: 250 },
    Azithromycin: { price: 18.99, stock: 100 },
    Amlodipine: { price: 9.99, stock: 180 },
    Atorvastatin: { price: 13.49, stock: 220 },
    Losartan: { price: 10.99, stock: 190 },
  };
  let inventoryCount = 0;
  for (const med of allMedicines) {
    const inv = inventoryPrices[med.name];
    if (inv) {
      const existing = await prisma.pharmacyMedicine.findFirst({
        where: { pharmacyId: pharmacyA.id, medicineId: med.id },
      });
      if (!existing) {
        await prisma.pharmacyMedicine.create({
          data: {
            pharmacyId: pharmacyA.id,
            medicineId: med.id,
            stock: inv.stock,
            price: inv.price,
            minimumStock: 20,
            inStock: true,
          },
        });
        inventoryCount++;
      }
    }
  }
  console.log(`   ✅ ${inventoryCount || 10} inventory items (10 medicines)\n`);

  // ---------------------------------------------------------------------------
  // 10. Pharmacy B (unverified, no inventory)
  // ---------------------------------------------------------------------------
  console.log("🏥 Creating Pharmacy B (unverified)...");
  const existingPharmacyB = await prisma.pharmacy.findUnique({ where: { licenseNumber: "PHARM-002" } });
  let pharmacyB = existingPharmacyB;
  if (!pharmacyB) {
    pharmacyB = await prisma.pharmacy.create({
      data: {
        name: "CityMed Pharmacy",
        description: "Community pharmacy serving the local area.",
        address: "321 Elm Street, Springfield, IL 62704",
        phone: "+1-555-0401",
        email: "pharmacy-b@test.com",
        licenseNumber: "PHARM-002",
        verified: false,
        active: true,
      },
    });
  }
  console.log(`   ✅ Pharmacy B: ${pharmacyB.id}\n`);

  // Create pharmacy staff user for Pharmacy B
  console.log("👤 Creating Pharmacy B staff user...");
  const pharmacyBUser = await findOrCreateUser(
    "pharmacy-b@test.com",
    "PHARMACY",
    {
      firstName: "David",
      lastName: "Lee",
      phone: "+1-555-0402",
    },
  );
  const existingPharmacyStaffB = await prisma.pharmacyStaff.findUnique({ where: { userId: pharmacyBUser.id } });
  if (!existingPharmacyStaffB) {
    await prisma.pharmacyStaff.create({
      data: {
        userId: pharmacyBUser.id,
        pharmacyId: pharmacyB.id,
        firstName: "David",
        lastName: "Lee",
        phone: "+1-555-0402",
        role: "STAFF",
      },
    });
  }
  console.log(`   ✅ Pharmacy B staff: ${pharmacyBUser.id}\n`);

  // ---------------------------------------------------------------------------
  // 11. Admin A
  // ---------------------------------------------------------------------------
  console.log("🛡️  Creating Admin A...");
  const adminA = await findOrCreateUser(
    "admin@test.com",
    "ADMIN",
    {
      firstName: "System",
      lastName: "Administrator",
      phone: "+1-555-0001",
    },
  );
  console.log(`   ✅ Admin A: ${adminA.id}\n`);

  // ---------------------------------------------------------------------------
  // 12. Suspended Patient
  // ---------------------------------------------------------------------------
  console.log("🚫 Creating Suspended Patient...");
  const suspendedPatient = await findOrCreateUser(
    "suspended-patient@test.com",
    "PATIENT",
    {
      firstName: "Suspended",
      lastName: "User",
      phone: "+1-555-0501",
      gender: "OTHER",
    },
    "SUSPENDED",
  );
  console.log(`   ✅ Suspended Patient: ${suspendedPatient.id}\n`);

  // ---------------------------------------------------------------------------
  // 13. Inactive Doctor
  // ---------------------------------------------------------------------------
  console.log("💤 Creating Inactive Doctor...");
  const inactiveDoctor = await findOrCreateUser(
    "inactive-doctor@test.com",
    "DOCTOR",
    {
      firstName: "Inactive",
      lastName: "Doctor",
      phone: "+1-555-0502",
      licenseNumber: "DOC-003",
      consultationFee: 100,
      verified: false,
    },
    "INACTIVE",
  );
  console.log(`   ✅ Inactive Doctor: ${inactiveDoctor.id}\n`);

  // ---------------------------------------------------------------------------
  // 14. Soft-deleted User
  // ---------------------------------------------------------------------------
  console.log("🗑️  Creating Soft-Deleted User...");
  const deletedUser = await findOrCreateUser(
    "deleted-user@test.com",
    "PATIENT",
    {
      firstName: "Deleted",
      lastName: "Account",
      phone: "+1-555-0503",
    },
    "ACTIVE",
    true, // softDelete
  );
  console.log(`   ✅ Soft-deleted User: ${deletedUser.id}\n`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌱 Seed Complete!\n");

  const userCount = await prisma.user.count();
  const patientCount = await prisma.patient.count();
  const doctorCount = await prisma.doctor.count();
  const adminCount = await prisma.admin.count();
  const pharmacyCount = await prisma.pharmacy.count();
  const specCount = await prisma.specialization.count();
  const medCount = await prisma.medicine.count();
  const scheduleCount = await prisma.doctorSchedule.count();
  const inventoryItemCount = await prisma.pharmacyMedicine.count();

  console.log("📊 Database Summary:");
  console.log(`   Users:        ${userCount}`);
  console.log(`   Patients:     ${patientCount}`);
  console.log(`   Doctors:      ${doctorCount}`);
  console.log(`   Admins:       ${adminCount}`);
  console.log(`   Pharmacies:   ${pharmacyCount}`);
  console.log(`   Specs:        ${specCount}`);
  console.log(`   Medicines:    ${medCount}`);
  console.log(`   Schedules:    ${scheduleCount}`);
  console.log(`   Inventory:    ${inventoryItemCount}`);
  console.log("");

  console.log("🔑 Test Accounts (all passwords: Test1234):");
  console.log("   ┌──────────────────────────┬────────────┬─────────────┐");
  console.log("   │ Email                    │ Role       │ Status      │");
  console.log("   ├──────────────────────────┼────────────┼─────────────┤");
  console.log("   │ patient-a@test.com       │ PATIENT    │ ACTIVE      │");
  console.log("   │ patient-b@test.com       │ PATIENT    │ ACTIVE      │");
  console.log("   │ doctor-a@test.com        │ DOCTOR     │ ACTIVE*     │");
  console.log("   │ doctor-b@test.com        │ DOCTOR     │ ACTIVE*     │");
  console.log("   │ pharmacy-a@test.com      │ PHARMACY   │ ACTIVE      │");
  console.log("   │ pharmacy-b@test.com      │ PHARMACY   │ ACTIVE      │");
  console.log("   │ admin@test.com           │ ADMIN      │ ACTIVE      │");
  console.log("   │ suspended-patient@test.. │ PATIENT    │ SUSPENDED   │");
  console.log("   │ inactive-doctor@test.com │ DOCTOR     │ INACTIVE    │");
  console.log("   │ deleted-user@test.com    │ PATIENT    │ ACTIVE+del  │");
  console.log("   └──────────────────────────┴────────────┴─────────────┘");
  console.log("   * Doctor A is verified; Doctor B is NOT verified");
  console.log("   + deleted-user has deletedAt set (soft-deleted)");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

// =============================================================================
// Run
// =============================================================================

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
