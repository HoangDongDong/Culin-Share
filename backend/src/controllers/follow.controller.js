const followService = require('../services/follow.service');
const notificationService = require('../services/notification.service');
const userRepository = require('../repositories/user.repository');

class FollowController {
    async followUser(req, res, next) {
        try {
            const { id: followingId } = req.params;
            const followerId = req.user.id;
            const result = await followService.followUser(followerId, followingId);

            // Gửi thông báo realtime tới người được follow
            try {
                const follower = await userRepository.findById(followerId);
                if (follower) {
                    await notificationService.createAndNotify({
                        userId: parseInt(followingId),
                        senderId: followerId,
                        type: 'follow',
                        recipeId: null,
                        message: `đã bắt đầu theo dõi bạn`,
                    });
                }
            } catch (notifError) {
                console.error('Lỗi gửi notification follow:', notifError.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Theo dõi thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async unfollowUser(req, res, next) {
        try {
            const { id: followingId } = req.params;
            const followerId = req.user.id;
            const result = await followService.unfollowUser(followerId, followingId);
            return res.status(200).json({
                success: true,
                message: 'Hủy theo dõi thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getFollowers(req, res, next) {
        try {
            const { id: userId } = req.params;
            const followers = await followService.getFollowers(userId);
            return res.status(200).json({
                success: true,
                data: followers
            });
        } catch (error) {
            next(error);
        }
    }

    async getFollowing(req, res, next) {
        try {
            const { id: userId } = req.params;
            const following = await followService.getFollowing(userId);
            return res.status(200).json({
                success: true,
                data: following
            });
        } catch (error) {
            next(error);
        }
    }

    async checkFollowStatus(req, res, next) {
        try {
            const { id: followingId } = req.params;
            const followerId = req.user.id;
            const result = await followService.checkFollowStatus(followerId, followingId);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FollowController();
