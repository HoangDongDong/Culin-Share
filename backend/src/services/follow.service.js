const followRepository = require('../repositories/follow.repository');

class FollowService {
    async followUser(followerId, followingId) {
        if (followerId === parseInt(followingId)) {
            const error = new Error('Bạn không thể theo dõi chính mình');
            error.statusCode = 400;
            throw error;
        }
        await followRepository.create(followerId, followingId);
        return { followed: true };
    }

    async unfollowUser(followerId, followingId) {
        await followRepository.delete(followerId, followingId);
        return { followed: false };
    }

    async getFollowers(userId) {
        return await followRepository.getFollowers(userId);
    }

    async getFollowing(userId) {
        return await followRepository.getFollowing(userId);
    }

    async checkFollowStatus(followerId, followingId) {
        const isFollowing = await followRepository.isFollowing(followerId, followingId);
        return { followed: isFollowing };
    }
}

module.exports = new FollowService();
