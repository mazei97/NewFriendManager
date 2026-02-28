import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { RemnantMember } from '../services/firebaseManager';
import { storageService } from '../services/storageService';

interface DetailScreenProps {
  member: RemnantMember;
  isNewMode: boolean;
  onSave: (member: RemnantMember) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function DetailScreen({ member, isNewMode, onSave, onDelete, onClose }: DetailScreenProps) {
  const [editedMember, setEditedMember] = useState<RemnantMember>(member);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // 사진 URL 로드
  useEffect(() => {
    loadPhotoUrl();
  }, [editedMember.사진]);

  const loadPhotoUrl = async () => {
    if (editedMember.사진 && editedMember.사진.startsWith('remote://')) {
      const url = await storageService.getImageUrl(editedMember.사진);
      setPhotoUrl(url);
    } else {
      setPhotoUrl(null);
    }
  };

  // 연락처 파싱 함수
  const parseContact = (contact: string): { number: string; type: string } => {
    if (!contact) return { number: '', type: '' };
    const parts = contact.split(';');
    return {
      number: parts[0] || '',
      type: parts[1] || '',
    };
  };

  // 연락처 조합 함수
  const combineContact = (number: string, type: string): string => {
    if (!number) return '';
    return type ? `${number};${type}` : number;
  };

  const genderOptions = ['남', '여'];
  const categoryOptions = ['등록', '방문'];
  const districtOptions = ['강서1', '강서2', '남부', '강남강북', '경기서부', '경기남부'];
  const contactTypeOptions = ['아빠', '엄마', '할아버지', '할머니', '기타'];

  const updateField = (field: keyof RemnantMember, value: string) => {
    setEditedMember({ ...editedMember, [field]: value });
  };

  const handleDatePickerOpen = (field: string) => {
    const currentValue = editedMember[field as keyof RemnantMember] as string;
    if (currentValue) {
      setTempDate(new Date(currentValue));
    } else {
      setTempDate(new Date());
    }
    setShowDatePicker(field);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
      if (event.type === 'set' && date) {
        const formattedDate = date.toISOString().split('T')[0];
        updateField(showDatePicker as keyof RemnantMember, formattedDate);
      }
    } else {
      // iOS: 날짜만 업데이트, 모달은 확인 버튼으로 닫음
      if (date) {
        setTempDate(date);
      }
    }
  };

  const handleDateConfirm = () => {
    if (showDatePicker && tempDate) {
      const formattedDate = tempDate.toISOString().split('T')[0];
      updateField(showDatePicker as keyof RemnantMember, formattedDate);
    }
    setShowDatePicker(null);
  };

  const handleDateCancel = () => {
    setShowDatePicker(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Firebase Storage에 업로드
      const remotePath = await storageService.uploadImage(result.assets[0].uri, editedMember.id);
      if (remotePath) {
        updateField('사진', remotePath);
      } else {
        Alert.alert('오류', '이미지 업로드에 실패했습니다.');
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Firebase Storage에 업로드
      const remotePath = await storageService.uploadImage(result.assets[0].uri, editedMember.id);
      if (remotePath) {
        updateField('사진', remotePath);
      } else {
        Alert.alert('오류', '이미지 업로드에 실패했습니다.');
      }
    }
  };

  const handlePhotoPress = () => {
    Alert.alert(
      '사진 선택',
      '사진을 어떻게 가져오시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '갤러리', onPress: pickImage },
        { text: '카메라', onPress: takePhoto },
      ]
    );
  };

  const makePhoneCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleSave = () => {
    if (!editedMember.이름.trim()) {
      Alert.alert('알림', '이름을 입력하세요.');
      return;
    }
    onSave(editedMember);
  };

