import { Button } from '@/components/ui/Button';
import type { CatalogFormValue } from '@/lib/admin-catalog-form';
import { COMPETENCY_KEYS, COMPETENCY_FULL_LABELS } from '@/types';

export function CatalogItemForm({
  releaseId,
  categories,
  item,
  submitLabel
}: {
  releaseId: string;
  categories: string[];
  item: CatalogFormValue;
  submitLabel: string;
}) {
  return (
    <>
      <input type="hidden" name="releaseId" value={releaseId} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">업종 ID</span>
          <input name="id" defaultValue={item.id || ''} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">상태</span>
          <select name="rowStatus" defaultValue={item.rowStatus} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">카테고리</span>
          <select name="category" defaultValue={item.category} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3">
            <option value="">선택</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">업종명</span>
          <input name="name" defaultValue={item.name} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">핵심 역량</span>
          <input name="coreSkills" defaultValue={item.coreSkills} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">투자비 문구</span>
          <input name="investmentRange" defaultValue={item.investmentRange} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">투자비 최소</span>
          <input name="investmentMin" type="number" defaultValue={item.investmentMin} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">투자비 최대</span>
          <input name="investmentMax" type="number" defaultValue={item.investmentMax ?? ''} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
      </div>

      <div className="mt-6 rounded-[20px] border border-quiz-border bg-quiz-bg/40 p-5">
        <h3 className="text-lg font-bold">12개 역량 점수</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {COMPETENCY_KEYS.map((key, index) => (
            <label key={key} className="space-y-2 text-sm">
              <span className="text-quiz-text-secondary">{COMPETENCY_FULL_LABELS[index]}</span>
              <input
                name={`competency_${key}`}
                type="number"
                min={1}
                max={5}
                defaultValue={item.competencyScores[key]}
                className="w-full rounded-[14px] border border-quiz-border bg-quiz-card px-4 py-3"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">운영형태</span>
          <input name="operationType" defaultValue={item.operationType} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">필요 인력</span>
          <input name="requiredStaff" defaultValue={item.requiredStaff} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">주말근무</span>
          <input name="weekendWork" defaultValue={item.weekendWork} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">워라밸</span>
          <input name="workLifeBalance" type="number" min={1} max={5} defaultValue={item.workLifeBalance} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">계절성</span>
          <input name="seasonality" defaultValue={item.seasonality} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">자격증</span>
          <input name="requiredLicense" defaultValue={item.requiredLicense} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">평균 월매출</span>
          <input name="avgMonthlyRevenue" defaultValue={item.avgMonthlyRevenue} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">영업이익률</span>
          <input name="operatingMargin" defaultValue={item.operatingMargin} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">손익분기</span>
          <input name="breakeven" defaultValue={item.breakeven} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">경쟁강도</span>
          <input name="competitionLevel" type="number" min={1} max={5} defaultValue={item.competitionLevel} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">차별화 여지</span>
          <input name="differentiationRoom" type="number" min={1} max={5} defaultValue={item.differentiationRoom} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">폐업률</span>
          <input name="closureRate" defaultValue={item.closureRate} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">성장 잠재력</span>
          <input name="growthPotential" type="number" min={1} max={5} defaultValue={item.growthPotential} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-quiz-text-secondary">진입장벽</span>
          <input name="entryBarrier" type="number" min={1} max={5} defaultValue={item.entryBarrier} className="w-full rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3" />
        </label>
      </div>

      <div className="mt-6">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </>
  );
}
