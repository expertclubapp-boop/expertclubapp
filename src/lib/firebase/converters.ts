import { 
  QueryDocumentSnapshot, 
  SnapshotOptions, 
  DocumentData,
  FirestoreDataConverter
} from 'firebase/firestore'

export const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => data,
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options)
    return {
      ...data,
      id: snapshot.id,
    } as unknown as T
  },
})

// Generic converter can be used for most collections
export const genericConverter = createConverter<any>()
