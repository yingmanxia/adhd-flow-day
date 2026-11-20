import type { PlanView, TriageTaskInput } from '@flowday/types'
import { Button } from '@flowday/ui'

export interface TriageActionsProps {
  plans: PlanView[]
  planId: string
  date: string
  onPlanId: (value: string) => void
  onDate: (value: string) => void
  onAct: (input: TriageTaskInput) => void
  todayLabel?: string
}

/** 四向分流控件：今日 / 计划 / 未来 / 删除，行内与连续分流浮层共用。 */
export function TriageActions({
  plans,
  planId,
  date,
  onPlanId,
  onDate,
  onAct,
  todayLabel = '今日',
}: TriageActionsProps) {
  return (
    <div className="triage-actions">
      <Button onClick={() => onAct({ action: 'TODAY' })}>{todayLabel}</Button>
      <div className="triage-choice">
        <select aria-label="归入计划" value={planId} onChange={(e) => onPlanId(e.target.value)}>
          <option value="">选计划</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.title}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          disabled={!planId}
          onClick={() => planId && onAct({ action: 'PLAN', planId })}
        >
          计划
        </Button>
      </div>
      <div className="triage-choice">
        <input
          aria-label="安排日期"
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
        />
        <Button
          variant="ghost"
          disabled={!date}
          onClick={() => date && onAct({ action: 'SCHEDULE', scheduledDate: date })}
        >
          未来
        </Button>
      </div>
      <Button variant="danger" onClick={() => onAct({ action: 'DELETE' })}>
        删除
      </Button>
    </div>
  )
}
