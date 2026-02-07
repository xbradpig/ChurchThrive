'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Church, Database } from '@churchthrive/shared';

type AccessRequestInsert = Database['public']['Tables']['access_requests']['Insert'];

export default function ChurchSearchClient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Church[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    if (query.length < 2) return;
    setIsSearching(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('churches')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      setResults(data || []);
    } catch {
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  async function handleJoinRequest() {
    if (!selectedChurch) return;
    setIsSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // @ts-ignore - Type inference issue with Supabase client
      const { error } = await supabase.from('access_requests').insert({
        church_id: selectedChurch.id,
        user_id: user.id,
        status: 'pending',
      });

      if (error) {
        setError('가입 요청 중 오류가 발생했습니다.');
        return;
      }

      router.push('/register/pending');
    } catch {
      setError('요청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-ct-xl shadow-ct-2 p-6">
      <h2 className="text-ct-xl font-semibold text-center mb-2">교회 선택</h2>
      <p className="text-ct-sm text-gray-500 text-center mb-6">
        소속 교회를 검색하여 선택해주세요
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-ct-sm rounded-ct-md">{error}</div>
      )}

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="교회명으로 검색"
          className="flex-1 h-11 px-3 border border-gray-300 rounded-ct-md text-ct-md
            focus:outline-none focus:ring-2 focus:ring-ct-primary focus:border-transparent
            placeholder:text-gray-400"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || query.length < 2}
          className="h-11 px-4 bg-ct-primary text-white font-medium rounded-ct-md
            hover:bg-ct-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
        >
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {results.map((church) => (
          <button
            key={church.id}
            onClick={() => setSelectedChurch(church)}
            className={`w-full p-3 text-left rounded-ct-md border transition-colors ${
              selectedChurch?.id === church.id
                ? 'border-ct-primary bg-ct-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="font-medium text-ct-md">{church.name}</p>
            {church.address && (
              <p className="text-ct-sm text-gray-500 mt-0.5">{church.address}</p>
            )}
            {church.denomination && (
              <p className="text-ct-xs text-gray-400 mt-0.5">{church.denomination}</p>
            )}
          </button>
        ))}
        {results.length === 0 && query.length >= 2 && !isSearching && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-ct-sm">검색 결과가 없습니다</p>
            <button
              onClick={() => router.push('/church/new')}
              className="mt-2 text-ct-sm text-ct-primary font-medium hover:underline"
            >
              교회 직접 등록하기
            </button>
          </div>
        )}
      </div>

      {/* Submit */}
      {selectedChurch && (
        <button
          onClick={handleJoinRequest}
          disabled={isSubmitting}
          className="w-full h-11 mt-4 bg-ct-primary text-white font-medium rounded-ct-md
            hover:bg-ct-primary-600 active:bg-ct-primary-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
        >
          {isSubmitting ? '요청 중...' : `${selectedChurch.name} 가입 요청`}
        </button>
      )}
    </div>
  );
}
