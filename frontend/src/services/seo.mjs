export const SITE_URL = 'https://bepnhaminh.page';
export const SITE_NAME = 'Bếp Nhà Mình – CulinShare';
export const HOME_TITLE = 'Bếp Nhà Mình – CulinShare | Công thức nấu ăn ngon';
export const HOME_DESCRIPTION = 'Bếp Nhà Mình – CulinShare chia sẻ công thức nấu ăn, món ngon mỗi ngày và kinh nghiệm nấu cơm gia đình. Khám phá món theo nguyên liệu và hướng dẫn từng bước.';
export const PUBLIC_PAGES = {
  '/': {title: HOME_TITLE, description: HOME_DESCRIPTION},
  '/about': {title:'Giới thiệu Bếp Nhà Mình – CulinShare',description:'Tìm hiểu cộng đồng Bếp Nhà Mình – CulinShare: công thức nấu ăn, chia sẻ kinh nghiệm, tìm món theo nguyên liệu và Tủ lạnh AI.'},
  '/search': {title: 'Khám phá công thức nấu ăn ngon | CulinShare', description: 'Tìm cách nấu món ngon cho gia đình. Lọc công thức theo nguyên liệu, thời gian, calo và độ khó trên Bếp Nhà Mình.'},
  '/community': {title: 'Cộng đồng chia sẻ công thức nấu ăn | CulinShare', description: 'Chia sẻ công thức nấu ăn, hỏi đáp và trao đổi bí quyết nấu ăn ngon mỗi ngày cùng cộng đồng CulinShare – Bếp Nhà Mình.'},
  '/chefs': {title: 'Đầu bếp và người chia sẻ công thức | CulinShare', description: 'Khám phá các tác giả và công thức nấu ăn từ cộng đồng yêu bếp CulinShare.'},
};
export const PRIVATE_PAGES = ['/login','/register','/profile','/admin','/fridge','/saved-recipes','/submit-recipe','/forgot-password','/reset-password'];
export const plainText = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const jsonLd = data => JSON.stringify(data).replace(/</g, '\\u003c');
export const canonical = pathname => SITE_URL + (pathname === '/' ? '/' : pathname.replace(/\/$/, ''));
export function imageUrl(value) {
  try {const url = new URL(value, SITE_URL); return ['http:','https:'].includes(url.protocol) ? url.href : undefined;} catch {return undefined;}
}
export function routeSeo(pathname, search = '') {
  const path = pathname.replace(/\/$/, '') || '/';
  const page = PUBLIC_PAGES[path];
  const publicDetail = /^\/(?:recipe|chef)\/[1-9]\d*$/.test(path) || /^\/community\/posts\/[1-9]\d*$/.test(path) || /^\/category\/[^/]+$/.test(path);
  return {
    title: page?.title || SITE_NAME,
    description: page?.description || HOME_DESCRIPTION,
    url: canonical(path),
    image: SITE_URL + '/hero_dish.jpg',
    noindex: (!page && !publicDetail) || Boolean(search),
    schema: path === '/' ? {
      '@context':'https://schema.org', '@type':'WebSite', name: SITE_NAME,
      '@id':SITE_URL+'/#website',alternateName:['Bếp Nhà Mình','CulinShare'], url: SITE_URL + '/', inLanguage:'vi-VN',
      description: HOME_DESCRIPTION,
      publisher:{'@type':'Organization','@id':SITE_URL+'/#organization',name:SITE_NAME,url:SITE_URL+'/',logo:{'@type':'ImageObject',url:SITE_URL+'/favicon-community.png'}},
    } : null,
  };
}
export function recipeSeo(recipe) {
  const base = routeSeo('/recipe/' + recipe.id);
  if(recipe.status !== 'published') return {...base,noindex:true};
  const description = plainText(recipe.description).slice(0, 170) || `Cách làm ${recipe.title}: nguyên liệu, định lượng và hướng dẫn từng bước trên CulinShare – Bếp Nhà Mình.`;
  const image = imageUrl(recipe.cover_image_url);
  const schema = {
    '@context':'https://schema.org', '@type':'Recipe', name:plainText(recipe.title),
    description, url:base.url, ...(image ? {image:[image]} : {}),
    ...(recipe.author_name ? {author:{'@type':'Person', name:plainText(recipe.author_name)}} : {}),
    ...(recipe.created_at && Number.isFinite(Date.parse(recipe.created_at)) ? {datePublished:new Date(recipe.created_at).toISOString()} : {}),
    ...(Number(recipe.prep_time_minutes) > 0 ? {prepTime:`PT${Number(recipe.prep_time_minutes)}M`} : {}),
    ...(Number(recipe.cook_time_minutes) > 0 ? {cookTime:`PT${Number(recipe.cook_time_minutes)}M`} : {}),
    ...(Number(recipe.servings) > 0 ? {recipeYield:`${Number(recipe.servings)} người`} : {}),
    recipeIngredient:(recipe.ingredients || []).map(item => plainText([item.quantity,item.unit,item.name].filter(value=>value!==null&&value!==undefined).join(' '))),
    recipeInstructions:(recipe.steps || []).map(step => ({'@type':'HowToStep',text:plainText(step.instruction)})),
  };
  // Only publish actual content fields; never invent ratings or nutritional units.
  return {...base, title:`${plainText(recipe.title)} – Cách làm và nguyên liệu | CulinShare`, description, image:image || base.image, noindex:false, schema};
}

