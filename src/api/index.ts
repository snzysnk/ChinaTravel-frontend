/**
 * 接口层：全应用访问后端的唯一入口。
 *
 * 页面只调用本文件暴露的方法，不直接使用 fetch，也不关心请求路径与信封解析——
 * 新增接口时改动集中在这里（见 frontend-toolchain 规格的目录约定要求）。
 */

import { request } from './request'
import type { Destination, HealthStatus } from './types'

/**
 * 健康检查：确认后端可达。
 * @returns 后端返回的状态对象
 */
export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/api/health')
}

/**
 * 查询全部目的地。
 * @returns 目的地集合；后端保证为空时返回空数组而非 null
 */
export function listDestinations(): Promise<Destination[]> {
  return request<Destination[]>('/api/destinations')
}
