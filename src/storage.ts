import { DayInform, MaintenanceRecord, ShiftType, VersionSnapshot } from './types';
import { INITIAL_INFORMS } from './mockData';

const STORAGE_KEY = 'maintintel_informs_v1';

export function loadInforms(): Record<string, DayInform> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveInforms(INITIAL_INFORMS);
      return INITIAL_INFORMS;
    }
    const parsed = JSON.parse(raw);
    if (Object.keys(parsed).length === 0) {
      saveInforms(INITIAL_INFORMS);
      return INITIAL_INFORMS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load informs from localStorage:', err);
    return INITIAL_INFORMS;
  }
}

export function saveInforms(informs: Record<string, DayInform>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(informs));
  } catch (err) {
    console.error('Failed to save informs to localStorage:', err);
  }
}

export function createNewInform(
  informs: Record<string, DayInform>,
  date: string,
  shift: ShiftType = 'DAY',
  author: string = '김철수 기사',
  summary: string = '신규 작성 인폼'
): { updatedInforms: Record<string, DayInform>; newInform: DayInform } {
  const existing = informs[date];
  if (existing) {
    return { updatedInforms: informs, newInform: existing };
  }

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newInform: DayInform = {
    date,
    title: `${date} 교대 인폼`,
    author,
    activeShift: shift,
    status: '진행 중',
    issueCount: 0,
    completionRate: 0,
    summary,
    lastSaved: nowStr,
    records: [
      {
        id: `rec-${Date.now()}-1`,
        no: 1,
        date,
        time: '09:00',
        shift,
        equipmentId: 'EQ-A1-001',
        workDescription: '',
        attachments: [],
        remarks: '',
        isRemarkWarning: false,
      },
    ],
    history: [
      {
        id: `ver-${Date.now()}`,
        timestamp: nowStr,
        author,
        shift,
        summary: '최초 신규 시트 생성',
        recordCount: 1,
        records: [],
      },
    ],
  };

  newInform.history[0].records = JSON.parse(JSON.stringify(newInform.records));

  const updated = {
    ...informs,
    [date]: newInform,
  };
  saveInforms(updated);
  return { updatedInforms: updated, newInform };
}

export function exportToCSV(records: MaintenanceRecord[], filename: string = 'maintenance_inform.csv') {
  const headers = ['No', '일자', '시간', '교대조', '설비번호', '정비내용', '첨부파일', '비고'];
  const rows = records.map((r) => [
    r.no,
    r.date,
    r.time,
    r.shift,
    `"${(r.equipmentId || '').replace(/"/g, '""')}"`,
    `"${(r.workDescription || '').replace(/"/g, '""')}"`,
    `"${r.attachments.map((a) => a.name).join(', ')}"`,
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
