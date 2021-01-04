const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {

  const wxContext = cloud.getWXContext()

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    env: wxContext.ENV,
    talkList: [{
      id: 2,
      title: "test2 第二期",
      titleUrl: "https://7869-xianyuinfo-byqz9-1301827009.tcb.qcloud.la/title/title2.png?sign=299dbe26e0b33b19ed617a3c7cc5b332&t=1609727371"
    }, {
      id: 1,
      title: "test1 第一期",
      titleUrl: "https://7869-xianyuinfo-byqz9-1301827009.tcb.qcloud.la/title/title1.png?sign=e7fa0ad716a9bf9f988c41c900118193&t=1609727357"
    }, ]
  }
}