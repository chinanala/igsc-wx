var __tip_keys = []

var __search_function = null

var __go_back_function = null

var __that = null

function init(that, hot_keys, tip_keys, search_function, go_back_function) {
  __that = that
  __tip_keys = tip_keys
  __search_function = search_function
  __go_back_function = go_back_function

  var tem_data = {}
  if (that.search_v) {
    tem_data.value = that.search_v
  }
  var bar_height = 30
  var view = {
    bar_height: bar_height
  }
  tem_data.hot_keys = hot_keys

  wx.getSystemInfo({
    success: function (res) {
      var w_height = res.windowHeight
      view.search_height = w_height - bar_height
      tem_data.view = view
      __that.setData({
        wx_search_data: tem_data,
      })
    }
  })

  get_his_keys(__that)
}


function wx_search_input(e) {
  var input_value = e.detail.value

  var tem_data = __that.data.wx_search_data

  var tip_keys = []
  if (input_value && input_value.length > 0) {
    for (var i = 0; i < __tip_keys.length; i++) {
      var mind_key = __tip_keys[i]

      if (mind_key.indexOf(input_value) != -1) {
        tip_keys.push(mind_key)
      }
    }
  }
  tem_data.value = input_value
  tem_data.tip_keys = tip_keys

  __that.setData({
    wx_search_data: tem_data,
  })
}


function wx_search_clear() {
  var tem_data = __that.data.wx_search_data
  tem_data.value = ''
  tem_data.tip_keys = []
  if (__that.search_v) {
    __that.search_v = ''
  }

  __that.setData({
    wx_search_data: tem_data,
    show_bottom_button: false,
    page_num: 1,
    search_pattern: 'all',
  })
  if (__that.data.page != 'like') {
    __that.getData(__that)
  } else {
    var open_id = wx.getStorageSync('user_open_id')
    if (open_id) {
      __that.get_like_list(open_id)
    }
  }
}


function wx_search_key_tap(e) {
  search(e.target.dataset.key)
  var tem_data = __that.data.wx_search_data
  tem_data.tip_keys = []

  __that.setData({
    wx_search_data: tem_data,
  })
}

function wx_search_confirm(e) {
  var key = e.target.dataset.key
  __that.data.wx_search_data.tip_keys = []
  if (key == 'back') {
    __go_back_function()
  } else {
    search(__that.data.wx_search_data.value)
  }
}

function search(input_value) {
  if (input_value) {
    if (input_value != '音频') {
      wx_search_add_his_key(input_value)
    }
    var tem_data = __that.data.wx_search_data
    tem_data.value = input_value
    __that.setData({
      wx_search_data: tem_data,
      show_bottom_button: false,
      page_num: 1,
    })

    __search_function(input_value)
    wx.setNavigationBarTitle({
      title: 'i古诗词',
      page: 'main'
    })
  } else {
    if (__that.data.page != 'like') {
      __that.getData(__that)
    }
  }
}

function get_his_keys() {
  var value = []
  try {
    value = wx.getStorageSync('wx_search_his_keys')
    if (value) {
      var tem_data = __that.data.wx_search_data
      tem_data.his = value.slice(0, 12)
      __that.setData({
        wx_search_data: tem_data,
      })
    }
  } catch (e) {

  }
}


function wx_search_add_his_key(input_value) {
  if (!input_value || input_value.length == 0 || input_value == 'undefined') {
    return
  }
  var value = wx.getStorageSync('wx_search_his_keys')
  if (value) {
    if (value.indexOf(input_value) < 0) {
      value.unshift(input_value)
    }
    wx.setStorage({
      key: 'wx_search_his_keys',
      data: value,
      success: function () {
        get_his_keys(__that)
      }
    })
  } else {
    value = []
    value.push(input_value)
    wx.setStorage({
      key: 'wx_search_his_keys',
      data: value,
      success: function () {
        get_his_keys(__that)
      }
    })
  }
}

function wx_search_delete_all() {
  wx.removeStorage({
    key: 'wx_search_his_keys',
    success: function (res) {
      var value = []
      var tem_data = __that.data.wx_search_data
      tem_data.his = value
      __that.setData({
        wx_search_data: tem_data,
      })
      __that.set_scroll_height()
    }
  })
}

module.exports = {
  init: init,
  wx_search_input: wx_search_input,
  wx_search_key_tap: wx_search_key_tap,
  wx_search_delete_all: wx_search_delete_all,
  wx_search_confirm: wx_search_confirm,
  wx_search_clear: wx_search_clear,
  search: search,
}