import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Friend } from '../types/Friend';

const COLLECTION_NAME = 'friends';

export const friendService = {
  // 새친구 추가
  async addFriend(friend: Omit<Friend, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...friend,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  // 모든 새친구 조회
  async getAllFriends(): Promise<Friend[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Friend));
  },

  // 새친구 정보 수정
  async updateFriend(id: string, data: Partial<Friend>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // 새친구 삭제
  async deleteFriend(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },
};
