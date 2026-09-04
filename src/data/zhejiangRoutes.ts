export interface XingzheWaypoint {
  id: string;
  lat: number;
  lng: number;
  elevation: number;
  name: string;
}

export interface XingzheRoutePreset {
  id: string;
  name: string;
  xingzheRoadbookId: string;
  city: string;
  difficulty: '入门休闲' | '进阶爬坡' | '长途挑战' | '终极硬核';
  distanceKm: number;
  elevationGainM: number;
  description: string;
  highlights: string[];
  waypoints: XingzheWaypoint[];
}

export const ZHEJIANG_XINGZHE_ROUTES: XingzheRoutePreset[] = [
  {
    id: 'hangzhou-westlake-longjing',
    name: '杭州西湖-龙井-梅灵南路经典起伏环线',
    xingzheRoadbookId: '#2841920',
    city: '杭州',
    difficulty: '入门休闲',
    distanceKm: 24.5,
    elevationGainM: 410,
    description: '杭州骑友的日常圣地！串联西湖断桥、杨公堤、龙井问茶、翁家山顶峰与梅灵隧道，茶园与湖光山色交织，起伏适中。',
    highlights: ['西湖断桥', '龙井问茶陡坡', '翁家山垭口', '梅灵隧道', '九溪十八涧'],
    waypoints: [
      { id: '1', lat: 30.2592, lng: 120.1472, elevation: 15, name: '西湖断桥残雪起点' },
      { id: '2', lat: 30.2458, lng: 120.1315, elevation: 18, name: '杨公堤林荫绿道' },
      { id: '3', lat: 30.2285, lng: 120.1180, elevation: 75, name: '龙井路口茶室' },
      { id: '4', lat: 30.2180, lng: 120.1085, elevation: 160, name: '龙井问茶连续发卡弯' },
      { id: '5', lat: 30.2085, lng: 120.0980, elevation: 218, name: '翁家山垭口顶峰' },
      { id: '6', lat: 30.2110, lng: 120.1210, elevation: 135, name: '满觉陇桂花弄' },
      { id: '7', lat: 30.1980, lng: 120.0760, elevation: 68, name: '梅家坞千亩茶园' },
      { id: '8', lat: 30.2160, lng: 120.0820, elevation: 142, name: '梅灵隧道口' },
      { id: '9', lat: 30.2380, lng: 120.1010, elevation: 52, name: '灵隐天竺路段' },
      { id: '10', lat: 30.2592, lng: 120.1472, elevation: 15, name: '北山街断桥终点' }
    ]
  },
  {
    id: 'anji-tianhuangping',
    name: '安吉天荒坪江南天池天路极速攻坚',
    xingzheRoadbookId: '#3105422',
    city: '湖州·安吉',
    difficulty: '进阶爬坡',
    distanceKm: 18.5,
    elevationGainM: 810,
    description: '长三角最具人气的爬坡天路！从港口村入山口持续爬升至海拔近千米的江南天池，大竹海与连续发卡弯，平均坡度 5.6%。',
    highlights: ['大溪峡谷', '长谷洞天', '藏龙百瀑', '抽水蓄能电站', '江南天池大坝'],
    waypoints: [
      { id: '1', lat: 30.4850, lng: 119.5820, elevation: 185, name: '港口村大桥入山口起点' },
      { id: '2', lat: 30.4680, lng: 119.5760, elevation: 290, name: '大溪峡谷绿道入口' },
      { id: '3', lat: 30.4490, lng: 119.5810, elevation: 430, name: '长谷洞天盘山路段' },
      { id: '4', lat: 30.4320, lng: 119.5890, elevation: 610, name: '藏龙百瀑陡坡段' },
      { id: '5', lat: 30.4180, lng: 119.5930, elevation: 780, name: '九龙峡连续发卡弯' },
      { id: '6', lat: 30.4050, lng: 119.5970, elevation: 915, name: '电站下水库观景台' },
      { id: '7', lat: 30.3980, lng: 119.5990, elevation: 985, name: '江南天池大坝终点' }
    ]
  },
  {
    id: 'qiandao-lake-140k',
    name: '千岛湖淳杨线-千汾线 140km 环湖超级大环线',
    xingzheRoadbookId: '#1984210',
    city: '杭州·淳安',
    difficulty: '长途挑战',
    distanceKm: 138.5,
    elevationGainM: 920,
    description: '国家级环湖骑行圣地！包含亚运会公路自行车赛段，全程全封闭专业骑行绿道，跨越湖水大桥与起伏岛屿，风景绝美。',
    highlights: ['秀水广场', '上江埠大桥', '汾口半程驿站', '界首亚运赛道', '千岛湖大桥'],
    waypoints: [
      { id: '1', lat: 29.6050, lng: 119.0400, elevation: 110, name: '千岛湖秀水广场起点' },
      { id: '2', lat: 29.5620, lng: 118.9950, elevation: 115, name: '上江埠特大桥' },
      { id: '3', lat: 29.5100, lng: 118.9150, elevation: 125, name: '安阳乡水岸绿道' },
      { id: '4', lat: 29.4600, lng: 118.8400, elevation: 118, name: '大墅镇骑行驿站' },
      { id: '5', lat: 29.4750, lng: 118.7200, elevation: 112, name: '汾口镇半程补给站' },
      { id: '6', lat: 29.5800, lng: 118.7600, elevation: 125, name: '姜家镇狮城古道' },
      { id: '7', lat: 29.6250, lng: 118.8600, elevation: 120, name: '界首亚运公路赛段' },
      { id: '8', lat: 29.6100, lng: 118.9800, elevation: 115, name: '千岛湖大桥观景台' },
      { id: '9', lat: 29.6050, lng: 119.0400, elevation: 110, name: '秀水广场闭环终点' }
    ]
  },
  {
    id: 'mogan-mountain-climb',
    name: '德清莫干山后坞-裸心堡经典盘山挑战',
    xingzheRoadbookId: '#2765103',
    city: '湖州·德清',
    difficulty: '进阶爬坡',
    distanceKm: 14.8,
    elevationGainM: 640,
    description: '江南避暑名山经典路线！从后坞村文化礼堂出发，途经古树竹海、裸心堡欧洲古堡风貌，登顶剑池与芦花荡公园。',
    highlights: ['后坞文化礼堂', '大界坞竹海', '裸心堡城堡', '剑池飞瀑', '芦花荡公园'],
    waypoints: [
      { id: '1', lat: 30.5620, lng: 119.8250, elevation: 110, name: '后坞文化礼堂起点' },
      { id: '2', lat: 30.5750, lng: 119.8400, elevation: 245, name: '大界坞竹林道' },
      { id: '3', lat: 30.5860, lng: 119.8510, elevation: 420, name: '裸心堡古堡盘山路' },
      { id: '4', lat: 30.5980, lng: 119.8620, elevation: 560, name: '剑池飞瀑岔道口' },
      { id: '5', lat: 30.6080, lng: 119.8690, elevation: 680, name: '芦花荡公园观景台' },
      { id: '6', lat: 30.6120, lng: 119.8730, elevation: 715, name: '荫山街核心区' },
      { id: '7', lat: 30.6150, lng: 119.8770, elevation: 745, name: '莫干山顶峰气象站' }
    ]
  },
  {
    id: 'siming-mountain-traverse',
    name: '宁波余姚梁弄-四明山-溪口雪窦山大穿越',
    xingzheRoadbookId: '#3298401',
    city: '宁波·余姚/奉化',
    difficulty: '终极硬核',
    distanceKm: 46.5,
    elevationGainM: 1280,
    description: '浙东第一天路！跨越四明山脉主峰群，白鹿观景台、红枫大道与雪窦山大瀑布，连续大爬升与长下坡考验综合操控力。',
    highlights: ['梁弄古镇', '白鹿观景台', '大岚茶海', '四明山镇天路', '雪窦山三隐潭'],
    waypoints: [
      { id: '1', lat: 30.0150, lng: 121.0850, elevation: 45, name: '余姚梁弄镇起点' },
      { id: '2', lat: 29.9350, lng: 121.0950, elevation: 380, name: '白鹿观景台' },
      { id: '3', lat: 29.8650, lng: 121.1100, elevation: 520, name: '大岚茶海起伏路' },
      { id: '4', lat: 29.7850, lng: 121.1250, elevation: 690, name: '四明山镇中心天路' },
      { id: '5', lat: 29.7450, lng: 121.1800, elevation: 620, name: '徐凫岩绝壁栈道' },
      { id: '6', lat: 29.7150, lng: 121.2350, elevation: 450, name: '雪窦山三隐潭' },
      { id: '7', lat: 29.6800, lng: 121.2750, elevation: 65, name: '溪口古镇终点' }
    ]
  },
  {
    id: 'zhoushan-zhujiajian',
    name: '舟山朱家尖大青山环岛滨海天路',
    xingzheRoadbookId: '#1842903',
    city: '舟山·普陀',
    difficulty: '入门休闲',
    distanceKm: 22.0,
    elevationGainM: 480,
    description: '东海第一绝美海景公路！一面悬崖海浪、一面青翠山峰，途径乌石塘、十里金沙与大青山绝顶观海台。',
    highlights: ['乌石塘海堤', '樟州古渔村', '南沙金沙滩', '大青山天路', '青山绝顶观海台'],
    waypoints: [
      { id: '1', lat: 29.8920, lng: 122.3850, elevation: 12, name: '朱家尖乌石塘海堤起点' },
      { id: '2', lat: 29.8750, lng: 122.4020, elevation: 18, name: '樟州古渔村' },
      { id: '3', lat: 29.8550, lng: 122.4100, elevation: 10, name: '南沙海滨浴场' },
      { id: '4', lat: 29.8350, lng: 122.3980, elevation: 65, name: '大青山国家公园门楼' },
      { id: '5', lat: 29.8200, lng: 122.3800, elevation: 360, name: '青山绝顶观海台' },
      { id: '6', lat: 29.8250, lng: 122.3650, elevation: 15, name: '筲箕湾避风港终点' }
    ]
  }
];
