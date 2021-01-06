const app = getApp();
const db = wx.cloud.database({
  env: 'xianyuinfo-byqz9'
})
const recorderManager = wx.getRecorderManager();
const recorderAudioManager = wx.createInnerAudioContext();
const playAudioManager = wx.createInnerAudioContext();
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
    recordPopupShow: false, //是否显示录音弹窗
    tempFilePath: "", //当前录音生成的临时路径
    hasGetSetting: false, //是否获取过授权
    recordTime: "", //已经录音的时间
    recordTimer: 0, //录音计时器
    recordStay: 'A', //录音时临时持方
    curAgument: {}, //当前播放中的论点
    talkList: [], //所有辩题配置
    senceID: 0, //当前展示的场次ID    
    talkListIndex: 0, //当前展示的场次索引
    voiceA: [], //正方声音
    voiceB: [], //反方声音
    play: "", //正在播放的正方还是反方
    isPlaying: false, //是否正在播放中
    playing: 1, //语音播放动画的索引
    soundAniTimer: 0, //语音播放动画的计时器
    playAIndex: 0,
    playBIndex: 0
  },

  onLoad: function () {
    this.onGetConfig();
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
    switch (e.currentTarget.dataset['index']) {
      case "record":
        this.showRecordPopup();
        break;
      case "good":
        console.log(this.data.curAgument);
        break;
      case "bad":
        console.log(this.data.curAgument);
        break;
    }
  },

  // 获取配置
  onGetConfig() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log("登陆成功：", res.result);
        app.globalData.openid = res.result.openid;
        this.setData({
          talkList: res.result.talkList,
          senceID: res.result.talkList[this.data.talkListIndex].id,
        })
        this.onGetUserDB();
      },
      fail: err => {
        console.log(err);
      }
    })
  },

  // 获取用户数据
  onGetUserDB() {
    var that = this;
    if (!app.globalData.userObj) {
      db.collection('user-db').where({
        "_openid": app.globalData.openid
      }).get({
        success: function (res) {
          if (res.data.length > 0) {
            app.globalData.userObj = res.data[0];
            if (app.globalData.userObj.lastSenceID != that.data.talkList[0].id) {
              app.globalData.userObj.voiceAPlayIndex = 0;
              app.globalData.userObj.voiceBPlayIndex = 0;
              app.globalData.userObj.lastSenceID = that.data.talkList[0].id;
              wx.cloud.callFunction({
                name: 'updateUserInfo',
                data: {
                  voiceAPlayIndex: app.globalData.userObj.voiceAPlayIndex,
                  voiceBPlayIndex: app.globalData.userObj.voiceBPlayIndex,
                  lastSenceID: app.globalData.userObj.lastSenceID
                }
              })
            }
            console.log("获取用户数据成功：", app.globalData.userObj);
            that.onGetTalkDB();
          } else {
            that.onCreateUserDB();
          }
        },
        fail: function (err) {
          console.log(err);
        }
      })
    }
  },

  // 创建用户数据
  onCreateUserDB: function () {
    var that = this;
    var data = {
      value: 0,
      lastSenceID: this.data.talkList[0].id,
      voiceAPlayIndex: 0,
      voiceBPlayIndex: 0,
      join: [{
        id: Number(this.data.talkList[0].id),
        stay: "",
      }],
    }
    db.collection('user-db').add({
      data: data,
      success: function (res) {
        app.globalData.userObj = data;
        console.log("创建用户数据成功：", app.globalData.userObj);
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
            talkList: that.data.talkList,
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
    var that = this;
    var a = this.data.voiceA;
    var b = this.data.voiceB;
    // .skip(app.globalData.userObj.voiceAPlayIndex)
    db.collection('voiceA' + this.data.senceID + '-db').limit(10).get({
      success: function (res) {
        var c = a.concat(res.data);
        that.setData({
          voiceA: c
        });
        console.log("获取正方声音数据成功：", that.data.voiceA, app.globalData.userObj.voiceAPlayIndex);
        // .skip(app.globalData.userObj.voiceBPlayIndex)
        db.collection('voiceB' + that.data.senceID + '-db').limit(10).get({
          success: function (res) {
            var c = b.concat(res.data);
            that.setData({
              voiceB: c
            })
            console.log("获取反方声音数据成功：", that.data.voiceB, app.globalData.userObj.voiceBPlayIndex);
          }
        })
      }
    })
  },

  // 切换辩论场
  onSwiperChange(e) {
    playAudioManager.stop();
    playAudioManager.offCanplay();
    clearInterval(this.data.soundAniTimer);
    app.globalData.userObj.voiceAPlayIndex += this.data.playAIndex;
    app.globalData.userObj.voiceBPlayIndex += this.data.playBIndex;
    this.setData({
      talkListIndex: e.detail.current,
      senceID: this.data.talkList[e.detail.current].id,
      isPlaying: false,
      play: "",
      playing: 1,
      voiceA: [],
      voiceB: [],
      playAIndex: 0,
      playBIndex: 0
    })
    console.log("切换辩题", e.detail.current);
    this.onGetTalkDB();
  },

  // 切换当前场次持方
  onStayChange() {

  },

  // 切换录音发言持方
  onRecordStayChange(e) {
    this.setData({
      recordStay: e.detail,
    });
  },

  // 开始播放
  onPlay() {
    var that = this;
    // 播放完成
    playAudioManager.onEnded(() => {
      console.log("播放完成");
      that.setData({
        isPlaying: false
      })
      wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          voiceAPlayIndex: that.data.play == "B" ? app.globalData.userObj.voiceAPlayIndex++ : app.globalData.userObj.voiceAPlayIndex,
          voiceBPlayIndex: that.data.play == "A" ? app.globalData.userObj.voiceBPlayIndex++ : app.globalData.userObj.voiceBPlayIndex,
          lastSenceID: app.globalData.userObj.lastSenceID
        }
      })
      clearInterval(that.data.soundAniTimer);
      that.setData({
        playing: 1
      })
      that.onPlayComplete();
    });
    // 开始播放
    playAudioManager.onCanplay(() => {
      console.log("开始播放");
      that.setData({
        isPlaying: true
      })
      playAudioManager.play();
      var count = 1;
      that.data.soundAniTimer = setInterval(function () {
        if (count > 3) {
          count = 1
        }
        that.setData({
          playing: count++
        })
      }, 500)
    })
    this.onPlayComplete();
  },

  onPlayComplete() {
    console.log("准备播放：");
    if (this.data.play == "A" || this.data.play == "") {
      this.setData({
        play: "A",
        curAgument: this.data.voiceA[this.data.playAIndex]
      })
      playAudioManager.src = this.data.voiceA[this.data.playAIndex].url;
      playAudioManager.loop = false;
      playAudioManager.obeyMuteSwitch = false;
      if (this.data.playAIndex < this.data.voiceA.length - 1) {
        this.data.playAIndex++;
      } else {
        this.data.playAIndex = 0;
      }
      this.data.play = "B";
    } else {
      this.setData({
        play: "B",
        curAgument: this.data.voiceB[this.data.playBIndex]
      })
      playAudioManager.src = this.data.voiceB[this.data.playBIndex].url;
      playAudioManager.loop = false;
      playAudioManager.obeyMuteSwitch = false;
      if (this.data.playBIndex < this.data.voiceB.length - 1) {
        this.data.playBIndex++;
      } else {
        this.data.playBIndex = 0;
      }
      this.data.play = "A";
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
    recorderAudioManager.stop();
  },

  startRecord() {
    recorderManager.onStart(() => {
      console.log('recorder start');
      this.data.recordTimer = setInterval(function () {
        this.data.recordTime++;
        this.setData({
          recordTime: this.data.recordTime
        })
      }.bind(this), 1000)
    })
    recorderManager.onStop((res) => {
      console.log('recorder stop', res);
      clearInterval(this.data.recordTimer);
      this.data.tempFilePath = res.tempFilePath
      recorderAudioManager.src = res.tempFilePath;
      recorderAudioManager.loop = true;
      recorderAudioManager.obeyMuteSwitch = false;
      recorderAudioManager.play();
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
    db.collection('voice' + this.data.recordStay + this.data.senceID + '-db').where({
      "_openid": String(app.globalData.openid)
    }).get({
      success: function (res) {
        console.log("上传前去重检查：", res);
        if (res.data.length > 0) {
          var id = res.data[0]._id;
          wx.showModal({
            title: '提示',
            content: '已经有上传一个论点，新的发布将会覆盖旧的论点，人气值也将被清空，确定继续覆盖么？',
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
    var fileName = 'voice/' + this.data.recordStay + "_" + this.data.senceID + "_" + app.globalData.openid + ".m4a";
    wx.cloud.uploadFile({
      cloudPath: fileName, // 上传至云端的路径
      filePath: this.data.tempFilePath, // 小程序临时文件路径
      success: res => {
        console.log("声音上传成功", res.fileID);
        if (oldID != "") {
          wx.showToast({
            title: '更新成功',
            icon: 'success',
            duration: 2000
          })
          hideRecordPopup();
        } else {
          var data = {
            url: res.fileID,
            RecordValue: 0,
          }
          db.collection('voice' + that.data.recordStay + that.data.senceID + '-db').add({
            data: data,
            success: function (res) {
              wx.showToast({
                title: '上传成功',
                icon: 'success',
                duration: 2000
              })
              hideRecordPopup();
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