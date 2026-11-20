import type { PlanView } from '@flowday/types'

import { notFound } from '../../common/errors.js'

import type { PlanRepository } from './repository.js'
import type { CreatePlanRequest, UpdatePlanRequest } from './schema.js'

export class PlanService {
  constructor(private readonly repo: PlanRepository) {}

  list(userId: string): Promise<PlanView[]> {
    return this.repo.list(userId)
  }

  async create(userId: string, input: CreatePlanRequest): Promise<PlanView> {
    return this.repo.create(userId, input)
  }

  async get(userId: string, id: string): Promise<PlanView> {
    const plan = await this.repo.findById(userId, id)
    if (!plan) throw notFound('计划不存在')
    return plan
  }

  async update(userId: string, id: string, input: UpdatePlanRequest): Promise<PlanView> {
    await this.get(userId, id)
    return this.repo.update(id, input)
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id)
    await this.repo.remove(userId, id)
  }
}
