// Conservative source segmentation: no generated instructions or fixed step count.
const ACTION = '(?:rửa|gọt|bào|cắt|thái|băm|đập|giã|vắt|chặt|chẻ|tỉa|khứa|bỏ|nhặt|cạo|lọc|ngâm|ướp|trộn|đánh|nhào|cán|nặn|gói|cuốn|xếp|đặt|trải|phết|lăn|nhúng|cho|thêm|đổ|rót|phi|xào|chiên|rán|nướng|hấp|luộc|chần|trụng|nấu|đun|hầm|kho|om|rang|vớt|lấy|múc|bọc|dùng|làm nóng|làm lạnh|làm sạch|làm mềm|làm nhân|chuẩn bị|pha|hòa|hoà|quết|quét|chia|ép|xay|nén|gắn|xả|lắc|nghiêng|nâng|trang trí|nêm|rắc)';
const CONNECTOR = '(?:(?:sau đó|tiếp theo|tiếp đến|tiếp tục|kế đến|cuối cùng|rồi|đầu tiên)\\s*,?\\s*)?';
const actionStart = new RegExp('^'+CONNECTOR+ACTION+'(?=$|[^\\p{L}])','iu');
const subjectAction = new RegExp('^[^,.:;!?\\n]{1,45}\\s+'+ACTION+'(?=$|[^\\p{L}])','iu');
const dependentStart=/^(?:cắt (?:lát|khúc|sợi|nhỏ|mỏng)|băm (?:nhỏ|nhuyễn)|giã (?:nhỏ|nhuyễn)|xay nhuyễn|trộn đều|nêm vừa ăn|nấu sôi|xếp ra (?:đĩa|dĩa)|vớt bỏ bọt|lấy ra|chiên vàng|ướp đá)(?=\s*[,.;!?]|$)/iu;
const conditionStart=/^(?:nếu|khi|lưu ý|mẹo|chú ý|vì|để|chờ|sau khi|trong khi|cho đến khi|đến khi)(?=$|[^\p{L}])/iu;
const operationStart=text=>!conditionStart.test(text)&&!dependentStart.test(text)&&(actionStart.test(text)||subjectAction.test(text));
const sectionStart = /^(?:xào rau củ|hấp mực|trình bày|thành phẩm|đế bánh|cốt bánh|nhân bánh|vỏ bánh|nước dùng|nấu nước dùng|làm [^:,.\n]{1,35}|pha [^:,.\n]{1,30}|xốt chấm|sốt chấm|tạo hình|chiên|nướng|hấp|ủ cà phê|tạo bọt sữa)\s*:/iu;
const heading = /^(Sơ chế|Chế biến|Cách dùng)\s*\n/u;
const display = raw => raw.trim().replace(/^[,;]\s*/u,'').replace(/^[–—•_-]\s*/u,'').replace(/^(?:Bước\s*\d+\s*[:.)-]|\d+[.)])\s+/iu,'').replace(/[,;]\s*$/u,'').trim();

function splitInstruction(instruction) {
    const match = heading.exec(instruction);
    const label = match?.[1] || '';
    const prefix = match?.[0] || '';
    const body = instruction.slice(prefix.length);
    const cuts = new Set([0,body.length]);
    // Newlines and real bullets, never numeric ranges such as 10 - 15 phút.
    for(const m of body.matchAll(/\n\s*(?=\S)|(?:^|\s)[–—•]\s*(?=[\p{L}])|(?:^|\s)[_-]\s+(?=[\p{L}])/gu))cuts.add(m.index);
    // A punctuation boundary is only useful when another operation starts.
    for(const m of body.matchAll(/[.!?;]\s*(?:,\s*)?(?=\S)/gu)) {
        if(body[m.index]==='.'&&/\d/u.test(body[m.index-1]||'')&&/\d/u.test(body[m.index+1]||''))continue;
        const at=m.index+m[0].length;
        if(operationStart(body.slice(at))||sectionStart.test(body.slice(at)))cuts.add(at);
    }
    for(const m of body.matchAll(/,\s+(?=\S)/gu)) {
        const at=m.index+m[0].length;
        // Keep short dependent actions and all ingredient lists together.
        const tail=body.slice(at);
        if(actionStart.test(tail)&&!dependentStart.test(tail)) {
            const previous=[...cuts].filter(x=>x<at).sort((a,b)=>b-a)[0]||0;
            const clause=body.slice(previous,at);
            const conditional=/(?:^|[.!?]\s*)(?:nếu|khi|đến khi|sau khi|trong khi)[^.!?]*,\s*$/iu.test(clause);
            if(at-previous>=110&&!conditional)cuts.add(at);
        }
    }
    // Named source stages may occur after a sentence or an inline bullet.
    for(const m of body.matchAll(/(?:[.!?]\s+|\n|\s[–—]\s+)(?=\S)/gu)) {
        const at=m.index+m[0].length;if(sectionStart.test(body.slice(at)))cuts.add(at);
    }
    const positions=[...cuts].sort((a,b)=>a-b),spans=[];
    for(let i=0;i<positions.length-1;i++) {
        const start=positions[i],end=positions[i+1];
        if(!display(body.slice(start,end))) {
            if(spans.length)spans[spans.length-1].end=end;
            continue;
        }
        if(spans.length && /:\s*$/u.test(body.slice(spans.at(-1).start,spans.at(-1).end)))spans[spans.length-1].end=end;
        else spans.push({start,end});
    }
    // Include any leading whitespace/bullet-only slice in the first source span.
    if(spans.length)spans[0].start=0;
    const pieces=spans.map(span=>({...span,label,raw:body.slice(span.start,span.end),instruction:(label?label+'\n':'')+display(body.slice(span.start,span.end))}));
    if(pieces.map(p=>p.raw).join('')!==body)throw Error('Tách bước không bảo toàn nguyên văn nguồn');
    return {prefix,body,pieces};
}
function splitSteps(steps) {
    const output=[],spans=[];
    for(const step of steps) {
        const split=splitInstruction(step.instruction);
        for(const part of split.pieces) {
            output.push({step_number:output.length+1,instruction:part.instruction,image_url:null,timer_seconds:0});
            spans.push({step_number:output.length,sourceStepId:step.id??null,sourceStepNumber:step.step_number,section:part.label,sourceStart:split.prefix.length+part.start,sourceEnd:split.prefix.length+part.end});
        }
    }
    return {steps:output,spans};
}
module.exports={splitInstruction,splitSteps,hasSourceHeading:text=>heading.test(text)};
