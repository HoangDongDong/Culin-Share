import { useEffect, useState } from 'react';
import api from '../services/api';
import { StepTimer } from './CookingTimers';

export default function AIRecipeSteps({ recipe, onResolved }) {
  const [error, setError] = useState('');
  const missing = recipe.steps.some((_, index) => !(recipe.stepTimers?.[index] > 0));
  const timerGroupId = `fridge-ai:${JSON.stringify([recipe.name, recipe.steps])}`;

  useEffect(() => {
    if (!missing || error) return;
    const controller = new AbortController();
    api.post('/api/ai/step-timers', { title: recipe.name, ingredients: recipe.ingredients || [],
      servings: recipe.servings, steps: recipe.steps, stepTimers: recipe.stepTimers || [] },
    { signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) onResolved(response.data.data.stepTimers);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error.response?.data?.message || 'AI chưa bổ sung được thời gian. Vui lòng thử lại.');
    });
    return () => controller.abort();
  }, [recipe, missing, error, onResolved]);

  return <div className="space-y-3">
    {missing && <div role="status" className="rounded-xl bg-primary/5 p-3 text-sm">
      {error ? <><p>{error}</p><button type="button" onClick={() => setError('')} className="mt-2 text-primary font-bold underline">Yêu cầu AI bổ sung lại</button></> : 'AI đang bổ sung thời gian từng bước…'}
    </div>}
    <p className="text-xs text-secondary">Thời gian từng bước do AI ước tính. Bạn có thể điều chỉnh trước khi bắt đầu.</p>
    {recipe.steps.map((step, index) => <div key={index} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">{index + 1}</div>
      <div className="flex-grow min-w-0">
        <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Bước {index + 1}</h5>
        <p className="text-sm text-on-surface leading-relaxed">{step}</p>
        <StepTimer recipeId={null} recipeTitle={recipe.name} timerGroupId={timerGroupId} stepId={index + 1}
          stepNumber={index + 1} durationSeconds={recipe.stepTimers?.[index] || 0} estimating={missing && !error} />
      </div>
    </div>)}
  </div>;
}
