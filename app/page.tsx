'use client';

import { useEffect, useState } from 'react';
import { firebaseService } from '@/lib/firebaseService';
import { RemnantMember, FriendDisplay, Filters } from '@/lib/types';

export default function Home() {
  const [friends, setFriends] = useState<FriendDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<RemnantMember | null>(null);
  const [filters, setFilters] = useState<Filters>({
    등반제외: false,
    방문제외: false,
    등록일자로부터: false,
    기간: 1,
  });
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [photoUrls, setPhotoUrls] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPhotoUrls();
  }, [friends]);

  const loadData = async () => {
    setLoading(true);
    
    const loginSuccess = await firebaseService.autoLogin();
    if (!loginSuccess) {
      alert('로그인에 실패했습니다.');
      setLoading(false);
      return;
    }

    const data = await firebaseService.loadMembers('date');
    const displayData = data.map(convertToDisplay);
    setFriends(displayData);
    setLoading(false);
  };

  const loadPhotoUrls = async () => {
    const urls: { [key: string]: string } = {};
    
    const friendsWithPhotos = friends.filter(
      friend => friend.photoUrl && friend.photoUrl.startsWith('remote://')
    );
    
    const BATCH_SIZE = 5;
    for (let i = 0; i < friendsWithPhotos.length; i += BATCH_SIZE) {
      const batch = friendsWithPhotos.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (friend) => {
        const url = await firebaseService.getImageUrl(friend.photoUrl!);
        if (url) {
          return { id: friend.id, url };
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      
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
      },
      completionDate: member.등반 || undefined,
      originalData: member,
    };
  };

  const handleOpenFilter = () => {
    setTempFilters(filters);
    setShowFilterModal(true);
  };

  const handleApplyFilter = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
  };

  const handleAddFriend = () => {
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

  const handleFriendClick = (friend: FriendDisplay) => {
    setSelectedMember(friend.originalData);
  };

  const handleSave = async (member: RemnantMember) => {
    if (!member.이름) {
      alert('이름을 입력해주세요.');
      return;
    }

    const success = await firebaseService.saveMember(member);
    if (success) {
      alert('저장되었습니다.');
      setSelectedMember(null);
      loadData();
    } else {
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (member: RemnantMember) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const success = await firebaseService.deleteMember(member.id, member.사진);
    if (success) {
      alert('삭제되었습니다.');
      setSelectedMember(null);
      loadData();
    } else {
      alert('삭제에 실패했습니다.');
    }
  };

  const filteredFriends = friends.filter(friend => {
    if (searchText && !friend.name.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    if (filters.등반제외 && friend.completionDate) {
      return false;
    }

    if (filters.방문제외 && friend.originalData.구분 === '방문') {
      return false;
    }

    if (filters.등록일자로부터) {
      if (!friend.originalData.등록일자) {
        return false;
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (selectedMember) {
    return <DetailView member={selectedMember} onSave={handleSave} onDelete={handleDelete} onClose={() => setSelectedMember(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-600 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="이름 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-5 py-3 rounded-full text-base bg-white text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={handleOpenFilter}
            className="flex items-center gap-1 px-4 text-white"
          >
            <span className="text-2xl font-bold">☰</span>
            <span className="text-lg font-bold">필터</span>
          </button>
        </div>
      </div>

      <div className="p-4 pb-24">
        {filteredFriends.length === 0 ? (
          <p className="text-center text-gray-500 mt-12">등록된 새친구가 없습니다</p>
        ) : (
          filteredFriends.map(friend => {
            const hasCompletionDate = !!(friend.completionDate && friend.completionDate !== '');
            const imageUrl = photoUrls[friend.id];
            
            return (
              <button
                key={friend.id}
                onClick={() => handleFriendClick(friend)}
                className="flex bg-white rounded-lg p-2 mb-2 shadow-sm w-full text-left"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={friend.name}
                    className="w-[60px] h-[60px] rounded-md object-cover"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] rounded-md bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {friend.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 ml-2 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-gray-800">{friend.name}</span>
                    <span className="text-[15px] text-gray-600">{friend.gender}</span>
                    <span className="text-[15px] text-gray-600">{friend.age}세</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">{friend.birthDate}</span>
                    {hasCompletionDate ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[15px]">⭐</span>
                        <span className="text-sm text-gray-600">{friend.completionDate}</span>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        {[friend.education.week1, friend.education.week2, friend.education.week3].map((checked, index) => (
                          <div
                            key={index}
                            className={`w-[22px] h-[22px] border-2 rounded flex items-center justify-center ${
                              checked ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'
                            }`}
                          >
                            {checked && <span className="text-white text-sm font-bold">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={handleAddFriend}
        className="fixed right-5 bottom-5 w-[60px] h-[60px] rounded-full bg-purple-600 flex items-center justify-center shadow-lg"
      >
        <span className="text-white text-[34px] font-bold leading-none">+</span>
      </button>

      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-5 w-[80%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-5 text-center">필터</h2>

            <button
              className="flex items-center py-3 w-full"
              onClick={() => setTempFilters({ ...tempFilters, 등반제외: !tempFilters.등반제외 })}
            >
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center ${
                tempFilters.등반제외 ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
              }`}>
                {tempFilters.등반제외 && <span className="text-white text-sm font-bold">✓</span>}
              </div>
              <span className="ml-3 text-white">등반제외</span>
            </button>

            <button
              className="flex items-center py-3 w-full"
              onClick={() => setTempFilters({ ...tempFilters, 방문제외: !tempFilters.방문제외 })}
            >
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center ${
                tempFilters.방문제외 ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
              }`}>
                {tempFilters.방문제외 && <span className="text-white text-sm font-bold">✓</span>}
              </div>
              <span className="ml-3 text-white">방문제외</span>
            </button>

            <button
              className="flex items-center py-3 w-full"
              onClick={() => setTempFilters({ ...tempFilters, 등록일자로부터: !tempFilters.등록일자로부터 })}
            >
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center ${
                tempFilters.등록일자로부터 ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
              }`}>
                {tempFilters.등록일자로부터 && <span className="text-white text-sm font-bold">✓</span>}
              </div>
              <span className="ml-3 text-white">등록일자로부터</span>
            </button>

            <div className="h-px bg-gray-600 my-3"></div>

            {[1, 2, 3].map(month => (
              <button
                key={month}
                className="flex items-center py-3 w-full"
                onClick={() => setTempFilters({ ...tempFilters, 기간: month as 1 | 2 | 3 })}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  tempFilters.기간 === month ? 'border-purple-600' : 'border-gray-400'
                }`}>
                  {tempFilters.기간 === month && (
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span className="ml-3 text-white">최근 {month}개월</span>
              </button>
            ))}

            <div className="h-px bg-gray-600 my-3"></div>

            <div className="flex gap-3 mt-5">
              <button
                className="flex-1 py-3 rounded bg-gray-600 text-white font-bold"
                onClick={() => setShowFilterModal(false)}
              >
                취소
              </button>
              <button
                className="flex-1 py-3 rounded bg-cyan-500 text-white font-bold"
                onClick={handleApplyFilter}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailView({
  member: initialMember,
  onSave,
  onDelete,
  onClose,
}: {
  member: RemnantMember;
  onSave: (member: RemnantMember) => void;
  onDelete: (member: RemnantMember) => void;
  onClose: () => void;
}) {
  const [member, setMember] = useState(initialMember);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const isNewMode = !initialMember.이름;

  useEffect(() => {
    if (member.사진 && member.사진.startsWith('remote://')) {
      firebaseService.getImageUrl(member.사진).then(setPhotoUrl);
    }
  }, [member.사진]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const remotePath = await firebaseService.uploadImage(file, member.id);
    if (remotePath) {
      setMember({ ...member, 사진: remotePath });
      const url = await firebaseService.getImageUrl(remotePath);
      setPhotoUrl(url);
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    if (phoneNumber) {
      const phone = phoneNumber.split(';')[0];
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-purple-600 p-4 flex items-center">
        <button onClick={onClose} className="text-white text-2xl mr-4">
          ←
        </button>
        <h1 className="text-white text-xl font-bold">
          {isNewMode ? '새친구 등록' : '새친구 정보'}
        </h1>
      </div>

      <div className="p-4 space-y-3 overflow-x-hidden">
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">사진</label>
          <div className="flex flex-col items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="사진"
                className="w-[225px] h-[225px] rounded-lg object-cover"
              />
            ) : (
              <div className="w-[225px] h-[225px] rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white text-6xl font-bold">
                  {member.이름 ? member.이름.charAt(0) : '?'}
                </span>
              </div>
            )}
            <label className="px-6 py-3 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
              사진 선택
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
          <input
            type="text"
            value={member.이름}
            onChange={(e) => setMember({ ...member, 이름: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
          <select
            value={member.성별}
            onChange={(e) => setMember({ ...member, 성별: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">선택</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
          <input
            type="date"
            value={member.생년월일}
            onChange={(e) => setMember({ ...member, 생년월일: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">구분</label>
          <select
            value={member.구분}
            onChange={(e) => setMember({ ...member, 구분: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">선택</option>
            <option value="새친구">새친구</option>
            <option value="방문">방문</option>
          </select>
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">등록일자</label>
          <input
            type="date"
            value={member.등록일자}
            onChange={(e) => setMember({ ...member, 등록일자: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">교구</label>
          <select
            value={member.교구}
            onChange={(e) => setMember({ ...member, 교구: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">선택</option>
            <option value="1교구">1교구</option>
            <option value="2교구">2교구</option>
            <option value="3교구">3교구</option>
            <option value="4교구">4교구</option>
          </select>
        </div>

        <div className="bg-white rounded-lg p-4 overflow-hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">연락처1</label>
          <div className="flex gap-2 items-stretch min-w-0">
            <input
              type="text"
              value={member.연락처1.split(';')[0] || ''}
              onChange={(e) => {
                const relation = member.연락처1.split(';')[1] || '';
                setMember({ ...member, 연락처1: `${e.target.value};${relation}` });
              }}
              placeholder="전화번호"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={member.연락처1.split(';')[1] || ''}
              onChange={(e) => {
                const phone = member.연락처1.split(';')[0] || '';
                setMember({ ...member, 연락처1: `${phone};${e.target.value}` });
              }}
              className="w-20 px-2 py-2 border border-gray-300 rounded-md shrink-0"
            >
              <option value="">관계</option>
              <option value="부">부</option>
              <option value="모">모</option>
              <option value="기타">기타</option>
            </select>
            <button
              onClick={() => handlePhoneCall(member.연락처1)}
              className="w-12 px-2 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center text-2xl shrink-0"
              title="전화 걸기"
            >
              📞
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 overflow-hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">연락처2</label>
          <div className="flex gap-2 items-stretch min-w-0">
            <input
              type="text"
              value={member.연락처2.split(';')[0] || ''}
              onChange={(e) => {
                const relation = member.연락처2.split(';')[1] || '';
                setMember({ ...member, 연락처2: `${e.target.value};${relation}` });
              }}
              placeholder="전화번호"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={member.연락처2.split(';')[1] || ''}
              onChange={(e) => {
                const phone = member.연락처2.split(';')[0] || '';
                setMember({ ...member, 연락처2: `${phone};${e.target.value}` });
              }}
              className="w-20 px-2 py-2 border border-gray-300 rounded-md shrink-0"
            >
              <option value="">관계</option>
              <option value="부">부</option>
              <option value="모">모</option>
              <option value="기타">기타</option>
            </select>
            <button
              onClick={() => handlePhoneCall(member.연락처2)}
              className="w-12 px-2 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center text-2xl shrink-0"
              title="전화 걸기"
            >
              📞
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
          <input
            type="text"
            value={member.주소}
            onChange={(e) => setMember({ ...member, 주소: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">교육 1차</label>
          <input
            type="date"
            value={member.교육1차}
            onChange={(e) => setMember({ ...member, 교육1차: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">교육 2차</label>
          <input
            type="date"
            value={member.교육2차}
            onChange={(e) => setMember({ ...member, 교육2차: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">교육 3차</label>
          <input
            type="date"
            value={member.교육3차}
            onChange={(e) => setMember({ ...member, 교육3차: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">등반 (수료일)</label>
          <input
            type="date"
            value={member.등반}
            onChange={(e) => setMember({ ...member, 등반: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">인수교사</label>
          <input
            type="text"
            value={member.인수교사}
            onChange={(e) => setMember({ ...member, 인수교사: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
          <textarea
            value={member.메모}
            onChange={(e) => setMember({ ...member, 메모: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSave(member)}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold"
          >
            저장
          </button>
          {!isNewMode && (
            <button
              onClick={() => onDelete(member)}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
