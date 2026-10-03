/**
 * 后端接口的类型声明。
 *
 * **权威来源**是后端仓库的响应信封契约：
 *   - spec：`openspec/specs/api-response-envelope/spec.md`
 *   - 实现：`backend/internal/platform/response/envelope.go`
 *
 * 这里的类型是**手工同步**的，不是从后端生成的（见 design.md 决策 6）：
 * 前后端是两个独立仓库，自动生成需要额外的链路与依赖，而当前接口只有两个。
 * 代价是后端改动响应结构时前端不会自动报错——因此改动后端信封或接口数据结构时，
 * 必须同步检查本文件。
 *
 * 契约要点：HTTP 状态码恒为 200，业务成败只看 `code`；`code` 为 0 表示成功，
 * 非零时 `data` 恒为 null、`msg` 为可展示的中文提示。
 */

/** 业务码。0 表示成功，非零表示失败（编码规则见后端 envelope.go 的分段说明）。 */
export type EnvelopeCode = number

/**
 * 响应信封。与后端 `response.Envelope` 的三个 JSON 字段一一对应。
 *
 * `data` 的失败态为 null：后端 `Fail` 构造时固定写入 null，因此这里声明为
 * `T | null`，强制调用方在成功分支里也处理 null 的可能，而不是直接取字段。
 */
export interface Envelope<T> {
  code: EnvelopeCode
  msg: string
  data: T | null
}

/**
 * 成功信封。
 *
 * 经 `request()` 解析成功后，`data` 必定非 null（解析逻辑已把 code 非零的情况
 * 抛成错误），因此用这个类型收窄掉 null，避免调用方反复判空。
 */
export interface SuccessEnvelope<T> extends Envelope<T> {
  code: 0
  data: T
}

/** GET /api/health 的 data 结构。 */
export interface HealthStatus {
  status: string
}

/** 目的地条目，对应 GET /api/destinations 返回集合中的元素。 */
export interface Destination {
  /** 目的地标识，如 "beijing"。 */
  id: string
  /** 展示名称，如 "北京"。 */
  name: string
  /** 所属省级行政区。 */
  province: string
  /** 一句话简介。 */
  summary: string
}
