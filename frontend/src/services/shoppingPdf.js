let fontPromise;
const text=value=>String(value??'').normalize('NFC').split('').map(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127?' ':char).join('').trim();
export async function createShoppingPdf({items,recipes=[],peopleCount,date=new Date()}) {
  if(!Array.isArray(items)||!items.length)throw new Error('Không có nguyên liệu cần mua thêm.');
  const {jsPDF}=await import('jspdf');
  if(!fontPromise)fontPromise=fetch('/fonts/NotoSans-Regular.ttf').then(response=>{if(!response.ok)throw new Error('Không tải được font PDF.');return response.arrayBuffer();}).then(buffer=>{
    const bytes=new Uint8Array(buffer);let binary='';for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));return btoa(binary);
  }).catch(error=>{fontPromise=undefined;throw error;});
  const pdf=new jsPDF({unit:'mm',format:'a4'});
  pdf.addFileToVFS('NotoSans.ttf',await fontPromise);pdf.addFont('NotoSans.ttf','NotoSans','normal');pdf.setFont('NotoSans');
  pdf.setProperties({title:'Danh sách đi chợ - CulinShare',author:'CulinShare'});
  let y=22;
  const page=()=>{pdf.addPage();pdf.setFont('NotoSans');y=22;};
  const line=(value,size=11,checkbox=false)=>{
    pdf.setFontSize(size);const lines=pdf.splitTextToSize(text(value),checkbox?170:178);
    lines.forEach((part,index)=>{if(y>275)page();if(checkbox&&index===0)pdf.rect(16,y-3,3,3);pdf.text(part,checkbox?23:16,y);y+=size*0.48+1;});y+=2;
  };
  line('DANH SÁCH ĐI CHỢ',19);
  line(`Ngày tạo: ${date.toLocaleDateString('vi-VN')} · Khẩu phần: ${text(peopleCount)} người`,10);
  line('Các món trong bữa ăn:',12);for(const recipe of recipes)line(recipe.name||recipe.title||recipe,10);
  y+=3;line('Nguyên liệu cần mua thêm:',13);for(const item of items)line(item,11,true);
  line('Gia vị cơ bản được coi là có sẵn. Các mục “Kiểm tra định lượng” cần đối chiếu trước khi mua.',9);
  const pages=pdf.getNumberOfPages();for(let number=1;number<=pages;number++){pdf.setPage(number);pdf.setFontSize(9);pdf.text(`CulinShare · ${number}/${pages}`,16,289);}
  return pdf;
}
export async function downloadShoppingPdf(data) {
  const pdf=await createShoppingPdf(data);
  pdf.save(`CulinShare-di-cho-${new Date().toISOString().slice(0,10)}.pdf`);
}
