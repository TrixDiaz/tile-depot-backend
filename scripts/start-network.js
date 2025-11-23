// Simple script to start the server on all network interfaces
import {spawn} from "child_process";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting backend server on all network interfaces...");
console.log("Server will be accessible at:");
console.log("- http://localhost:5000 (local)");
console.log("- http://192.168.1.21:5000 (network)");
console.log("");

// Set environment variables
process.env.SERVER_HOST = "0.0.0.0";
process.env.SERVER_PORT = "5000";

// Start the server
const server = spawn("node", ["server.js"], {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    SERVER_HOST: "0.0.0.0",
    SERVER_PORT: "5000",
  },
});

server.on("error", (error) => {
  console.error("Failed to start server:", error);
});

server.on("close", (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping server...");
  server.kill("SIGINT");
  process.exit(0);
});
