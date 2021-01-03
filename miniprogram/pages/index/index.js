//index.js
const app = getApp()

Page({
  data: {
    talkList: [0, 1],
    animation: {},
    recordShow: false,
    src: ""
  },

  onLoad: function () {
    // 动画
    this.animation = wx.createAnimation();
    this.animation.delay
    this.animation.translate(0, 30).step({
      duration: 500
    })
    this.setData({
      animation: this.animation.export()
    })
  },

  showRecord: function () {
    console.log("start record");
    this.setData({
      recordShow: true
    });
  },

  hideRecord() {
    this.setData({
      recordShow: false
    });
  },

  startRecord() {
    wx.startRecord({
      success: (e) => {
        let myaudio = wx.createInnerAudioContext();
        myaudio.src = e.tempFilePath;
        myaudio.loop = true;
        myaudio.play();
        myaudio.onError((res) => {
          wx.playVoice({
            filePath: e.tempFilePath,
          })
        })
      },
    })
  },

  stopRecord() {
    wx.stopRecord();
  },

  pageChange(e) {
    console.log(e);
  }
})