  const handleDelete = () => {
    Alert.alert(
      '삭제 확인',
      `${editedMember.이름}을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const renderPickerModal = (
    field: keyof RemnantMember,
    options: string[],
    title: string
  ) => (
    <Modal
      visible={showPicker === field}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPicker(null)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPicker(null)}
      >
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.pickerOption}
              onPress={() => {
                updateField(field, option);
                setShowPicker(null);
              }}
            >
              <Text style={styles.pickerOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.headerButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>상세정보</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 사진 */}
        <View style={styles.photoContainer}>
          {photoUrl ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={styles.photo}
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>
                {editedMember.이름.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.photoEditButton} onPress={handlePhotoPress}>
            <Text style={styles.photoEditIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* 이름 */}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={editedMember.이름}
            onChangeText={(text) => updateField('이름', text)}
            placeholder="이름"
          />
        </View>

        {/* 성별 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => setShowPicker('성별')}
        >
          <Text style={styles.label}>성별</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.성별 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 생년월일 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => handleDatePickerOpen('생년월일')}
        >
          <Text style={styles.label}>생년월일</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.생년월일 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 구분 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => setShowPicker('구분')}
        >
          <Text style={styles.label}>구분</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.구분 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 등록일자 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => handleDatePickerOpen('등록일자')}
        >
          <Text style={styles.label}>등록일자</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.등록일자 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 교구 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => setShowPicker('교구')}
        >
          <Text style={styles.label}>교구</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.교구 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 연락처1 */}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>연락처1</Text>
          <View style={styles.contactContainer}>
            <TextInput
              style={styles.contactInput}
              value={parseContact(editedMember.연락처1).number}
              onChangeText={(text) => {
                const contact = parseContact(editedMember.연락처1);
                updateField('연락처1', combineContact(text, contact.type));
              }}
              placeholder="연락처"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.contactTypeButton}
              onPress={() => setShowPicker('연락처1타입')}
            >
              <Text style={styles.contactTypeText}>
                {parseContact(editedMember.연락처1).type || '관계'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
            {parseContact(editedMember.연락처1).number && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => makePhoneCall(parseContact(editedMember.연락처1).number)}
              >
                <Text style={styles.phoneIcon}>📞</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 연락처2 */}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>연락처2</Text>
          <View style={styles.contactContainer}>
            <TextInput
              style={styles.contactInput}
              value={parseContact(editedMember.연락처2).number}
              onChangeText={(text) => {
                const contact = parseContact(editedMember.연락처2);
                updateField('연락처2', combineContact(text, contact.type));
              }}
              placeholder="연락처"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.contactTypeButton}
              onPress={() => setShowPicker('연락처2타입')}
            >
              <Text style={styles.contactTypeText}>
                {parseContact(editedMember.연락처2).type || '관계'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
            {parseContact(editedMember.연락처2).number && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => makePhoneCall(parseContact(editedMember.연락처2).number)}
              >
                <Text style={styles.phoneIcon}>📞</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 주소 */}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>주소</Text>
          <TextInput
            style={styles.input}
            value={editedMember.주소}
            onChangeText={(text) => updateField('주소', text)}
            placeholder="주소"
            multiline
          />
        </View>

        {/* 교육1차 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => handleDatePickerOpen('교육1차')}
        >
          <Text style={styles.label}>교육1차</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.교육1차 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 교육2차 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => handleDatePickerOpen('교육2차')}
        >
          <Text style={styles.label}>교육2차</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.교육2차 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 교육3차 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => handleDatePickerOpen('교육3차')}
        >
          <Text style={styles.label}>교육3차</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.교육3차 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 등반 */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => handleDatePickerOpen('등반')}
        >
          <Text style={styles.label}>등반</Text>
          <View style={styles.pickerField}>
            <Text style={styles.pickerText}>{editedMember.등반 || '선택'}</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* 인수교사 */}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>인수교사</Text>
          <TextInput
            style={styles.input}
            value={editedMember.인수교사}
            onChangeText={(text) => updateField('인수교사', text)}
            placeholder="인수교사"
          />
        </View>

        {/* 메모 */}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>메모</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={editedMember.메모}
            onChangeText={(text) => updateField('메모', text)}
            placeholder="메모"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 저장/삭제 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        {!isNewMode && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pickers */}
      {renderPickerModal('성별', genderOptions, '성별 선택')}
      {renderPickerModal('구분', categoryOptions, '구분 선택')}
      {renderPickerModal('교구', districtOptions, '교구 선택')}
      
      {/* 연락처 타입 선택 - 특별 처리 */}
      <Modal
        visible={showPicker === '연락처1타입'}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(null)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>관계 선택</Text>
            {contactTypeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.pickerOption}
                onPress={() => {
                  const contact = parseContact(editedMember.연락처1);
                  updateField('연락처1', combineContact(contact.number, option));
                  setShowPicker(null);
                }}
              >
                <Text style={styles.pickerOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPicker === '연락처2타입'}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(null)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>관계 선택</Text>
            {contactTypeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.pickerOption}
                onPress={() => {
                  const contact = parseContact(editedMember.연락처2);
                  updateField('연락처2', combineContact(contact.number, option));
                  setShowPicker(null);
                }}
              >
                <Text style={styles.pickerOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={handleDateCancel}>
          <TouchableOpacity style={styles.datePickerModalOverlay} activeOpacity={1} onPress={handleDateCancel}>
            <View style={styles.datePickerModal} onStartShouldSetResponder={() => true}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <Text style={styles.datePickerButton}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>{showDatePicker}</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text style={[styles.datePickerButton, styles.datePickerConfirm]}>확인</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={handleDateChange} textColor="#000000" />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      {showDatePicker && Platform.OS === 'android' && <DateTimePicker value={tempDate} mode="date" display="default" onChange={handleDateChange} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    padding: 16,
    paddingTop: 40,
  },
  headerButton: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photo: {
    width: 225,
    height: 225,
    borderRadius: 112.5,
    backgroundColor: '#e0e0e0',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200EE',
  },
  photoPlaceholderText: {
    color: 'white',
    fontSize: 72,
    fontWeight: 'bold',
  },
  photoEditButton: {
    position: 'absolute',
    right: '25%',
    bottom: 0,
    backgroundColor: '#6200EE',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditIcon: {
    fontSize: 24,
  },
  fieldRow: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 8,
    padding: 10,
  },
  label: {
    fontSize: 14,
    color: 'white',
    backgroundColor: '#6200EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  input: {
    fontSize: 15,
    color: '#333',
    padding: 6,
  },
  memoInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pickerField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
  },
  pickerText: {
    fontSize: 15,
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#999',
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 6,
  },
  contactTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  contactTypeText: {
    fontSize: 13,
    color: '#6200EE',
  },
  phoneButton: {
    padding: 6,
  },
  phoneIcon: {
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerButton: {
    fontSize: 16,
    color: '#6200EE',
    paddingHorizontal: 8,
  },
  datePickerConfirm: {
    fontWeight: 'bold',
  },
  datePickerContainer: {
    height: 216,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
});