export function categorySeo(category) {
  const base=routeSeo('/category/'+encodeURIComponent(category.slug));
  return {...base,title:`${plainText(category.name)} – Công thức và cách nấu ngon | CulinShare`,description:plainText(category.description).slice(0,170)||`Khám phá công thức ${plainText(category.name)} và cách nấu từng bước trên CulinShare – Bếp Nhà Mình.`,image:imageUrl(category.image_url)||base.image};
}
export function postSeo(post) {
  const base=routeSeo('/community/posts/'+post.id);
  if(post.status!=='published'||post.deleted_at)return {...base,noindex:true};
  const title=plainText(post.title || post.content).slice(0,90);
  const description=plainText(post.content).slice(0,170);
  const image=imageUrl(post.media?.[0]?.media_url);
  return {...base,title:`${title} | Cộng đồng CulinShare`,description,image:image||base.image,schema:{'@context':'https://schema.org','@type':'DiscussionForumPosting',headline:title,text:plainText(post.content),url:base.url,...(image?{image:[image]}:{}),...(post.author_name?{author:{'@type':'Person',name:plainText(post.author_name)}}:{}),...(post.created_at&&Number.isFinite(Date.parse(post.created_at))?{datePublished:new Date(post.created_at).toISOString()}:{} )}};
}

export function applySeo(meta) {
  document.title = meta.title;
  const setMeta = (attribute, key, value) => {
    const matches = [...document.head.querySelectorAll(`meta[${attribute}="${key}"]`)];
    const element = matches.shift() || document.createElement('meta');
    matches.forEach(node=>node.remove());
    element.setAttribute(attribute,key); element.content=value; document.head.appendChild(element);
  };
  setMeta('name','description',meta.description);
  setMeta('name','robots',meta.noindex?'noindex, follow':'index, follow, max-image-preview:large');
  for(const [key,value] of Object.entries({type:meta.schema?.['@type']==='Recipe'?'article':'website',title:meta.title,description:meta.description,url:meta.url,image:meta.image,site_name:SITE_NAME,locale:'vi_VN'}))setMeta('property','og:'+key,value);
  setMeta('name','twitter:card','summary_large_image');
  setMeta('name','twitter:title',meta.title);setMeta('name','twitter:description',meta.description);setMeta('name','twitter:image',meta.image);
  const links=[...document.head.querySelectorAll('link[rel="canonical"]')];
  const link=links.shift() || document.createElement('link');links.forEach(node=>node.remove());link.rel='canonical';link.href=meta.url;document.head.appendChild(link);
  document.head.querySelectorAll('script[data-seo-schema]').forEach(node=>node.remove());
  if(meta.schema){const script=document.createElement('script');script.type='application/ld+json';script.dataset.seoSchema='true';script.textContent=jsonLd(meta.schema);document.head.appendChild(script);}
}
