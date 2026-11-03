import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../services/api';
import { communityApi, communityError } from '../../services/communityApi';
import CommunityAvatar from './CommunityAvatar';
import CommunityDialog from './CommunityDialog';

const date = value => new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export default function CommunityPost({ post, user, requireLogin, onChange, onRemove }) {
  const [dialog, setDialog] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [editContent, setEditContent] = useState(post.content), [reason, setReason] = useState('spam'), [reportText, setReportText] = useState('');
  const [showComments, setShowComments] = useState(false), [comments, setComments] = useState([]), [commentLoading, setCommentLoading] = useState(false);
  const [cursor, setCursor] = useState(0), [hasMoreComments, setHasMoreComments] = useState(false), [commentError, setCommentError] = useState('');
  const [commentText, setCommentText] = useState(''), [replyTo, setReplyTo] = useState(null), [commentBusy, setCommentBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [reportedComment, setReportedComment] = useState(null);
  const author = post.author_name || post.author_username || 'Thành viên';
  const own = user?.id === post.author_id;
  const closeDialog = () => { setDialog(null); setError(''); };
  const loadComments = async (after = 0) => {
    setCommentLoading(true); setCommentError('');
    try {
      const result = await communityApi.comments(post.id, after);
      setComments(current => after ? [...current, ...result.comments.filter(item => !current.some(existing => existing.id === item.id))] : result.comments);
      setCursor(result.nextCursor); setHasMoreComments(result.hasMore);
    } catch (err) { setCommentError(communityError(err)); }
    finally { setCommentLoading(false); }
  };
  const toggleComments = () => { setShowComments(current => !current); if (!showComments && !comments.length) loadComments(); };
  const like = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    try { onChange({ ...post, ...await communityApi.like(post.id, !post.liked) }); }
    catch (err) { toast.error(communityError(err)); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    try { const result = await communityApi.save(post.id,!post.saved); onChange({ ...post,...result }); toast.success(result.saved ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.'); }
    catch (err) { toast.error(communityError(err)); }
    finally { setBusy(false); }
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`); toast.success('Đã sao chép liên kết bài viết.'); }
    catch { toast.error('Không sao chép được. Bạn có thể mở bài viết và sao chép địa chỉ trên trình duyệt.'); }
  };
  const saveDialog = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (dialog === 'edit') { onChange(await communityApi.edit(post.id, editContent)); toast.success('Đã cập nhật bài viết.'); }
      if (dialog === 'delete') { await communityApi.remove(post.id); onRemove(post.id); toast.success('Đã xóa bài viết.'); }
      if (dialog === 'report') { await (reportedComment ? communityApi.reportComment(reportedComment, reason, reportText) : communityApi.report(post.id, reason, reportText)); toast.success('Đã gửi báo cáo để quản trị viên xem xét.'); }
      closeDialog();
    } catch (err) { setError(communityError(err)); }
    finally { setBusy(false); }
  };
  const submitComment = async event => {
    event.preventDefault(); if (!requireLogin() || !commentText.trim()) return;
    setCommentBusy(true); setCommentError('');
    try {
      await communityApi.addComment(post.id, commentText, replyTo?.id || null);
      setCommentText(''); setReplyTo(null); onChange({ ...post, comment_count: Number(post.comment_count) + 1 });
      await loadComments();
    } catch (err) { setCommentError(communityError(err)); }
    finally { setCommentBusy(false); }
  };
  const deleteComment = async comment => {
    setCommentBusy(true);
    try {
      await communityApi.removeComment(comment.id);
      setComments(current => current.filter(item => item.id !== comment.id));
      onChange({ ...post, comment_count: Math.max(0, Number(post.comment_count) - 1) });
      if (replyTo?.id === comment.id) setReplyTo(null);
    } catch (err) { setCommentError(communityError(err)); }
    finally { setCommentBusy(false); }
  };
  return <article className="community-post" id={`community-post-${post.id}`}>
    <div className="community-post-heading">
      <div className="community-person"><Link to={`/chef/${post.author_id}`}><CommunityAvatar name={author} src={post.author_avatar} /></Link><div><Link to={`/chef/${post.author_id}`}><strong>{author}</strong></Link><small><Link to={`/community/posts/${post.id}`}>{date(post.created_at)}</Link><span aria-hidden="true"> · </span><span className="material-symbols-outlined">public</span>{post.status !== 'published' && ` · ${post.status === 'hidden' ? 'Đã ẩn' : 'Chưa xuất bản'}`}</small></div></div>
      <details className="community-menu"><summary aria-label="Tùy chọn bài viết"><span className="material-symbols-outlined">more_horiz</span></summary><div>
        <button onClick={share}><span className="material-symbols-outlined">link</span>Sao chép liên kết</button>
        {own && <button onClick={() => { setEditContent(post.content); setDialog('edit'); }}><span className="material-symbols-outlined">edit</span>Chỉnh sửa nội dung</button>}
        {(own || user?.role === 'admin') && <button onClick={() => setDialog('delete')} className="danger"><span className="material-symbols-outlined">delete</span>Xóa bài viết</button>}
        {!own && <button onClick={() => { if (requireLogin()) { setReportedComment(null); setDialog('report'); } }}><span className="material-symbols-outlined">flag</span>Báo cáo bài viết</button>}
      </div></details>
    </div>
    {post.topic_name && <p className="px-6 pt-4 text-xs font-semibold text-primary">{post.topic_name}</p>}
    {post.title && <h3 className="px-6 pt-5 font-bold text-lg text-stone-900">{post.title}</h3>}
    <p className="community-post-content">{post.content}</p>
    {post.media.length > 0 && <div className={`community-post-media count-${post.media.length}`}>{post.media.map((media, index) => <button type="button" key={media.id} onClick={() => setLightbox(media)} aria-label={`Xem ảnh ${index + 1} của bài viết`}><img src={getImageUrl(media.media_url)} alt={`Ảnh món ăn do ${author} chia sẻ`} loading="lazy" /></button>)}</div>}
    {post.recipes.length > 0 && <div className="community-attached-recipes">{post.recipes.map(recipe => <Link to={`/recipe/${recipe.id}`} key={recipe.id}>
      {recipe.cover_image_url ? <img src={getImageUrl(recipe.cover_image_url)} alt="" loading="lazy" /> : <span className="material-symbols-outlined">menu_book</span>}
      <div><small>CÔNG THỨC TRÊN CULINSHARE</small><strong>{recipe.title}</strong><span>{recipe.total_minutes} phút chế biến</span></div><span className="material-symbols-outlined">arrow_outward</span>
    </Link>)}</div>}
    <div className="community-post-counts"><span><span className="community-heart-dot">♥</span>{post.like_count} lượt thích</span><button onClick={toggleComments}>{post.comment_count} bình luận</button></div>
    <div className="community-post-actions">
      <button onClick={like} disabled={busy || post.status !== 'published'} className={post.liked ? 'liked' : ''} aria-pressed={post.liked}><span className="material-symbols-outlined" style={{ fontVariationSettings: post.liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>{post.liked ? 'Đã thích' : 'Yêu thích'}</button>
      <button onClick={toggleComments} aria-expanded={showComments}><span className="material-symbols-outlined">chat_bubble</span>Bình luận</button>
      <button onClick={save} disabled={busy || post.status !== 'published'} aria-pressed={Boolean(post.saved)}><span className="material-symbols-outlined" style={{ fontVariationSettings: post.saved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>{post.saved ? 'Đã lưu' : 'Lưu bài'}</button>
      <button onClick={share}><span className="material-symbols-outlined">ios_share</span>Chia sẻ</button>
    </div>
    {showComments && <section className="community-comments" aria-label="Bình luận bài viết">
      {commentLoading && <p className="community-muted" role="status">Đang tải bình luận…</p>}
      {!commentLoading && !comments.length && !commentError && <p className="community-muted">Hãy là người đầu tiên trò chuyện về món ăn này.</p>}
      {comments.map(comment => <div key={comment.id} className={`community-comment${comment.parent_id ? ' reply' : ''}`}>
        <CommunityAvatar name={comment.author_name || comment.author_username} src={comment.author_avatar} small />
        <div><div className="community-comment-bubble"><Link to={`/chef/${comment.user_id}`}><strong>{comment.author_name || comment.author_username}</strong></Link>{comment.parent_id && <small>Trả lời bình luận #{comment.parent_id}</small>}<p>{comment.content}</p></div>
          <div className="community-comment-tools"><time>{date(comment.created_at)}</time><button onClick={() => { if (requireLogin()) setReplyTo(comment); }}>Trả lời</button>{(user?.id === comment.user_id || user?.role === 'admin') && <button disabled={commentBusy} onClick={() => deleteComment(comment)}>Xóa</button>}{user?.id !== comment.user_id && <button onClick={() => { if (requireLogin()) { setReportedComment(comment.id); setDialog('report'); } }}>Báo cáo</button>}</div>
        </div>
      </div>)}
      {hasMoreComments && <button className="community-text-button" disabled={commentLoading} onClick={() => loadComments(cursor)}>Xem thêm bình luận</button>}
      {commentError && <p role="alert" className="community-error">{commentError}<button className="community-text-button" onClick={() => loadComments()}>Thử lại</button></p>}
      {user ? <form onSubmit={submitComment} className="community-comment-form">
        {replyTo && <div className="community-reply-label">Đang trả lời {replyTo.author_name || replyTo.author_username}<button type="button" onClick={() => setReplyTo(null)} aria-label="Hủy trả lời">×</button></div>}
        <label className="sr-only" htmlFor={`comment-${post.id}`}>Viết bình luận</label><textarea id={`comment-${post.id}`} value={commentText} onChange={event => setCommentText(event.target.value)} placeholder="Chia sẻ một lời nhắn thân thiện…" rows={2} maxLength={2000} disabled={commentBusy} />
        <button className="community-primary-button" disabled={commentBusy || !commentText.trim() || post.status !== 'published'}>{commentBusy ? 'Đang gửi…' : 'Gửi bình luận'}<span className="material-symbols-outlined">send</span></button>
      </form> : <button className="community-text-button" onClick={requireLogin}>Đăng nhập để tham gia trò chuyện →</button>}
    </section>}
    {dialog && <CommunityDialog title={dialog === 'edit' ? 'Chỉnh sửa bài viết' : dialog === 'delete' ? 'Xóa bài viết này?' : reportedComment ? 'Báo cáo bình luận' : 'Báo cáo bài viết'} onClose={closeDialog} busy={busy}>
      <form onSubmit={saveDialog} className="community-dialog-form">
        {dialog === 'edit' && <><label htmlFor={`edit-post-${post.id}`}>Nội dung bài viết</label><textarea id={`edit-post-${post.id}`} value={editContent} onChange={event => setEditContent(event.target.value)} rows={6} maxLength={8000} required disabled={busy} /><small>Ảnh và công thức đính kèm được giữ nguyên.</small></>}
        {dialog === 'delete' && <p>Bài viết sẽ không còn hiển thị trong cộng đồng. Bạn có chắc muốn xóa?</p>}
        {dialog === 'report' && <><p>Giúp giữ căn bếp chung an toàn và thân thiện. Báo cáo được gửi riêng đến quản trị viên.</p><label htmlFor={`reason-${post.id}`}>Lý do báo cáo</label><select id={`reason-${post.id}`} value={reason} onChange={event => setReason(event.target.value)} disabled={busy}><option value="spam">Spam hoặc quảng cáo</option><option value="inappropriate">Nội dung không phù hợp</option><option value="misinformation">Thông tin sai lệch</option><option value="harassment">Quấy rối, công kích</option><option value="other">Lý do khác</option></select><label htmlFor={`report-${post.id}`}>Thông tin thêm (không bắt buộc)</label><textarea id={`report-${post.id}`} value={reportText} onChange={event => setReportText(event.target.value)} maxLength={1500} rows={3} disabled={busy} /></>}
        {error && <p className="community-error" role="alert">{error}</p>}
        <footer><button type="button" className="community-secondary-button" onClick={closeDialog} disabled={busy}>Hủy</button><button className="community-primary-button" disabled={busy || (dialog === 'edit' && !editContent.trim())}>{busy ? 'Đang xử lý…' : dialog === 'edit' ? 'Lưu thay đổi' : dialog === 'delete' ? 'Xóa bài viết' : 'Gửi báo cáo'}</button></footer>
      </form>
    </CommunityDialog>}
    {lightbox && <CommunityDialog title="Ảnh từ cộng đồng" onClose={() => setLightbox(null)}><img className="community-lightbox" src={getImageUrl(lightbox.media_url)} alt={`Ảnh do ${author} chia sẻ`} /></CommunityDialog>}
  </article>;
}
