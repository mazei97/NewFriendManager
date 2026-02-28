import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';

const CACHE_KEY = '@image_url_cache';
const CACHE_EXPIRY_DAYS = 7; // 7일 후 만료
const MAX_IMAGE_SIZE = 800; // 최대 이미지 크기 (가로/세로 중 큰 쪽 기준)

// 메모리 캐시 (빠른 접근용)
const memoryCache: { [key: string]: string } = {};

interface CacheItem {
  url: string;
  timestamp: number;
}

export const storageService = {
  // 캐시 초기화 (앱 시작 시 호출)
  async initCache() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData: { [key: string]: CacheItem } = JSON.parse(cached);
        const now = Date.now();
        const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        // 만료되지 않은 항목만 메모리 캐시에 로드
        Object.keys(cacheData).forEach(key => {
          if (now - cacheData[key].timestamp < expiryTime) {
            memoryCache[key] = cacheData[key].url;
          }
        });
      }
    } catch (error) {
      console.error('캐시 초기화 실패:', error);
    }
  },

  // 캐시 저장
  async saveCache() {
    try {
      const cacheData: { [key: string]: CacheItem } = {};
      const now = Date.now();
      
      Object.keys(memoryCache).forEach(key => {
        cacheData[key] = {
          url: memoryCache[key],
          timestamp: now,
        };
      });
      
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  },

  // Firebase Storage에서 이미지 URL 가져오기 (파일 캐싱 적용)
  async getImageUrl(photoPath: string): Promise<string | null> {
    try {
      if (!photoPath || !photoPath.startsWith('remote://')) {
        return null;
      }

      // 메모리 캐시 확인
      if (memoryCache[photoPath]) {
        return memoryCache[photoPath];
      }

      const path = photoPath.substring(9); // "remote://" 제거
      
      const imageRef = ref(storage, path);
      const url = await getDownloadURL(imageRef);
      
      // 메모리 캐시에 저장
      memoryCache[photoPath] = url;
      
      // 파일 캐시에 저장 (비동기로 백그라운드에서)
      this.saveCache();
      
      return url;
    } catch (error) {
      console.error('이미지 URL 가져오기 실패:', error);
      return null;
    }
  },

  // 이미지 업로드
  async uploadImage(uri: string, memberId: string): Promise<string | null> {
    try {
      // 이미지 리사이징 (최대 800x800, 품질 80%)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_IMAGE_SIZE } }], // 가로 기준으로 리사이징, 세로는 비율 유지
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();
      
      const filename = `members/${memberId}_${Date.now()}.jpg`;
      const imageRef = ref(storage, filename);
      
      await uploadBytes(imageRef, blob);
      
      const remotePath = `remote://${filename}`;
      
      // 업로드 후 바로 URL 가져와서 캐시에 저장
      const url = await getDownloadURL(imageRef);
      memoryCache[remotePath] = url;
      
      // 파일 캐시에 저장
      this.saveCache();
      
      return remotePath;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      return null;
    }
  },

  // 캐시 초기화
  async clearCache() {
    try {
      Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('캐시 초기화 실패:', error);
    }
  },

  // 특정 이미지 캐시 삭제
  async removeCacheItem(photoPath: string) {
    if (memoryCache[photoPath]) {
      delete memoryCache[photoPath];
      await this.saveCache();
    }
  },
};
