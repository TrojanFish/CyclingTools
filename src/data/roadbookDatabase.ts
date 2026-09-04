export interface RoadbookPoint {
  lat: number;
  lng: number;
  elevation: number;
  name: string;
}

export interface RoadbookItem {
  id: string;
  name: string;
  nameEn?: string;
  sourceCode: string; // e.g. 行者 #2841920 / Tour de France
  region: string; // e.g. 浙江·杭州
  regionEn?: string;
  province: string; // e.g. 浙江 / Europe / USA
  category: 'lake' | 'climb' | 'coastal' | 'long-distance' | 'scenic';
  categoryLabel: string;
  categoryLabelEn?: string;
  difficulty: '入门休闲' | '进阶爬坡' | '长途挑战' | '终极硬核';
  difficultyEn?: string;
  distanceKm: number;
  elevationGainM: number;
  maxAltitudeM: number;
  avgGradePct: number;
  sceneryRating: number; // 1-5
  roadCondition: string; // 沥青柏油 / 封闭绿道 / 盘山公路
  roadConditionEn?: string;
  bestSeason: string; // 4-10月
  description: string;
  descriptionEn?: string;
  highlights: string[];
  tips: string[];
  waypoints: RoadbookPoint[];
}

export const ROADBOOK_DATABASE: RoadbookItem[] = [
  {
    id: 'hz-westlake-longjing',
    name: '杭州西湖-龙井-梅灵南路经典起伏环线',
    sourceCode: '行者 #2841920',
    region: '杭州·西湖',
    province: '浙江',
    category: 'scenic',
    categoryLabel: '景区起伏',
    difficulty: '入门休闲',
    distanceKm: 24.5,
    elevationGainM: 410,
    maxAltitudeM: 220,
    avgGradePct: 3.2,
    sceneryRating: 5,
    roadCondition: '优质沥青路面，部分景区周末机动车限行',
    bestSeason: '全年适宜，春秋季（3-5月 / 9-11月）最佳',
    description: '杭州骑友的日常刷街圣地！串联断桥、杨公堤、龙井问茶发卡弯、翁家山顶峰与梅家坞茶园，湖光与茶海交织，起伏适中，极具韵味。',
    highlights: ['断桥残雪', '杨公堤林荫道', '龙井问茶陡坡', '翁家山垭口', '梅灵隧道', '九溪十八涧'],
    tips: [
      '周末及节假日白天西湖周边机动车较多，推荐清晨 6:00~8:00 晨骑体验最佳。',
      '龙井下坡至满觉陇路段弯道较急且游客较多，切勿高速放坡，控制车速。'
    ],
    waypoints: [
      { lat: 30.2592, lng: 120.1472, elevation: 15, name: '西湖断桥残雪起点' },
      { lat: 30.2458, lng: 120.1315, elevation: 18, name: '杨公堤林荫绿道' },
      { lat: 30.2285, lng: 120.1180, elevation: 75, name: '龙井路口茶室' },
      { lat: 30.2180, lng: 120.1085, elevation: 160, name: '龙井问茶连续发卡弯' },
      { lat: 30.2085, lng: 120.0980, elevation: 218, name: '翁家山垭口顶峰' },
      { lat: 30.2110, lng: 120.1210, elevation: 135, name: '满觉陇桂花弄' },
      { lat: 30.1980, lng: 120.0760, elevation: 68, name: '梅家坞千亩茶园' },
      { lat: 30.2160, lng: 120.0820, elevation: 142, name: '梅灵隧道口' },
      { lat: 30.2380, lng: 120.1010, elevation: 52, name: '灵隐天竺路段' },
      { lat: 30.2592, lng: 120.1472, elevation: 15, name: '北山街断桥终点' }
    ]
  },
  {
    id: 'anji-tianhuangping',
    name: '安吉天荒坪江南天池天路极速攻坚',
    sourceCode: '行者 #3105422',
    region: '湖州·安吉',
    province: '浙江',
    category: 'climb',
    categoryLabel: '高山爬坡',
    difficulty: '进阶爬坡',
    distanceKm: 18.5,
    elevationGainM: 810,
    maxAltitudeM: 985,
    avgGradePct: 5.6,
    sceneryRating: 5,
    roadCondition: '高等级盘山柏油公路，双向两车道，弯道带反光镜',
    bestSeason: '4月 - 11月（盛夏避暑，秋季竹海金黄）',
    description: '长三角骑行圈最具人气的爬坡圣地！从港口村大桥入山口持续攀升近千米至江南天池抽水蓄能电站大坝，万亩竹海与九曲回肠的发卡弯极具挑战性。',
    highlights: ['大溪峡谷', '长谷洞天', '藏龙百瀑', '九龙峡连续发卡弯', '江南天池大坝'],
    tips: [
      '建议使用 34T 压缩盘配合 30T/34T 大飞轮，保持 80 RPM 踏频防爆缸。',
      '山顶海拔近千米，气温比山下低 5~7℃，下坡前必须穿戴防风马甲/风衣。'
    ],
    waypoints: [
      { lat: 30.4850, lng: 119.5820, elevation: 185, name: '港口村大桥入山口起点' },
      { lat: 30.4680, lng: 119.5760, elevation: 290, name: '大溪峡谷绿道入口' },
      { lat: 30.4490, lng: 119.5810, elevation: 430, name: '长谷洞天盘山路段' },
      { lat: 30.4320, lng: 119.5890, elevation: 610, name: '藏龙百瀑陡坡段' },
      { lat: 30.4180, lng: 119.5930, elevation: 780, name: '九龙峡连续发卡弯' },
      { lat: 30.4050, lng: 119.5970, elevation: 915, name: '电站下水库观景台' },
      { lat: 30.3980, lng: 119.5990, elevation: 985, name: '江南天池大坝终点' }
    ]
  },
  {
    id: 'qiandao-lake-140k',
    name: '千岛湖淳杨线-千汾线 140km 环湖超级大环线',
    sourceCode: '行者 #1984210',
    region: '杭州·淳安',
    province: '浙江',
    category: 'lake',
    categoryLabel: '湖泊绿道',
    difficulty: '长途挑战',
    distanceKm: 138.5,
    elevationGainM: 920,
    maxAltitudeM: 160,
    avgGradePct: 1.5,
    sceneryRating: 5,
    roadCondition: '全封闭彩色专业自行车道 + 亚运会标准宽阔沥青路面',
    bestSeason: '3月 - 11月',
    description: '中国公路自行车国家级骑行天堂！全程串联淳杨线景观绿道、千汾线与界首亚运会公路赛道，跨越数十座湖岛跨水大桥，起伏平顺，风光绝伦。',
    highlights: ['千岛湖秀水广场', '上江埠特大桥', '安阳水岸绿道', '大墅镇驿站', '界首亚运公路赛段', '千岛湖大桥'],
    tips: [
      '全程 140km，建议按顺时针方向骑行（贴湖面一侧视野更开阔且避开顶头风）。',
      '汾口镇（约 65km 处）为半程最佳餐饮补给点，备足电解质水与能量胶。'
    ],
    waypoints: [
      { lat: 29.6050, lng: 119.0400, elevation: 110, name: '千岛湖秀水广场起点' },
      { lat: 29.5620, lng: 118.9950, elevation: 115, name: '上江埠特大桥' },
      { lat: 29.5100, lng: 118.9150, elevation: 125, name: '安阳乡水岸绿道' },
      { lat: 29.4600, lng: 118.8400, elevation: 118, name: '大墅镇骑行驿站' },
      { lat: 29.4750, lng: 118.7200, elevation: 112, name: '汾口镇半程补给站' },
      { lat: 29.5800, lng: 118.7600, elevation: 125, name: '姜家镇狮城古道' },
      { lat: 29.6250, lng: 118.8600, elevation: 120, name: '界首亚运公路赛段' },
      { lat: 29.6100, lng: 118.9800, elevation: 115, name: '千岛湖大桥观景台' },
      { lat: 29.6050, lng: 119.0400, elevation: 110, name: '秀水广场闭环终点' }
    ]
  },
  {
    id: 'mogan-mountain-climb',
    name: '德清莫干山后坞-裸心堡经典盘山挑战',
    sourceCode: '行者 #2765103',
    region: '湖州·德清',
    province: '浙江',
    category: 'climb',
    categoryLabel: '高山爬坡',
    difficulty: '进阶爬坡',
    distanceKm: 14.8,
    elevationGainM: 640,
    maxAltitudeM: 745,
    avgGradePct: 5.2,
    sceneryRating: 5,
    roadCondition: '沥青路面，林荫覆盖率超 90%，弯多路窄',
    bestSeason: '5月 - 10月（华东顶级避暑骑行线路）',
    description: '江南名山经典骑行爬坡线！从后坞文化礼堂出发，途经大界坞竹海、裸心堡欧洲古堡风貌，登顶剑池与芦花荡公园，幽静清凉。',
    highlights: ['后坞文化礼堂', '大界坞竹林道', '裸心堡城堡', '剑池飞瀑', '芦花荡公园', '气象站顶峰'],
    tips: [
      '山路弯道较多且树荫遮挡视线，入弯前请轻压刹车并鸣笛/示意。',
      '景区夏季早晚温差较大，备好防风背心。'
    ],
    waypoints: [
      { lat: 30.5620, lng: 119.8250, elevation: 110, name: '后坞文化礼堂起点' },
      { lat: 30.5750, lng: 119.8400, elevation: 245, name: '大界坞竹林道' },
      { lat: 30.5860, lng: 119.8510, elevation: 420, name: '裸心堡古堡盘山路' },
      { lat: 30.5980, lng: 119.8620, elevation: 560, name: '剑池飞瀑岔道口' },
      { lat: 30.6080, lng: 119.8690, elevation: 680, name: '芦花荡公园观景台' },
      { lat: 30.6120, lng: 119.8730, elevation: 715, name: '荫山街核心区' },
      { lat: 30.6150, lng: 119.8770, elevation: 745, name: '莫干山顶峰气象站' }
    ]
  },
  {
    id: 'siming-mountain-traverse',
    name: '宁波余姚梁弄-四明山-溪口雪窦山大穿越',
    sourceCode: '行者 #3298401',
    region: '宁波·余姚/奉化',
    province: '浙江',
    category: 'climb',
    categoryLabel: '高山爬坡',
    difficulty: '终极硬核',
    distanceKm: 46.5,
    elevationGainM: 1280,
    maxAltitudeM: 720,
    avgGradePct: 4.8,
    sceneryRating: 5,
    roadCondition: '浙东天路高山公路，沥青铺设完善，弯道急且下坡长',
    bestSeason: '4月 - 11月（10-11月红枫漫山极为震撼）',
    description: '浙东第一公路天路！跨越四明山脉主峰群，途径白鹿观景台、红枫森林与溪口雪窦山大瀑布，连续高强度爬升与数十公里下坡考验综合车控力。',
    highlights: ['梁弄古镇', '白鹿观景台', '大岚茶海', '四明山镇天路', '徐凫岩绝壁', '雪窦山三隐潭'],
    tips: [
      '高难度硬核路线，总爬升近 1300 米，需具备 80km 以上山地耐力储备。',
      '长距离下坡需采用点刹降温，避免碳纤维圈刹过热爆框或碟刹热衰减。'
    ],
    waypoints: [
      { lat: 30.0150, lng: 121.0850, elevation: 45, name: '余姚梁弄镇起点' },
      { lat: 29.9350, lng: 121.0950, elevation: 380, name: '白鹿观景台' },
      { lat: 29.8650, lng: 121.1100, elevation: 520, name: '大岚茶海起伏路' },
      { lat: 29.7850, lng: 121.1250, elevation: 690, name: '四明山镇中心天路' },
      { lat: 29.7450, lng: 121.1800, elevation: 620, name: '徐凫岩绝壁栈道' },
      { lat: 29.7150, lng: 121.2350, elevation: 450, name: '雪窦山三隐潭' },
      { lat: 29.6800, lng: 121.2750, elevation: 65, name: '溪口古镇终点' }
    ]
  },
  {
    id: 'zhoushan-zhujiajian',
    name: '舟山朱家尖大青山环岛滨海天路',
    sourceCode: '行者 #1842903',
    region: '舟山·普陀',
    province: '浙江',
    category: 'coastal',
    categoryLabel: '滨海海景',
    difficulty: '入门休闲',
    distanceKm: 22.0,
    elevationGainM: 480,
    maxAltitudeM: 360,
    avgGradePct: 3.5,
    sceneryRating: 5,
    roadCondition: '海景旅游公路，路面平整开阔，海风较大',
    bestSeason: '5月 - 10月',
    description: '东海第一绝美海景公路！一面千仞悬崖海浪、一面青翠山峰，途经乌石塘海堤、十里金沙滩与大青山绝顶观海台，骑行体验极佳。',
    highlights: ['乌石塘海堤', '樟州古渔村', '南沙金沙滩', '大青山天路', '青山绝顶观海台'],
    tips: [
      '海边侧风较大，建议使用中低框轮组（35mm~45mm）以增强操控稳定性。',
      '盛夏注意海边强紫外线，备好防晒袖套与高倍防晒霜。'
    ],
    waypoints: [
      { lat: 29.8920, lng: 122.3850, elevation: 12, name: '朱家尖乌石塘海堤起点' },
      { lat: 29.8750, lng: 122.4020, elevation: 18, name: '樟州古渔村' },
      { lat: 29.8550, lng: 122.4100, elevation: 10, name: '南沙海滨浴场' },
      { lat: 29.8350, lng: 122.3980, elevation: 65, name: '大青山国家公园门楼' },
      { lat: 29.8200, lng: 122.3800, elevation: 360, name: '青山绝顶观海台' },
      { lat: 29.8250, lng: 122.3650, elevation: 15, name: '筲箕湾避风港终点' }
    ]
  },
  {
    id: 'taihu-lake-loop',
    name: '环太湖 300km 超级长途耐力巡航线',
    sourceCode: '行者 #1209841',
    region: '湖州/苏州/无锡',
    province: '江浙沪',
    category: 'long-distance',
    categoryLabel: '长途耐力',
    difficulty: '长途挑战',
    distanceKm: 295.0,
    elevationGainM: 380,
    maxAltitudeM: 65,
    avgGradePct: 0.2,
    sceneryRating: 4,
    roadCondition: '全线平原环湖公路与环太湖骑行绿道，平坦笔直',
    bestSeason: '4月 - 6月 / 9月 - 11月',
    description: '华东最具代表性的百公里超级巡航挑战！环绕整个太湖水系，平路高速破风巡航，是检验车队集团巡航与长距离有氧耐力的终极试验场。',
    highlights: ['湖州太湖月亮湾', '宜兴竹海湿地', '无锡鼋头渚', '苏州东山/西山半岛', '太湖大桥'],
    tips: [
      '长途骑行注意合理轮转破风（可节省 35% 体能），制定每 50km 补给计划。',
      '注意夜骑照明，备齐前后高流明车灯与反光安全背心。'
    ],
    waypoints: [
      { lat: 30.9520, lng: 120.1250, elevation: 12, name: '湖州太湖旅游度假区起点' },
      { lat: 31.1850, lng: 119.9200, elevation: 15, name: '长兴太湖图影湿地' },
      { lat: 31.3650, lng: 119.8800, elevation: 18, name: '宜兴大浦骑行驿站' },
      { lat: 31.5200, lng: 120.2100, elevation: 14, name: '无锡太湖鼋头渚' },
      { lat: 31.3200, lng: 120.4500, elevation: 16, name: '苏州太湖国家湿地' },
      { lat: 31.1100, lng: 120.3800, elevation: 15, name: '苏州吴江七都水岸' },
      { lat: 30.9520, lng: 120.1250, elevation: 12, name: '湖州度假区闭环终点' }
    ]
  },
  {
    id: 'beijing-miaofeng-mountain',
    name: '北京门头沟妙峰山经典爬坡线',
    sourceCode: '行者 #1085201',
    region: '北京·门头沟',
    province: '北京',
    category: 'climb',
    categoryLabel: '高山爬坡',
    difficulty: '进阶爬坡',
    distanceKm: 20.5,
    elevationGainM: 880,
    maxAltitudeM: 1020,
    avgGradePct: 4.8,
    sceneryRating: 5,
    roadCondition: '北方公路车标杆圣地，沥青平整，沿途每公里有里程路牌',
    bestSeason: '4月 - 10月',
    description: '北京公路车车手的“大考圣地”！从担礼村金顶妙峰山牌坊出发，20.5公里持续爬升至山顶娘娘庙，坡度均匀，测试 FTP 与爬坡功率的最佳考场。',
    highlights: ['金顶妙峰山牌坊', '担礼村热身段', '涧沟村发卡弯', '妙峰山娘娘庙顶峰'],
    tips: [
      '前 7km 坡度较缓（3%~4%），切忌用力过猛，保持在 Sweet Spot 区间为后半程保留体能。',
      '过涧沟村后的最后 4km 坡度陡增至 7%~8%，是刷 PR 的核心发力点。'
    ],
    waypoints: [
      { lat: 39.9850, lng: 116.0350, elevation: 140, name: '妙峰山牌坊起点' },
      { lat: 40.0250, lng: 116.0380, elevation: 330, name: '桃园村水库' },
      { lat: 40.0520, lng: 116.0250, elevation: 620, name: '涧沟村补给驿站' },
      { lat: 40.0750, lng: 116.0150, elevation: 890, name: '玫瑰谷观景台' },
      { lat: 40.0820, lng: 116.0100, elevation: 1020, name: '金顶妙峰山娘娘庙终点' }
    ]
  },
  {
    id: 'qinghai-lake-epic',
    name: '环青海湖 360km 高原史诗环线',
    sourceCode: '行者 #1002340',
    region: '青海·海北/海南',
    province: '青海',
    category: 'long-distance',
    categoryLabel: '高原史诗',
    difficulty: '终极硬核',
    distanceKm: 360.0,
    elevationGainM: 1450,
    maxAltitudeM: 3820,
    avgGradePct: 0.8,
    sceneryRating: 5,
    roadCondition: '环湖公路沥青路面，地势开阔，高海拔缺氧挑战',
    bestSeason: '6月 - 8月（7-8月万亩油菜花盛开极美）',
    description: '中国最负盛名的公路自行车圣地！环绕中国最大内陆咸水湖，蔚蓝湖水、金色油菜花海与雪山草原相映成趣，平均海拔 3200 米的高原圣境。',
    highlights: ['西海镇原子城', '金沙湾沙漠天路', '二郎剑景区', '黑马河日出', '橡皮山垭口(3820m)', '鸟岛湿地'],
    tips: [
      '平均海拔 3200m，提前适应高海拔缺氧，心率会比平原高 10~15 BPM，控制输出强度。',
      '高原天气多变，紫外线极强，必须做好保暖防雨防晒准备。'
    ],
    waypoints: [
      { lat: 36.9550, lng: 100.9000, elevation: 3100, name: '西海镇骑行大本营起点' },
      { lat: 36.7800, lng: 100.4500, elevation: 3220, name: '金沙湾沙漠公路' },
      { lat: 36.5800, lng: 100.2800, elevation: 3195, name: '二郎剑水上景区' },
      { lat: 36.7200, lng: 99.7800, elevation: 3200, name: '黑马河日出观景点' },
      { lat: 36.9800, lng: 99.8800, elevation: 3190, name: '鸟岛生态保护区' },
      { lat: 37.1500, lng: 100.4200, elevation: 3210, name: '刚察县草原驿站' },
      { lat: 36.9550, lng: 100.9000, elevation: 3100, name: '西海镇闭环终点' }
    ]
  },
  {
    id: 'france-alpe-dhuez',
    name: '法国阿尔卑斯·阿尔普迪埃 21 发卡天路',
    nameEn: "Alpe d'Huez (21 Hairpins) - Tour de France",
    sourceCode: 'Tour de France Classic',
    region: '法国·伊泽尔省 (Isère, France)',
    regionEn: 'Isère, French Alps',
    province: 'Europe',
    category: 'climb',
    categoryLabel: '世界殿堂爬坡',
    categoryLabelEn: 'World Tour Climb',
    difficulty: '终极硬核',
    difficultyEn: 'Extreme HC',
    distanceKm: 13.8,
    elevationGainM: 1061,
    maxAltitudeM: 1850,
    avgGradePct: 8.1,
    sceneryRating: 5,
    roadCondition: '环法特级柏油路面，21 个编号发卡弯，路标清晰',
    roadConditionEn: 'Tour de France HC tarmac, 21 legendary numbered hairpin signs',
    bestSeason: '5月 - 10月 (May - October)',
    description: '环法自行车赛最具传奇色彩的高山终点！从瓦桑堡出发，攀登 21 个带历届赛段冠军铭牌的发卡弯，平均坡度 8.1%，最高海拔 1850 米。',
    descriptionEn: 'The most iconic climb in Tour de France history. 21 numbered hairpins bearing plaques of past stage winners, rising from Le Bourg-d Oisans to 1,850m.',
    highlights: ['瓦桑堡起点', '第21弯 (Marco Pantani)', '拉加尔德村', '第7弯荷兰角 (Dutch Corner)', '环法终点拱门'],
    tips: [
      '前 2km 坡度高达 10%~11%，切忌盲目高功率起步，保持高踏频配速。',
      '每个发卡弯外侧较为平缓，可在弯心借力微调呼吸与齿比。'
    ],
    waypoints: [
      { lat: 45.0550, lng: 6.0300, elevation: 740, name: "瓦桑堡起点 (Le Bourg-d'Oisans)" },
      { lat: 45.0590, lng: 6.0420, elevation: 890, name: '第21弯 (Turn 21 - Pantani)' },
      { lat: 45.0640, lng: 6.0510, elevation: 1080, name: '第16弯 (Turn 16 - La Garde)' },
      { lat: 45.0720, lng: 6.0620, elevation: 1390, name: '第7弯荷兰角 (Dutch Corner)' },
      { lat: 45.0820, lng: 6.0710, elevation: 1650, name: '第3弯 (Turn 3 - Huez Village)' },
      { lat: 45.0920, lng: 6.0720, elevation: 1850, name: '阿尔普迪埃环法终点 (Alpe d Huez Summit)' }
    ]
  },
  {
    id: 'italy-passo-dello-stelvio',
    name: '意大利斯泰尔维奥山口 48 弯天路 (Cima Coppi)',
    nameEn: 'Passo dello Stelvio (48 Hairpins) - Giro d Italia',
    sourceCode: 'Giro d Italia Cima Coppi',
    region: '意大利·南蒂罗尔 (South Tyrol, Italy)',
    regionEn: 'South Tyrol, Italian Alps',
    province: 'Europe',
    category: 'climb',
    categoryLabel: '世界殿堂爬坡',
    categoryLabelEn: 'World Tour Climb',
    difficulty: '终极硬核',
    difficultyEn: 'Extreme HC',
    distanceKm: 24.3,
    elevationGainM: 1808,
    maxAltitudeM: 2758,
    avgGradePct: 7.4,
    sceneryRating: 5,
    roadCondition: '阿尔卑斯高山国家级公路，连续 48 个折返发卡急弯',
    roadConditionEn: 'Alpine pass highway with 48 wall-like engineered switchbacks',
    bestSeason: '6月中旬 - 9月 (June - September)',
    description: '环意自行车赛最高荣誉 Cima Coppi 象征！从普拉托出发攀登 48 个整齐排列如拉链般的发卡弯，直插海拔 2758 米的雪山垭口。',
    descriptionEn: 'The highest paved pass in the Eastern Alps. Climb 48 legendary wall-like switchbacks from Prato allo Stelvio up to the 2,758m Cima Coppi summit.',
    highlights: ['普拉托村起点', '特劳福伊松林段', '第48~30发卡群', '雪山峭壁视线', '海拔2758m斯泰尔维奥垭口'],
    tips: [
      '由于终点海拔高达 2758 米，氧气含量仅平原 72%，心率会显著偏高，防寒衣物不可或缺。',
      '山顶即使盛夏 7 月气温也经常只有 5℃ 左右，下坡前必须换戴全指防风手套。'
    ],
    waypoints: [
      { lat: 46.6180, lng: 10.5900, elevation: 915, name: '普拉托起点 (Prato allo Stelvio)' },
      { lat: 46.5820, lng: 10.5280, elevation: 1370, name: '特劳福伊 (Trafoi Village)' },
      { lat: 46.5510, lng: 10.4920, elevation: 1980, name: '第35发卡弯森林线 (Timberline)' },
      { lat: 46.5360, lng: 10.4680, elevation: 2350, name: '第15弯雪山绝壁群 (High Wall)' },
      { lat: 46.5290, lng: 10.4530, elevation: 2758, name: '斯泰尔维奥山口顶峰 (Stelvio Pass Summit)' }
    ]
  },
  {
    id: 'spain-sa-calobra',
    name: '西班牙马略卡岛·萨卡洛布拉天路 (Coll dels Reis)',
    nameEn: 'Sa Calobra (Coll dels Reis) - Mallorca, Spain',
    sourceCode: 'Mallorca Cycling Paradise',
    region: '西班牙·马略卡岛 (Mallorca, Spain)',
    regionEn: 'Mallorca, Balearic Islands',
    province: 'Europe',
    category: 'climb',
    categoryLabel: '世界殿堂爬坡',
    categoryLabelEn: 'World Tour Climb',
    difficulty: '进阶爬坡',
    difficultyEn: 'Advanced Climb',
    distanceKm: 9.5,
    elevationGainM: 668,
    maxAltitudeM: 682,
    avgGradePct: 7.0,
    sceneryRating: 5,
    roadCondition: '世界级旅游公路，特有 270 度立交螺旋发卡弯（领带结）',
    roadConditionEn: 'Engineered cycling paradise featuring the iconic 270-degree Tie Knot bridge',
    bestSeason: '3月 - 5月 / 9月 - 11月 (March - November)',
    description: '欧洲职业车队冬季冬训圣地！从地中海幽静峡湾港口出发，穿越鬼斧神工的石灰岩峡谷，以 7% 持续均坡攀登至 Coll dels Reis 垭口。',
    descriptionEn: 'The jewel of Mallorca and winter training mecca for WorldTour pros. Climbs from a turquoise cove through sheer limestone cliffs, featuring the 270-degree Tie Knot bridge.',
    highlights: ['萨卡洛布拉港口', '石灰岩石裂谷', '领带结螺旋立交弯 (Nus de Sa Corbata)', 'Coll dels Reis 观景垭口'],
    tips: [
      '由于该路线是死胡同，骑车必须先放坡 10km 到海边再掉头往上爬，下坡时先探明路况。',
      '冬季和早春为欧洲车友聚集高峰期，路面铺装极佳。'
    ],
    waypoints: [
      { lat: 39.8510, lng: 2.7980, elevation: 5, name: '萨卡洛布拉港湾起点 (Port de Sa Calobra)' },
      { lat: 39.8420, lng: 2.8090, elevation: 180, name: '岩壁峡谷发卡弯 (Limestone Gorge)' },
      { lat: 39.8320, lng: 2.8180, elevation: 420, name: '中段盘山折返线 (Mid-Mountain)' },
      { lat: 39.8250, lng: 2.8220, elevation: 590, name: '270度领带结螺旋弯 (The Tie Knot)' },
      { lat: 39.8210, lng: 2.8230, elevation: 682, name: 'Coll dels Reis 垭口顶峰' }
    ]
  }
];
