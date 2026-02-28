// Firebase 데이터 타입 (한글 필드명)
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

// 화면 표시용 타입
export interface FriendDisplay {
  id: string;
  name: string;
  gender: string;
  age: number;
  birthDate: string;
  photoUrl?: string;
  education: {
    week1: boolean;
    week2: boolean;
    week3: boolean;
  };
  completionDate?: string;
  originalData: RemnantMember;
}

export interface Filters {
  등반제외: boolean;
  방문제외: boolean;
  등록일자로부터: boolean;
  기간: 1 | 2 | 3;
}
