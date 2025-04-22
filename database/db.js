import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    //config mongoose settings
    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
      this.isConnected = true;
    });
    mongoose.connection.on("error", () => {
      console.error("MongoDB connection error");
      this.isConnected = false;
    });
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      this.handleDisconnection();
    });

    process.on("SIGTERM", this.handleAppTermination.bind(this));
  }

  async conncect() {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in .env file");
      }

      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Adjust as needed
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
      };
      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true); // Enable debug mode in development
      }
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.retryCount = 0; // Reset retry count on successful connection
    } catch (error) {
      console.error("MongoDB connection error:", error.message);
      this.isConnected = false;
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    try {
      if (this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        console.log(
          `Retrying connection... (${this.retryCount}/${MAX_RETRIES})`
        );
        await new Promise((resolve) =>
          setTimeout(() => {
            resolve;
          }, RETRY_INTERVAL)
        );
        return this.conncect();
      }
    } catch (error) {
      console.error("Error during reconnection attempt:", error.message);
    }
  }

  async handleDisconnection() {
    if (!this.isConnected) {
      console.log("MongoDB is not connected. Attempting to reconnect...");
      await this.conncect();
    }
  }

  async handleAppTermination() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0); // Exit the process after closing the connection
    } catch (error) {
      console.error("Error closing MongoDB connection:", error.message);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

//create a singleton instance of the DatabaseConnection class
const dbConnection = new DatabaseConnection();
export default dbConnection.connection.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
