const test=require('node:test');
const assert=require('node:assert/strict');
const seo=import('../frontend/src/services/seo.mjs');

test('recipe links, canonical metadata and the live sitemap use the same descriptive URL', async () => {
  const { recipePath, recipeSeo, routeSeo } = await seo;
  const { sitemap } = require('../backend/src/services/seo.service.js');
  const recipe = { id: 35075, title: 'Mì spaghetti xào tôm nấm', status: 'published' };
  const path = '/recipe/35075/mi-spaghetti-xao-tom-nam';
  assert.equal(recipePath(recipe), path);
  assert.equal(recipeSeo(recipe).url, 'https://bepnhaminh.page' + path);
  assert.equal(routeSeo(path).noindex, false);
  assert.match(sitemap({ recipes: [recipe], categories: [], posts: [] }), /<loc>https:\/\/bepnhaminh\.page\/recipe\/35075\/mi-spaghetti-xao-tom-nam<\/loc>/);
});

test('public routes have canonical primary-domain URLs and private/search variants are noindex',async()=>{
  const {routeSeo}=await seo;
  assert.equal(routeSeo('/').url,'https://bepnhaminh.page/');
  assert.equal(routeSeo('/community/').url,'https://bepnhaminh.page/community');
  for(const route of ['/','/community','/search','/chefs','/recipe/12'])assert.equal(routeSeo(route).noindex,false);
  for(const route of ['/admin','/profile','/login','/edit-recipe/1','/product/1','/not-found'])assert.equal(routeSeo(route).noindex,true);
  assert.equal(routeSeo('/search','?q=pho').noindex,true);
});

test('Recipe schema uses only published factual fields and real instructions',async()=>{
  const {recipeSeo}=await seo;
  const recipe={id:1,status:'published',title:'Phở gà',description:'Cách nấu phở gà',cover_image_url:'https://example.com/pho.jpg',author_name:'Đầu bếp',prep_time_minutes:15,cook_time_minutes:40,servings:4,ingredients:[{quantity:500,unit:'g',name:'Thịt gà'}],steps:[{instruction:'Luộc gà.'}]};
  const meta=recipeSeo(recipe);
  assert.equal(meta.schema['@type'],'Recipe');assert.equal(meta.noindex,false);
  assert.equal(meta.schema.prepTime,'PT15M');assert.equal(meta.schema.recipeIngredient[0],'500 g Thịt gà');
  assert.equal(meta.schema.recipeInstructions[0].text,'Luộc gà.');
  assert.equal(meta.schema.aggregateRating,undefined);assert.equal(meta.schema.nutrition,undefined);
  const hidden=recipeSeo({...recipe,status:'pending'});
  assert.equal(hidden.noindex,true);assert.equal(hidden.schema,null);
});

test('snapshot HTML and JSON-LD cannot break out through stored recipe content',async()=>{
  const {escapeHtml,jsonLd,imageUrl}=await seo;
  const attack='</script><script>alert("x")</script>';
  assert.ok(!escapeHtml(attack).includes('<script>'));
  assert.ok(!jsonLd({name:attack}).includes('</script>'));
  assert.equal(JSON.parse(jsonLd({name:attack})).name,attack);
  assert.equal(imageUrl('javascript:alert(1)'),undefined);
});

test('Recipe markup uses real category and step media while leaving unknown metadata absent', async () => {
  const { imageUrl, recipeSeo } = await seo;
  const recipe = {
    id: 42, status: 'published', title: 'Gà luộc', prep_time_minutes: null,
    categories: [{ name: 'Món Việt' }],
    steps: [
      { instruction: 'Bước 1: Luộc gà. Đợi 30 phút.', image_url: '/uploads/ga.jpg' },
      { instruction: 'Vớt gà ra.', image_url: '' },
    ],
  };
  const { schema } = recipeSeo(recipe, url => imageUrl(url, 'https://api.example.com'));
  assert.equal(schema.recipeCategory, 'Món Việt');
  assert.equal(schema.recipeInstructions[0].name, 'Luộc gà');
  assert.equal(schema.recipeInstructions[0].image, 'https://api.example.com/uploads/ga.jpg');
  assert.equal(schema.recipeInstructions[1].image, undefined);
  assert.equal(schema.prepTime, undefined);
  assert.equal(schema.video, undefined);
  assert.equal(recipeSeo({ ...recipe, prep_time_minutes: 0 }).schema.prepTime, 'PT0M');
});
test('categories and public community posts have distinct metadata; hidden posts stay noindex',async()=>{
  const {categorySeo,postSeo}=await seo;
  const category=categorySeo({slug:'mon-viet',name:'Món Việt',description:'Món ngon Việt Nam'});
  assert.equal(category.url,'https://bepnhaminh.page/category/mon-viet');assert.ok(category.title.includes('Món Việt'));
  const post={id:7,status:'published',title:'Cách nấu phở',content:'Chia sẻ bí quyết nấu phở.',author_name:'Tác giả'};
  assert.equal(postSeo(post).schema['@type'],'DiscussionForumPosting');
  assert.equal(postSeo(post).url,'https://bepnhaminh.page/community/posts/7');
  assert.equal(postSeo({...post,status:'hidden'}).noindex,true);
  assert.equal(postSeo({...post,deleted_at:'2026-11-04'}).noindex,true);
});
