import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnv} from 'vite';
import {SITE_URL,SITE_NAME,HOME_DESCRIPTION,PUBLIC_PAGES,PRIVATE_PAGES,routeSeo,recipeSeo,categorySeo,postSeo,escapeHtml as e,jsonLd} from '../src/services/seo.mjs';

const frontend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(frontend,'dist');
const env={...loadEnv('production',frontend,''),...process.env};
const api=env.VITE_API_BASE_URL || 'http://localhost:3000';
// A pasted KEY=value or multiline value must fail the build instead of shipping a broken app.
if(!/^https?:\/\/[^\s=]+$/.test(api))throw Error('VITE_API_BASE_URL phải chỉ chứa URL backend, không có tên biến, dấu = hoặc xuống dòng.');
const template=await fs.readFile(path.join(dist,'index.html'),'utf8');
export function renderHtml(template,meta,content=''){
  const head=template.replace(/<title>[\s\S]*?<\/title>/gi,'')
    .replace(/<meta\s+[^>]*(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>/gi,'')
    .replace(/<link\s+[^>]*rel="canonical"[^>]*>/gi,'');
  const tags=[`<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}">`,
    `<meta name="robots" content="${meta.noindex?'noindex, follow':'index, follow, max-image-preview:large'}">`,
    ...(meta.url?[`<link rel="canonical" href="${e(meta.url)}">`]:[]),
    ...Object.entries({type:meta.schema?.['@type']==='Recipe'?'article':'website',title:meta.title,description:meta.description,url:meta.url,image:meta.image,site_name:SITE_NAME,locale:'vi_VN'}).filter(([,v])=>v).map(([k,v])=>`<meta property="og:${k}" content="${e(v)}">`),
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${e(meta.title)}">`,
    `<meta name="twitter:description" content="${e(meta.description)}">`,
    `<meta name="twitter:image" content="${e(meta.image)}">`,
    ...(meta.schema?[`<script type="application/ld+json" data-seo-schema="true">${jsonLd(meta.schema)}</script>`]:[]),
  ].join('\n');
  return head.replace('</head>',tags+'\n</head>').replace('<div id="root"></div>',`<div id="root">${content}</div>`);
}
const links=items=>`<ul>${items.map(item=>`<li><a href="/recipe/${Number(item.id)}">${e(item.title)}</a></li>`).join('')}</ul>`;
const shell=body=>`<main style="max-width:960px;margin:40px auto;padding:24px;font-family:system-ui;line-height:1.7"><nav><a href="/">CulinShare – Bếp Nhà Mình</a> · <a href="/search">Công thức</a> · <a href="/community">Cộng đồng</a></nav>${body}</main>`;
async function writePage(url,meta,body){
  const filename=url==='/'?'index.html':url.slice(1)+'/index.html';
  const target=path.join(dist,filename);await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,renderHtml(template,meta,shell(body)));
}
async function getJson(url){
  const response=await fetch(api.replace(/\/$/,'')+url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`API trả HTTP ${response.status}`);
  const result=await response.json();if(!result.success)throw Error('API không trả dữ liệu thành công');return result;
}
let recipes=[];
try{
  for(let page=1;page<=100;page++){
    const result=await getJson(`/api/recipes?page=${page}&limit=50`);
    if(!Array.isArray(result.data))throw Error('Danh sách công thức sai định dạng');
    recipes.push(...result.data.filter(item=>item.status==='published'));
    if(result.data.length<50)break;
  }
}catch(error){console.warn(`SEO: chưa lấy đủ công thức từ API (${error.message}); vẫn tạo các trang công khai cơ bản.`);}
recipes=[...new Map(recipes.map(item=>[item.id,item])).values()];
let categories=[],postEntries=[];
try{
  const {data:catalog}=await getJson('/api/seo/catalog');
  categories=catalog.categories;postEntries=catalog.posts;
}catch(error){console.warn(`SEO: chưa lấy được danh mục/bài cộng đồng (${error.message}).`);}
const urls=Object.keys(PUBLIC_PAGES);
for(const [url,meta] of Object.entries(PUBLIC_PAGES)){
  const body=`<h1>${e(meta.title)}</h1><p>${e(meta.description)}</p>`+(url==='/'||url==='/search'?`<h2>Công thức nấu ăn và món ngon mỗi ngày</h2>${links(recipes)}<h2>Danh mục</h2><ul>${categories.map(category=>`<li><a href="/category/${e(encodeURIComponent(category.slug))}">${e(category.name)}</a></li>`).join('')}</ul>`:'');
  await writePage(url,routeSeo(url),body);
}
let snapshots=0;
// Small batches bound connections and use only the public API, without credentials.
for(let i=0;i<recipes.length;i+=4){
  await Promise.all(recipes.slice(i,i+4).map(async item=>{
    try{
      const {data:recipe}=await getJson(`/api/recipes/${Number(item.id)}`);
      if(!recipe||recipe.status!=='published'||Number(recipe.id)!==Number(item.id))return;
      const meta=recipeSeo(recipe);
      const body=`<article><h1>${e(recipe.title)}</h1><p>${e(recipe.description)}</p>${meta.schema.image?`<img src="${e(meta.schema.image[0])}" alt="${e(recipe.title)}" style="max-width:100%">`:''}<p>Tác giả: ${e(recipe.author_name || 'CulinShare')}</p><p>Chuẩn bị: ${Number(recipe.prep_time_minutes)||0} phút · Nấu: ${Number(recipe.cook_time_minutes)||0} phút · Khẩu phần: ${e(recipe.servings || '')}</p><h2>Nguyên liệu</h2><ul>${meta.schema.recipeIngredient.map(text=>`<li>${e(text)}</li>`).join('')}</ul><h2>Cách làm</h2><ol>${meta.schema.recipeInstructions.map(step=>`<li>${e(step.text)}</li>`).join('')}</ol></article>`;
      await writePage(`/recipe/${Number(recipe.id)}`,meta,body);urls.push(`/recipe/${Number(recipe.id)}`);snapshots++;
    }catch(error){console.warn(`SEO: bỏ snapshot công thức ${Number(item.id)} (${error.message}).`);}
  }));
}
for(const category of categories){
  try{
    const url='/category/'+encodeURIComponent(category.slug),meta=categorySeo(category);
    const {data:items}=await getJson('/api/recipes?category='+encodeURIComponent(category.slug)+'&limit=50');
    await writePage(url,meta,`<h1>${e(category.name)}</h1><p>${e(meta.description)}</p>${links(items)}`);urls.push(url);
  }catch(error){console.warn(`SEO: bỏ snapshot danh mục (${error.message}).`);}
}
const postLinks=[];
for(let i=0;i<postEntries.length;i+=4){
  await Promise.all(postEntries.slice(i,i+4).map(async entry=>{
    try{
      const {data:post}=await getJson('/api/community/posts/'+Number(entry.id));
      const meta=postSeo(post);if(meta.noindex)return;
      const url='/community/posts/'+Number(post.id);
      await writePage(url,meta,`<article><h1>${e(post.title||post.content.slice(0,90))}</h1><p>Tác giả: ${e(post.author_name||'CulinShare')}</p><p style="white-space:pre-wrap">${e(post.content)}</p>${(post.media||[]).map(media=>`<img src="${e(media.media_url)}" alt="Ảnh bài viết" style="max-width:100%">`).join('')}<h2>Công thức được chia sẻ</h2>${links(post.recipes||[])}</article>`);
      urls.push(url);postLinks.push({url,title:post.title||post.content.slice(0,90)});
    }catch(error){console.warn(`SEO: bỏ snapshot bài ${Number(entry.id)} (${error.message}).`);}
  }));
}
await writePage('/community',routeSeo('/community'),`<h1>${e(PUBLIC_PAGES['/community'].title)}</h1><p>${e(PUBLIC_PAGES['/community'].description)}</p><ul>${postLinks.map(post=>`<li><a href="${e(post.url)}">${e(post.title)}</a></li>`).join('')}</ul>`);
for(const url of PRIVATE_PAGES)await writePage(url,routeSeo(url),`<h1>${e(SITE_NAME)}</h1><p>Chức năng tài khoản và thành viên.</p>`);
// Unknown/new routes get no incorrect homepage canonical; React adds their own metadata.
await fs.writeFile(path.join(dist,'spa.html'),renderHtml(template,{...routeSeo('/'),title:SITE_NAME,description:HOME_DESCRIPTION,url:null,schema:null}));
// Primary /sitemap.xml is rewritten to the live backend; retain a build snapshot for diagnostics.
await fs.writeFile(path.join(dist,'sitemap-build.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${e(SITE_URL+url)}</loc></url>`).join('')}</urlset>`);
await fs.writeFile(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`SEO: ${urls.length} URL trong sitemap, ${snapshots} công thức có HTML và Recipe JSON-LD.`);
