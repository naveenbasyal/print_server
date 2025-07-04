import { ulid } from "ulid";
import db from "./database";

const colleges = [
  {
    id: ulid(),
    name: "Delhi University",
    email: "info@du.in",
    country: "India",
    state: "Delhi",
    isVerified: true,
  },
  {
    id: ulid(),
    name: "Jawaharlal Nehru University",
    email: "info@jnu.in",
    country: "India",
    state: "Delhi",
    isVerified: true,
  },
  {
    id: ulid(),
    name: "Indian Institute of Technology Delhi",
    email: "info@iitd.in",
    country: "India",
    state: "Delhi",
    isVerified: true,
  },
  {
    id: ulid(),
    name: "Indian Institute of Technology Bombay",
    email: "info@iitb.in",
    country: "India",
    state: "Maharashtra",
    isVerified: true,
  },
  {
    id: ulid(),
    name: "CGC Landran",
    email: "info@cgcl.in",
    country: "India",
    state: "Punjab",
    isVerified: true,
  },
];

const users = [
  {
    id: ulid(),
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210",
    countryCode: "+91",
    password: "password",
    role: "CUSTOMER" as const,
  },
  {
    id: ulid(),
    name: "Tope Singh",
    email: "tope@example.com",
    phone: "9876543211",
    countryCode: "+91",
    password: "password",
    role: "CUSTOMER" as const,
  },
  {
    id: ulid(),
    name: "Naveen Basyal",
    email: "naveen@example.com",
    phone: "9000000001",
    countryCode: "+91",
    password: "password",
    role: "SUPERADMIN" as const,
  },
  {
    id: ulid(),
    name: "Puneet Sharma",
    email: "puneet@example.com",
    phone: "9000000002",
    countryCode: "+91",
    password: "password",
    role: "SUPERADMIN" as const,
  },
  {
    id: ulid(),
    name: "Saini Stationary",
    email: "saini@example.com",
    phone: "9000000004",
    countryCode: "+91",
    password: "password",
    role: "STATIONARY_OWNER" as const,
  },
  {
    id: ulid(),
    name: "Lalu Stationary",
    email: "lalu@example.com",
    phone: "9000000005",
    countryCode: "+91",
    password: "password",
    role: "STATIONARY_OWNER" as const,
  },
];

const stationaries = [
  {
    id: ulid(),
    name: "Saini Stationary",
    email: "saini@example.com",
    countryCode: "+91",
    phone: "9000000002",
    isActive: true,
    canDeliver: true,
    address: "123 Main Street, Delhi",
    collegeId: colleges[0].id,
    ownerId: users[4].id,
  },
  {
    id: ulid(),
    name: "Lalu Stationary",
    email: "lalu@example.com",
    countryCode: "+91",
    phone: "9000000003",
    isActive: true,
    canDeliver: false,
    address: "456 Market Road, Delhi",
    collegeId: colleges[1].id,
    ownerId: users[5].id,
  },
];

const cartItems = [
  {
    name: "Assignment 1",
    fileUrl: "https://example.com/file1.pdf",
    coloured: false,
    duplex: true,
    spiral: false,
    hardbind: false,
    quantity: 2,
    price: 50,
    fileType: "PDF",
  },
  {
    name: "Notes",
    fileUrl: "https://example.com/file2.pdf",
    coloured: true,
    duplex: false,
    spiral: true,
    hardbind: false,
    quantity: 1,
    price: 100,
    fileType: "PDF",
  },
];

async function seed() {
  console.log("🌱 Starting seed...");

  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.stationary.deleteMany();
  await db.user.deleteMany();
  await db.college.deleteMany();

  await Promise.all(
    colleges.map((college) => db.college.create({ data: college }))
  );

  await Promise.all(
    users.map((user, idx) =>
      db.user.create({
        data: {
          ...user,
          isVerified: true,
          collegeId: colleges[idx % colleges.length].id,
        },
      })
    )
  );

  // Seed Stationaries
  await Promise.all(
    stationaries.map((stationary) => db.stationary.create({ data: stationary }))
  );

    // Seed Carts and CartItems for first two users
    for (let i = 0; i < 2; i++) {
      const user = users[i];
      const cart = await db.cart.create({
        data: {
          userId: user.id,
        },
      });

      await Promise.all(
        cartItems.map((item) =>
          db.cartItem.create({
            // @ts-ignore
            data: {
              ...item,
              cartId: cart.id,
            },
          })
        )
      );
    }

  console.log("✅ Seeding completed.");
}

seed()
  .then(() => {
    console.log("🌸 Finished seeding!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding:", error);
    process.exit(1);
  });
