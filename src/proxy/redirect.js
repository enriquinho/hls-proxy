import { v4 as uuidv4 } from 'uuid';

const redirectionMap = {}

export const getProxyRedirectUrl = (originalURL) => {
  const uuid = uuidv4()
  redirectionMap[uuid] = originalURL
  return '/' + uuid
}

export const getURLFromRedirectUrl = (redirectURL) => redirectionMap[redirectURL.replace('/', '')]