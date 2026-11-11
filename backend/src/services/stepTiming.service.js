const ai = require('./ai.service');
const recipes = require('../repositories/recipe.repository');
const { id: validId } = require('./resourceSecurity');

const validTimer = value => ['number', 'string'].includes(typeof value) &&
    Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 2147483647;

class StepTimingService {
    constructor() { this.pending = new Map(); }

    async complete({ title, ingredients, servings, steps, stepTimers = [] }) {
        if (!Array.isArray(steps) || !steps.length || steps.length > 200 ||
            steps.some(step => typeof step !== 'string' || !step.trim() || step.length > 10000)) {
            throw Object.assign(new Error('Cần từ 1 đến 200 bước nấu hợp lệ để AI bổ sung thời gian.'), { statusCode: 400 });
        }
        const missing = steps.map((instruction, index) => ({ instruction, step_number: index + 1 }))
            .filter(step => !validTimer(stepTimers[step.step_number - 1]));
        if (!missing.length) return steps.map((_, index) => Number(stepTimers[index]));
        const estimated = await ai.estimateStepTimers({ title, ingredients, servings, steps: missing });
        const byNumber = new Map(estimated.map(step => [step.step_number, step.timer_seconds]));
        return steps.map((_, index) => validTimer(stepTimers[index]) ? Number(stepTimers[index]) : byNumber.get(index + 1));
    }

    async ensureStored(recipeId, viewer) {
        recipeId = validId(recipeId);
        const recipe = await recipes.findById(recipeId);
        if (!recipe || (recipe.status !== 'published' && viewer?.role !== 'admin' && Number(viewer?.id) !== Number(recipe.author_id))) {
            throw Object.assign(new Error('Không tìm thấy công thức nấu ăn.'), { statusCode: 404 });
        }
        if (this.pending.has(recipeId)) return this.pending.get(recipeId);
        const pending = this.fillStored(recipe).finally(() => this.pending.delete(recipeId));
        this.pending.set(recipeId, pending);
        return pending;
    }

    async fillStored(recipe) {
        const steps = await recipes.getSteps(recipe.id);
        if (!steps.some(step => !validTimer(step.timer_seconds))) return steps;
        const ingredients = await recipes.getIngredients(recipe.id);
        const timers = await this.complete({ title: recipe.title, servings: recipe.servings, ingredients,
            steps: steps.map(step => step.instruction), stepTimers: steps.map(step => step.timer_seconds) });
        await recipes.fillMissingStepTimers(recipe.id, steps.map((step, index) => ({ ...step, timer_seconds: timers[index] })));
        const current = await recipes.getSteps(recipe.id);
        if (current.some(step => !validTimer(step.timer_seconds))) {
            throw Object.assign(new Error('Các bước vừa thay đổi. Vui lòng thử bổ sung thời gian lại.'), { statusCode: 409 });
        }
        return current;
    }
}

module.exports = new StepTimingService();
