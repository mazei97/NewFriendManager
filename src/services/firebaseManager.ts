import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  ref, 
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';

const ACCOUNT = 'remnant@iyewon.org';
const PASSWORD = 'remnant237';
const COLLECTION_NAME = 'member';

export interface RemnantMember {
  id: string;
  사진: string;
  이름: string;
  성별: string;
  생년월일: string;
  구분: string;
  등록일자: string;
  교구: string;
  연락처1: string;
  연락처2: string;
  주소: string;
  교육1차: string;
  교육2차: string;
  교육3차: string;
  등반: string;
  인수교사: string;
  메모: string;
}

export const KEYS = [
  'id', '사진', '이름', '성별', '생년월일', '구분', '등록일자', 
  '교구', '연락처1', '연락처2', '주소', '교육1차', '교육2차', 
  '교육3차', '등반', '인수교사', '메모'
];

class FirebaseManager {
  private user: User | null = null;
  public update: boolean = true;

  constructor() {
    // 인증 상태 변경 리스너
    onAuthStateChanged(auth, (user) => {
      this.user = user;
    });
  }

  // 로그인
  async login(): Promise<boolean> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, ACCOUNT, PASSWORD);
      this.user = userCredential.user;
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  }

  // 로그아웃
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.user = null;
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  }

  // 자동 로그인
  async autoLogin(): Promise<boolean> {
    return await this.login();
  }

  // 현재 사용자 확인
  getCurrentUser(): User | null {
    return this.user;
  }

  // 로그인 여부 확인
  isLoggedIn(): boolean {
    return this.user !== null;
  }

  // 데이터 로드
  async load(sortBy: 'name' | 'date' | 'age' = 'name'): Promise<RemnantMember[] | null> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      this.update = false;
      
      const data: RemnantMember[] = querySnapshot.docs.map(doc => {
        const remnant: any = {};
        KEYS.forEach(key => {
          remnant[key] = doc.data()[key] || '';
        });
        return remnant as RemnantMember;
      });

      // 정렬
      if (sortBy === 'name') {
        // 이름 순 (가나다순)
        data.sort((a, b) => a.이름.localeCompare(b.이름, 'ko'));
      } else if (sortBy === 'date') {
        // 등록일자 순 (최신순)
        data.sort((a, b) => {
          const dateA = a.등록일자 || '0000-00-00';
          const dateB = b.등록일자 || '0000-00-00';
          return dateB.localeCompare(dateA);
        });
      } else if (sortBy === 'age') {
        // 생년월일 순 (어린순)
        data.sort((a, b) => {
          const dateA = a.생년월일 || '9999-99-99';
          const dateB = b.생년월일 || '9999-99-99';
          return dateB.localeCompare(dateA);
        });
      }

      return data;
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      return null;
    }
  }

  // 데이터 저장
  async save(data: RemnantMember): Promise<boolean> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, data.id), data);
      this.update = true;
      return true;
    } catch (error) {
      console.error('데이터 저장 실패:', error);
      return false;
    }
  }

  // 데이터 삭제
  async remove(documentId: string, photoName: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, documentId));
      this.update = true;
      
      // 사진도 삭제
      await this.removePhoto(photoName);
      
      return true;
    } catch (error) {
      console.error('데이터 삭제 실패:', error);
      return false;
    }
  }

  // 사진 삭제
  async removePhoto(photoName: string): Promise<void> {
    try {
      if (photoName.startsWith('remote://')) {
        const photoPath = photoName.substring(9);
        const photoRef = ref(storage, photoPath);
        await deleteObject(photoRef);
        this.update = true;
      }
    } catch (error) {
      console.error('사진 삭제 실패:', error);
    }
  }
}

export const firebaseManager = new FirebaseManager();
