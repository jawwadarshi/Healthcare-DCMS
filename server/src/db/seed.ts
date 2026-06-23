import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { AppRole } from "../common/constants/roles.js";
import { users } from "./schema.js";

type SeedUserInput = {
  name: string;
  email: string;
  password: string;
  role: AppRole;
};

const seedUsers: SeedUserInput[] = [
  {
    name: "System Admin",
    email: "admin@dentalclinic.com",
    password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
    role: AppRole.ADMIN,
  },
  {
    name: "Dr. John Carter",
    email: "doctor@dentalclinic.com",
    password: process.env.SEED_DOCTOR_PASSWORD ?? "Doctor@12345",
    role: AppRole.DOCTOR,
  },
  {
    name: "Front Desk Staff",
    email: "staff@dentalclinic.com",
    password: process.env.SEED_STAFF_PASSWORD ?? "Staff@12345",
    role: AppRole.STAFF,
  },
];

const seed = async () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  for (const user of seedUsers) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    if (existingUser.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`Skipping existing user: ${user.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    await db.insert(users).values({
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    });

    // eslint-disable-next-line no-console
    console.log(`Created ${user.role} user: ${user.email}`);
  }
};

seed()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seeding completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seeding failed:", error);
    process.exit(1);
  });
