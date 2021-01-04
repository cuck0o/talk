const app = getApp();
const db = wx.cloud.database({
  env: 'xianyuinfo-byqz9'
})
const recorderManager = wx.getRecorderManager();
const options = {
  duration: 180000,
  sampleRate: 44100,
  numberOfChannels: 1,
  encodeBitRate: 192000,
  format: 'aac',
  frameSize: 50
}

Page({
  data: {
    talkListIndex: 0, //当前界面索引
    talkList: [], //所有辩题配置
    recordPopupShow: false, //是否显示录音弹窗
    curRecord: "", //当前录音信息
    tempFilePath: "", //当前录音临时路径
    hasGetSetting: false, //是否获取过授权
    recordTime: "", //已经录音的时间
    recordStay: 'A', //录音时临时持方
    stay: 'A', //我的持方
  },

  // 获取配置
  onLoad: function () {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log("登陆成功：", res.result);
        app.globalData.openid = res.result.openid;
        this.setData({
          talkList: res.result.talkList
        })
        this.onGetUserDB();
      },
      fail: err => {
        console.log(err);
      }
    })
  },

  // 获取用户数据
  onGetUserDB: function () {
    var that = this;
    db.collection('user-db').where({
      "_openid": app.globalData.openid
    }).get({
      success: function (res) {
        if (res.data.length > 0) {
          console.log("获取用户数据成功：", res.data[0]);
          that.onGetTalkDB();
        } else {
          that.onCreateUserDB();
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  // 创建用户数据
  onCreateUserDB: function () {
    console.log("创建用户：");
    var that = this;
    var data = {
      value: 0,
      status: 0,
      voice: [],
      lastSence: {
        id: Number(this.data.talkList[0].id),
        stay: ""
      }
    }
    db.collection('user-db').add({
      data: data,
      success: function (res) {
        console.log("创建用户数据成功:", res);
        app.globalData.userObj = data;
        that.onGetTalkDB();
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  // 获取辩题数据
  onGetTalkDB() {
    var that = this;
    db.collection('talk-db').where({
      _id: this.data.talkList[that.data.talkListIndex].id
    }).get({
      success: function (res) {
        if (res.data.length > 0) {
          console.log("获取辩题数据成功：", res.data);
          that.data.talkList[that.data.talkListIndex].zhengfang = res.data[0].zhengfang;
          that.data.talkList[that.data.talkListIndex].fanfang = res.data[0].fanfang;
          that.setData({
            talkList: that.data.talkList
          })
          that.onGetVoiceDB();
        } else {
          that.onCreateTalkDB();
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  // 创建辩题数据
  onCreateTalkDB() {
    var that = this;
    var data = {
      _id: that.data.talkList[that.data.talkListIndex].id,
      zhengfang: 0,
      fanfang: 0,
    }
    db.collection('talk-db').add({
      data: data,
      success: function (res) {
        console.log("开放辩题成功:", res);
        that.data.talkList[that.data.talkListIndex].zhengfang = data.zhengfang;
        that.data.talkList[that.data.talkListIndex].fanfang = data.fanfang;
        that.setData({
          talkList: that.data.talkList
        })
        that.onGetVoiceDB();
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  // 获取声音数据
  onGetVoiceDB() {

  },

  // 切换辩论场
  onSwiperChange(e) {
    console.log("切换辩题", e.detail.current);
    this.setData({
      talkListIndex: e.detail.current
    })
    this.onGetTalkDB();
  },

  // 切换发言持方
  onRecordStayChange(e) {
    this.setData({
      recordStay: e.detail,
    });
  },

  // 开始播放
  onPlay(e) {
    // var that = this;
    // var id = e.currentTarget.dataset["id"];
    // var j = 0;
    // var count = 0;
    // that.data.timer = setInterval(function () {
    //   let time = +dataset.time * 2
    //   if (time > count) {
    //     j = j % 3;
    //     j++;
    //     count++;
    //     that.setData({
    //       curplay: id
    //     })
    //   } else {
    //     clearInterval(that.data.timer); //停止帧动画循环  
    //     that.setData({
    //       playId: -1,
    //       playing: 0
    //     })
    //   }
    // }, 500)
  },

  // 用户登录信息及其授权
  getUserInfo(e) {
    if (!this.data.hasGetSetting) {
      this.data.hasGetSetting = true;
      wx.getSetting({
        onGetUserInfo: function (e) {
          if (e.detail.userInfo) {
            console.log(e);
          }
        },
        success: res => {
          console.log("获取授权：", res);
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: res => {
                console.log("获得授权：", res);
              }
            })
          }
        }
      })
    }
    console.log(e.currentTarget.dataset['index']);
    switch (e.currentTarget.dataset['index']) {
      case "record":
        this.showRecordPopup();
        break;
      case "good":
        console.log(this.data.curRecord);
        break;
      case "bad":
        console.log(this.data.curRecord);
        break;
    }
  },

  showRecordPopup: function () {
    console.log("我来录音咯~");
    this.setData({
      recordPopupShow: true
    });
  },

  hideRecordPopup() {
    this.setData({
      recordPopupShow: false,
      tempFilePath: "",
    });
  },

  startRecord() {
    recorderManager.onStart(() => {
      console.log('recorder start');
    })
    recorderManager.onPause(() => {
      console.log('recorder pause');
    })
    recorderManager.onStop((res) => {
      console.log('recorder stop', res);
      this.data.tempFilePath = res.tempFilePath
      let myaudio = wx.createInnerAudioContext();
      myaudio.src = res.tempFilePath;
      myaudio.loop = true;
      myaudio.play();
    })
    recorderManager.start(options);
  },

  stopRecord() {
    recorderManager.stop();
  },

  checkRecord() {
    if (this.data.tempFilePath == "") {
      return;
    }
    var that = this;
    // 检查数据库
    db.collection('voice-db').where({
      "_openid": String(app.globalData.openid),
      "senceID": Number(this.data.talkList[this.data.talkListIndex].id),
      "RecordStay": String(this.data.recordStay)
    }).get({
      success: function (res) {
        console.log("上传前去重检查：", res);
        if (res.data.length > 0) {
          var id = res.data[0]._id;
          wx.showModal({
            title: '提示',
            content: '已经有上传一个论点，新的发布将会覆盖旧的论点，人气值也将被清空',
            success(res) {
              if (res.confirm) {
                that.uploadRecord(id);
              }
            }
          })
        } else {
          that.uploadRecord("");
        }
      },
      fail: function (err) {
        that.uploadRecord("");
      }
    });
  },

  uploadRecord(oldID = "") {
    var that = this;
    var fileName = 'voice/' + this.data.recordStay + "_" + this.data.talkList[this.data.talkListIndex].id + "_" + app.globalData.openid + ".m4a";
    wx.cloud.uploadFile({
      cloudPath: fileName, // 上传至云端的路径
      filePath: this.data.tempFilePath, // 小程序临时文件路径
      success: res => {
        console.log("声音上传成功", res.fileID);
        if (oldID != "") {
          // 同意覆盖旧的
          wx.showToast({
            title: '更新成功',
            icon: 'success',
            duration: 2000
          })
        } else {
          // 新的录音记录
          var data = {
            url: res.fileID,
            senceID: this.data.talkList[this.data.talkListIndex].id,
            RecordValue: 0,
            RecordStay: this.data.recordStay
          }
          db.collection('voice-db').add({
            data: data,
            success: function (res) {
              wx.showToast({
                title: '上传成功',
                icon: 'success',
                duration: 2000
              })
            },
            fail: function (err) {
              wx.showToast({
                title: '上传失败',
                icon: 'success',
                duration: 2000
              })
            }
          })
        }
        that.data.tempFilePath = "";
      }
    })
  },


})