import {useEffect,useId,useState} from 'react';
import api from '../services/api';

export default function SearchSuggestions({value,onChange,onSelect,inputClassName}) {
  const id=useId(),[items,setItems]=useState([]),[active,setActive]=useState(-1),[open,setOpen]=useState(false),[status,setStatus]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      if(!open||value.trim().length<2)return;
      setStatus('Đang tìm…');
      api.get('/api/recipes/suggestions',{params:{q:value},signal:controller.signal}).then(response=>{setItems(response.data.data);setActive(-1);setStatus(response.data.data.length?'':'Không có gợi ý. Bạn vẫn có thể nhấn tìm kiếm.');}).catch(()=>{if(!controller.signal.aborted)setStatus('Chưa tải được gợi ý.');});
    },300);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[value,open]);
  const choose=item=>{setOpen(false);onSelect(item.label);};
  return <div className="relative w-full min-w-0">
    <input role="combobox" aria-label="Tìm món ăn, nguyên liệu hoặc đầu bếp" aria-autocomplete="list" aria-expanded={open&&value.trim().length>=2} aria-controls={id} aria-activedescendant={active>=0?`${id}-${active}`:undefined} autoComplete="off" maxLength={200} className={inputClassName||"w-full h-14 pl-12 pr-28 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/30"} placeholder="Tìm món, nguyên liệu, đầu bếp…" value={value} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onChange={event=>{onChange(event.target.value);setItems([]);setActive(-1);setStatus('');setOpen(true);}} onKeyDown={event=>{
      if(event.key==='Escape'){setOpen(false);setActive(-1);}
      if(event.key==='ArrowDown'&&items.length){event.preventDefault();setOpen(true);setActive(index=>(index+1)%items.length);}
      if(event.key==='ArrowUp'&&items.length){event.preventDefault();setActive(index=>(index-1+items.length)%items.length);}
      if(event.key==='Enter'&&open&&active>=0&&items[active]){event.preventDefault();choose(items[active]);}
    }}/>
    {open&&value.trim().length>=2&&<div className="absolute top-full mt-2 z-40 w-full bg-white border rounded-xl shadow-lg overflow-hidden"><ul id={id} role="listbox" aria-label="Gợi ý tìm kiếm">{items.map((item,index)=><li id={`${id}-${index}`} key={item.kind+item.label} role="option" aria-selected={index===active} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(item)} className={'p-3 cursor-pointer hover:bg-orange-50 '+(index===active?'bg-orange-50':'')}>{item.label}<small className="ml-2 text-stone-500">{item.kind==='recipe'?'Món ăn':'Nguyên liệu'}</small></li>)}</ul><p role="status" className="text-xs text-stone-500 px-3 py-2">{status}</p></div>}
  </div>;
}
