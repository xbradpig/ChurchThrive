'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTSelect } from '@/components/atoms/CTSelect';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTBadge } from '@/components/atoms/CTBadge';
import { StepIndicator } from '@/components/features/ImportWizard/StepIndicator';
import { cn } from '@/lib/cn';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────
interface ValidationResult {
  rowIndex: number;
  status: 'valid' | 'error' | 'warning';
  messages: string[];
}

interface ImportProgress {
  current: number;
  total: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { number: 1, label: '파일 업로드' },
  { number: 2, label: '열 매핑' },
  { number: 3, label: '미리보기' },
  { number: 4, label: '가져오기' },
];

const DB_FIELDS = [
  { value: '', label: '매핑 안함' },
  { value: 'name', label: '이름 *' },
  { value: 'phone', label: '전화번호' },
  { value: 'email', label: '이메일' },
  { value: 'address', label: '주소' },
  { value: 'gender', label: '성별' },
  { value: 'birth_date', label: '생년월일' },
  { value: 'position', label: '직분' },
  { value: 'baptism_date', label: '세례일' },
  { value: 'joined_at', label: '등록일' },
];

const HEADER_SUGGEST_MAP: Record<string, string> = {
  '이름': 'name',
  '성명': 'name',
  'name': 'name',
  '전화': 'phone',
  '전화번호': 'phone',
  '핸드폰': 'phone',
  '휴대폰': 'phone',
  '연락처': 'phone',
  'phone': 'phone',
  'tel': 'phone',
  '이메일': 'email',
  'email': 'email',
  '주소': 'address',
  'address': 'address',
  '성별': 'gender',
  'gender': 'gender',
  '생년월일': 'birth_date',
  '생일': 'birth_date',
  '생년': 'birth_date',
  'birth': 'birth_date',
  'birthday': 'birth_date',
  '직분': 'position',
  '직책': 'position',
  'position': 'position',
  '세례일': 'baptism_date',
  '세례': 'baptism_date',
  '등록일': 'joined_at',
  '등록': 'joined_at',
};

const POSITION_MAP: Record<string, string> = {
  '장로': 'elder',
  '안수집사': 'ordained_deacon',
  '집사': 'deacon',
  '성도': 'saint',
  'elder': 'elder',
  'deacon': 'deacon',
  'saint': 'saint',
};

const GENDER_MAP: Record<string, string> = {
  '남': 'male',
  '남자': 'male',
  '남성': 'male',
  'M': 'male',
  'male': 'male',
  '여': 'female',
  '여자': 'female',
  '여성': 'female',
  'F': 'female',
  'female': 'female',
};

const BATCH_SIZE = 50;

