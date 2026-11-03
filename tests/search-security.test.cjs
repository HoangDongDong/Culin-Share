const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseSearch,normalize,like}=require('../backend/src/services/searchFilters');
const {writeOriginGuard}=require('../backend/src/middlewares/securityMiddleware');
const {validateUrls}=require('../backend/src/services/resourceSecurity');
const recipes=require('../backend/src/repositories/recipe.repository');
const service=require('../backend/src/services/recipe.service');
const comments=require('../backend/src/services/comment.service');
const commentRepo=require('../backend/src/repositories/comment.repository');
const pool=require('../backend/src/config/database');

test('public profile DTO never exposes contact, health, budget or authentication data',()=>{
  const {toPublicUserDTO}=require('../backend/src/utils/dto.util');
  const dto=toPublicUserDTO({id:1,full_name:'Đầu bếp',email:'private',phone:'private',address:'private',height:170,weight:60,daily_budget:100,password_hash:'secret',otp_code:'secret'});
  for(const key of ['email','phone','address','height','weight','daily_budget','password_hash','otp_code'])assert.ok(!(key in dto));
  assert.equal(dto.full_name,'Đầu bếp');
});

test('search rejects query objects, SQL sort payloads and inverted ranges',()=>{
  for(const query of [{q:{x:1}},{sort:'rating; DROP TABLE recipes'},{page:'-1'},{minTime:'30',maxTime:'10'},{limit:'500'},{maxCalories:'NaN'},{category:',,'}])assert.throws(()=>parseSearch(query),error=>error.statusCode===400);
  assert.deepEqual(parseSearch({q:' đậu HŨ ',minTime:'0',maxTime:'30'}),{query:'đậu HŨ',minTime:0,maxTime:30});
  assert.equal(normalize('Đậu hũ'),'dau hu');assert.equal(like('50%_!'),'%50!%!_!!%');
});
test('search keeps injection text in bound parameters and uses all filters in count and page queries',async t=>{
  const calls=[];t.mock.method(pool,'query',async(sql,params)=>{calls.push({sql,params});return sql.includes('COUNT(DISTINCT')?[[{total:14}]]:[[]];});
  const payload="' OR 1=1 --";
  const result=await recipes.findAll(parseSearch({q:payload,category:'Món Việt,Món chay',minCalories:'100',maxCalories:'500',maxTime:'30',page:'2',limit:'6'}));
  assert.equal(result.meta.totalPages,3);assert.equal(result.meta.page,2);
  for(const call of calls){assert.ok(!call.sql.includes(payload));assert.ok(call.params.includes(like(payload)));assert.match(call.sql,/total_time_minutes <= \?/);assert.match(call.sql,/EXISTS\(SELECT 1 FROM recipe_categories/);}
  assert.deepEqual(calls[1].params.slice(-2),[6,6]);
});
test('write guard rejects forged browser origins and permits configured frontend and bearer CLI requests',()=>{
  const guard=writeOriginGuard(['http://localhost:5050']);
  for(const headers of [{origin:'https://evil.invalid'},{origin:'null'},{'sec-fetch-site':'cross-site'}]){
    let status,next=false;guard({method:'POST',headers},{status(code){status=code;return this;},json(){}},()=>{next=true;});assert.equal(status,403);assert.equal(next,false);
  }
  for(const headers of [{origin:'http://localhost:5050'},{}]){let next=false;guard({method:'POST',headers},{},()=>{next=true;});assert.equal(next,true);}
});
test('URL validation rejects executable and nested JSON image URLs',()=>{
  for(const value of [{video_url:'javascript:alert(1)'},{coverImageUrl:'data:text/html,<script>x</script>'},{steps:'[{"image_url":"javascript:x"}]'},{images:'["javascript:x"]'}])assert.throws(()=>validateUrls(value),error=>error.statusCode===400);
  assert.doesNotThrow(()=>validateUrls({cover_image_url:'https://example.com/image.jpg',description:'<script>plain text</script>'}));
});
test('draft detail is denied to guests/other users and allowed for owner/admin',async t=>{
  t.mock.method(recipes,'findById',async()=>({id:1,author_id:7,status:'draft'}));
  t.mock.method(service,'getRecipeDetail',async recipe=>recipe);
  await assert.rejects(service.getRecipeById(1),e=>e.statusCode===404);
  await assert.rejects(service.getRecipeById(1,{id:8,role:'user'}),e=>e.statusCode===404);
  assert.equal((await service.getRecipeById(1,{id:7,role:'user'})).id,1);
  assert.equal((await service.getRecipeById(1,{id:8,role:'admin'})).id,1);
});
test('cross-recipe replies cannot write and comments on unpublished recipes are denied',async t=>{
  t.mock.method(recipes,'findById',async()=>({id:1,status:'published'}));
  t.mock.method(commentRepo,'findById',async()=>({id:2,recipe_id:99}));
  t.mock.method(commentRepo,'create',async()=>{throw Error('Must not write');});
  await assert.rejects(comments.addComment(7,1,'hello',2),e=>e.statusCode===400);
  t.mock.method(recipes,'findById',async()=>({status:'draft'}));
  await assert.rejects(comments.addComment(7,1,'hello'),e=>e.statusCode===404);
});
