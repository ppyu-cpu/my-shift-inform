import React, { useState, useEffect } from 'react';
import { ActiveScreen, DayInform, MaintenanceRecord, ShiftType, VersionSnapshot, WorkStatusType } from './types';
import { loadInforms, saveInforms, createNewInform } from './storage';
import { Header } from './components/Header';
import { HubView } from './components/HubView';
import { MainInformSheet } from './components/MainInformSheet';
import { SearchResultsView } from './components/SearchResultsView';
import { SavedRecordsManager } from './components/SavedRecordsManager';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { NewInformModal } from './components/NewInformModal';
import { NewDateSheetModal } from './components/NewDateSheetModal';
import { EmergencyLogModal } from './components/EmergencyLogModal';
import { Toast } from './components/Toast';
import {
  saveInformToFirebase,
  saveRecordToFirebase,
  fetchAllInformsFromFirebase,
  seedDefaultDataIfNeeded,
  subscribeToInforms,
} from './services/firebaseService';

export default function App() {
  const [informs, setInforms] = useState<Record<string, DayInform>>(() => loadInforms());
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('hub');
  const [selectedDate, setSelectedDate] = useState<string>('2024-05-20');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<ShiftType | 'ALL'>('ALL');
  const [highlightRecordId, setHighlightRecordId] = useState<string | undefined>();
  const [targetShift, setTargetShift] = useState<ShiftType | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [isNewDateModalOpen, setIsNewDateModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Sync to localStorage as local fallback
  useEffect(() => {
    saveInforms(informs);
  }, [informs]);

  // Initial Firebase synchronization and real-time listening
  useEffect(() => {
    let isMounted = true;

    const initFirebase = async () => {
      try {
        const remoteInforms = await fetchAllInformsFromFirebase();
        if (isMounted && Object.keys(remoteInforms).length > 0) {
          setInforms((prev) => ({
            ...prev,
            ...remoteInforms,
          }));
        } else {
          // Seed defaults to Firebase so the cloud database has data
          await seedDefaultDataIfNeeded(informs);
        }
      } catch (err) {
        console.warn('Firebase initial load note:', err);
      }
    };

    initFirebase();

    const unsubscribe = subscribeToInforms((remoteInforms) => {
      if (isMounted && Object.keys(remoteInforms).length > 0) {
        setInforms((prev) => ({
          ...prev,
          ...remoteInforms,
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Currently active day inform
  const currentInform =
    informs[selectedDate] ||
    Object.values(informs)[0] || {
      date: selectedDate,
      title: `${selectedDate} 인폼`,
      author: '김철수 기사',
      activeShift: 'DAY',
      status: '진행 중',
      issueCount: 0,
      completionRate: 0,
      summary: '신규 작성 시트',
      lastSaved: '',
      records: [],
      history: [],
    };

  // Handlers
  const handleSelectDateInform = (date: string) => {
    setSelectedDate(date);
    setHighlightRecordId(undefined);
    setTargetShift(undefined);
    setCurrentScreen('main');
  };

  const handleEnterTodayInform = () => {
    setSelectedDate('2024-05-20');
    setHighlightRecordId(undefined);
    setTargetShift(undefined);
    setCurrentScreen('main');
  };

  const handleUpdateInform = (updated: DayInform) => {
    setInforms((prev) => ({
      ...prev,
      [updated.date]: updated,
    }));
    saveInformToFirebase(updated).catch(console.error);
  };

  const handleCreateDateSheet = (
    date: string,
    shift: ShiftType,
    author: string,
    summary: string
  ) => {
    const { updatedInforms, newInform } = createNewInform(
      informs,
      date,
      shift,
      author,
      summary
    );
    setInforms(updatedInforms);
    setSelectedDate(newInform.date);
    setCurrentScreen('main');
    saveInformToFirebase(newInform).catch(console.error);
    showToast(`${date} 신규 인폼 시트가 생성되었습니다.`);
  };

  const handleCreateEntry = (entry: {
    date: string;
    shift: ShiftType;
    equipmentId: string;
    workDescription: string;
    workStatus?: WorkStatusType;
    remarks: string;
    author: string;
    attachments: { name: string; type: 'image' | 'pdf' | 'document'; size: string; dataUrl?: string }[];
  }) => {
    let targetInform = informs[entry.date];
    if (!targetInform) {
      const created = createNewInform(
        informs,
        entry.date,
        entry.shift,
        entry.author,
        '새 정비 항목 작성'
      );
      targetInform = created.newInform;
    }

    const nowTime = new Date().toTimeString().substring(0, 5);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const workStatus = entry.workStatus || '완료됨';

    const newRec: MaintenanceRecord = {
      id: `rec-${Date.now()}`,
      no: targetInform.records.length + 1,
      date: entry.date,
      time: nowTime,
      shift: entry.shift,
      equipmentId: entry.equipmentId,
      workDescription: entry.workDescription,
      workStatus,
      savedAt: nowStr,
      author: entry.author || '담당 엔지니어',
      remarks: entry.remarks,
      attachments: entry.attachments.map((a, i) => ({
        id: `att-${Date.now()}-${i}`,
        name: a.name,
        size: a.size,
        type: a.type,
        dataUrl: a.dataUrl,
      })),
      isRemarkWarning:
        entry.remarks.includes('대기') ||
        entry.remarks.includes('경보') ||
        entry.remarks.includes('주의') ||
        entry.remarks.includes('긴급'),
    };

    const updatedInform: DayInform = {
      ...targetInform,
      records: [...targetInform.records, newRec],
      lastSaved: nowStr,
    };

    setInforms((prev) => ({
      ...prev,
      [entry.date]: updatedInform,
    }));
    setSelectedDate(entry.date);
    setHighlightRecordId(newRec.id);
    setCurrentScreen('main');

    // Persist to Firebase Firestore
    saveInformToFirebase(updatedInform).catch(console.error);
    saveRecordToFirebase(newRec).catch(console.error);

    showToast(`설비 "${entry.equipmentId}" 정비 인폼이 Firebase DB에 저장되었습니다. (상태: ${workStatus})`);
  };

  const handleRestoreVersion = (snapshot: VersionSnapshot) => {
    const updated: DayInform = {
      ...currentInform,
      records: JSON.parse(JSON.stringify(snapshot.records)),
      lastSaved: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    handleUpdateInform(updated);
    showToast(`[${snapshot.timestamp}] 시점의 버전으로 인폼이 복구되었습니다.`);
  };

  const handleGlobalSearchSubmit = (q: string) => {
    setSearchQuery(q);
    setCurrentScreen('search');
  };

  const handleJumpToDateSheet = (date: string, recordId: string, shift: ShiftType) => {
    setSelectedDate(date);
    setHighlightRecordId(recordId);
    setTargetShift(shift);
    setCurrentScreen('main');

    const parts = date.split('-');
    const dateLabel =
      parts.length === 3 ? `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일` : date;
    showToast(`${dateLabel} [${shift} 조] 원본 시트로 이동하여 해당 정비 내역을 펼쳤습니다.`);
  };

  const handleEmergencySubmit = (emergency: {
    equipmentId: string;
    issue: string;
    shift: ShiftType;
    actionTaken: string;
  }) => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    const emergencyRec: MaintenanceRecord = {
      id: `rec-emg-${Date.now()}`,
      no: currentInform.records.length + 1,
      date: currentInform.date,
      time: nowTime,
      shift: emergency.shift,
      equipmentId: emergency.equipmentId,
      workDescription: `[긴급 장애] ${emergency.issue}`,
      remarks: `[비상 조치] ${emergency.actionTaken}`,
      attachments: [],
      isRemarkWarning: true,
    };

    const updated: DayInform = {
      ...currentInform,
      status: '이슈 있음',
      issueCount: (currentInform.issueCount || 0) + 1,
      records: [emergencyRec, ...currentInform.records],
      lastSaved: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    handleUpdateInform(updated);
    showToast(`[긴급] ${emergency.equipmentId} 비상 정비 로그가 등록되었습니다.`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#fdf8ff] text-[#1c192d] font-sans antialiased overflow-hidden select-none">
      {/* Global Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setHighlightRecordId(undefined);
          setCurrentScreen(screen);
        }}
        onOpenNewInformModal={() => setIsNewEntryModalOpen(true)}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleGlobalSearchSubmit}
        currentDate={selectedDate}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hub Screen: Shift Ledger Hub (Full Width) */}
        {currentScreen === 'hub' && (
          <HubView
            informs={informs}
            todayDate={selectedDate}
            onEnterTodayInform={handleEnterTodayInform}
            onSelectDateInform={handleSelectDateInform}
            onOpenNewDateModal={() => setIsNewDateModalOpen(true)}
            onImportInforms={(imported) => {
              setInforms(imported);
              saveInforms(imported);
            }}
            onShowToast={showToast}
            onNavigateToReservations={() => setCurrentScreen('reservations')}
            selectedShiftFilter={selectedShiftFilter}
            onSelectShiftFilter={setSelectedShiftFilter}
          />
        )}

        {/* Main Inform Sheet: Realtime editing spreadsheet */}
        {currentScreen === 'main' && (
          <MainInformSheet
            inform={currentInform}
            availableDates={Object.keys(informs)}
            targetShift={targetShift}
            onDateChange={(date) => {
              setTargetShift(undefined);
              if (informs[date]) {
                setSelectedDate(date);
              } else {
                handleCreateDateSheet(date, 'DAY', '김철수 기사', '신규 생성 인폼');
              }
            }}
            onUpdateInform={handleUpdateInform}
            onOpenVersionHistory={() => setIsVersionModalOpen(true)}
            onNavigateToHub={() => {
              setTargetShift(undefined);
              setHighlightRecordId(undefined);
              setCurrentScreen('hub');
            }}
            onSearchSubmit={handleGlobalSearchSubmit}
            onShowToast={showToast}
            highlightRecordId={highlightRecordId}
            onClearHighlight={() => {
              setHighlightRecordId(undefined);
              setTargetShift(undefined);
            }}
          />
        )}

        {/* Search Screen: Read-only search results grid (Full Width) */}
        {currentScreen === 'search' && (
          <SearchResultsView
            query={searchQuery}
            informs={informs}
            onCloseSearch={() => setCurrentScreen('main')}
            onJumpToDateSheet={handleJumpToDateSheet}
            onShowToast={showToast}
          />
        )}

        {/* Firebase Saved Records & Reservations Manager */}
        {currentScreen === 'reservations' && (
          <SavedRecordsManager
            onClose={() => setCurrentScreen('main')}
            onOpenNewInform={() => setIsNewEntryModalOpen(true)}
            onJumpToDateSheet={handleJumpToDateSheet}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* Modals */}
      <NewInformModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        defaultDate={selectedDate}
        defaultShift={currentInform.activeShift || 'DAY'}
        onCreateEntry={handleCreateEntry}
      />

      <NewDateSheetModal
        isOpen={isNewDateModalOpen}
        onClose={() => setIsNewDateModalOpen(false)}
        existingDates={Object.keys(informs)}
        onCreateDateSheet={handleCreateDateSheet}
      />

      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        inform={currentInform}
        onRestoreVersion={handleRestoreVersion}
      />

      <EmergencyLogModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSubmitEmergency={handleEmergencySubmit}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
