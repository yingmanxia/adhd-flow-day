import type { TaskView } from '@flowday/types'
import { Button, Modal } from '@flowday/ui'

export function DeleteConfirm({
  task,
  onClose,
  onConfirm,
}: {
  task: TaskView | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal open={Boolean(task)} title="删除确认" onClose={onClose} bare>
      <div className="confirm-card">
        <div className="confirm-icon" aria-hidden="true">
          !
        </div>
        <div>
          <h3>删除这条任务？</h3>
          <p>「{task?.title}」将从收件箱移除，此操作不可恢复。</p>
        </div>
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            确认删除
          </Button>
        </div>
        <p className="confirm-undo">担心误删？删除后 5 秒内可在底部提示点「撤销」</p>
      </div>
    </Modal>
  )
}
