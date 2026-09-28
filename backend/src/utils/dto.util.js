/**
 * =================================================================
 * DTO UTILITY (Data Transfer Object)
 * =================================================================
 * Chuẩn hóa dữ liệu trước khi trả về cho client.
 * Lược bỏ các thông tin nhạy cảm (password_hash, otp_code, ...).
 * =================================================================
 */

const parseCuisinePreferences = (value) => {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (error) {
        // Ignore JSON parse errors and fall back to raw string
    }
    return trimmed;
};

const parseDailyBudget = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

/**
 * Chuyển đổi user object từ DB thành User DTO
 * Lược bỏ: password_hash, otp_code, otp_expires_at
 * 
 * @param {Object} user - User object từ database
 * @returns {Object} User DTO an toàn để trả về cho client
 */
const toUserDTO = (user) => {
    if (!user) return null;

    const cuisinePreferences = parseCuisinePreferences(user.cuisine_preferences);
    const dailyBudget = parseDailyBudget(user.daily_budget);

    const dto = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name || null,
        avatar_url: user.avatar_url || null,
        phone: user.phone || null,
        address: user.address || null,
        bio: user.bio || null,
        facebook_url: user.facebook_url || null,
        instagram_username: user.instagram_username || null,
        cuisine_preferences: cuisinePreferences,
        daily_budget: dailyBudget,
        role: user.role,
        is_verified: user.is_verified === 1 || user.is_verified === true,
        height: user.height || null,
        weight: user.weight || null,
        activity_level: user.activity_level || 'sedentary',
        created_at: user.created_at,
        updated_at: user.updated_at
    };

    // Alias camelCase fields for profile API clients
    dto.fullName = dto.full_name;
    dto.avatarUrl = dto.avatar_url;
    dto.facebookUrl = dto.facebook_url;
    dto.instagramUsername = dto.instagram_username;
    dto.cuisinePreferences = dto.cuisine_preferences;
    dto.dailyBudget = dto.daily_budget;
    dto.activityLevel = dto.activity_level;

    return dto;
};

module.exports = {
    toUserDTO
};
