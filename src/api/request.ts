/**
 * 统一的信封解析与请求入口——全应用只有这一处发请求、只有这一处解析 code。
 *
 * 逻辑从零构建版本的 index.html 中同名函数原样迁移（见 design.md 决策 7），
 * 只补了类型标注，行为未变：
 *   - 校验 HTTP 状态与 JSON 可解析性；
 *   - 判断信封的 code，为零取 data，非零以 msg 构造错误；
 *   - 抛出而不是返回 null，使调用方无法"忘记判空"而渲染出空白内容。
 *
 * 请求一律使用**相对路径**（如 '/api/destinations'）。开发期由 Vite 开发服务器
 * 把 /api 转发到后端，生产环境由反向代理承担同样职责——因此本文件不出现任何
 * 后端主机名或端口，产物在两种环境下使用同一套地址。
 */

import type { Envelope, SuccessEnvelope } from './types'

/**
 * 发起一次接口请求并返回信封中的 data。
 *
 * @param path 接口路径（相对路径），如 '/api/destinations'
 * @returns 信封中的 data 字段，已收窄为非 null
 * @throws {Error} 网络不可达、响应非 JSON、或 code 非零时抛出，message 为可展示的中文提示
 */
export async function request<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } })
  } catch {
    // fetch 只在网络层失败时 reject（后端未启动、代理未生效、DNS 失败等）。
    // 开发期经同源转发，因此这里的失败通常意味着后端未启动或转发目标不可达，
    // 而不是跨域被拦——跨域拦截的场景留给生产环境的反向代理配置错误。
    throw new Error('无法连接后端服务，请确认后端已启动')
  }

  if (!response.ok) {
    throw new Error('服务返回异常状态：HTTP ' + response.status)
  }

  let envelope: Envelope<unknown>
  try {
    envelope = (await response.json()) as Envelope<unknown>
  } catch {
    throw new Error('响应不是合法的 JSON 信封')
  }

  if (envelope.code !== 0) {
    // 失败信封：data 必为 null，只展示 msg，不尝试渲染 data。
    throw new Error(envelope.msg || '请求失败（code=' + envelope.code + '）')
  }

  // 收窄为成功信封：经过上面的判断，此处 data 必定非 null。
  return (envelope as SuccessEnvelope<T>).data
}
