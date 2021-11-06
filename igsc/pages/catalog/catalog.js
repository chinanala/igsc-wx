var config = require('../../config')
var util = require('../../utils/util.js')
var WxSearch = require('../search/search.js')
const background_audio_manager = wx.getBackgroundAudioManager()
Page({
  data: {
    gscitems: [],
    page: 'main',
    historyplay: null,
    showhead: true,
    current_paly_id: 0
  },
  getcurrent_paly_id: function () {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    // 如果正在播放
    if (background_audio_manager && !background_audio_manager.paused) {
      if (background_audio_manager.src) {
        that.setData({
          current_paly_id: background_audio_manager._audio_id,
        })
        return true
      }
    }
    that.setData({
      current_paly_id: 0
    })
    return false
  },
  go2detail: function (e) {
    var id_ = e.target.dataset.id_
    var pages = getCurrentPages()
    var url = '/pages/gsc/gsc?id=' + id_ + '&from=' + this.data.page
    if (pages.length == config.maxLayer) {
      wx.redirectTo({
        url: url,
      })
    } else {
      wx.navigateTo({
        url: url
      })
    }
  },
  getData: function (that) {
    wx.getStorage({
      key: 'gscItems' + util.formatTime(new Date()),
      success: function (res) {
        var items = res.data
        if (!items || items.length == 0) {
          that.getAllData(that)
        } else {
          that.setData({
            gscitems: items,
          })
          that.storage_result(items)
        }
      },
      fail: function () {
        that.getAllData(that)
      }
    })
  },
  getAllData: function (context) {
    var that = this
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: config.gscUrl + 'index/all/abc',
      success(result) {
        if (!result || result.data.code != 0) {
          wx.showToast({
            title: '网络异常~~',
            icon: 'none'
          })
          return
        }
        var datas = result.data.data.data
        var dd = []
        for (var data of datas) {
          var splits = data.content.split('。')
          var fuhao = '。'
          if (splits.length > 0) {
            if (splits[0].indexOf('？') >= 0) {
              fuhao = '？'
            }
            data.short_content = splits[0].split('？')[0]
          } else {
            data.short_content = data.content
          }
          data.short_content += fuhao
          dd.push(data)
        }
        context.setData({
          gscitems: dd,
        })
        that.storage_result(dd)
        wx.setStorage({
          key: 'gscItems' + util.formatTime(new Date()),
          data: dd
        })
        wx.hideLoading()
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({
          title: '加载失败:(',
          icon: 'none'
        })
      }
    })
  },
  storage_result: function(items){
    var search_result_ids = []
    var audio_ids = []
    for (var d of items) {
      search_result_ids.push(d.id)
      if(d.audio_id > 0){
        audio_ids.push(d.audio_id)
      }
    }
    wx.setStorageSync('search_result_ids', search_result_ids)
    if(audio_ids.length > 0){
      wx.setStorageSync('audio_ids', audio_ids)
    }
  },
  onLoad: function (options) {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    if (options.hasOwnProperty('q')) {
      if (options.q == '音频') {
        that.setData({
          showhead: false,
        })
      } else {
        that.setData({
          showhead: true,
        })
      }
      that.my_search_function(options.q)
      WxSearch.search(options.q)
    } else {
      wx.getStorage({
        key: 'gscItems' + util.formatTime(new Date()),
        success: function (res) {
          if (!res) {
            wx.showToast({
              title: '加载失败:(',
              icon: 'none'
            })
            return
          }
          var items = res.data
          if (!items || items.length == 0) {
            that.getAllData(that)
          } else {
            wx.showLoading({
              title: '加载中...',
            })
            that.setData({
              gscitems: items,
            })
            that.storage_result(items)
            wx.hideLoading()
          }
        },
        fail: function (err) {
          that.getAllData(that)
        }
      })
    }
    clearInterval(wx.getStorageSync('currentInterval'))
    var currentInterval = setInterval(() => {
      that.getcurrent_paly_id()
    }, 500)
    wx.setStorageSync('currentInterval', currentInterval)
  },
  wxSearchInput: WxSearch.wxSearchInput,
  wxSearchKeyTap: WxSearch.wxSearchKeyTap,
  wxSearchDeleteAll: WxSearch.wxSearchDeleteAll,
  wxSearchConfirm: WxSearch.wxSearchConfirm,
  wxSearchClear: WxSearch.wxSearchClear,
  my_search_function: function (value) {
    wx.showLoading({
      title: '加载中...'
    })
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (that != current_page) {
      that = current_page
    }
    that.search_V = value
    var page = that.data.page
    var key = 'search_' + value + util.formatTime(new Date()) + '_' + page
    wx.getStorage({
      key: key,
      success: function (res) {
        if (res) {
          var data = res.data
        } else {
          wx.showToast({
            title: '网络异常~~',
            icon: 'none'
          })
          return
        }
        that.setData({
          gscitems: data,
        })
        that.storage_result(data)
        if (data.length == 0) {
          util.showSuccess('没有相关内容')
        } else {
          wx.hideLoading()
        }
      },
      fail: function () {
        var open_id = 'abcd'
        if (page == 'like') {
          try {
            open_id = wx.getStorageSync('user_open_id')
          } catch (e) {}
          if (!open_id) {
            util.userLogin()
            wx.showToast({
              title: '请重试一次',
              icon: 'none'
            })
          }
        }
        wx.request({
          url: config.gscUrl + 'query/' + value + '/' + page + '/' + open_id,
          success(result) {
            if (!result || result.data.code != 0) {
              wx.showToast({
                title: '网络异常~~',
                icon: 'none'
              })
              return
            }
            var datas = result.data.data.data
            var dd = []
            for (var data of datas) {
              var splits = data.content.split('。')
              var fuhao = '。'
              if (splits.length > 0) {
                if (splits[0].indexOf('？') >= 0) {
                  fuhao = '？'
                }
                data.short_content = splits[0].split('？')[0]
              } else {
                data.short_content = data.content
              }
              data.short_content += fuhao
              dd.push(data)
            }
            that.setData({
              gscitems: dd,
            })
            wx.setStorage({
              key: key,
              data: dd,
            })
            that.storage_result(dd)
            if (dd.length == 0) {
              util.showSuccess('没有相关内容')
            } else {
              wx.hideLoading()
            }
          },
          fail: (e) => {
            wx.showToast({
              title: '网络异常~~',
              icon: 'none'
            })
          }
        })
      }
    })
    setTimeout(() => {
      if (page == 'like') {
        wx.setNavigationBarTitle({
          title: '我的收藏'
        })
      } else {
        wx.setNavigationBarTitle({
          title: 'i古诗词'
        })
      }
    }, 200)
  },
  my_goback_function: function () {
    wx.reLaunch({
      url: '../gsc/gsc?id=1&from=main'
    })
  },
  onReady: function () {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    that.getcurrent_paly_id()
  },
  onShow: function () {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (that != current_page) {
      that = current_page
    }
    WxSearch.init(
      that, ['杜甫', '白居易', '苏轼', '姜夔', '浣溪沙', '满庭芳', '青玉案', '蝶恋花', '与陈伯之书', '滕王阁序', '谏逐客书', '洛神赋'], // 热点搜索推荐
      ['宋祁', '朱淑真', '吴文英', '晏几道', '秦观', '贺铸', '王安石', '李之仪', '周邦彦', '姜夔', '晏殊', '张先', '范仲淹', '晁补之', '赵佶', '宋徽宗', '张元干', '岳飞', '史达祖', '刘克庄', '蒋捷', '钱惟演', '张炎', '张孝祥', '张镃', '张抡', '青玉案', '元宵', '中秋', '蝶恋花', '满庭芳', '卜算子', '菩萨蛮', '忆江南', '浣溪沙', '诉衷情', '清平乐', '雨霖铃', '定风波', '八声甘州', '青门引', '念奴娇', '水调歌头', '洞仙歌', '渔家傲', '横塘路', '瑞龙吟', '六丑', '欧阳修', '声声慢', '永遇乐', '贺新郎', '水龙吟', '程垓', '齐天乐', '苏轼', '辛弃疾', '白居易', '李白', '杜甫', '李清照'],
      that.my_search_function,
      that.my_goback_function
    )
    var temData = that.data.wxSearchData
    if (that.search_V && temData) {
      if (temData.value != that.search_V) {
        temData.value = that.search_V
        that.setData({
          wxSearchData: temData,
        })
      }
    }
    wx.getStorage({
      key: 'historyplay',
      success: function (res) {
        if (res) {
          var historylist = []
          var historyplay = res.data
          for (var x in historyplay) {
            historylist.push(historyplay[x])
          }
          historylist.sort((a, b) => {
            return parseInt(b.times) - parseInt(a.times)
          })
          historylist = historylist.slice(0, 10)
          for (var x in historylist) {
            if (historylist[x].times > 99) {
              historylist[x].times = '99+'
            }
          }
          that.setData({
            historyplay: historylist,
          })
        } else {
          that.setData({
            historyplay: null,
          })
        }
      },
      fail: function () {
        that.setData({
          historyplay: null,
        })
      }
    })
    that.getcurrent_paly_id()
  },
  onHide: function () {
    var playingint = wx.getStorageSync('playingint')
    if (playingint) {
      clearInterval(playingint)
    }
    var currentInterval = wx.getStorageSync('currentInterval')
    if (currentInterval) {
      clearInterval(currentInterval)
    }
  },
  onUnload: function () {
    var playingint = wx.getStorageSync('playingint')
    if (playingint) {
      clearInterval(playingint)
    }
    var currentInterval = wx.getStorageSync('currentInterval')
    if (currentInterval) {
      clearInterval(currentInterval)
    }
  },
  getLikeList:function(open_id){
    var that = this
    wx.request({
      url: config.gscUrl + 'mylike/' + open_id,
      success(result) {
        if (!result || result.data.code != 0) {
          wx.showToast({
            title: '网络异常~~',
            icon: 'none'
          })
          wx.hideNavigationBarLoading()
          wx.stopPullDownRefresh()
          return
        }
        var datas = result.data.data.data
        var dd = []
        for (var data of datas) {
          var splits = data.content.split('。')
          var fuhao = '。'
          if (splits.length > 0) {
            if (splits[0].indexOf('？') >= 0) {
              fuhao = '？'
            }
            data.short_content = splits[0].split('？')[0]
          } else {
            data.short_content = data.content
          }
          data.short_content += fuhao
          dd.push(data)
        }
        that.setData({
          gscitems: dd,
        })
        that.storage_result(dd)
        wx.hideLoading()
      }
    })
  },
  onPullDownRefresh: function () {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    that.setData({
      showhead: true,
    })
    if (that.data.page == 'main') {
      var open_id = ''
      try {
        open_id = wx.getStorageSync('user_open_id')
      } catch (e) {}
      if (!open_id) {
        util.userLogin()
        wx.showToast({
          title: '请重试一次',
          icon: 'none'
        })
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
        return
      }
      that.getLikeList(open_id)
      wx.setNavigationBarTitle({
        title: '我的收藏'
      })
      wx.showLoading({
        title: '加载中...',
      })
    } else {
      wx.setNavigationBarTitle({
        title: 'i古诗词'
      })
      that.getData(that)
    }
    if (that.data.page == 'main') {
      that.setData({
        page: 'like',
      })
    } else {
      that.setData({
        page: 'main',
      })
    }
    wx.hideNavigationBarLoading()
    wx.stopPullDownRefresh()
    WxSearch.wxSearchClear()
  },
  onReachBottom: function () {
    return
  },
  onShareTimeline: function () {
    return {
      title: '欢迎体验i古诗词',
      query: 'from=timeline',
      imageUrl: '/static/share.jpg',
      success: function (res) {
        util.showSuccess('分享成功')
      },
      fail: function (res) {
        util.showSuccess('取消分享')
      }
    }
  },
  onShareAppMessage: function (res) {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    var q = that.data.wxSearchData.value
    return {
      title: 'i古诗词 ' + (q ? q : '我们都爱古诗词'),
      path: '/pages/catalog/catalog' + (q ? ('?q=' + q) : ''),
      imageUrl: '/static/share4.jpg',
      success: function (res) {
        util.showSuccess('分享成功')
      },
      fail: function (res) {
        util.showSuccess('取消分享')
      }
    }
  }
})