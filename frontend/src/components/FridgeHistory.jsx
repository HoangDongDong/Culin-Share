import { useEffect, useState } from 'react';
import api from '../services/api';

export default function FridgeHistory({ token, onRestore, disabled }) {
  const [entries, setEntries] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/ai/fridge-history', { signal: controller.signal }).then(response => {
      setEntries(response.data.data.entries);
      setNextCursor(response.data.data.nextCursor);
      setError('');
    }).catch(error => {
      if (!controller.signal.aborted) setError(error.response?.data?.message || 'Chưa tải được lịch sử. Bạn thử lại nhé.');
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [retry]);

  const loadMore = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await api.get('/api/ai/fridge-history', { params: { before: nextCursor } });
      setEntries(previous => [...previous, ...response.data.data.entries]);
      setNextCursor(response.data.data.nextCursor);
    } catch (error) {
      setError(error.response?.data?.message || 'Chưa tải được lịch sử. Bạn thử lại nhé.');
    } finally { setBusy(false); }
  };

  const openEntry = async id => {
    setBusy(true);
    setError('');
    try {
      const response = await api.get(`/api/ai/fridge-history/${id}`);
      if (localStorage.getItem('token') === token) onRestore(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Chưa mở được lần gợi ý này.');
    } finally { setBusy(false); }
  };

  const deleteEntry = async id => {
    if (!window.confirm('Xóa lần gợi ý này khỏi lịch sử?')) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/api/ai/fridge-history/${id}`);
      setEntries(previous => previous.filter(entry => entry.id !== id));
    } catch (error) {
      setError(error.response?.data?.message || 'Chưa xóa được lần gợi ý này.');
    } finally { setBusy(false); }
  };

  return (
    <section aria-labelledby="fridge-history-title" className="bg-white rounded-2xl border border-outline-variant/20 p-4 sm:p-6 mb-6">
      <h2 id="fridge-history-title" className="text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" aria-hidden="true">history</span>
        Lịch sử Tủ lạnh ảo
      </h2>
      <p className="text-sm text-secondary mt-2 mb-4">Các lần gợi ý thành công được lưu vào tài khoản. Mở lại để xem món ăn, nguyên liệu và danh sách đi chợ.</p>
      {error && <div role="alert" className="text-red-700 text-sm mb-3">
        <p>{error}</p>
        <button type="button" disabled={busy || disabled} className="underline mt-1 disabled:opacity-50" onClick={() => { setBusy(true); setRetry(value => value + 1); }}>Tải lại lịch sử</button>
      </div>}
      {!busy && !error && entries.length === 0 && <p className="text-sm text-secondary">Chưa có lịch sử. Hãy tạo gợi ý món ăn đầu tiên của bạn.</p>}
      <ul className="space-y-3 max-h-96 overflow-y-auto">
        {entries.map(entry => <li key={entry.id} className="rounded-xl bg-surface-container-low p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm break-words">{entry.recipe_names.join(' · ')}</p>
              <p className="text-xs text-secondary mt-1">
                {new Date(entry.created_at).toLocaleString('vi-VN')} · {entry.request_config.peopleCount} người · {entry.recipe_names.length} món · {entry.request_config.cookingSpeed}
              </p>
              <p className="text-xs text-secondary mt-1 break-words">{entry.request_config.ingredients.map(item => [item.name, item.quantity].filter(Boolean).join(' ')).join(', ')}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy || disabled} onClick={() => openEntry(entry.id)} className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50">Mở lại</button>
              <button type="button" disabled={busy || disabled} onClick={() => deleteEntry(entry.id)} aria-label={`Xóa lần gợi ý ${new Date(entry.created_at).toLocaleString('vi-VN')}`} className="px-3 py-2 rounded-lg border border-outline-variant/30 text-red-700 text-sm disabled:opacity-50">Xóa</button>
            </div>
          </div>
        </li>)}
      </ul>
      {busy && <p role="status" className="text-sm text-secondary mt-3">Đang tải lịch sử…</p>}
      {nextCursor && <button type="button" onClick={loadMore} disabled={busy || disabled} className="mt-4 text-sm font-bold text-primary disabled:opacity-50">Xem thêm lịch sử</button>}
    </section>
  );
}
