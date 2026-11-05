const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
async function main(){
    const get=async endpoint=>{const response=await fetch('http://127.0.0.1:3002'+endpoint,{headers:{Origin:'http://localhost:5052'},signal:AbortSignal.timeout(15000)});assert.equal(response.status,200,endpoint);const result=await response.json();assert.equal(result.success,true);return result;};
    const local=JSON.parse(await fs.readFile(path.join(__dirname,'../.cache/vifoodrec/local-verification.json'),'utf8'));
    const published=local.publication.find(row=>row.status==='published').n;
    const first=await get('/api/recipes?page=1&limit=50'),second=await get('/api/recipes?page=2&limit=50');
    assert.equal(first.meta.total,local.baselineRecipes+published);assert.equal(first.data.length,50);assert.ok(second.data.every(item=>!first.data.some(previous=>previous.id===item.id)));
    const removed=await get('/api/recipes?category=vifoodrec&limit=1');assert.equal(removed.meta.total,0);
    const match=await get('/api/recipes?category=mon-nuoc&limit=50');assert.ok(match.meta.total>0);
    const detail=await get('/api/recipes/'+match.data.find(r=>r.slug.startsWith('vfr-')).id);assert.equal(detail.data.importInfo.dataset,'ViFoodRec');assert.equal(detail.data.importInfo.nutritionBasis,'unknown');assert.ok(detail.data.ingredients.length);assert.ok(detail.data.steps.length);assert.equal(detail.data.calories,null);assert.equal(detail.data.difficulty,null);
    const unicode=await get('/api/recipes?q='+encodeURIComponent('bánh')+'&limit=50'),ascii=await get('/api/recipes?q=banh&limit=50');assert.deepEqual(unicode.data.map(row=>row.id),ascii.data.map(row=>row.id));
    const home=await get('/api/home');assert.equal(home.data.recipes.length,4);
    const catalog=await get('/api/seo/catalog');assert.equal(catalog.data.recipes.length,local.baselineRecipes+published);
    const htmlRecipe=await get('/api/recipes?category=mon-nuoc&q='+encodeURIComponent('bánh')+'&limit=5');
    const report={checks:10,totalRecipes:first.meta.total,importedRecipes:published,foodCategories:true,sampleRecipeId:detail.data.id,sampleImage:detail.data.cover_image_url,sampleRecipeIds:htmlRecipe.data.map(row=>row.id),paginationNoOverlap:true,unicodeSearch:true,provenance:true,nutritionNotInvented:true};
    await fs.writeFile(path.join(__dirname,'../.cache/vifoodrec/http-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
