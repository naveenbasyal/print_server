"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./db/database"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5001;
app.all("/", (req, res) => {
    res.status(200).json({
        message: "Server Running",
    });
});
async function startServer() {
    try {
        await database_1.default.$connect();
        console.log("Database connected successfully");
        app.listen(PORT, () => {
            console.log(`Server running on port http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await database_1.default.$disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    console.log("Shutting down gracefully...");
    await database_1.default.$disconnect();
    process.exit(0);
});
startServer();
