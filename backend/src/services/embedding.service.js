const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const cosine = (a, b) => {
    if (!a?.length || a.length !== b?.length) return 0;
    let dot = 0, aa = 0, bb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
    return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
};
const validVector = vector => Array.isArray(vector) && vector.length === 768 &&
    vector.every(Number.isFinite) && vector.some(value => value !== 0);

class EmbeddingService {
    constructor({ cachePath = path.join(__dirname, '../../.cache/fridge-rag-vectors.json') } = {}) {
        this.cachePath = cachePath;
        this.cache = new Map();
        this.loaded = false;
        this.rateLimitedUntil = 0;
        this.queue = Promise.resolve();
    }

    async embed(texts, taskType, { cache = true } = {}) {
        // Serialize cache writes and initial indexing across simultaneous requests.
        const work = this.queue.then(() => this.run(texts, taskType, cache));
        this.queue = work.catch(() => {});
        return work;
    }

    async run(texts, taskType, cache) {
        if (!texts.length) return [];
        const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw Object.assign(new Error('Thiếu GEMINI_API_KEY để truy xuất công thức.'), { statusCode: 503 });
        if (!this.loaded) {
            try {
                const entries = JSON.parse(await fs.readFile(this.cachePath, 'utf8'));
                if (Array.isArray(entries)) this.cache = new Map(entries.filter(entry => Array.isArray(entry) && typeof entry[0] === 'string' && validVector(entry[1])));
            } catch { /* A missing/invalid cache is rebuilt from current published recipes. */ }
            this.loaded = true;
        }
        const keys = texts.map(text => createHash('sha256').update(JSON.stringify([model, 768, taskType, text])).digest('hex'));
        const result = keys.map(key => cache ? this.cache.get(key) : undefined);
        const signal = AbortSignal.timeout(12_000);
        let changed = false;
        for (let start = 0; start < texts.length; start += 50) {
            const indexes = texts.slice(start, start + 50).map((_, offset) => start + offset).filter(index => !result[index]);
            if (!indexes.length) continue;
            if (Date.now() < this.rateLimitedUntil) {
                throw Object.assign(new Error('Dịch vụ tạo vector đang giới hạn yêu cầu (HTTP 429).'), { statusCode: 503 });
            }
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({ requests: indexes.map(index => ({ model: `models/${model}`, taskType,
                    outputDimensionality: 768, content: { parts: [{ text: texts[index] }] } })) }),
                signal,
            }).catch(() => { throw Object.assign(new Error('Không kết nối được dịch vụ tìm kiếm công thức. Vui lòng thử lại.'), { statusCode: 503 }); });
            if (response.status === 429) this.rateLimitedUntil = Date.now() + 60_000;
            if (!response.ok) throw Object.assign(new Error(`Không thể tạo vector tìm công thức (HTTP ${response.status}). Vui lòng thử lại.`), { statusCode: 503 });
            const payload = await response.json();
            if (payload.embeddings?.length !== indexes.length || payload.embeddings.some(item => !validVector(item.values))) {
                throw Object.assign(new Error('Dữ liệu vector công thức không hợp lệ.'), { statusCode: 502 });
            }
            indexes.forEach((index, offset) => {
                result[index] = payload.embeddings[offset].values;
                if (cache) { this.cache.set(keys[index], result[index]); changed = true; }
            });
        }
        if (changed) {
            while (this.cache.size > 10000) this.cache.delete(this.cache.keys().next().value);
            try {
                await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
                // This cache is disposable: an interrupted write is detected and rebuilt.
                // Direct writes also work in Windows environments that restrict rename.
                await fs.writeFile(this.cachePath, JSON.stringify([...this.cache]));
            } catch { console.warn('Không lưu được cache vector; tiếp tục dùng cache trong bộ nhớ.'); }
        }
        return result;
    }
}

module.exports = new EmbeddingService();
module.exports.EmbeddingService = EmbeddingService;
module.exports.cosine = cosine;
