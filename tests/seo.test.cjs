const test=require('node:test');
const assert=require('node:assert/strict');
const seo=import('../frontend/src/services/seo.mjs');

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
