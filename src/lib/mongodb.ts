import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vrk-admin";

if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
}

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient | null> | undefined;

    // eslint-disable-next-line no-var
    var _inMemoryDb: InMemoryDatabase | undefined;
}


// -----------------------------
// IN MEMORY FALLBACK DATABASE
// -----------------------------

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

                    toArray: async () => {

                        const key = Object.keys(query)[0];
                        const order = query[key];


                        return collectionData
                            .slice()
                            .sort((a, b) => {

                                if (order === -1) {

                                    return (
                                        b[key]?.localeCompare(a[key]) || 0
                                    );

                                }


                                return (
                                    a[key]?.localeCompare(b[key]) || 0
                                );

                            });

                    }

                }),


                toArray: async () => collectionData.slice()

            }),




            findOne: async (query: any) => {


                return collectionData.find(doc => {


                    for (const [key, value] of Object.entries(query)) {

                        if (doc[key] !== value) {

                            return false;

                        }

                    }


                    return true;


                });


            },





            insertOne: async (doc: T) => {


                collectionData.push(doc);


                return {

                    acknowledged: true,

                    insertedId: doc

                };


            },





            // FIXED: insertMany added
            insertMany: async (docs: T[]) => {


                collectionData.push(...docs);


                return {


                    acknowledged: true,


                    insertedCount: docs.length


                };


            },






            updateOne: async (
                query: any,
                update: any,
                options?: any
            ) => {


                const existing =
                    collectionData.find(doc => {


                        for (const [key, value] of Object.entries(query)) {


                            if (doc[key] !== value) {

                                return false;

                            }

                        }


                        return true;


                    });




                if (existing) {


                    Object.assign(
                        existing,
                        update.$set
                    );


                }


                else if (options?.upsert) {


                    collectionData.push({

                        ...query,

                        ...update.$set

                    });


                }



                return {


                    acknowledged: true


                };


            }

        };

    }


}







// -----------------------------
// MONGODB CONNECTION
// -----------------------------


const client = new MongoClient(uri, {

    tls: true,

    serverApi: {
        version: "1"
    },


    connectTimeoutMS: 10000


});




let connectionFailed = false;




const clientPromise =

    globalThis._mongoClientPromise ||

    (
        globalThis._mongoClientPromise =

        client.connect()

            .then(async (client) => {


                console.log(
                    "✅ MongoDB connected successfully"
                );


                // verify connection

                await client
                    .db(dbName)
                    .command({
                        ping: 1
                    });


                console.log(
                    "✅ MongoDB ping successful"
                );


                return client;


            })


            .catch((err) => {


                console.error(
                    "❌ MongoDB connection failed:",
                    err
                );


                connectionFailed = true;


                return null;


            })

    );








// -----------------------------
// GET DATABASE
// -----------------------------


export async function getDatabase(): Promise<Db> {



    if (!connectionFailed) {


        const client =
            await clientPromise;



        if (client) {


            return client.db(dbName);


        }


    }





    // Development fallback only


    console.warn(
        "⚠️ Using InMemoryDatabase fallback"
    );



    if (!globalThis._inMemoryDb) {


        globalThis._inMemoryDb =
            new InMemoryDatabase();


    }



    return globalThis
        ._inMemoryDb as any;



}