// ─── Component ────────────────────────────────────────────────────────
export default function MemberImportPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    errors: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // ─── Step 1: File Upload ──────────────────────────────────────────
  const parseFile = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    try {
      const XLSX = (await import('xlsx')).default;
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      if (jsonData.length < 2) {
        alert('파일에 데이터가 없습니다. 첫 번째 행은 헤더, 두 번째 행부터 데이터여야 합니다.');
        return;
      }

      const fileHeaders = jsonData[0].map((h) => String(h).trim());
      const fileRows = jsonData.slice(1).filter((row) =>
        row.some((cell) => String(cell).trim() !== '')
      );

      setFile(selectedFile);
      setHeaders(fileHeaders);
      setRows(fileRows.map((row) => row.map((cell) => String(cell).trim())));

      // Auto-suggest mapping
      const autoMapping: Record<string, string> = {};
      fileHeaders.forEach((header) => {
        const normalized = header.toLowerCase().trim();
        if (HEADER_SUGGEST_MAP[normalized]) {
          autoMapping[header] = HEADER_SUGGEST_MAP[normalized];
        } else if (HEADER_SUGGEST_MAP[header]) {
          autoMapping[header] = HEADER_SUGGEST_MAP[header];
        }
      });
      setMapping(autoMapping);
      setStep(2);
    } catch (error) {
      console.error('Failed to parse file:', error);
      alert('파일을 읽는 중 오류가 발생했습니다. .xlsx 또는 .csv 파일인지 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) parseFile(droppedFile);
    },
    [parseFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) parseFile(selectedFile);
    },
    [parseFile]
  );

  // ─── Step 2: Column Mapping ───────────────────────────────────────
  const updateMapping = useCallback((header: string, dbField: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (dbField === '') {
        delete next[header];
      } else {
        // Remove previous assignment of this dbField
        for (const key of Object.keys(next)) {
          if (next[key] === dbField) {
            delete next[key];
          }
        }
        next[header] = dbField;
      }
      return next;
    });
  }, []);

  const hasNameMapping = useMemo(
    () => Object.values(mapping).includes('name'),
    [mapping]
  );

  // ─── Step 3: Validation ───────────────────────────────────────────
  const runValidation = useCallback(() => {
    const results: ValidationResult[] = [];
    const phonesSeen = new Set<string>();
    const reverseMapping: Record<string, number> = {};

    // Build reverseMapping: dbField -> header index
    headers.forEach((header, idx) => {
      if (mapping[header]) {
        reverseMapping[mapping[header]] = idx;
      }
    });

    rows.forEach((row, rowIdx) => {
      const messages: string[] = [];
      let status: 'valid' | 'error' | 'warning' = 'valid';

      // Check required: name
      const nameIdx = reverseMapping['name'];
      if (nameIdx === undefined || !row[nameIdx]?.trim()) {
        messages.push('이름이 비어있습니다');
        status = 'error';
      }

      // Validate phone
      const phoneIdx = reverseMapping['phone'];
      if (phoneIdx !== undefined && row[phoneIdx]?.trim()) {
        const phone = row[phoneIdx].replace(/\D/g, '');
        if (phone && (phone.length < 10 || phone.length > 11)) {
          messages.push('전화번호 형식이 올바르지 않습니다');
          status = 'error';
        }
        if (phone && phonesSeen.has(phone)) {
          messages.push('중복 전화번호');
          if (status !== 'error') status = 'warning';
        }
        if (phone) phonesSeen.add(phone);
      }

      // Validate email
      const emailIdx = reverseMapping['email'];
      if (emailIdx !== undefined && row[emailIdx]?.trim()) {
        const email = row[emailIdx].trim();
        if (email && !email.includes('@')) {
          messages.push('이메일 형식이 올바르지 않습니다');
          if (status !== 'error') status = 'warning';
        }
      }

      // Validate gender
      const genderIdx = reverseMapping['gender'];
      if (genderIdx !== undefined && row[genderIdx]?.trim()) {
        const genderRaw = row[genderIdx].trim();
        if (genderRaw && !GENDER_MAP[genderRaw]) {
          messages.push(`인식할 수 없는 성별: "${genderRaw}"`);
          if (status !== 'error') status = 'warning';
        }
      }

      // Validate position
      const posIdx = reverseMapping['position'];
      if (posIdx !== undefined && row[posIdx]?.trim()) {
        const posRaw = row[posIdx].trim();
        if (posRaw && !POSITION_MAP[posRaw]) {
          messages.push(`인식할 수 없는 직분: "${posRaw}"`);
          if (status !== 'error') status = 'warning';
        }
      }

      results.push({ rowIndex: rowIdx, status, messages });
    });

    setValidationResults(results);
    setStep(3);
  }, [rows, headers, mapping]);

  const errorCount = useMemo(
    () => validationResults.filter((r) => r.status === 'error').length,
    [validationResults]
  );
  const warningCount = useMemo(
    () => validationResults.filter((r) => r.status === 'warning').length,
    [validationResults]
  );

  // ─── Step 4: Execute Import ───────────────────────────────────────
  const getMappedValue = useCallback(
    (row: string[], field: string): string | null => {
      const headerIdx = headers.findIndex((h) => mapping[h] === field);
      if (headerIdx === -1) return null;
      const value = row[headerIdx]?.trim() || null;
      return value;
    },
    [headers, mapping]
  );

  const executeImport = useCallback(async () => {
    setStep(4);
    setImportComplete(false);

    // Filter rows that are not errors
    const validRows = rows.filter(
      (_, idx) => validationResults[idx]?.status !== 'error'
    );

    const progress: ImportProgress = {
      current: 0,
      total: validRows.length,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [],
    };
    setImportProgress({ ...progress });

    try {
      // Get church_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      const { data: memberData } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData) {
        alert('교회 정보를 찾을 수 없습니다.');
        return;
      }

      const churchId = memberData.church_id;

      // Process in batches
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);
        const inserts = batch.map((row) => {
          const name = getMappedValue(row, 'name') || '';
          const phone = getMappedValue(row, 'phone');
          const email = getMappedValue(row, 'email');
          const address = getMappedValue(row, 'address');
          const genderRaw = getMappedValue(row, 'gender');
          const positionRaw = getMappedValue(row, 'position');
          const birthDate = getMappedValue(row, 'birth_date');
          const baptismDate = getMappedValue(row, 'baptism_date');
          const joinedAt = getMappedValue(row, 'joined_at');

          const gender = genderRaw ? GENDER_MAP[genderRaw] || null : null;
          const position = positionRaw ? POSITION_MAP[positionRaw] || null : null;

          return {
            church_id: churchId,
            name,
            phone: phone ? phone.replace(/\D/g, '') : '',
            email: email || null,
            address: address || null,
            gender: gender as 'male' | 'female' | null,
            position: position as 'elder' | 'ordained_deacon' | 'deacon' | 'saint' | null,
            birth_date: birthDate || null,
            baptism_date: baptismDate || null,
            joined_at: joinedAt || null,
            status: 'active' as const,
            role: 'member' as const,
          };
        });

        const { data: insertedData, error } = await supabase
          .from('members')
          .insert(inserts)
          .select('id');

        if (error) {
          // If batch insert fails, try one-by-one
          for (let j = 0; j < inserts.length; j++) {
            const { error: singleError } = await supabase
              .from('members')
              .insert(inserts[j]);

            if (singleError) {
              progress.errorCount += 1;
              progress.errors.push({
                row: i + j + 2, // +2 for header row + 0-index
                message: singleError.message,
              });
            } else {
              progress.successCount += 1;
            }
            progress.current = i + j + 1;
            setImportProgress({ ...progress });
          }
        } else {
          progress.successCount += inserts.length;
          progress.current = Math.min(i + BATCH_SIZE, validRows.length);
          setImportProgress({ ...progress });
        }
      }

      // Count skipped (error rows)
      progress.skippedCount = rows.length - validRows.length;
      setImportProgress({ ...progress });
    } catch (err: any) {
      console.error('Import failed:', err);
      progress.errors.push({ row: 0, message: err.message || '알 수 없는 오류' });
      setImportProgress({ ...progress });
    } finally {
      setImportComplete(true);
    }
  }, [rows, validationResults, supabase, getMappedValue]);

  const downloadErrorLog = useCallback(() => {
    const lines = [
      '행번호,오류 내용',
      ...importProgress.errors.map((e) => `${e.row},"${e.message}"`),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_errors.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [importProgress.errors]);

  // ─── Render Helpers ───────────────────────────────────────────────
  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="ct-container py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/members')}
          className="flex items-center gap-1 text-ct-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          교인 관리로 돌아가기
        </button>
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          엑셀 임포트
        </h1>
        <p className="text-ct-sm text-gray-500 mt-1">
          엑셀 파일(.xlsx, .csv)로 교인 명단을 일괄 등록합니다
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={WIZARD_STEPS} currentStep={step} className="mb-8" />

      {/* Step Content */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 p-6">
        {/* ───── Step 1: File Upload ───── */}
        {step === 1 && (
          <div>
            <h2 className="text-ct-lg font-semibold mb-4">1. 파일 업로드</h2>
            <p className="text-ct-sm text-gray-500 mb-6">
              교인 명단이 담긴 엑셀(.xlsx) 또는 CSV 파일을 업로드하세요.
              첫 번째 행은 헤더(열 이름)여야 합니다.
            </p>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <CTSpinner size="lg" />
                <p className="text-ct-sm text-gray-500 mt-4">파일을 분석하는 중...</p>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                className={cn(
                  'border-2 border-dashed rounded-ct-lg p-12 text-center transition-colors cursor-pointer',
                  isDragOver
                    ? 'border-ct-primary bg-ct-primary-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-ct-md font-medium text-gray-700">
                  파일을 드래그하여 놓거나 클릭하여 선택
                </p>
                <p className="text-ct-sm text-gray-400 mt-2">
                  지원 형식: .xlsx, .csv (최대 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* ───── Step 2: Column Mapping ───── */}
        {step === 2 && (
          <div>
            <h2 className="text-ct-lg font-semibold mb-2">2. 열 매핑</h2>
            <p className="text-ct-sm text-gray-500 mb-6">
              엑셀 파일의 열(헤더)을 교인 데이터 필드에 연결하세요. 이름은 필수입니다.
            </p>

            {/* File info */}
            {file && (
              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-ct-md">
                <DocumentTextIcon className="w-8 h-8 text-ct-primary shrink-0" />
                <div>
                  <p className="text-ct-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-ct-xs text-gray-500">
                    {formatFileSize(file.size)} / {rows.length}개 데이터 행
                  </p>
                </div>
              </div>
            )}

            {/* Mapping table */}
            <div className="border rounded-ct-md overflow-hidden mb-6">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-0 bg-gray-50 px-4 py-3 border-b font-medium text-ct-xs text-gray-500 uppercase">
                <span>엑셀 열 이름</span>
                <span className="w-8" />
                <span>매핑 필드</span>
              </div>
              {headers.map((header) => (
                <div
                  key={header}
                  className="grid grid-cols-[1fr_auto_1fr] gap-0 items-center px-4 py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-ct-sm font-medium text-gray-700 truncate">
                      {header}
                    </span>
                    {/* Show first value for reference */}
                    {rows[0] && (
                      <span className="text-ct-xs text-gray-400 truncate hidden sm:inline">
                        (예: {rows[0][headers.indexOf(header)]})
                      </span>
                    )}
                  </div>
                  <div className="w-8 flex justify-center text-gray-300">
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                  <CTSelect
                    options={DB_FIELDS}
                    value={mapping[header] || ''}
                    onChange={(e) => updateMapping(header, e.target.value)}
                    size="sm"
                    placeholder="매핑 안함"
                  />
                </div>
              ))}
            </div>

            {/* Preview of mapped data */}
            {previewRows.length > 0 && Object.keys(mapping).length > 0 && (
              <div className="mb-4">
                <h3 className="text-ct-sm font-semibold text-gray-600 mb-2">
                  매핑 미리보기 (처음 5행)
                </h3>
                <div className="overflow-x-auto border rounded-ct-md">
                  <table className="w-full text-ct-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                        {Object.entries(mapping).map(([, dbField]) => (
                          <th
                            key={dbField}
                            className="px-3 py-2 text-left font-medium text-gray-500"
                          >
                            {DB_FIELDS.find((f) => f.value === dbField)?.label || dbField}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                          {Object.entries(mapping).map(([header, dbField]) => (
                            <td
                              key={dbField}
                              className="px-3 py-2 text-gray-700 truncate max-w-[150px]"
                            >
                              {row[headers.indexOf(header)] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Validation note */}
            {!hasNameMapping && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-ct-md text-ct-sm text-red-700">
                <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                <span>이름 필드를 반드시 매핑해주세요.</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <CTButton
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setHeaders([]);
                  setRows([]);
                  setMapping({});
                }}
                leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              >
                다시 선택
              </CTButton>
              <CTButton
                variant="primary"
                onClick={runValidation}
                disabled={!hasNameMapping}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                검증하기
              </CTButton>
            </div>
          </div>
        )}

        {/* ───── Step 3: Preview & Validation ───── */}
        {step === 3 && (
          <div>
            <h2 className="text-ct-lg font-semibold mb-2">3. 데이터 검증</h2>
            <p className="text-ct-sm text-gray-500 mb-4">
              데이터를 확인하세요. 오류가 있는 행은 건너뛰고, 유효한 행만 가져옵니다.
            </p>

            {/* Summary */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-ct-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-ct-sm font-medium text-green-800">
                  정상 {validationResults.filter((r) => r.status === 'valid').length}개
                </span>
              </div>
              {warningCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-ct-md">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <span className="text-ct-sm font-medium text-yellow-800">
                    경고 {warningCount}개
                  </span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-ct-md">
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                  <span className="text-ct-sm font-medium text-red-800">
                    오류 {errorCount}개 (건너뜀)
                  </span>
                </div>
              )}
            </div>

            {/* Data table */}
            <div className="overflow-x-auto border rounded-ct-md mb-6 max-h-[400px] overflow-y-auto">
              <table className="w-full text-ct-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-12">행</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-16">
                      상태
                    </th>
                    {Object.entries(mapping).map(([, dbField]) => (
                      <th
                        key={dbField}
                        className="px-3 py-2 text-left font-medium text-gray-500"
                      >
                        {DB_FIELDS.find((f) => f.value === dbField)?.label || dbField}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium text-gray-500">메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults.map((result) => {
                    const row = rows[result.rowIndex];
                    return (
                      <tr
                        key={result.rowIndex}
                        className={cn(
                          'border-t',
                          result.status === 'error' && 'bg-red-50',
                          result.status === 'warning' && 'bg-yellow-50'
                        )}
                      >
                        <td className="px-3 py-2 text-gray-400">{result.rowIndex + 2}</td>
                        <td className="px-3 py-2">
                          {result.status === 'valid' && (
                            <CTBadge label="정상" color="green" size="sm" />
                          )}
                          {result.status === 'warning' && (
                            <CTBadge label="경고" color="yellow" size="sm" />
                          )}
                          {result.status === 'error' && (
                            <CTBadge label="오류" color="red" size="sm" />
                          )}
                        </td>
                        {Object.entries(mapping).map(([header, dbField]) => (
                          <td
                            key={dbField}
                            className="px-3 py-2 text-gray-700 truncate max-w-[120px]"
                          >
                            {row[headers.indexOf(header)] || '-'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-ct-xs">
                          {result.messages.length > 0 && (
                            <span
                              className={cn(
                                result.status === 'error'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                              )}
                            >
                              {result.messages.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <CTButton
                variant="ghost"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              >
                매핑 수정
              </CTButton>
              <CTButton
                variant="primary"
                onClick={executeImport}
                disabled={validationResults.filter((r) => r.status !== 'error').length === 0}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                {validationResults.filter((r) => r.status !== 'error').length}명 가져오기
              </CTButton>
            </div>
          </div>
        )}

        {/* ───── Step 4: Execute Import ───── */}
        {step === 4 && (
          <div>
            <h2 className="text-ct-lg font-semibold mb-4">4. 가져오기 실행</h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-ct-sm text-gray-600 mb-2">
                <span>진행 상황</span>
                <span>
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    importComplete && importProgress.errorCount > 0
                      ? 'bg-yellow-500'
                      : 'bg-ct-primary'
                  )}
                  style={{
                    width: `${
                      importProgress.total > 0
                        ? (importProgress.current / importProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Status */}
            {!importComplete && (
              <div className="flex items-center justify-center gap-3 py-8">
                <CTSpinner size="md" />
                <span className="text-ct-md text-gray-600">데이터를 가져오는 중...</span>
              </div>
            )}

            {importComplete && (
              <>
                {/* Results Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-ct-md">
                    <p className="text-ct-2xl font-bold text-green-700">
                      {importProgress.successCount}
                    </p>
                    <p className="text-ct-sm text-green-600 mt-1">성공</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-ct-md">
                    <p className="text-ct-2xl font-bold text-red-700">
                      {importProgress.errorCount}
                    </p>
                    <p className="text-ct-sm text-red-600 mt-1">실패</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-ct-md">
                    <p className="text-ct-2xl font-bold text-gray-600">
                      {importProgress.skippedCount}
                    </p>
                    <p className="text-ct-sm text-gray-500 mt-1">건너뜀</p>
                  </div>
                </div>

                {/* Completion message */}
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-ct-md mb-6">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
                  <p className="text-ct-sm text-green-800">
                    가져오기가 완료되었습니다. {importProgress.successCount}명의 교인이
                    등록되었습니다.
                  </p>
                </div>

                {/* Error log download */}
                {importProgress.errors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-ct-sm font-semibold text-gray-600 mb-2">
                      오류 로그
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto border rounded-ct-md mb-3">
                      {importProgress.errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 border-b last:border-b-0 text-ct-xs text-red-600"
                        >
                          {err.row > 0 ? `행 ${err.row}: ` : ''}
                          {err.message}
                        </div>
                      ))}
                    </div>
                    <CTButton
                      variant="outline"
                      size="sm"
                      leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                      onClick={downloadErrorLog}
                    >
                      오류 로그 다운로드
                    </CTButton>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <CTButton
                    variant="ghost"
                    onClick={() => {
                      setStep(1);
                      setFile(null);
                      setHeaders([]);
                      setRows([]);
                      setMapping({});
                      setValidationResults([]);
                      setImportComplete(false);
                      setImportProgress({
                        current: 0,
                        total: 0,
                        successCount: 0,
                        errorCount: 0,
                        skippedCount: 0,
                        errors: [],
                      });
                    }}
                  >
                    다른 파일 가져오기
                  </CTButton>
                  <CTButton
                    variant="primary"
                    onClick={() => router.push('/members')}
                  >
                    교인 목록으로 이동
                  </CTButton>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
