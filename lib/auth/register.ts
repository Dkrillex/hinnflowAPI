/**
 * 注册表单的校验规则，浏览器与 /api/auth/register 共用。
 * 与 new-api v1.0.0-rc.45 的 model.User 校验标签一致：
 *   username max=20、password min=8,max=128、email max=50，长度都按 Unicode 字符计
 */

export const USERNAME_MAX = 20
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128
export const EMAIL_MAX = 50

export type RegisterInputError = 'INVALID' | 'USERNAME_LENGTH' | 'PASSWORD_LENGTH' | 'EMAIL_INVALID'

/** 按码点计数，对应 Go 的 utf8.RuneCountInString */
const runes = (s: string) => Array.from(s).length

export function checkUsername(username: string): RegisterInputError | null {
  if (!username) return 'INVALID'
  return runes(username) > USERNAME_MAX ? 'USERNAME_LENGTH' : null
}

export function checkPassword(password: string): RegisterInputError | null {
  if (!password) return 'INVALID'
  const n = runes(password)
  return n < PASSWORD_MIN || n > PASSWORD_MAX ? 'PASSWORD_LENGTH' : null
}

export function checkEmail(email: string): RegisterInputError | null {
  if (!email) return 'INVALID'
  return email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'EMAIL_INVALID' : null
}

/** 邀请码只是透传给 new-api 查邀请人，限定成它生成的那种短字母数字串，其余丢弃 */
export function cleanAffCode(raw: unknown): string {
  return typeof raw === 'string' && /^[A-Za-z0-9]{1,32}$/.test(raw) ? raw : ''
}
