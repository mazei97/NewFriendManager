import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { RemnantMember } from './types';

const ACCOUNT = 'remnant@iyewon.org';
const PASSWORD = 'remnant237';
const COLLECTION_NAME = 'member';

export const firebaseService = {
  // 자동 로그인
  async autoLogin(): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(auth, ACCOUNT, PASSWORD);
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  },

  // 데이터 로드
  async loadMembers(sortBy: 'name' | 'date' | 'age' = 'date'): Promise<RemnantMember[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      const data: RemnantMember[] = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: docData.id || '',
          사진: docData.사진 || '',
          이름: docData.이름 || '',
          성별: docData.성별 || '',
          생년월일: docData.생년월일 || '',
          구분: docData.구분 || '',
          등록일자: docData.등록일자 || '',
          교구: docData.교구 || '',
          연락처1: docData.연락처1 || '',
          연락처2: docData.연락처2 || '',
          주소: docData.주소 || '',
          교육1차: docData.교육1차 || '',
          교육2차: docData.교육2차 || '',
          교육3차: docData.교육3차 || '',
          등반: docData.등반 || '',
          인수교사: docData.인수교사 || '',
          메모: docData.메모 || '',
        } as RemnantMember;
      });

      // 정렬
      if (sortBy === 'name') {
        data.sort((a, b) => a.이름.localeCompare(b.이름, 'ko'));
      } else if (sortBy === 'date') {
        data.sort((a, b) => {
          const dateA = a.등록일자 || '0000-00-00';
          const dateB = b.등록일자 || '0000-00-00';
          return dateB.localeCompare(dateA);
        });
      } else if (sortBy === 'age') {
        data.sort((a, b) => {
          const dateA = a.생년월일 || '9999-99-99';
          const dateB = b.생년월일 || '9999-99-99';
          return dateB.localeCompare(dateA);
        });
      }

      return data;
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      return [];
    }
  },

  // 데이터 저장
  async saveMember(member: RemnantMember): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, member.id), member);
      return true;
    } catch (error) {
      console.error('데이터 저장 실패:', error);
      return false;
    }
  },

  // 데이터 삭제
  async deleteMember(documentId: string, photoPath: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, documentId));
      
      // 사진도 삭제
      if (photoPath && photoPath.startsWith('remote://')) {
        const path = photoPath.substring(9);
        const photoRef = ref(storage, path);
        await deleteObject(photoRef);
      }
      
      return true;
    } catch (error) {
      console.error('데이터 삭제 실패:', error);
      return false;
    }
  },

  // 이미지 URL 가져오기
  async getImageUrl(photoPath: string): Promise<string | null> {
    try {
      if (!photoPath || !photoPath.startsWith('remote://')) {
        return null;
      }

      const path = photoPath.substring(9);
      const imageRef = ref(storage, path);
      const url = await getDownloadURL(imageRef);
      
      return url;
    } catch (error) {
      console.error('이미지 URL 가져오기 실패:', error);
      return null;
    }
  },

  // 이미지 업로드
  async uploadImage(file: File, memberId: string): Promise<string | null> {
    try {
      // 웹에서는 리사이징을 Canvas API로 처리
      const resizedBlob = await this.resizeImage(file, 800);
      
      const filename = `members/${memberId}_${Date.now()}.jpg`;
      const imageRef = ref(storage, filename);
      
      await uploadBytes(imageRef, resizedBlob);
      
      return `remote://${filename}`;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      return null;
    }
  },

  // 이미지 리사이징 (Canvas API 사용)
  async resizeImage(file: File, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 변환 실패'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  },
};
