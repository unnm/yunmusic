// pages/video/video.js
import request from '../../utils/request'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [], // 导航标签数据
    navId: '', // 导航的标识
    videoList: [], // 视频列表数据
    videoId: '', // 视频id标识
    videoUpdateTime: [], // 记录video播放的时长
    isTriggered: false // 标识下拉刷新是否被触发
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取导航数据
    this.getVideoGroupListData()
  },

  // 获取导航数据
  async getVideoGroupListData() {
    let videoGroupListData = await request('/video/group/list')
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0, 14),
      navId: videoGroupListData.data[0].id
    })
    // 获取视频列表数据
    this.getVideoList(this.data.navId)
  },

  // 获取视频列表数据
  async getVideoList(navId) {
    let videoListData = await request('/video/group', { id: navId })
    // 关闭消息提示框
    wx.hideLoading()
    let index = 0
    let videoList = videoListData.datas.map((item) => {
      item.id = index++
      return item
    })
    this.setData({
      videoList,
      isTriggered: false // 关闭下拉刷新
    })
  },

  // 点击切换导航的回调
  changeNav(event) {
    let navId = event.currentTarget.id // 通过id向event事件对象传参时，如果传递的是number，会自动转换成string
    // let navId = event.currentTarget.dataset.id // 通过data-向event事件对象传参时，如果传递的是number，不会自动转换成string
    this.setData({
      navId: navId >>> 0, // 利用位操作符将字符串转化为数值
      videoList: []
    })
    // 显示正在加载
    wx.showLoading({
      title: '正在加载'
    })
    // 动态获取当前导航对应的视频数据
    this.getVideoList(this.data.navId)
  },

  // 点击播放/继续播放的回调
  handlePlay(event) {
    /*
      需求：
        1.在点击播放的事件中需要找到上一个播放的按钮
        2.在播放新的视频之前关闭上一个正在播放的视频
      关键：
        1.如何找到上一个视频的实例对象
        2.如何确认点击播放的视频和正在播放的视频不是同一个视频
      单例模式：
        1.需要创建多个变量的场景下，通过一个变量接收，始终保持只有一个对象
        2.好处是节省内存空间
    */
    let vid = event.currentTarget.id
    // 关闭上一个播放的视频
    // this.vid !== vid && this.videoContext?.stop()
    // this.vid = vid
    // 更新data中videoId的状态数据
    this.setData({
      videoId: vid
    })
    // 创建控制video标签的实例对象
    this.videoContext = wx.createVideoContext(vid)
    // 判断当前的视频之前是否有播放记录，如果有，则跳转至指定的播放位置
    let { videoUpdateTime } = this.data
    let videoItem = videoUpdateTime.find((item) => item.vid === vid)
    if (videoItem) {
      this.videoContext.seek(videoItem.currentTime)
    }
    this.videoContext.play()
  },

  // 监听视频播放进度的回调
  handleTimeUpdate(event) {
    let videoTimeObj = {
      vid: event.currentTarget.id,
      currentTime: event.detail.currentTime
    }
    let { videoUpdateTime } = this.data
    /* 
    思路：判断记录播放时长的videoUpdateTime数组中是否有当前视频的播放记录
      1.如果有，就在原有的播放记录中修改播放时间为当前的播放时间
      2.如果没有，就在数组中添加当前视频的播放对象
    */
    let videoItem = videoUpdateTime.find(
      (item) => item.vid === videoTimeObj.vid
    )
    if (videoItem) {
      // 之前有
      videoItem.currentTime = event.detail.currentTime
    } else {
      // 之前没有
      videoUpdateTime.push(videoTimeObj)
    }
    // 统一更新videoUpdateTime的状态
    this.setData({
      videoUpdateTime
    })
  },

  // 视频播放结束调用的回调
  handleEnded(event) {
    // 移除记录播放时长数组中当前视频的对象
    let { videoUpdateTime } = this.data
    let index = videoUpdateTime.findIndex(
      (item) => item.vid === event.currentTarget.id
    )
    videoUpdateTime.splice(index, 1)
    this.setData({
      videoUpdateTime
    })
  },

  // 自定义下拉刷新的回调  scroll-view
  handleRefresher() {
    console.log('下拉')
    // 再次发请求获取最新的视频列表数据
    this.getVideoList(this.data.navId)
  },

  // 自定义上拉触底的回调  scroll-view
  handleToLower() {
    // 数据分页：1.后端分页 2.前端分页
    // 注意：网易云音乐暂时没有提供分页的api，分页效果自己模拟
    // 模拟的数据
    let newVideoList = [
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_2ECFBFC02440C7BF84BC83AF637ACE4E',
          coverUrl:
            'https://p1.music.126.net/gax3FlvmFsYYsXcVOsG3_Q==/109951165353772705.jpg',
          height: 360,
          width: 480,
          title: '这才是王杰原来的声音，为杰哥祈祷，声音早日康复。',
          description: '这才是王杰原来的声音，为杰哥祈祷，声音早日康复。',
          commentCount: 724,
          shareCount: 1487,
          resolutions: [
            {
              resolution: 240,
              size: 6958433
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 330000,
            authStatus: 1,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/NyE3ZaBBa4q1uTRycso9jQ==/109951164200929365.jpg',
            accountStatus: 0,
            gender: 1,
            city: 330100,
            birthday: 647190000000,
            userId: 74474,
            userType: 4,
            nickname: '葱_music',
            signature: '音乐一窍不通，仅是喜欢。',
            description: '',
            detailDescription: '',
            avatarImgId: 109951164200929360,
            backgroundImgId: 109951163339122270,
            backgroundUrl:
              'http://p1.music.126.net/C7sUbNgRxYvgDVOSA8ZcjQ==/109951163339122274.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '音乐视频达人',
              2: '生活图文达人'
            },
            djStatus: 10,
            vipType: 11,
            remarkName: null,
            avatarImgIdStr: '109951164200929365',
            backgroundImgIdStr: '109951163339122274'
          },
          urlInfo: {
            id: '2ECFBFC02440C7BF84BC83AF637ACE4E',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/knmcgDqK_128092819_sd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=QGyOuDBfcCdJCDnUxqXuKxaTHgeqHNMg&sign=6930b43c630a681681c5fcd7806ceef8&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 6958433,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 240
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 59101,
              name: '华语现场',
              alg: null
            },
            {
              id: 57108,
              name: '流行现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            },
            {
              id: 16201,
              name: '温暖',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: [109],
          relateSong: [
            {
              name: '祈祷',
              id: 301947,
              pst: 0,
              t: 0,
              ar: [
                {
                  id: 9657,
                  name: '王韵婵',
                  tns: [],
                  alias: []
                },
                {
                  id: 5358,
                  name: '王杰',
                  tns: [],
                  alias: []
                }
              ],
              alia: [],
              pop: 100,
              st: 0,
              rt: '',
              fee: 8,
              v: 17,
              crbt: null,
              cf: '',
              al: {
                id: 29911,
                name: '祈祷',
                picUrl:
                  'http://p3.music.126.net/Cxe8i6l2TePK9Fb4rrsC_A==/109951163611525216.jpg',
                tns: [],
                pic_str: '109951163611525216',
                pic: 109951163611525220
              },
              dt: 270333,
              h: {
                br: 320000,
                fid: 0,
                size: 10815782,
                vd: 17526
              },
              m: {
                br: 192000,
                fid: 0,
                size: 6489487,
                vd: 20141
              },
              l: {
                br: 128000,
                fid: 0,
                size: 4326339,
                vd: 21825
              },
              a: null,
              cd: '1',
              no: 7,
              rtUrl: null,
              ftype: 0,
              rtUrls: [],
              djId: 0,
              copyright: 1,
              s_id: 0,
              mst: 9,
              cp: 7002,
              mv: 5309077,
              rtype: 0,
              rurl: null,
              publishTime: 752083200000,
              privilege: {
                id: 301947,
                fee: 8,
                payed: 0,
                st: 0,
                pl: 128000,
                dl: 0,
                sp: 7,
                cp: 1,
                subp: 1,
                cs: false,
                maxbr: 999000,
                fl: 128000,
                toast: false,
                flag: 0,
                preSell: false
              }
            }
          ],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: '2ECFBFC02440C7BF84BC83AF637ACE4E',
          durationms: 73165,
          playTime: 1536998,
          praisedCount: 8417,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_85D78BFC8F4280BA1A2E49D7346BB46E',
          coverUrl:
            'https://p1.music.126.net/p7IZak51SfiKflkDwy35Ww==/109951163952594480.jpg',
          height: 1080,
          width: 1920,
          title: '当中国rapper站上美国街头表演，看黑人和白人的反应！',
          description:
            '当中国rapper站上美国街头表演，看黑人和白人的反应！《江心寺》 池一骋CHI/Dawa\n（1:28秒后亮了）\n',
          commentCount: 4318,
          shareCount: 5693,
          resolutions: [
            {
              resolution: 240,
              size: 109441249
            },
            {
              resolution: 480,
              size: 132206513
            },
            {
              resolution: 720,
              size: 265244869
            },
            {
              resolution: 1080,
              size: 292787760
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 1000000,
            authStatus: 1,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/jT6mGP7hXGoXRmc9ZIa_NA==/109951164060640030.jpg',
            accountStatus: 0,
            gender: 1,
            city: 1004400,
            birthday: 885024000000,
            userId: 330816088,
            userType: 4,
            nickname: '池一骋CHI',
            signature:
              '池一骋，来自温州的说唱歌手，美国说唱厂牌燥堂主理人，明日之子第二季全国18强。',
            description: '',
            detailDescription: '',
            avatarImgId: 109951164060640030,
            backgroundImgId: 109951163696522240,
            backgroundUrl:
              'http://p1.music.126.net/hRZGgwFITjOtzxP4gKkg7A==/109951163696522234.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '音乐原创视频达人'
            },
            djStatus: 10,
            vipType: 11,
            remarkName: null,
            avatarImgIdStr: '109951164060640030',
            backgroundImgIdStr: '109951163696522234'
          },
          urlInfo: {
            id: '85D78BFC8F4280BA1A2E49D7346BB46E',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/eNv7gAJy_2400622074_uhd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=oklxcGsPUybhSpUHlkmEQwfxpCmjajdI&sign=12f60daec8345ce2075f0f24b793f864&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 292787760,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 1080
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 59106,
              name: '街头表演',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: null,
          relateSong: [
            {
              name: '江心寺',
              id: 1349745416,
              pst: 0,
              t: 0,
              ar: [
                {
                  id: 13007102,
                  name: '池一骋',
                  tns: [],
                  alias: []
                },
                {
                  id: 29235420,
                  name: 'Dawa',
                  tns: [],
                  alias: []
                }
              ],
              alia: [],
              pop: 75,
              st: 0,
              rt: '',
              fee: 8,
              v: 6,
              crbt: null,
              cf: '',
              al: {
                id: 75752628,
                name: '江心寺(Feat. Dawa)',
                picUrl:
                  'http://p3.music.126.net/2M76EfsvqmCOVa9RDORq1A==/109951163900733752.jpg',
                tns: [],
                pic_str: '109951163900733752',
                pic: 109951163900733760
              },
              dt: 185000,
              h: {
                br: 320000,
                fid: 0,
                size: 7403146,
                vd: -2
              },
              m: {
                br: 192000,
                fid: 0,
                size: 4441905,
                vd: -2
              },
              l: {
                br: 128000,
                fid: 0,
                size: 2961284,
                vd: -1
              },
              a: null,
              cd: '01',
              no: 1,
              rtUrl: null,
              ftype: 0,
              rtUrls: [],
              djId: 0,
              copyright: 0,
              s_id: 0,
              mst: 9,
              cp: 0,
              mv: 0,
              rtype: 0,
              rurl: null,
              publishTime: 0,
              privilege: {
                id: 1349745416,
                fee: 8,
                payed: 0,
                st: 0,
                pl: 128000,
                dl: 0,
                sp: 7,
                cp: 1,
                subp: 1,
                cs: false,
                maxbr: 999000,
                fl: 128000,
                toast: false,
                flag: 0,
                preSell: false
              }
            }
          ],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: '85D78BFC8F4280BA1A2E49D7346BB46E',
          durationms: 299724,
          playTime: 10234834,
          praisedCount: 56336,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_11856B9EAA05BFBCA4E5347A00184DD3',
          coverUrl:
            'https://p1.music.126.net/3lO8CUWZDCCpKM0uNnS1GQ==/109951163229049789.jpg',
          height: 540,
          width: 960,
          title: '洗脑神曲《Mi Mi Mi》嗨翻全场！白银组合热力演唱成名',
          description: '洗脑神曲《Mi Mi Mi》嗨翻全场！白银组合热力演唱成名',
          commentCount: 65,
          shareCount: 86,
          resolutions: [
            {
              resolution: 240,
              size: 44432260
            },
            {
              resolution: 480,
              size: 60331883
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 110000,
            authStatus: 1,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/emKCPDqFBYA1ms6znsGVhw==/109951165709352119.jpg',
            accountStatus: 0,
            gender: 1,
            city: 110101,
            birthday: 678985200000,
            userId: 299347675,
            userType: 204,
            nickname: '阿扎提-流行音乐电台',
            signature: '定期更新影视作品！',
            description: '',
            detailDescription: '',
            avatarImgId: 109951165709352110,
            backgroundImgId: 109951164900023520,
            backgroundUrl:
              'http://p1.music.126.net/mFLpIPxACkWFlflx65YYEg==/109951164900023515.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '影视视频达人'
            },
            djStatus: 10,
            vipType: 11,
            remarkName: null,
            avatarImgIdStr: '109951165709352119',
            backgroundImgIdStr: '109951164900023515'
          },
          urlInfo: {
            id: '11856B9EAA05BFBCA4E5347A00184DD3',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/N1E5sYEU_1375106340_hd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=olPmcsliYcBeipBwMiLHYlRyaRiHmOyp&sign=772dc45fd2e8d82307b1f483ba8e56e9&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 60331883,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 480
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 59101,
              name: '华语现场',
              alg: null
            },
            {
              id: 57108,
              name: '流行现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            },
            {
              id: 13164,
              name: '快乐',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: [109],
          relateSong: [],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: '11856B9EAA05BFBCA4E5347A00184DD3',
          durationms: 398014,
          playTime: 191129,
          praisedCount: 560,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_987D911C5BDF7AB9BC734640715796B4',
          coverUrl:
            'https://p1.music.126.net/aP3HaB_29NGDkaqJi_LhUQ==/109951163572990836.jpg',
          height: 720,
          width: 1280,
          title: '他唱了一首张国荣的《风继续吹》，一开嗓全场都坐不住了',
          description:
            '他唱了一首张国荣的《风继续吹》，一开嗓全场都坐不住了，太像了\n',
          commentCount: 1921,
          shareCount: 2509,
          resolutions: [
            {
              resolution: 240,
              size: 15937422
            },
            {
              resolution: 480,
              size: 22803934
            },
            {
              resolution: 720,
              size: 36543215
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 430000,
            authStatus: 0,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/s7UbKTvdHKzfQCRCoqbGEw==/18781857627506469.jpg',
            accountStatus: 0,
            gender: 2,
            city: 430100,
            birthday: -2209017600000,
            userId: 440542582,
            userType: 0,
            nickname: '虐心音乐厅',
            signature: '音乐视频自媒体',
            description: '',
            detailDescription: '',
            avatarImgId: 18781857627506468,
            backgroundImgId: 109951162868126480,
            backgroundUrl:
              'http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '音乐视频达人'
            },
            djStatus: 0,
            vipType: 0,
            remarkName: null,
            avatarImgIdStr: '18781857627506469',
            backgroundImgIdStr: '109951162868126486'
          },
          urlInfo: {
            id: '987D911C5BDF7AB9BC734640715796B4',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/aKJBhi2N_1306535111_shd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=RvWqdyAIefZaEibuKvkSoQRfEgsHEFoM&sign=970cf97866f1416800d9a3328acd13c6&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 36543215,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 720
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: null,
          relateSong: [],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: '987D911C5BDF7AB9BC734640715796B4',
          durationms: 139200,
          playTime: 4419734,
          praisedCount: 26568,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_FD9F2A11330DE43CC509CDEBCEBDF82E',
          coverUrl:
            'https://p1.music.126.net/3YyI5lLMRdZB2wHlHuEriQ==/109951163679820721.jpg',
          height: 1080,
          width: 1920,
          title: '蔡依林很好听的一首老歌，《日不落》你应该不陌生',
          description: '蔡依林很好听的一首老歌，《日不落》你应该不陌生',
          commentCount: 223,
          shareCount: 167,
          resolutions: [
            {
              resolution: 240,
              size: 35911881
            },
            {
              resolution: 480,
              size: 60175659
            },
            {
              resolution: 720,
              size: 90373746
            },
            {
              resolution: 1080,
              size: 129644673
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 340000,
            authStatus: 0,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/p_X_gt49W_SR5dIpDQVf6g==/109951163424476772.jpg',
            accountStatus: 0,
            gender: 1,
            city: 340100,
            birthday: 827683200000,
            userId: 309396116,
            userType: 0,
            nickname: '坚果音乐秀',
            signature: '音乐是唯一的力量，救赎我的灵魂',
            description: '',
            detailDescription: '',
            avatarImgId: 109951163424476770,
            backgroundImgId: 109951163571489730,
            backgroundUrl:
              'http://p1.music.126.net/J5ugUVblg-l67Rxogp-6WA==/109951163571489734.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '音乐视频达人'
            },
            djStatus: 0,
            vipType: 11,
            remarkName: null,
            avatarImgIdStr: '109951163424476772',
            backgroundImgIdStr: '109951163571489734'
          },
          urlInfo: {
            id: 'FD9F2A11330DE43CC509CDEBCEBDF82E',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/H7HRL8Lp_2124734402_uhd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=QnsckfVlMcrZPizpAHvxAGEvIkJbCCoa&sign=1d1518561726b04f5159dfffed5c6fa7&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 129644673,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 1080
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 9102,
              name: '演唱会',
              alg: null
            },
            {
              id: 59101,
              name: '华语现场',
              alg: null
            },
            {
              id: 57108,
              name: '流行现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            },
            {
              id: 23120,
              name: '蔡依林',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: [101],
          relateSong: [
            {
              name: '日不落',
              id: 209643,
              pst: 0,
              t: 0,
              ar: [
                {
                  id: 7219,
                  name: '蔡依林',
                  tns: [],
                  alias: []
                }
              ],
              alia: [],
              pop: 100,
              st: 0,
              rt: '600902000005157183',
              fee: 8,
              v: 40,
              crbt: null,
              cf: '',
              al: {
                id: 21325,
                name: '特务J',
                picUrl:
                  'http://p3.music.126.net/Yu--DIhsQSoei6XQTrSUNA==/109951163200168756.jpg',
                tns: ['Agent J'],
                pic_str: '109951163200168756',
                pic: 109951163200168750
              },
              dt: 228000,
              h: {
                br: 320000,
                fid: 0,
                size: 9142900,
                vd: -24600
              },
              m: {
                br: 192000,
                fid: 0,
                size: 5485757,
                vd: -22000
              },
              l: {
                br: 128000,
                fid: 0,
                size: 3657185,
                vd: -20400
              },
              a: null,
              cd: '1',
              no: 11,
              rtUrl: null,
              ftype: 0,
              rtUrls: [],
              djId: 0,
              copyright: 2,
              s_id: 0,
              mst: 9,
              cp: 7002,
              mv: 186041,
              rtype: 0,
              rurl: null,
              publishTime: 1190304000000,
              privilege: {
                id: 209643,
                fee: 8,
                payed: 0,
                st: 0,
                pl: 128000,
                dl: 0,
                sp: 7,
                cp: 1,
                subp: 1,
                cs: false,
                maxbr: 999000,
                fl: 128000,
                toast: false,
                flag: 4,
                preSell: false
              }
            }
          ],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: 'FD9F2A11330DE43CC509CDEBCEBDF82E',
          durationms: 279755,
          playTime: 621023,
          praisedCount: 2522,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_B632F147DDA3DAEFB455B6FA9D20F544',
          coverUrl:
            'https://p1.music.126.net/YIpjD6tm7tNMACdXAyiIYg==/109951164207079079.jpg',
          height: 720,
          width: 1280,
          title: '费玉清爆笑模仿比莉，走出了六七不认的步伐，原来你是这样的小哥',
          description:
            '抬头唱歌圣如佛 低头嘿嘿淫成魔\n没错这就是我们的小哥费玉清\n可谁又能曾向\n往前倒推20年\n我们小哥还是一位灵魂舞者\n本期给大家盘点三个费玉清魔性的3个跳舞现场\n快来和我看看吧',
          commentCount: 555,
          shareCount: 2055,
          resolutions: [
            {
              resolution: 240,
              size: 24106669
            },
            {
              resolution: 480,
              size: 38450204
            },
            {
              resolution: 720,
              size: 56555808
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 220000,
            authStatus: 0,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/ZgHFn18PretxYmnLXMjf4Q==/109951163708074591.jpg',
            accountStatus: 0,
            gender: 2,
            city: 220200,
            birthday: 631123200000,
            userId: 1437838778,
            userType: 0,
            nickname: '唯一迷小音',
            signature: '心中有音乐，哪里都是舞台',
            description: '',
            detailDescription: '',
            avatarImgId: 109951163708074600,
            backgroundImgId: 109951162868126480,
            backgroundUrl:
              'http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '音乐原创视频达人'
            },
            djStatus: 0,
            vipType: 0,
            remarkName: null,
            avatarImgIdStr: '109951163708074591',
            backgroundImgIdStr: '109951162868126486'
          },
          urlInfo: {
            id: 'B632F147DDA3DAEFB455B6FA9D20F544',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/p7mg1Jyw_2583212600_shd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=LejCMpyNdASiyDinXOuJhqzqZeUXPgjm&sign=d9129ba0751a5749fe9ad8edd92edbe7&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 56555808,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 720
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            },
            {
              id: 74120,
              name: '鬼畜',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: null,
          relateSong: [],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: 'B632F147DDA3DAEFB455B6FA9D20F544',
          durationms: 191530,
          playTime: 1965054,
          praisedCount: 12660,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_FA47F8E86CDC4F19F4C24B97602595E7',
          coverUrl:
            'https://p1.music.126.net/jKRBa95CdgcCs2zHszGO5A==/109951163065247256.jpg',
          height: 720,
          width: 1280,
          title: '曾经多少人设为手机铃声的一首歌，贾斯汀·比伯现场现场',
          description:
            '曾经多少人设为手机铃声的一首英文歌，贾斯汀·比伯声音一出来耳朵都怀孕了！',
          commentCount: 2056,
          shareCount: 3714,
          resolutions: [
            {
              resolution: 240,
              size: 29631206
            },
            {
              resolution: 480,
              size: 42281394
            },
            {
              resolution: 720,
              size: 67487188
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 110000,
            authStatus: 0,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/W7N6omtZupPtvniz7zgrzA==/109951163573643904.jpg',
            accountStatus: 0,
            gender: 1,
            city: 110101,
            birthday: 662659200000,
            userId: 65220333,
            userType: 0,
            nickname: '音乐网事',
            signature:
              '(更多的好音乐在新浪微博【音巢】中) 。流离的经历 ，只是让心更安静。孤独的岁月，幸能遇见你',
            description: '',
            detailDescription: '',
            avatarImgId: 109951163573643900,
            backgroundImgId: 3339216814375188,
            backgroundUrl:
              'http://p1.music.126.net/hyp1XMjcH_1VhQzxD0VhOQ==/3339216814375188.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: {
              1: '音乐视频达人'
            },
            djStatus: 0,
            vipType: 0,
            remarkName: null,
            avatarImgIdStr: '109951163573643904',
            backgroundImgIdStr: '3339216814375188'
          },
          urlInfo: {
            id: 'FA47F8E86CDC4F19F4C24B97602595E7',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/VJMXf9s7_49262492_shd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=DkQKYlNyuoOTaxWGfqxUMPDiWOhcFitz&sign=ca9ca9cc7ea89cd8ae24c1d4489d98f9&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 67487188,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 720
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 12100,
              name: '流行',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            },
            {
              id: 16131,
              name: '英文',
              alg: null
            },
            {
              id: 14137,
              name: '感动',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: null,
          relateSong: [
            {
              name: 'As Long As You Love Me',
              id: 1518938,
              pst: 0,
              t: 0,
              ar: [
                {
                  id: 35531,
                  name: 'Justin Bieber',
                  tns: [],
                  alias: []
                },
                {
                  id: 185832,
                  name: 'Big Sean',
                  tns: [],
                  alias: []
                }
              ],
              alia: [],
              pop: 100,
              st: 0,
              rt: '600902000008000122',
              fee: 1,
              v: 33,
              crbt: null,
              cf: '',
              al: {
                id: 154515,
                name: 'As Long As You Love Me',
                picUrl:
                  'http://p3.music.126.net/1bYAE6KD6kDyAnh77dzAag==/770757651112633.jpg',
                tns: [],
                pic: 770757651112633
              },
              dt: 229000,
              h: {
                br: 320000,
                fid: 0,
                size: 9192103,
                vd: -38600
              },
              m: {
                br: 192000,
                fid: 0,
                size: 5515316,
                vd: -36200
              },
              l: {
                br: 128000,
                fid: 0,
                size: 3676923,
                vd: -34800
              },
              a: null,
              cd: '1',
              no: 1,
              rtUrl: null,
              ftype: 0,
              rtUrls: [],
              djId: 0,
              copyright: 1,
              s_id: 0,
              mst: 9,
              cp: 7003,
              mv: 5491,
              rtype: 0,
              rurl: null,
              publishTime: 1339430400007,
              privilege: {
                id: 1518938,
                fee: 1,
                payed: 0,
                st: 0,
                pl: 0,
                dl: 0,
                sp: 0,
                cp: 0,
                subp: 0,
                cs: false,
                maxbr: 320000,
                fl: 0,
                toast: false,
                flag: 4,
                preSell: false
              }
            }
          ],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: 'FA47F8E86CDC4F19F4C24B97602595E7',
          durationms: 254022,
          playTime: 2907768,
          praisedCount: 32793,
          praised: false,
          subscribed: false
        }
      },
      {
        type: 1,
        displayed: false,
        alg: 'onlineHotGroup',
        extAlg: null,
        data: {
          alg: 'onlineHotGroup',
          scm: '1.music-video-timeline.video_timeline.video.181017.-295043608',
          threadId: 'R_VI_62_1477EAE772D2914E3B4D6B24E2608442',
          coverUrl:
            'https://p1.music.126.net/HE_FDiJFWSSZFQZB9RvptQ==/109951165043246335.jpg',
          height: 720,
          width: 1280,
          title: '【BLACKPINK】Last Christmas京瓷巨蛋Live完整版',
          description: '【BLACKPINK】Last Christmas京瓷巨蛋Live完整版',
          commentCount: 481,
          shareCount: 1591,
          resolutions: [
            {
              resolution: 240,
              size: 17398373
            },
            {
              resolution: 480,
              size: 29297707
            },
            {
              resolution: 720,
              size: 43580946
            }
          ],
          creator: {
            defaultAvatar: false,
            province: 110000,
            authStatus: 0,
            followed: false,
            avatarUrl:
              'http://p1.music.126.net/9Si713j7PcoI29P_uWXjww==/109951165387568902.jpg',
            accountStatus: 0,
            gender: 2,
            city: 110101,
            birthday: 1577808000000,
            userId: 131214442,
            userType: 0,
            nickname: 'Memrise_',
            signature: '',
            description: '',
            detailDescription: '',
            avatarImgId: 109951165387568900,
            backgroundImgId: 109951165824402740,
            backgroundUrl:
              'http://p1.music.126.net/3c6l1penshkLUjj6o1lrXQ==/109951165824402741.jpg',
            authority: 0,
            mutual: false,
            expertTags: null,
            experts: null,
            djStatus: 0,
            vipType: 11,
            remarkName: null,
            avatarImgIdStr: '109951165387568902',
            backgroundImgIdStr: '109951165824402741'
          },
          urlInfo: {
            id: '1477EAE772D2914E3B4D6B24E2608442',
            url: 'http://vodkgeyttp9.vod.126.net/vodkgeyttp8/NSmLh5Co_3023173320_shd.mp4?ts=1631278771&rid=ECA695AFEEBCA6523A76EDE7C57A6BDF&rl=3&rs=gFDfCsKZBqEvZgpfDeBfEweiDTRhBHSD&sign=799c22cd906af2180339be6091f3458a&ext=e%2BqjUMv1%2B8cnZ1A3xfcj5L4b61QEaje12vOAVX15RI2vKTs4QkZaQVEh21Y2zDDQy4SDRiLdEUXIkHBaRNDilyJTGqwl02HXUjSxn5fla979xJGcwG%2FceccMMsAHdQY0Fbx6qDTG9T1JJZviAF7dVDlztZSw4tVwssuuzxdTRGu55QAGoYiwyopWNart%2FmlWR7OpDyRW7TPpT49zzcCfiMPDIphonvl0XG8QFmgV%2BrfFZ6WvmVmC0cw5QAjqt4Id',
            size: 43580946,
            validityTime: 1200,
            needPay: false,
            payInfo: null,
            r: 720
          },
          videoGroup: [
            {
              id: 58100,
              name: '现场',
              alg: null
            },
            {
              id: 1101,
              name: '舞蹈',
              alg: null
            },
            {
              id: 57107,
              name: '韩语现场',
              alg: null
            },
            {
              id: 57108,
              name: '流行现场',
              alg: null
            },
            {
              id: 59108,
              name: '巡演现场',
              alg: null
            },
            {
              id: 1100,
              name: '音乐现场',
              alg: null
            },
            {
              id: 5100,
              name: '音乐',
              alg: null
            },
            {
              id: 92105,
              name: 'BLACKPINK',
              alg: null
            }
          ],
          previewUrl: null,
          previewDurationms: 0,
          hasRelatedGameAd: false,
          markTypes: null,
          relateSong: [],
          relatedInfo: null,
          videoUserLiveInfo: null,
          vid: '1477EAE772D2914E3B4D6B24E2608442',
          durationms: 207907,
          playTime: 1299669,
          praisedCount: 20000,
          praised: false,
          subscribed: false
        }
      }
    ]
    let { videoList } = this.data
    // 将视频最新的数据更新到原有视频列表中
    videoList.push(...newVideoList)
    this.setData({
      videoList
    })
  },

  // 跳转至搜索界面
  toSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // console.log('页面的下拉刷新，需要在json中配置一个属性')
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // console.log('页面的上拉触底')
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({ from }) {
    if (from === 'button') {
      return {
        title: '来自button的转发',
        path: '/pages/video/video',
        imageUrl: '/static/images/nvsheng.jpg'
      }
    } else {
      return {
        title: '来自menu的转发',
        path: '/pages/video/video',
        imageUrl: '/static/images/nvsheng.jpg'
      }
    }
  }
})
