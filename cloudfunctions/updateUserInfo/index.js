const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return db.collection('user-db')
    .where({
      "_openid": wxContext.OPENID
    })
    .update({
      data: {
        voiceAPlayIndex: event.voiceAPlayIndex,
        voiceBPlayIndex: event.voiceBPlayIndex,
        lastSenceID: event.lastSenceID
      }
    })
}