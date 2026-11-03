const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require('../backend/src/services/community.service');
const repository = require('../backend/src/repositories/community.repository');
const notifications = require('../backend/src/services/notification.service');
const owner = { id: 7, role: 'user' }, other = { id: 8, role: 'user' };
const post = { id: 42, author_id: 7, status: 'published', liked: false, like_count: 1 };

test('hidden community posts are inaccessible to guests and other authors', async t => {
    t.mock.method(repository, 'find', async () => ({ ...post, status: 'hidden' }));
    await assert.rejects(service.post(42, null), error => error.statusCode === 404);
    await assert.rejects(service.post(42, other), error => error.statusCode === 404);
    assert.equal((await service.post(42, owner)).id, 42);
});

test('editing and deleting another author post cannot reach persistence', async t => {
    t.mock.method(repository, 'find', async () => post);
    t.mock.method(repository, 'update', async () => { throw new Error('Must not write'); });
    t.mock.method(repository, 'remove', async () => { throw new Error('Must not write'); });
    await assert.rejects(service.update(42, other, 'Unauthorized edit'), error => error.statusCode === 403);
    await assert.rejects(service.remove(42, other), error => error.statusCode === 403);
});

test('cross-post replies and deleted comment reports are rejected', async t => {
    t.mock.method(repository, 'find', async () => post);
    t.mock.method(repository, 'comment', async () => ({ id: 2, post_id: 99, status: 'published', user_id: 8 }));
    await assert.rejects(service.addComment(42, owner, { content: 'Reply', parentId: 2 }), error => error.statusCode === 400);
    t.mock.method(repository, 'comment', async () => undefined);
    await assert.rejects(service.reportComment(2, owner, { reason: 'spam' }), error => error.statusCode === 404);
});

test('repeated likes do not create duplicate community notifications', async t => {
    t.mock.method(repository, 'find', async () => post);
    let writes = 0, events = [];
    t.mock.method(repository, 'like', async () => ++writes === 1);
    t.mock.method(notifications, 'createAndNotify', async event => events.push(event));
    await service.like(42, other, true); await service.like(42, other, true);
    assert.equal(events.length, 1);
    assert.equal(events[0].postId, 42);
    assert.equal(events[0].userId, 7);
    assert.equal(events[0].type, 'community_like');
});
