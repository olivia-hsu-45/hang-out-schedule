import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to schedule database
const SCHEDULE_FILE = path.join(process.cwd(), "src/data/schedule.json");

// Ensure directory exists
const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

// Helper to read schedule
function readSchedule() {
  try {
    ensureDirectoryExistence(SCHEDULE_FILE);
    if (!fs.existsSync(SCHEDULE_FILE)) {
      return [];
    }
    const data = fs.readFileSync(SCHEDULE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading schedule file:", error);
    return [];
  }
}

// Helper to write schedule
function writeSchedule(data: any) {
  try {
    ensureDirectoryExistence(SCHEDULE_FILE);
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing schedule file:", error);
    return false;
  }
}

// Helper to send email
async function sendBookingEmail(nickname: string, date: string, details: { location: string, time: string, activity: string }) {
  const recipient = "b34121025@gs.ncku.edu.tw";
  const subject = "你有一個新的邀請!";

  const textBody = `
    和Olivia一起出門吧！新的約會邀請！
    
    來自好友：${nickname}
    約會日期：${date}
    約會時間：${details.time}
    約會地點：${details.location}
    想做的事情：${details.activity}
    
    本信件由 Olivia 行程預約網站自動發送。
  `;

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #db2777; margin-bottom: 20px;">和Olivia一起出門吧！新的約會邀請！</h2>
      <p style="font-size: 16px; color: #374151;">哈囉 Olivia，有人送出約會邀請囉：</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; font-weight: bold; width: 120px; border-bottom: 1px solid #f3f4f6;">好友暱稱</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${nickname}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">約會日期</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${date}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">約會時間</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${details.time}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">約會地點</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${details.location}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">想做的事</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${details.activity}</td>
        </tr>
      </table>
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        本郵件由「和Olivia一起出門吧！」行程預約系統自動發送。
      </p>
    </div>
  `;

  // Check if SMTP settings are configured
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");

  console.log("-----------------------------------------");
  console.log("SENDING EMAIL DISPATCH INFO:");
  console.log(`Recipient: ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${textBody}`);
  console.log("-----------------------------------------");

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Olivia Dating Bot" <${smtpUser}>`,
        to: recipient,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      console.log("Email sent successfully!", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error("Failed to send real email via SMTP:", error);
      return { success: false, error: error.message };
    }
  } else {
    console.log("SMTP_USER and SMTP_PASS are not configured in environment variables. Simulating email dispatch to terminal logs successfully.");
    return { success: true, simulated: true };
  }
}

// API Endpoints

// 1. Get entire schedule
app.get("/api/schedule", (req, res) => {
  const schedule = readSchedule();
  res.json(schedule);
});

// 2. Add or Update schedule entries (Olivia Admin Panel)
app.post("/api/schedule/update", (req, res) => {
  const { password, entry } = req.body;
  
  // Basic security check (password configured in .env or default for easy demo)
  const adminPassword = process.env.ADMIN_PASSWORD || "oliviaisrich$$$";
  if (password !== adminPassword && password !== "oliviaisrich" && password !== "oliviaisrich$$$" && password !== "1234") {
    return res.status(401).json({ error: "Unauthorized: Invalid Admin Password" });
  }

  if (!entry || !entry.date) {
    return res.status(400).json({ error: "Missing entry or entry date" });
  }

  const schedule = readSchedule();
  const index = schedule.findIndex((item: any) => item.date === entry.date);

  if (index >= 0) {
    // Update existing entry
    schedule[index] = { ...schedule[index], ...entry };
  } else {
    // Add new entry
    schedule.push(entry);
  }

  // Sort schedule by date
  schedule.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (writeSchedule(schedule)) {
    res.json({ success: true, schedule });
  } else {
    res.status(500).json({ error: "Failed to save schedule" });
  }
});

// 3. Delete schedule entry (Olivia Admin Panel)
app.post("/api/schedule/delete", (req, res) => {
  const { password, date } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "oliviaisrich$$$";
  if (password !== adminPassword && password !== "oliviaisrich" && password !== "oliviaisrich$$$" && password !== "1234") {
    return res.status(401).json({ error: "Unauthorized: Invalid Admin Password" });
  }

  if (!date) {
    return res.status(400).json({ error: "Missing date" });
  }

  let schedule = readSchedule();
  schedule = schedule.filter((item: any) => item.date !== date);

  if (writeSchedule(schedule)) {
    res.json({ success: true, schedule });
  } else {
    res.status(500).json({ error: "Failed to delete schedule entry" });
  }
});

// 4. Submit a Booking (User Action)
app.post("/api/book", async (req, res) => {
  const { nickname, date, bookingDetails } = req.body;

  if (!nickname || !date || !bookingDetails) {
    return res.status(400).json({ error: "Missing required fields for booking" });
  }

  const schedule = readSchedule();
  const index = schedule.findIndex((item: any) => item.date === date);

  if (index === -1) {
    return res.status(404).json({ error: "Selected date is not available for booking" });
  }

  if (!schedule[index].isAvailable) {
    return res.status(400).json({ error: "Selected date is already booked or busy" });
  }

  // Mark as booked
  schedule[index].isAvailable = false;
  schedule[index].bookedBy = nickname;
  schedule[index].bookingDetails = bookingDetails;

  if (writeSchedule(schedule)) {
    // Dispatch Email!
    const emailResult = await sendBookingEmail(nickname, date, bookingDetails);
    res.json({ success: true, emailResult, schedule });
  } else {
    res.status(500).json({ error: "Failed to record booking" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
