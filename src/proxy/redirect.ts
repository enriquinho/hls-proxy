import { v4 as uuidv4 } from 'uuid';

const redirectionMap: Record<string, string> = {}

export const getProxyRedirectUrl = (originalURL: string) => {
  const uuid = uuidv4()
  redirectionMap[uuid] = originalURL
  return '/' + uuid
}

export const getURLFromRedirectUrl = (redirectURL: string) => redirectionMap[redirectURL.replace('/', '')]