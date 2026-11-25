import { Binary, MongoClient, type Db } from 'mongodb';
import { MONGODB_DB_NAME, MONGODB_URI } from '../config/index.ts';
import type { Car } from '../models/types.ts';

let client: MongoClient | null = null;
let database: Db | null = null;
let mongoConnected = false;
let lastMongoError: string | undefined;

export interface MongoPersistenceStatus {
  configured: boolean;
  connected: boolean;
  mode: 'mongodb' | 'json_file';
  databaseName?: string;
  error?: string;
}

export function isMongoConfigured(): boolean {
  return Boolean(MONGODB_URI);
}

export function isMongoConnected(): boolean {
  return mongoConnected && Boolean(database);
}

export function getMongoPersistenceStatus(): MongoPersistenceStatus {
  return {
    configured: isMongoConfigured(),
    connected: isMongoConnected(),
    mode: isMongoConnected() ? 'mongodb' : 'json_file',
    databaseName: isMongoConnected() ? MONGODB_DB_NAME : undefined,
    error: lastMongoError,
  };
}

export async function connectMongo(): Promise<Db | null> {
  if (!MONGODB_URI) {
    mongoConnected = false;
    lastMongoError = 'MONGODB_URI not configured; using local JSON file store.';
    return null;
  }

  if (MONGODB_URI.includes('<db_password>')) {
    mongoConnected = false;
    lastMongoError = 'MONGODB_URI contains placeholder <db_password>. Replace <db_password> with your actual MongoDB Atlas password.';
    console.warn(`⚠️ ${lastMongoError}`);
    return null;
  }

  if (database && mongoConnected) {
    return database;
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
    await client.connect();
    database = client.db(MONGODB_DB_NAME);
    await database.command({ ping: 1 });

    // Ensure unique indexes for cars, app_state, and uploaded_media
    await database.collection('cars').createIndex({ id: 1 }, { unique: true });
    await database.collection('cars').createIndex({ createdAt: -1 });
    await database.collection('app_state').createIndex({ key: 1 }, { unique: true });
    await database.collection('uploaded_media').createIndex({ filename: 1 }, { unique: true });

    mongoConnected = true;
    lastMongoError = undefined;
    console.log(`✅ MongoDB Atlas connected (database: ${MONGODB_DB_NAME})`);
    return database;
  } catch (err) {
    mongoConnected = false;
    database = null;
    lastMongoError = err instanceof Error ? err.message : 'MongoDB connection failed';
    console.error('❌ MongoDB connection failed, falling back to local db.json:', lastMongoError);
    return null;
  }
}

export async function loadCarsFromMongo(): Promise<Car[] | null> {
  if (!database || !mongoConnected) return null;
  const docs = await database
    .collection<Car & { _id?: unknown }>('cars')
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as Car[];
}

export async function seedCarsToMongoIfEmpty(seedCars: Car[]): Promise<void> {
  if (!database || !mongoConnected || seedCars.length === 0) return;
  const count = await database.collection('cars').countDocuments();
  if (count === 0) {
    const ops = seedCars.map((car) => ({
      updateOne: {
        filter: { id: car.id },
        update: { $set: car },
        upsert: true,
      },
    }));
    await database.collection('cars').bulkWrite(ops, { ordered: false });
  }
}

export async function upsertCarInMongo(car: Car): Promise<void> {
  if (!database || !mongoConnected) return;
  await database.collection('cars').updateOne(
    { id: car.id },
    { $set: car },
    { upsert: true }
  );
}

export async function bulkUpsertCarsInMongo(cars: Car[]): Promise<void> {
  if (!database || !mongoConnected || cars.length === 0) return;
  const ops = cars.map((car) => ({
    updateOne: {
      filter: { id: car.id },
      update: { $set: car },
      upsert: true,
    },
  }));
  await database.collection('cars').bulkWrite(ops, { ordered: false });
}

export async function deleteCarInMongo(carId: string): Promise<void> {
  if (!database || !mongoConnected) return;
  await database.collection('cars').deleteOne({ id: carId });
}

export async function loadAppStateFromMongo(): Promise<Record<string, unknown> | null> {
  if (!database || !mongoConnected) return null;
  const doc = await database
    .collection<{ key: string; state: Record<string, unknown> }>('app_state')
    .findOne({ key: 'primary' }, { projection: { _id: 0 } });
  return doc?.state || null;
}

export async function saveAppStateToMongo(stateWithoutCars: Record<string, unknown>): Promise<void> {
  if (!database || !mongoConnected) return;
  await database.collection('app_state').updateOne(
    { key: 'primary' },
    { $set: { key: 'primary', state: stateWithoutCars, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export interface MongoStoredMedia {
  filename: string;
  mimeType: string;
  size: number;
  data: Binary;
  createdAt: string;
}

export async function saveMediaInMongo(
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<void> {
  if (!database || !mongoConnected) return;
  await database.collection<MongoStoredMedia>('uploaded_media').updateOne(
    { filename },
    {
      $set: {
        filename,
        mimeType,
        size: buffer.length,
        data: new Binary(buffer),
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

export async function getMediaFromMongo(
  filename: string
): Promise<{ mimeType: string; buffer: Buffer } | null> {
  if (!database || !mongoConnected) return null;
  const doc = await database
    .collection<MongoStoredMedia>('uploaded_media')
    .findOne({ filename });
  if (!doc || !doc.data) return null;
  const buf = Buffer.isBuffer(doc.data)
    ? doc.data
    : Buffer.from((doc.data as unknown as { buffer: Uint8Array }).buffer || []);
  return { mimeType: doc.mimeType || 'image/jpeg', buffer: buf };
}

export async function listMediaInMongo(): Promise<
  Array<{ filename: string; url: string; size: number; createdAt: string }>
> {
  if (!database || !mongoConnected) return [];
  const docs = await database
    .collection<MongoStoredMedia>('uploaded_media')
    .find({}, { projection: { _id: 0, filename: 1, size: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({
    filename: d.filename,
    url: `/uploads/${d.filename}`,
    size: d.size,
    createdAt: d.createdAt,
  }));
}

export async function deleteMediaFromMongo(filename: string): Promise<boolean> {
  if (!database || !mongoConnected) return false;
  const result = await database.collection('uploaded_media').deleteOne({ filename });
  return result.deletedCount > 0;
}
