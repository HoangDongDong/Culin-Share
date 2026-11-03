import { getImageUrl } from '../../services/api';

export default function CommunityAvatar({ name = 'Thành viên', src, small = false }) {
  return <span className={`community-avatar${small ? ' small' : ''}`}>
    {src ? <img src={getImageUrl(src)} alt={name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : null}
    <span aria-hidden="true">{name.trim().charAt(0).toUpperCase() || 'C'}</span>
  </span>;
}
