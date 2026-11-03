import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import CommunityDialog from './CommunityDialog';
import CommunityAvatar from './CommunityAvatar';
import { communityApi, communityError } from '../../services/communityApi';

export default function CommunityComposer({ user, onClose, onCreated, topics = [], challenges = [], defaultChallenge = null }) {
  const [content, setContent] = useState(''), [images, setImages] = useState([]), [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState(''), [found, setFound] = useState([]), [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [title, setTitle] = useState(''), [topic, setTopic] = useState('');
  const [kind, setKind] = useState(defaultChallenge ? 'challenge' : 'story'), [challengeId, setChallengeId] = useState(defaultChallenge || '');
  const [progress, setProgress] = useState(0);
  const previews = useRef([]), searchAbort = useRef(null);
  useEffect(() => () => { previews.current.forEach(image => URL.revokeObjectURL(image.url)); searchAbort.current?.abort(); }, []);
  const chooseImages = event => {
    const selected = [...event.target.files]; event.target.value = '';
    if (images.length + selected.length > 4) { setError('Bạn có thể chọn tối đa 4 ảnh.'); return; }
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024)) { setError('Chọn ảnh JPG, PNG, WEBP hoặc GIF, tối đa 5 MB mỗi ảnh.'); return; }
    const next = [...images, ...selected.map(file => ({ file, url: URL.createObjectURL(file) }))];
    previews.current = next; setImages(next); setError('');
  };
  const removeImage = index => {
    URL.revokeObjectURL(images[index].url);
    const next = images.filter((_, i) => i !== index); previews.current = next; setImages(next);
  };
  const search = async () => {
    searchAbort.current?.abort(); const controller = new AbortController(); searchAbort.current = controller;
    setSearching(true); setError('');
    try { setFound(await communityApi.recipes(query, controller.signal)); setHasSearched(true); }
    catch (err) { if (err.code !== 'ERR_CANCELED') setError(communityError(err)); }
    finally { if (!controller.signal.aborted) setSearching(false); }
  };
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { await communityApi.create(content, recipes, images, { title, topic, kind, challengeId: kind === 'challenge' ? challengeId : '' }, setProgress); toast.success('Đã chia sẻ câu chuyện của bạn!'); onCreated(); onClose(); }
    catch (err) { setError(communityError(err)); }
    finally { setBusy(false); }
  };
  return <CommunityDialog title="Chia sẻ từ căn bếp của bạn" onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="community-composer-form">
      <div className="community-person"><CommunityAvatar name={user.full_name || user.fullName || user.username} src={user.avatar_url || user.avatarUrl} /><div><strong>{user.full_name || user.fullName || user.username}</strong><small><span className="material-symbols-outlined">public</span> Bài viết công khai</small></div></div>
      <label htmlFor="community-title" className="text-xs block mb-2">Tiêu đề (không bắt buộc)</label>
      <input id="community-title" className="w-full mb-3" value={title} onChange={event => setTitle(event.target.value)} maxLength={150} disabled={busy} placeholder="Một câu chuyện từ căn bếp…" />
      <div className="grid grid-cols-2 gap-3 mb-3"><label className="text-xs">Nhóm cộng đồng<select className="w-full mt-1" value={topic} onChange={event => {setTopic(event.target.value);if(event.target.value==='tips'&&kind==='story')setKind('tip');}} disabled={busy}><option value="">Chia sẻ chung</option>{topics.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label className="text-xs">Loại bài<select className="w-full mt-1" value={kind} onChange={event => setKind(event.target.value)} disabled={busy}><option value="story">Câu chuyện</option><option value="tip">Câu hỏi & mẹo</option>{challenges.length > 0 && <option value="challenge">Bài dự thử thách</option>}</select></label></div>
      {kind === 'challenge' && <label className="text-xs block mb-3">Thử thách<select className="w-full mt-1" required value={challengeId} onChange={event => setChallengeId(event.target.value)} disabled={busy}><option value="">Chọn thử thách</option>{challenges.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
      <label className="sr-only" htmlFor="community-content">Nội dung bài viết</label>
      <textarea id="community-content" required maxLength={8000} rows={5} value={content} onChange={event => setContent(event.target.value)} placeholder="Hôm nay bếp nhà bạn có gì ngon? Chia sẻ một món ăn, mẹo nhỏ hay câu chuyện của bạn…" disabled={busy} />
      <div className="community-preview-grid">{images.map((image, index) => <div key={image.url}><img src={image.url} alt={`Ảnh đính kèm ${index + 1}`} /><button type="button" aria-label={`Bỏ ảnh ${index + 1}`} onClick={() => removeImage(index)} disabled={busy}>×</button></div>)}</div>
      <div className="community-selected-recipes">{recipes.map(recipe => <span key={recipe.id}>{recipe.title}<button type="button" onClick={() => setRecipes(current => current.filter(item => item.id !== recipe.id))} disabled={busy} aria-label={`Bỏ công thức ${recipe.title}`}>×</button></span>)}</div>
      <div className="community-attach-row"><label className="community-secondary-button"><span className="material-symbols-outlined">add_photo_alternate</span>Thêm ảnh<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImages} hidden disabled={busy} /></label><small>Tối đa 4 ảnh · 5 MB/ảnh</small></div>
      <div className="community-recipe-picker">
        <label htmlFor="community-recipe-search">Đính kèm công thức trên CulinShare <small>({recipes.length}/3)</small></label>
        <div className="community-search"><input id="community-recipe-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên công thức…" disabled={busy} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); search(); } }} /><button type="button" onClick={search} disabled={busy || searching}>{searching ? 'Đang tìm…' : 'Tìm'}</button></div>
        <div className="community-recipe-options">{found.map(recipe => <button type="button" key={recipe.id} disabled={busy || recipes.length >= 3 || recipes.some(item => item.id === recipe.id)} onClick={() => setRecipes(current => [...current, recipe])}><span className="material-symbols-outlined">menu_book</span>{recipe.title}<span>+</span></button>)}</div>
        {hasSearched && !searching && !found.length && <p className="community-muted">Chưa tìm thấy công thức. Thử tên món ngắn hơn nhé.</p>}
      </div>
      {error && <p role="alert" className="community-error">{error}</p>}
      {busy && <p role="status" className="community-muted">{progress < 100 ? `Đang gửi dữ liệu: ${progress}%` : 'Đang xử lý ảnh và lưu bài viết…'}</p>}
      <footer><small>{content.length}/8.000 ký tự</small><button className="community-primary-button" disabled={busy || !content.trim()}>{busy ? 'Đang đăng bài…' : 'Chia sẻ bài viết'}<span className="material-symbols-outlined">arrow_forward</span></button></footer>
    </form>
  </CommunityDialog>;
}
