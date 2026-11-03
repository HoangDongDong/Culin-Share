import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CommunityAvatar from '../components/community/CommunityAvatar';
import CommunityComposer from '../components/community/CommunityComposer';
import CommunityPost from '../components/community/CommunityPost';
import CommunityDialog from '../components/community/CommunityDialog';
import CommunityActivityForm from '../components/community/CommunityActivityForm';
import { communityApi, communityError } from '../services/communityApi';
import './CommunityPage.css';

const panel = 'bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm';
const tabs = [['latest','Bài viết mới','forum'],['tips','Câu hỏi & mẹo','lightbulb'],['challenges','Thử thách tuần','trophy'],['top_chefs','Đầu bếp nổi bật','stars'],['following','Đang theo dõi','group'],['saved','Đã lưu','bookmark']];
const eventDate = value => new Date(value).toLocaleString('vi-VN', { timeZone:'Asia/Bangkok', day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' });

function Feed({ tab, topic, query, postId, challengeId, user, requireLogin, onChanged }) {
  const [posts,setPosts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [page,setPage]=useState(1),[hasMore,setHasMore]=useState(false),[moreBusy,setMoreBusy]=useState(false),[attempt,setAttempt]=useState(0);
  const params = () => ({tab:['saved','following','mine'].includes(tab)?tab:'latest',topic:topic==='all'?'':topic,kind:tab==='tips'?'tip':tab==='challenges'?'challenge':'',q:query,challengeId:challengeId||'',page:1});
  useEffect(()=>{
    const controller=new AbortController();
    const queryParams={tab:['saved','following','mine'].includes(tab)?tab:'latest',topic:topic==='all'?'':topic,kind:tab==='tips'?'tip':tab==='challenges'?'challenge':'',q:query,challengeId:challengeId||'',page:1};
    const request=postId?communityApi.post(postId,controller.signal).then(post=>({posts:[post],hasMore:false})):communityApi.feed(queryParams,controller.signal);
    request.then(result=>{setPosts(result.posts);setHasMore(result.hasMore);setPage(1);}).catch(err=>{if(err.code!=='ERR_CANCELED')setError(communityError(err));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[tab,topic,query,postId,challengeId,attempt]);
  const more=async()=>{setMoreBusy(true);setError('');try{const result=await communityApi.feed({...params(),page:page+1});setPosts(current=>[...current,...result.posts.filter(post=>!current.some(item=>item.id===post.id))]);setPage(page+1);setHasMore(result.hasMore);}catch(err){setError(communityError(err));}finally{setMoreBusy(false);}};
  return <div aria-live="polite">
    {loading&&<div className={panel+' text-center text-sm text-stone-500'} role="status">Đang tải bài viết từ cộng đồng…</div>}
    {error&&<div role="alert" className="community-error">{error}<button className="community-text-button" onClick={()=>{setError('');setLoading(true);setAttempt(value=>value+1);}}>Thử lại</button></div>}
    {!loading&&!error&&!posts.length&&<div className={panel+' text-center py-12'}><span className="material-symbols-outlined text-4xl text-stone-300">forum</span><h3 className="font-bold mt-4">{postId?'Bài viết không còn hiển thị':'Chưa có bài viết trong mục này'}</h3><p className="text-sm text-stone-500 mt-2">{tab==='saved'?'Những bài bạn lưu sẽ xuất hiện tại đây.':tab==='following'?'Theo dõi đầu bếp yêu thích để xem bài của họ tại đây.':'Hãy chia sẻ câu chuyện đầu tiên hoặc thử bộ lọc khác.'}</p>{postId&&<Link className="community-text-button" to="/community">Về cộng đồng</Link>}</div>}
    {posts.map(post=><CommunityPost key={post.id} post={post} user={user} requireLogin={requireLogin} onChange={updated=>setPosts(current=>current.map(item=>item.id===updated.id?updated:item).filter(item=>tab!=='saved'||item.saved))} onRemove={id=>{setPosts(current=>current.filter(item=>item.id!==id));onChanged();}}/>)}
    {hasMore&&<button className="community-load-more" disabled={moreBusy} onClick={more}>{moreBusy?'Đang tải…':'Xem thêm bài viết'}</button>}
  </div>;
}

export default function CommunityPage(){
  const user=useSelector(state=>state.auth.user),navigate=useNavigate(),{id:postId}=useParams();
  const [activeTab,setActiveTab]=useState('latest'),[selectedGroup,setSelectedGroup]=useState('all');
  const [query,setQuery]=useState(''),[search,setSearch]=useState(''),[revision,setRevision]=useState(0);
  const [metadata,setMetadata]=useState({topics:[],people:[],following:[],challenges:[],events:[]}),[metaError,setMetaError]=useState('');
  const [activity,setActivity]=useState(null);
  const [composer,setComposer]=useState(false),[selectedChallenge,setSelectedChallenge]=useState(null),[event,setEvent]=useState(null),[busy,setBusy]=useState('');
  const refresh=()=>setRevision(value=>value+1);
  const requireLogin=useCallback(()=>{const token=localStorage.getItem('token');if(user&&token&&token!=='null'&&token!=='undefined')return true;navigate('/login',{state:{from:'/community',message:'Đăng nhập để chia sẻ và tương tác trong cộng đồng.'}});return false;},[user,navigate]);
  useEffect(()=>{const controller=new AbortController();communityApi.metadata(controller.signal).then(data=>{setMetadata(data);setMetaError('');}).catch(err=>{if(err.code!=='ERR_CANCELED')setMetaError(communityError(err));});return()=>controller.abort();},[user?.id,revision]);
  useEffect(()=>{const open=()=>{if(requireLogin()){setSelectedChallenge(null);setComposer(true);}};window.addEventListener('open-community-composer',open);return()=>window.removeEventListener('open-community-composer',open);},[requireLogin]);
  const chooseTab=value=>{if(['saved','following','mine'].includes(value)&&!requireLogin())return;setActiveTab(value);setSelectedChallenge(null);if(postId)navigate('/community');};
  const follow=async person=>{if(!requireLogin())return;setBusy('person-'+person.id);try{await communityApi.follow(person.id,!person.followed);refresh();toast.success(person.followed?'Đã bỏ theo dõi.':'Đã theo dõi thành viên.');}catch(err){toast.error(communityError(err));}finally{setBusy('');}};
  const participate=async challenge=>{if(!requireLogin())return;setBusy('challenge-'+challenge.id);try{await communityApi.join(challenge.id,!challenge.joined);refresh();toast.success(challenge.joined?'Đã rời thử thách.':'Đã đăng ký tham gia thử thách.');}catch(err){toast.error(communityError(err));}finally{setBusy('');}};
  const register=async item=>{if(!requireLogin())return;setBusy('event-'+item.id);try{await communityApi.register(item.id,!item.registered);setEvent(null);refresh();toast.success(item.registered?'Đã hủy đăng ký.':'Đã đăng ký sự kiện.');}catch(err){toast.error(communityError(err));}finally{setBusy('');}};
  const people=metadata.people;
  const personRow=person=><div key={person.id} className="flex items-center justify-between gap-2 py-2"><Link to={'/chef/'+person.id} className="flex items-center gap-2 min-w-0"><CommunityAvatar name={person.full_name||person.username} src={person.avatar_url} small/><span className="text-xs font-semibold truncate">{person.full_name||person.username}</span></Link>{person.id!==user?.id&&<button className="text-[11px] border border-stone-200 rounded-lg px-2 py-1.5 shrink-0 hover:bg-stone-50" disabled={Boolean(busy)} onClick={()=>follow(person)}>{busy==='person-'+person.id?'Đang xử lý…':person.followed?'Đang theo dõi':'Theo dõi'}</button>}</div>;
  const challengeCard=challenge=><div key={challenge.id} className="rounded-xl border border-stone-200 p-4 space-y-3"><h4 className="font-semibold text-sm">{challenge.title}</h4><p className="text-xs text-stone-500 leading-relaxed">{challenge.description}</p><p className="text-[11px] text-stone-500">Kết thúc {eventDate(challenge.ends_at)} · {challenge.participant_count} người tham gia</p><div className="flex flex-wrap gap-2"><button className="community-primary-button" disabled={Boolean(busy)} onClick={()=>participate(challenge)}>{challenge.joined?'Rời thử thách':'Tham gia ngay'}</button><button className="community-secondary-button" onClick={()=>{setSelectedChallenge(challenge.id);setActiveTab('challenges');}}>Xem bài dự thi</button>{Boolean(challenge.joined)&&<button className="community-secondary-button" onClick={()=>{if(requireLogin()){setSelectedChallenge(challenge.id);setComposer(true);}}}>Đăng bài dự thi</button>}</div></div>;
  return <div className="community-page bg-[#FAF8F5] text-stone-800 min-h-screen flex flex-col"><Header/><main className="flex-1 w-full pb-16">
        <section className="relative w-full overflow-hidden border-b border-stone-200/50 bg-[#FAF8F5]">
          {/* Background Photography Layer - Seamlessly anchored to the right */}
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[65%] md:w-[58%] lg:w-[52%] xl:w-[48%] z-0 pointer-events-none overflow-hidden">
            <img
              src="/community_hero.jpg"
              alt="Cộng đồng CulinShare"
              className="w-full h-full object-cover object-center"
            />
            {/* Smooth linear fade on the left edge into the #FAF8F5 background */}
            <div className="absolute inset-y-0 left-0 w-28 sm:w-40 md:w-56 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent"></div>
            {/* Soft vertical fades */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#FAF8F5]/20 to-transparent"></div>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#FAF8F5]/30 to-transparent"></div>
          </div>

          {/* Content Layer */}
          <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[220px] lg:min-h-[260px]">
              
              {/* Left Column: Breadcrumb, Heading, Subtitle */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Breadcrumb */}
                <div className="text-xs text-stone-500 mb-2 flex items-center gap-1.5 select-none">
                  <Link to="/" className="hover:text-primary transition-colors">
                    Trang chủ
                  </Link>
                  <span>›</span>
                  <span className="text-[#ab2e10] font-semibold">Cộng đồng</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-stone-900 leading-[1.18] tracking-tight">
                  Kết nối cùng cộng đồng <br />
                  <span className="text-[#ab2e10]">đam mê nấu ăn</span>
                </h1>

                <p className="text-stone-600 text-xs sm:text-sm md:text-base mt-2.5 max-w-lg leading-relaxed">
                  Chia sẻ công thức, đặt câu hỏi, học hỏi kinh nghiệm và lan tỏa tình yêu ẩm thực cùng những người bạn có chung đam mê.
                </p>
              </div>

              {/* Right Column: Chalk Handwritten Quote directly on the background */}
              <div className="hidden lg:flex lg:col-span-5 justify-end items-center pr-4 xl:pr-10 select-none">
                <div className="text-white text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] max-w-[240px]">
                  <p className="font-display italic text-base sm:text-lg lg:text-xl leading-snug font-medium text-amber-50 tracking-wide">
                    Nấu ăn ngon hơn <br />
                    khi có cộng đồng <br />
                    cùng sẻ chia
                  </p>
                  <p className="text-amber-200 text-2xl leading-none mt-2">
                    ♡
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
    <div className="w-full border-b border-stone-200/60 bg-white/80"><div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto">{tabs.map(([key,label,icon])=><button key={key} onClick={()=>chooseTab(key)} aria-pressed={activeTab===key} className={'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap border '+(activeTab===key?'bg-[#ab2e10] border-[#ab2e10] text-white':'bg-white border-stone-200 hover:bg-stone-50')}><span className="material-symbols-outlined text-base">{icon}</span>{label}</button>)}</div></div>
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6"><div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-3 space-y-5"><div className={panel}><h3 className="font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">groups</span>Nhóm cộng đồng</h3>
      {[{slug:'all',name:'Tất cả hoạt động',icon:'grid_view'},...metadata.topics].map(group=><button key={group.slug} aria-pressed={selectedGroup===group.slug} onClick={()=>{setSelectedGroup(group.slug);if(postId)navigate('/community');}} className={'w-full flex items-center justify-between gap-2 text-left rounded-xl px-3 py-3 text-xs '+(selectedGroup===group.slug?'bg-[#fbece8] text-primary font-bold':'hover:bg-stone-50')}><span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">{group.icon}</span>{group.name}</span>{group.post_count!==undefined&&<small className="text-stone-400">{group.post_count} bài</small>}</button>)}</div>
      <div className={panel}><h3 className="font-bold mb-3">Đang theo dõi</h3>{!user?<button className="community-text-button" onClick={requireLogin}>Đăng nhập để xem danh sách →</button>:metadata.following.length?metadata.following.map(personRow):<p className="text-xs text-stone-500 leading-relaxed">Bạn chưa theo dõi thành viên nào. Khám phá những đầu bếp bên cạnh nhé.</p>}<button className="community-text-button mt-3" onClick={()=>chooseTab('following')}>Xem bảng tin đang theo dõi →</button></div>
      <div className="bg-[#ecede1] rounded-2xl p-5"><h3 className="font-semibold">Cảm hứng từ tủ lạnh</h3><p className="text-xs text-stone-600 my-3 leading-relaxed">Tìm món ngon từ nguyên liệu bạn đang có, rồi chia sẻ thành quả cùng mọi người.</p><Link to="/fridge" className="community-text-button">Mở tủ lạnh ảo →</Link></div></aside>
      <section className="lg:col-span-6 min-w-0 space-y-5" aria-label="Bảng tin cộng đồng">
      <div className={panel+' flex items-center gap-3'}><CommunityAvatar name={user?.full_name||user?.fullName||user?.username||'Bạn'} src={user?.avatar_url||user?.avatarUrl}/><button className="flex-1 min-w-0 text-left text-xs bg-stone-50 rounded-xl p-3 text-stone-500" onClick={()=>{if(requireLogin()){setSelectedChallenge(null);setComposer(true);}}}>Hôm nay bếp nhà bạn có gì ngon?</button><button className="community-primary-button shrink-0" onClick={()=>{if(requireLogin()){setSelectedChallenge(null);setComposer(true);}}}>Đăng bài</button></div>
      {metaError&&<p role="alert" className="community-error">{metaError}<button className="community-text-button" onClick={refresh}>Thử tải lại</button></p>}
      {postId?<Link to="/community" className="community-text-button">← Về bảng tin</Link>:<form className="flex gap-2" onSubmit={e=>{e.preventDefault();setQuery(search.trim());}}><label htmlFor="community-search" className="sr-only">Tìm bài viết</label><input id="community-search" className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm" placeholder="Tìm bài viết hoặc người chia sẻ…" value={search} maxLength={200} onChange={e=>setSearch(e.target.value)}/><button className="community-secondary-button">Tìm kiếm</button></form>}
      {activeTab==='top_chefs'&&!postId?<div className={panel}><h2 className="font-bold mb-4">Đầu bếp tích cực trong cộng đồng</h2>{people.length?people.map(personRow):<p className="text-sm text-stone-500">Chưa có thành viên để hiển thị.</p>}</div>:<>
      {activeTab==='challenges'&&!postId&&<div className={panel+' space-y-4'}><h2 className="font-bold">Thử thách đang diễn ra</h2>{metadata.challenges.length?metadata.challenges.map(challengeCard):<p className="text-sm text-stone-500">Chưa có thử thách nào được công bố. Thông tin sẽ xuất hiện khi có thử thách mới.</p>}</div>}
      {(!user&&['following','saved'].includes(activeTab))?<div className={panel}><button className="community-text-button" onClick={requireLogin}>Đăng nhập để xem mục này →</button></div>:<Feed key={[activeTab,selectedGroup,query,postId,user?.id,revision,selectedChallenge].join(':')} tab={activeTab} topic={selectedGroup} query={query} postId={postId} challengeId={activeTab==='challenges'?selectedChallenge:null} user={user} requireLogin={requireLogin} onChanged={refresh}/>}
      </>}
      </section>
      <aside className="lg:col-span-3 space-y-5"><div className={panel+' space-y-3'}><div className="flex justify-between items-center"><h3 className="font-bold">Thử thách tuần</h3><button className="community-text-button" onClick={()=>chooseTab('challenges')}>Xem tất cả →</button></div>{user?.role==='admin'&&<button className="community-text-button" onClick={()=>setActivity('challenge')}>+ Tạo thử thách</button>}{metadata.challenges.length?challengeCard(metadata.challenges[0]):<p className="text-xs leading-relaxed text-stone-500">Chưa có thử thách đang mở.</p>}</div>
      <div className={panel}><div className="flex justify-between mb-4"><h3 className="font-bold">Thành viên tích cực</h3><button className="community-text-button" onClick={()=>chooseTab('top_chefs')}>Xem tất cả →</button></div>{people.slice(0,5).map(person=><div key={person.id}>{personRow(person)}<p className="text-[10px] text-stone-400 ml-10 mb-2">{person.post_count} bài chia sẻ</p></div>)}{!people.length&&<p className="text-xs text-stone-500">Chưa có dữ liệu thành viên.</p>}</div>
      <div className={panel}><h3 className="font-bold mb-3">Sự kiện sắp tới</h3>{user?.role==='admin'&&<button className="community-text-button" onClick={()=>setActivity('event')}>+ Tạo sự kiện</button>}{metadata.events.length?metadata.events.map(item=><button key={item.id} onClick={()=>setEvent(item)} className="block w-full text-left p-3 border border-stone-100 rounded-xl mb-2 hover:bg-stone-50"><strong className="text-xs">{item.title}</strong><small className="block text-stone-500 mt-1">{eventDate(item.starts_at)}</small><small className="text-primary">{item.registered?'Đã đăng ký · Xem chi tiết':'Xem chi tiết & đăng ký →'}</small></button>):<p className="text-xs text-stone-500 leading-relaxed">Chưa có sự kiện nào được công bố.</p>}</div>
      </aside>
    </div></div>
    </main><Footer/>
    {composer&&user&&<CommunityComposer user={user} topics={metadata.topics} challenges={metadata.challenges} defaultChallenge={selectedChallenge} onClose={()=>setComposer(false)} onCreated={()=>{setActiveTab('latest');setSelectedGroup('all');setSelectedChallenge(null);setQuery('');setSearch('');refresh();if(postId)navigate('/community');}}/>}
    {activity&&<CommunityActivityForm type={activity} onClose={()=>setActivity(null)} onCreated={refresh}/>}
    {event&&<CommunityDialog title={event.title} onClose={()=>setEvent(null)} busy={Boolean(busy)}><div className="community-dialog-form"><p className="whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p><p className="text-xs mt-4">{eventDate(event.starts_at)} – {eventDate(event.ends_at)}</p><p className="text-sm mt-3">Địa điểm: {event.location}</p><p className="text-xs mt-2">{event.registration_count} người đã đăng ký</p>{event.event_url&&/^https?:\/\//i.test(event.event_url)&&<a className="community-text-button block mt-3" href={event.event_url} target="_blank" rel="noreferrer">Mở trang sự kiện →</a>}<footer><button className="community-primary-button" disabled={Boolean(busy)} onClick={()=>register(event)}>{busy?'Đang xử lý…':event.registered?'Hủy đăng ký':'Đăng ký tham gia'}</button></footer></div></CommunityDialog>}
  </div>;
}
