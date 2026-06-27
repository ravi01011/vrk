const { MongoClient } = require('mongodb');
const fs = require('fs');

function loadEnvLocal() {
    const p = './.env.local';
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^([^=]+)=(?:"([^"]*)"|(.*))$/);
        if (m) {
            const key = m[1].trim();
            const val = (m[2] !== undefined) ? m[2] : (m[3] || '');
            process.env[key] = val;
        }
    });
}

async function insertDummyBooking() {
    console.log("Reading environment variables...");
    loadEnvLocal();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || "vrk-admin";
    
    if (!uri) {
        console.error('❌ MONGODB_URI not set in environment or .env.local');
        process.exit(2);
    }

    console.log("Connecting to MongoDB Atlas...");
    const client = new MongoClient(uri, { serverApi: { version: "1" } });

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('bookings');
        
        const bookingId = `BKG-${Date.now().toString().slice(-6)}`;
        
        const testBooking = {
            bookingId,
            guestName: "John Doe (Database Test)",
            mobile: "9876543210",
            aadhaarNo: "e85e29f8f435...encrypted...dummy", // Mocking encryption
            aadhaarFront: "",
            aadhaarBack: "",
            address: "123 Test Server Avenue",
            roomNo: "101",
            checkIn: new Date().toISOString().split("T")[0],
            checkInTime: "14:00",
            checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            checkOutTime: "11:00",
            numGuests: 2,
            advance: 500,
            total: 2500,
            balance: 2000,
            status: "Partial",
            remarks: "This is an automated test booking to verify database storage.",
            createdAt: new Date().toISOString(),
        };

        console.log("Inserting test booking...");
        await collection.insertOne(testBooking);
        
        console.log(`\n✅ SUCCESSFULLY INSERTED INTO MONGODB!`);
        console.log(`Booking ID: ${bookingId}`);
        console.log(`Guest Name: ${testBooking.guestName}`);
        console.log(`\nYou can now go to your Admin Dashboard /bookings page to see it live!`);

    } catch (err) {
        console.error('\n❌ Failed to insert booking. Error details:');
        console.error(err);
    } finally {
        await client.close();
    }
}

insertDummyBooking();
