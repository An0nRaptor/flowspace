import dns from "dns";
import mongoose from "mongoose";
import { config } from "./app-config";

const connectDatabase = async () => {
  try {
    // Optional: some local DNS proxies refuse SRV lookups (mongodb+srv).
    if (config.DNS_SERVERS !== "none") {
      dns.setServers(config.DNS_SERVERS.split(",").map((s) => s.trim()));
    }

    await mongoose.connect(config.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting MongoDB", error);
    process.exit(1);
  }
};

export default connectDatabase;


