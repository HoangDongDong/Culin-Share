const test=require('node:test');
const assert=require('node:assert/strict');
const {catalog,sitemap}=require('../backend/src/services/seo.service');

test('live catalog selects only public recipes/posts, excludes deleted and seed posts',async()=>{
  const queries=[];
  const pool={query:async sql=>{queries.push(sql);return [[]];}};
  assert.deepEqual(await catalog(pool),{recipes:[],categories:[],posts:[]});
  assert.ok(queries[0].includes("status = 'published'"));
  assert.ok(queries[2].includes("p.status = 'published'"));
  assert.ok(queries[2].includes('p.deleted_at IS NULL'));
  assert.ok(queries[2].includes('community_demo_'));
  assert.ok(queries.every(sql=>!/^\s*(INSERT|UPDATE|DELETE)/i.test(sql)));
});
test('live sitemap includes canonical recipe/category/post URLs and real lastmod only',()=>{
  const xml=sitemap({recipes:[{id:12,updated_at:'2026-11-04T00:00:00Z'}],categories:[{slug:'mon-viet&chay',updated_at:'invalid'}],posts:[{id:9}]});
  assert.ok(xml.includes('https://bepnhaminh.page/recipe/12'));
  assert.ok(xml.includes('https://bepnhaminh.page/category/mon-viet%26chay'));
  assert.ok(xml.includes('https://bepnhaminh.page/community/posts/9'));
  assert.equal((xml.match(/<lastmod>/g)||[]).length,1);
  assert.ok(!xml.includes('/profile'));
});
