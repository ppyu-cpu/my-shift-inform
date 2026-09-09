import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DayInform, MaintenanceRecord } from '../types';
import { INITIAL_INFORMS } from '../mockData';

const INFORMS_COLLECTION = 'informs';
const RECORDS_COLLECTION = 'maintenance_records';

/**
 * Save a full DayInform to Firestore, and sync its records to maintenance_records
 */
export async function saveInformToFirebase(inform: DayInform): Promise<boolean> {
  try {
    const informRef = doc(db, INFORMS_COLLECTION, inform.date);
    await setDoc(informRef, {
      ...inform,
      lastSaved: inform.lastSaved || new Date().toISOString().replace('T', ' ').substring(0, 19),
    }, { merge: true });

    // Also sync each record in this inform to maintenance_records collection
    const batch = writeBatch(db);
    for (const rec of inform.records) {
      const recRef = doc(db, RECORDS_COLLECTION, rec.id);
      batch.set(recRef, {
        ...rec,
        date: inform.date,
        shift: rec.shift || inform.activeShift,
        author: rec.author || inform.author,
        workStatus: rec.workStatus || '작성 중',
        savedAt: rec.savedAt || inform.lastSaved || new Date().toISOString().replace('T', ' ').substring(0, 19),
      }, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving inform to Firestore:', error);
    return false;
  }
}

/**
 * Save or update an individual MaintenanceRecord to Firestore
 */
export async function saveRecordToFirebase(
  record: MaintenanceRecord,
  dayInform?: DayInform
): Promise<boolean> {
  try {
    const recRef = doc(db, RECORDS_COLLECTION, record.id);
    const savedTime = record.savedAt || new Date().toISOString().replace('T', ' ').substring(0, 19);

    await setDoc(recRef, {
      ...record,
      savedAt: savedTime,
      workStatus: record.workStatus || '작성 중',
    }, { merge: true });

    // Also update in parent inform document if provided
    if (dayInform) {
      const existingIdx = dayInform.records.findIndex((r) => r.id === record.id);
      let updatedRecords = [...dayInform.records];
      if (existingIdx >= 0) {
        updatedRecords[existingIdx] = { ...record, savedAt: savedTime };
      } else {
        updatedRecords.push({ ...record, savedAt: savedTime });
      }

      const informRef = doc(db, INFORMS_COLLECTION, dayInform.date);
      await setDoc(informRef, {
        ...dayInform,
        records: updatedRecords,
        lastSaved: savedTime,
      }, { merge: true });
    }

    return true;
  } catch (error) {
    console.error('Error saving maintenance record to Firestore:', error);
    return false;
  }
}

/**
 * Fetch all DayInforms from Firestore
 */
export async function fetchAllInformsFromFirebase(): Promise<Record<string, DayInform>> {
  try {
    const snapshot = await getDocs(collection(db, INFORMS_COLLECTION));
    if (snapshot.empty) {
      // Seed initial informs into Firestore so the database is populated right away
      await seedInitialInformsToFirebase();
      return INITIAL_INFORMS;
    }

    const informs: Record<string, DayInform> = {};
    snapshot.forEach((d) => {
      const data = d.data() as DayInform;
      informs[data.date || d.id] = data;
    });
    return informs;
  } catch (error) {
    console.error('Error fetching informs from Firestore:', error);
    return {};
  }
}

/**
 * Seed initial mock data into Firestore once if empty
 */
export async function seedInitialInformsToFirebase(): Promise<void> {
  try {
    for (const [date, inform] of Object.entries(INITIAL_INFORMS)) {
      await saveInformToFirebase(inform);
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}

/**
 * Fetch all maintenance records (reservations & records) from Firestore
 */
export async function fetchAllRecordsFromFirebase(): Promise<MaintenanceRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, RECORDS_COLLECTION));
    const records: MaintenanceRecord[] = [];
    snapshot.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as MaintenanceRecord);
    });
    return records;
  } catch (error) {
    console.error('Error fetching records from Firestore:', error);
    return [];
  }
}

/**
 * Listen to real-time updates of DayInforms
 */
export function subscribeToInforms(
  onUpdate: (informs: Record<string, DayInform>) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, INFORMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const informs: Record<string, DayInform> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DayInform;
        informs[data.date || docSnap.id] = data;
      });
      if (Object.keys(informs).length > 0) {
        onUpdate(informs);
      }
    },
    (err) => {
      console.error('Firestore informs subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Delete a maintenance record from Firestore
 */
export async function deleteRecordFromFirebase(recordId: string, date: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, RECORDS_COLLECTION, recordId));
    return true;
  } catch (error) {
    console.error('Error deleting record from Firestore:', error);
    return false;
  }
}

/**
 * Seed default initial mock data if Firestore is empty
 */
export async function seedDefaultDataIfNeeded(
  initialData: Record<string, DayInform> = INITIAL_INFORMS
): Promise<void> {
  try {
    const existing = await fetchAllInformsFromFirebase();
    if (Object.keys(existing).length === 0) {
      for (const date of Object.keys(initialData)) {
        await saveInformToFirebase(initialData[date]);
      }
    }
  } catch (error) {
    console.warn('Could not seed default data to Firebase:', error);
  }
}
