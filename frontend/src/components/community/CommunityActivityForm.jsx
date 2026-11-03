import { useState } from 'react';
import toast from 'react-hot-toast';
import CommunityDialog from './CommunityDialog';
import { communityApi, communityError } from '../../services/communityApi';

export default function CommunityActivityForm({ type, onClose, onCreated }) {
  const [values,setValues] = useState({title:'',description:'',startsAt:'',endsAt:'',location:'',eventUrl:''});
  const [busy,setBusy] = useState(false),[error,setError] = useState('');
  const field = key => ({value:values[key],onChange:event=>setValues(current=>({...current,[key]:event.target.value})),disabled:busy});
  const submit = async event => {
    event.preventDefault();setBusy(true);setError('');
    try {
      await communityApi.createActivity(type,{...values,startsAt:new Date(values.startsAt).toISOString(),endsAt:new Date(values.endsAt).toISOString()});
      toast.success('Đã công bố hoạt động.');onCreated();onClose();
    } catch(err) { setError(communityError(err)); }
    finally { setBusy(false); }
  };
  return <CommunityDialog title={type==='challenge'?'Tạo thử thách':'Tạo sự kiện'} onClose={onClose} busy={busy}><form onSubmit={submit} className="community-dialog-form">
    <label htmlFor="activity-title">Tên hoạt động</label><input id="activity-title" className="w-full" {...field('title')} required maxLength={150}/>
    <label htmlFor="activity-description">Nội dung</label><textarea id="activity-description" {...field('description')} required maxLength={5000} rows={4}/>
    <label htmlFor="activity-start">Bắt đầu (giờ địa phương)</label><input id="activity-start" className="w-full" type="datetime-local" {...field('startsAt')} required/>
    <label htmlFor="activity-end">Kết thúc</label><input id="activity-end" className="w-full" type="datetime-local" {...field('endsAt')} required/>
    {type==='event'&&<><label htmlFor="activity-location">Địa điểm / hình thức tham gia</label><input id="activity-location" className="w-full" {...field('location')} required maxLength={255}/><label htmlFor="activity-url">Đường dẫn sự kiện (không bắt buộc)</label><input id="activity-url" className="w-full" type="url" {...field('eventUrl')} maxLength={2048}/></>}
    {error&&<p className="community-error" role="alert">{error}</p>}<footer><button className="community-primary-button" disabled={busy}>{busy?'Đang lưu…':'Công bố'}</button></footer>
  </form></CommunityDialog>;
}
