import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vrk-admin";

if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
}

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
    // eslint-disable-next-line no-var
    var _inMemoryDb: InMemoryDatabase | undefined;
}

// In-memory fallback database for when MongoDB is unavailable
class InMemoryDatabase {
    private collections: Map<string, any[]> = new Map();

    collection<T>(name: string) {
        if (!this.collections.has(name)) {
            this.collections.set(name, []);
        }
        const collectionData = this.collections.get(name)!;

        return {
            find: () => ({
                sort: (query: any) => ({
                    toArray: async () => collectionData.slice().sort((a, b) => {
                        const key = Object.keys(query)[0];
                        const order = query[key];
                        if (order === -1) return b[key]?.localeCompare(a[key]) || 0;
                        return a[key]?.localeCompare(b[key]) || 0;
                    }),
                }),
                toArray: async () => collectionData.slice(),
            }),
            findOne: async (query: any) => collectionData.find(doc => {
                for (const [key, val] of Object.entries(query)) {
                    if (doc[key] !== val) return false;
                }
                return true;
            }),
            updateOne: async (query: any, update: any, options?: any) => {
                const existing = collectionData.find(doc => {
                    for (const [key, val] of Object.entries(query)) {
                        if (doc[key] !== val) return false;
                    }
                    return true;
                });
                if (existing) {
                    Object.assign(existing, update.$set);
                } else if (options?.upsert) {
                    collectionData.push({ ...query, ...update.$set });
                }
                return { acknowledged: true };
            },
            insertOne: async (doc: T) => {
                collectionData.push(doc);
                return { acknowledged: true, insertedId: doc };
            },
        };
    }
}

// Include explicit options to improve compatibility with Atlas TLS and server API
const client = new MongoClient(uri, {
    tls: true,
    // Use Server API v1 for stable behavior across driver versions
    serverApi: { version: "1" },
    // Increase connect timeout slightly for network flakiness in dev
    connectTimeoutMS: 10000,
});

let connectionFailed = false;

const clientPromise: Promise<MongoClient> =
    globalThis._mongoClientPromise || (globalThis._mongoClientPromise = client.connect().catch((err) => {
        console.warn("MongoDB connection failed, falling back to in-memory storage:", err && err.message);
        connectionFailed = true;
        return null as any;
    }));

export async function getDatabase(): Promise<Db> {
    // Try to use real MongoDB if available
    if (!connectionFailed) {
        try {
            const client = await Promise.race([
                clientPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 5000)),
            ]);
            if (client) {
                return client.db(dbName);
            }
        } catch (err) {
            console.warn("MongoDB connection unavailable, using in-memory fallback");
            connectionFailed = true;
        }
    }

    // Fall back to in-memory storage
    if (!globalThis._inMemoryDb) {
        globalThis._inMemoryDb = new InMemoryDatabase();
    }
    return globalThis._inMemoryDb as any;
}
