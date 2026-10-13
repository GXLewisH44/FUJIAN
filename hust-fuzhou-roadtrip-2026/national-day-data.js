const defaultTripDays = [
  {
    date: 2, start: '14:00', origin: '全季武汉光谷湖北经济学院酒店', title: '武汉 → 仙岛湖 → 瑞昌', subtitle: '14:00从已订全季出发 · 揽胜亭后坐公交船 · 已订九江快乐城美仑酒店',
    stops: [
      { id: 'lake', name: '仙岛湖 · 揽胜亭', drive: 98, km: 118.0, type: '景点', hint: '导航点为高德“揽胜亭”；停车、步行上亭及看全景的时间请填在这里。' },
      { id: 'pier', name: '王英客运码头 · 公交船往返', drive: 6, km: 2.6, type: '公交船', hint: '驾车导航点为高德“王英码头”，不在岛上游玩。你发的攻略称单程约30—40分钟；请把等船、上下船和往返航行总时间填在这里。国庆船班须码头确认。' },
      { id: 'wanging', name: '王英镇 · 晚餐 / 休息', drive: 0, type: '补给', hint: '码头附近补给，停车和用餐时间填在这里。' },
      { id: 'ruichang', name: '九江快乐城美仑酒店', drive: 96, km: 109.1, type: '住宿', hint: '10月2日至3日已订；请在高德搜索“九江快乐城美仑酒店”核对具体入口和停车场。' }
    ]
  },
  {
    date: 3, start: '09:30', origin: '九江快乐城美仑酒店', title: '庐山山下 → 南昌夜景', subtitle: '09:30出发 · 落星墩后先到象湖星程入住 · 再看夜景',
    stops: [
      { id: 'donglin', name: '东林寺祖庭', drive: 53, km: 38.7, type: '景点', hint: '高德导航点为“东林寺”，不是东林大佛；停车和入寺时间另填。' },
      { id: 'xiufeng', name: '秀峰 · 山下远观', drive: 60, km: 38.2, type: '景点', hint: '高德导航点为“秀峰风景名胜区”入口附近；仅在山下看瀑，不进山。门外视线与水量不能保证。' },
      { id: 'lunch', name: '庐山市 · 午餐 / 休息', drive: 21, km: 7.0, type: '补给', hint: '为算路选“庐山市人民政府”作城区导航参照点，吃饭地点可能不同；停留及停车时间另填。' },
      { id: 'luoxing', name: '落星墩 · 鄱阳湖畔', drive: 6, km: 1.6, type: '景点', hint: '高德导航点为“落星墩”；景观受鄱阳湖水位影响，出发前核对。' },
      { id: 'checkin', name: '星程南昌象湖南大一附院酒店 · 先入住', drive: 156, km: 122.9, type: '入住', hint: '从落星墩先到你已订的星程；办理入住、停车、休整和晚餐时间都填在这里。随后再开车看夜景。' },
      { id: 'bayi', name: '八一广场', drive: 32, km: 11.2, type: '夜景', hint: '从象湖星程出发，高德导航点为“八一广场”；南昌晚到时这是第一处可删的景点，删站后须重新算路。' },
      { id: 'tengwang', name: '滕王阁 · 外观夜景', drive: 20, km: 4.2, type: '夜景', minTime: '18:30', hint: '高德导航点为“滕王阁”；只看外围夜景、不买票入阁。提前到达会等到夜景计划时间。' },
      { id: 'qiushui', name: '秋水广场', drive: 17, km: 5.6, type: '夜景', minTime: '19:50', hint: '高德导航点为“赣江市民公园-秋水广场”；想看20:00喷泉，停留至少填40分钟，遇雨可能停演。' },
      { id: 'wheel', name: '南昌之星 · 摩天轮外围', drive: 9, km: 3.3, type: '夜景', minTime: '20:45', hint: '高德导航点为“南昌之星摩天轮”；只看外观、不乘坐。' },
      { id: 'starway', name: '返回星程南昌象湖南大一附院酒店', drive: 28, km: 14.4, type: '住宿', hint: '夜景结束返回已入住的同一家星程；10月3日至4日已订。' }
    ]
  },
  {
    date: 4, start: '07:30', origin: '星程南昌象湖南大一附院酒店', title: '南昌 → 沙县小吃 → 福州', subtitle: '沙县城区停一次车 · 步行吃几样三明小吃 · 前往三江口',
    stops: [
      { id: 'shaxian', name: '沙县 · 建国路停车场 / 小吃步行圈', drive: 254, km: 365.6, type: '停车', map: 'https://www.amap.com/place/B0K3NAEX4M', hint: '高德导航点为“沙县东门古街(建国路)停车场”；只是停车参照点，不必进古街。找位、停好车的时间填这里，满位时当天另找附近停车点。' },
      { id: 'miaomen', name: '庙门扁肉 · 建国路旗舰总店', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0256003F9', transfer: '从停车场步行 · 无开车转场', hint: '先试手打扁肉，可搭拌面；高德店点在建国路。步行、等位和吃这家的时间一起填写。国庆营业须提前核对。' },
      { id: 'baozhu', name: '宝珠沙县小吃 · 府前中路店', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0256001E0', transfer: '沿府前中路步行 · 无开车转场', hint: '尝葱肉饼；高德店点在府前中路194号。按当天店内供应选择，步行及排队时间也填在这里。' },
      { id: 'jialan', name: '佳兰烧麦 · 府前中路', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0256002A4', transfer: '沿府前中路步行 · 无开车转场', hint: '试沙县烧麦，和常见糯米烧麦口感不同；店点以高德“佳兰烧麦”为准，营业和排队须当天确认。' },
      { id: 'yujiao', name: '淳古味 · 芋饺 / 米冻皮', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0LKKZN7WO', transfer: '沿府前中路步行 · 无开车转场', hint: '高德店点为“淳古味老沙县芋饺·米冻皮(步行街店)”；把步行、点餐、吃完返回停车场的时间都填在这里。' },
      { id: 'fuzhou', name: '福州 · 三江口', drive: 165, km: 232.1, type: '到达', hint: '这一段从沙县建国路停车场起算；终点暂以“三江口地铁站”为参照点。你家具体地址未提供，最后一段以当天导航为准。' }
    ]
  }
];

const defaultInbound = {
  date: 1,
  origin: '福州湾二期（西北门）',
  title: '福州 → 顺昌 → 抚州 → 九江 → 武汉',
  subtitle: '方程豹钛7 · 10月1日凌晨出发 · 顺路停靠3处比亚迪闪充站 · 住已订武汉全季',
  stops: [
    { id: 'charge1', name: '比亚迪闪充 · 南平顺昌合掌岩收费站出口', driveSeconds: 9965, km: 241.4, type: '闪充', map: 'https://www.amap.com/search?query=%E5%8D%97%E5%B9%B3%E9%A1%BA%E6%98%8C%E5%90%88%E6%8E%8C%E5%B2%A9%E6%94%B6%E8%B4%B9%E7%AB%99%E5%87%BA%E5%8F%A3%20%E9%97%AA%E5%85%85', hint: '截图第一站；位于收费站出口附近。把下高速、等桩、闪充和休息合计填在这里。' },
    { id: 'charge2', name: '比亚迪闪充 · 抚州罗针收费站入口', driveSeconds: 9625, km: 249.4, type: '闪充', map: 'https://www.amap.com/search?query=%E6%8A%9A%E5%B7%9E%E7%BD%97%E9%92%88%E6%94%B6%E8%B4%B9%E7%AB%99%E5%85%A5%E5%8F%A3%20%E9%97%AA%E5%85%85', hint: '截图第二站；在罗针收费站入口附近。闪充、用餐及司机休息时间合并填写。' },
    { id: 'charge3', name: '比亚迪闪充 · 九江东林大佛', driveSeconds: 7872, km: 203.1, type: '闪充', map: 'https://www.amap.com/search?query=%E4%B9%9D%E6%B1%9F%E4%B8%9C%E6%9E%97%E5%A4%A7%E4%BD%9B%20%E9%97%AA%E5%85%85', hint: '截图第三站；这是东林大佛附近的比亚迪闪充站，不是返程10月3日要去的东林寺祖庭。' },
    { id: 'wuhan_in', name: '全季武汉光谷湖北经济学院酒店', driveSeconds: 9065, km: 229.2, type: '住宿', hint: '10月1日至2日已订。到店后的入住、休息不计入当天抵达时间；10月2日返程固定14:00从这里出发。' }
  ]
};

window.NATIONAL_DAY_DATA = { tripDays: defaultTripDays, inbound: defaultInbound, inboundStart: '02:00', values: {} };
