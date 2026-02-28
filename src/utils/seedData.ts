import { friendService } from '../services/friendService';
import { sampleFriends } from './testData';

export const seedTestData = async () => {
  try {
    console.log('테스트 데이터 추가 시작...');
    
    for (const friend of sampleFriends) {
      await friendService.addFriend(friend);
      console.log(`${friend.name} 추가 완료`);
    }
    
    console.log('모든 테스트 데이터 추가 완료!');
    return true;
  } catch (error) {
    console.error('테스트 데이터 추가 실패:', error);
    return false;
  }
};
