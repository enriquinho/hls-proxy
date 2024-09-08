const uuids = [
  '2d4aa74c-34f4-454a-9196-a6db4a3f528a',
  '1b261666-d0c5-46e9-94c1-efca58a654d1',
  '4d35648a-da81-4a25-bb73-631ee0daf1ee',
  'a9e2d9d1-84c8-41ea-9090-f36a8cadacaa',
  '82ab178c-adf7-421f-8656-a9fa81cd391d',
  'b685c7b4-cbd9-452d-82f7-6e3e927f685b',
  '90065b5a-cacf-46da-a4ad-ffa7d36ecdfb',
  '0b2f092c-6ec0-4f9c-b0da-eafda0140372',
  '8ee29c1f-4e86-4362-9cbc-c0d85f1e2689',
  '9ec03c65-69a2-4138-a346-c95b6c655276',
  'e798b10f-05ce-464c-8742-8a18b72d49f2',
  'ac3b60dd-c143-49bd-9dda-0183beaf5ef4',
  'f2a7c96a-4109-46f1-945d-dc63ba238af6',
  '00da5fc2-ad9e-4ce5-869e-3241e37b5083',
  'a804d0da-9394-4ff2-b03e-10904b016b62',
  '415ccb9b-893f-4498-a5aa-ad20e3d9a967',
  'dc5beee8-a1e7-4d82-862b-df7ca71f9d8f'
]

let generator = uuid()
const v4 = () => {
  return generator.next().value
}

const resetUUIDs = () => {
  generator = uuid()
}

function* uuid() {
  let index = 0
  while (true) {
    yield uuids[index % uuids.length]
    index++
  }
}

module.exports = {
  v4,
  resetUUIDs
}