import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firebaseManager, RemnantMember } from '../services/firebaseManager';
import { storageService } from '../services/storageService';
import DetailScreen from './DetailScreen';

interface FriendDisplay {
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
    week4: boolean;
  };
  completionDate?: string;
  originalData: RemnantMember;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<FriendDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedMember, setSelectedMember] = useState<RemnantMember | null>(null);
  const [photoUrls, setPhotoUrls] = useState<{ [key: string]: string }>({});
  const [sortBy] = useState<'name' | 'date' | 'age'>('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    등반제외: false,
    방문제외: false,
    등록일자로부터: false,
    기간: 1, // 1, 2, 3 개월
  });
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    loadFriends();
  }, [sortBy]); // sortBy가 변경되면 다시 로드

  // 사진 URL 로드
  useEffect(() => {
    loadPhotoUrls();
  }, [friends]);

  const loadPhotoUrls = async () => {
    const urls: { [key: string]: string } = {};
    
    // remote:// 경로를 가진 친구들만 필터링
    const friendsWithPhotos = friends.filter(
      friend => friend.photoUrl && friend.photoUrl.startsWith('remote://')
    );
    
    // 5개씩 배치로 병렬 처리
    const BATCH_SIZE = 5;
    for (let i = 0; i < friendsWithPhotos.length; i += BATCH_SIZE) {
      const batch = friendsWithPhotos.slice(i, i + BATCH_SIZE);
      
      // 배치 내에서 병렬 처리
      const promises = batch.map(async (friend) => {
        const url = await storageService.getImageUrl(friend.photoUrl!);
        if (url) {
          return { id: friend.id, url };
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      
      // 결과를 urls 객체에 추가
      results.forEach(result => {
        if (result) {
          urls[result.id] = result.url;
        }
      });
    }
    
    setPhotoUrls(urls);
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const convertToDisplay = (member: RemnantMember): FriendDisplay => {
    return {
      id: member.id,
      name: member.이름,
      gender: member.성별,
      age: calculateAge(member.생년월일),
      birthDate: member.생년월일,
      photoUrl: member.사진,
      education: {
        week1: !!(member.교육1차 && member.교육1차 !== ''),
        week2: !!(member.교육2차 && member.교육2차 !== ''),
        week3: !!(member.교육3차 && member.교육3차 !== ''),
        week4: !!(member.등반 && member.등반 !== ''),
      },
      completionDate: member.등반 || undefined, // 등반 날짜가 수료일
      originalData: member,
    };
  };

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await firebaseManager.load(sortBy);
      
      if (data) {
        const displayData = data.map(convertToDisplay);
        setFriends(displayData);
      } else {
        Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('데이터 로드 오류:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFilter = () => {
    setTempFilters(filters); // 현재 필터를 임시 필터에 복사
    setShowFilterModal(true);
  };

  const handleCancelFilter = () => {
    setShowFilterModal(false);
  };

  const handleApplyFilter = () => {
    setFilters(tempFilters); // 임시 필터를 실제 필터에 적용
    setShowFilterModal(false);
  };

  const handleAddFriend = () => {
    // 빈 새친구 데이터 생성
    const newMember: RemnantMember = {
      id: Date.now().toString(),
      사진: '',
      이름: '',
      성별: '',
      생년월일: '',
      구분: '',
      등록일자: '',
      교구: '',
      연락처1: '',
      연락처2: '',
      주소: '',
      교육1차: '',
      교육2차: '',
      교육3차: '',
      등반: '',
      인수교사: '',
      메모: '',
    };
    setSelectedMember(newMember);
  };

  const handleFriendPress = (friend: FriendDisplay) => {
    setSelectedMember(friend.originalData);
  };

  const handleSaveMember = async (member: RemnantMember) => {
    const success = await firebaseManager.save(member);
    
    if (success) {
      Alert.alert('성공', '저장되었습니다.');
      setSelectedMember(null);
      loadFriends();
    } else {
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    const success = await firebaseManager.remove(selectedMember.id, selectedMember.사진);
    if (success) {
      Alert.alert('성공', '삭제되었습니다.');
      setSelectedMember(null);
      loadFriends();
    } else {
      Alert.alert('오류', '삭제에 실패했습니다.');
    }
  };

  const filteredFriends = friends.filter(friend => {
    // 검색어 필터
    if (searchText && !friend.name.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    // 등반제외 필터 (completionDate가 있는 경우 제외)
    if (filters.등반제외 && friend.completionDate) {
      return false;
    }

    // 방문제외 필터 (구분이 '방문'인 경우 제외)
    if (filters.방문제외 && friend.originalData.구분 === '방문') {
      return false;
    }

    // 등록일자로부터 N개월 필터 (체크박스가 선택되었을 때만)
    if (filters.등록일자로부터) {
      if (!friend.originalData.등록일자) {
        return false; // 등록일자가 없으면 제외
      }
      
      const registrationDate = new Date(friend.originalData.등록일자);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - registrationDate.getFullYear()) * 12 + (now.getMonth() - registrationDate.getMonth());
      
      if (monthsDiff > filters.기간) {
        return false;
      }
    }

    return true;
  });

  const renderEducationCheckboxes = (education: FriendDisplay['education']) => {
    const weeks = [education.week1, education.week2, education.week3];
    return (
      <View style={styles.checkboxContainer}>
        {weeks.map((checked, index) => (
          <View key={index} style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
        ))}
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: FriendDisplay }) => {
    // 등반 날짜가 있으면 수료 완료
    const hasCompletionDate = !!(item.completionDate && item.completionDate !== '');
    
    // Firebase Storage URL 또는 기본 이미지
    const imageSource = photoUrls[item.id] 
      ? { uri: photoUrls[item.id] }
      : null;
    
    return (
    <TouchableOpacity 
      style={styles.friendCard}
      onPress={() => handleFriendPress(item)}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>
            {item.name.charAt(0)}
          </Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.gender}>{item.gender}</Text>
          <Text style={styles.age}>{item.age}세</Text>
        </View>
        
        <View style={styles.dateRow}>
          <Text style={styles.birthDate}>{item.birthDate}</Text>
          {hasCompletionDate ? (
            <View style={styles.completionContainer}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.completionDate}>{item.completionDate}</Text>
            </View>
          ) : (
            renderEducationCheckboxes(item.education)
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="이름 검색"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilter}>
          <Text style={styles.filterIcon}>☰</Text>
          <Text style={styles.filterText}>필터</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriendItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>등록된 새친구가 없습니다</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={handleAddFriend}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* 필터 모달 */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.filterModalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>필터</Text>

            {/* 등반제외 */}
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setTempFilters({
                  ...tempFilters,
                  등반제외: !tempFilters.등반제외,
                })
              }
            >
              <View style={[styles.checkbox, tempFilters.등반제외 && styles.checkboxChecked]}>{tempFilters.등반제외 && <Text style={styles.checkmark}>✓</Text>}</View>
              <Text style={styles.filterOptionText}>등반제외</Text>
            </TouchableOpacity>

            {/* 방문제외 */}
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setTempFilters({
                  ...tempFilters,
                  방문제외: !tempFilters.방문제외,
                })
              }
            >
              <View style={[styles.checkbox, tempFilters.방문제외 && styles.checkboxChecked]}>{tempFilters.방문제외 && <Text style={styles.checkmark}>✓</Text>}</View>
              <Text style={styles.filterOptionText}>방문제외</Text>
            </TouchableOpacity>

            {/* 등록일자로부터 */}
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setTempFilters({
                  ...tempFilters,
                  등록일자로부터: !tempFilters.등록일자로부터,
                })
              }
            >
              <View style={[styles.checkbox, tempFilters.등록일자로부터 && styles.checkboxChecked]}>{tempFilters.등록일자로부터 && <Text style={styles.checkmark}>✓</Text>}</View>
              <Text style={styles.filterOptionText}>등록일자로부터</Text>
            </TouchableOpacity>

            <View style={styles.filterDivider} />

            {/* 기간 선택 */}
            <TouchableOpacity style={styles.filterOption} onPress={() => setTempFilters({ ...tempFilters, 기간: 1 })}>
              <View style={[styles.radioButton, tempFilters.기간 === 1 && styles.radioButtonSelected]}>
                {tempFilters.기간 === 1 && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.filterOptionText}>최근 1개월</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterOption} onPress={() => setTempFilters({ ...tempFilters, 기간: 2 })}>
              <View style={[styles.radioButton, tempFilters.기간 === 2 && styles.radioButtonSelected]}>
                {tempFilters.기간 === 2 && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.filterOptionText}>최근 2개월</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterOption} onPress={() => setTempFilters({ ...tempFilters, 기간: 3 })}>
              <View style={[styles.radioButton, tempFilters.기간 === 3 && styles.radioButtonSelected]}>
                {tempFilters.기간 === 3 && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.filterOptionText}>최근 3개월</Text>
            </TouchableOpacity>

            <View style={styles.filterDivider} />

            {/* 버튼 */}
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity style={styles.filterResetButton} onPress={handleCancelFilter}>
                <Text style={styles.filterResetButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterApplyButton} onPress={handleApplyFilter}>
                <Text style={styles.filterApplyButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 상세화면 모달 */}
      <Modal
        visible={selectedMember !== null}
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}
      >
        {selectedMember && (
          <DetailScreen
            member={selectedMember}
            isNewMode={!selectedMember.이름}
            onSave={handleSaveMember}
            onDelete={handleDeleteMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#6200EE',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 4,
  },
  filterIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  friendCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200EE',
  },
  photoPlaceholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  gender: {
    fontSize: 15,
    color: '#666',
  },
  age: {
    fontSize: 15,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  birthDate: {
    fontSize: 14,
    color: '#666',
  },
  star: {
    fontSize: 15,
  },
  completionDate: {
    fontSize: 14,
    color: '#666',
  },
  completionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#6200EE',
    borderColor: '#6200EE',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 50,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    lineHeight: 34,
    marginTop: -2,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#424242',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#666',
    marginVertical: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6200EE',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6200EE',
  },
  filterButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  filterResetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#666',
    alignItems: 'center',
  },
  filterResetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterApplyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
  },
  filterApplyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
