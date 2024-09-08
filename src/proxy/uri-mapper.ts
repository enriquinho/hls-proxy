import { v4 as uuidv4 } from 'uuid';

let fromIdToUriMap: Record<string, string> = {}
let fromUriToIdMap: Record<string, string> = {}

export const getIdFromUri = (uri: string) => {
  const alreadyPresentId = fromUriToIdMap[uri]
  if (alreadyPresentId) return alreadyPresentId

  const uuid = uuidv4()
  fromIdToUriMap[uuid] = uri
  fromUriToIdMap[uri] = uuid
  return uuid
}

export const getUriFromId = (id: string) => fromIdToUriMap[id]

export const resetMappings = () => {
  fromIdToUriMap = {}
  fromUriToIdMap = {}
}