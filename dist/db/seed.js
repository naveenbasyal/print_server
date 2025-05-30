"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ulid_1 = require("ulid");
const database_1 = __importDefault(require("./database"));
const colleges = [
    {
        id: (0, ulid_1.ulid)(),
        name: "Delhi University",
        email: "info@du.in",
        country: "India",
        state: "Delhi",
        isVerified: true,
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Jawaharlal Nehru University",
        email: "info@jnu.in",
        country: "India",
        state: "Delhi",
        isVerified: true,
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Indian Institute of Technology Delhi",
        email: "info@iitd.in",
        country: "India",
        state: "Delhi",
        isVerified: true,
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Indian Institute of Technology Bombay",
        email: "info@iitb.in",
        country: "India",
        state: "Maharashtra",
        isVerified: true,
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "CGC Landran",
        email: "info@cgcl.in",
        country: "India",
        state: "Punjab",
        isVerified: true,
    },
];
const users = [
    {
        id: (0, ulid_1.ulid)(),
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        countryCode: "+91",
        password: "password",
        role: "CUSTOMER",
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Tope Singh",
        email: "tope@example.com",
        phone: "9876543211",
        countryCode: "+91",
        password: "password",
        role: "CUSTOMER",
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Naveen Basyal",
        email: "naveen@example.com",
        phone: "9000000001",
        countryCode: "+91",
        password: "password",
        role: "SUPERADMIN",
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Puneet Sharma",
        email: "puneet@example.com",
        phone: "9000000002",
        countryCode: "+91",
        password: "password",
        role: "SUPERADMIN",
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Saini Stationary",
        email: "saini@example.com",
        phone: "9000000004",
        countryCode: "+91",
        password: "password",
        role: "STATIONARY_OWNER",
    },
    {
        id: (0, ulid_1.ulid)(),
        name: "Lalu Stationary",
        email: "lalu@example.com",
        phone: "9000000005",
        countryCode: "+91",
        password: "password",
        role: "STATIONARY_OWNER",
    },
];
const stationaries = [
    {
        id: (0, ulid_1.ulid)(),
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
        id: (0, ulid_1.ulid)(),
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
    await database_1.default.cartItem.deleteMany();
    await database_1.default.cart.deleteMany();
    await database_1.default.stationary.deleteMany();
    await database_1.default.user.deleteMany();
    await database_1.default.college.deleteMany();
    await Promise.all(colleges.map((college) => database_1.default.college.create({ data: college })));
    await Promise.all(users.map((user, idx) => database_1.default.user.create({
        data: {
            ...user,
            isVerified: true,
            collegeId: colleges[idx % colleges.length].id,
        },
    })));
    // Seed Stationaries
    await Promise.all(stationaries.map((stationary) => database_1.default.stationary.create({ data: stationary })));
    // Seed Carts and CartItems for first two users
    for (let i = 0; i < 2; i++) {
        const user = users[i];
        const cart = await database_1.default.cart.create({
            data: {
                userId: user.id,
            },
        });
        await Promise.all(cartItems.map((item) => database_1.default.cartItem.create({
            data: {
                ...item,
                cartId: cart.id,
            },
        })));
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
