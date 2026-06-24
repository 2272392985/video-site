import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

// Dynamically create Prisma client based on DATABASE_URL to support Postgres seeding
const dbUrl = process.env.DATABASE_URL || "";
let prisma: PrismaClient;

if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
  const { neon } = require("@neondatabase/serverless");
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const sql = neon(dbUrl);
  const adapter = new PrismaNeon(sql);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

async function main() {
  console.log("Start seeding...");

  // 1. Clear database
  await prisma.transaction.deleteMany({});
  await prisma.recVideoRel.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.userAction.deleteMany({});
  await prisma.playRecord.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.admin.deleteMany({});

  console.log("Database cleared.");

  // 2. Create Admins
  const hashedAdminPassword = await bcrypt.hash("Admin@123", 10);
  
  const superAdmin = await prisma.admin.create({
    data: {
      account: "admin",
      password: hashedAdminPassword,
      fullName: "系统管理员",
      role: "超级",
      status: "启用",
    },
  });

  const auditAdmin = await prisma.admin.create({
    data: {
      account: "audit_admin",
      password: hashedAdminPassword,
      fullName: "审核员小王",
      role: "审核",
      status: "启用",
    },
  });

  console.log("Admins seeded.");

  // 3. Create Users
  const hashedUserPassword = await bcrypt.hash("User@123", 10);

  const user1 = await prisma.user.create({
    data: {
      username: "user1",
      password: hashedUserPassword,
      email: "user1@example.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=vlog",
      status: "正常",
      adminId: superAdmin.id,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "xiaoming",
      password: hashedUserPassword,
      email: "xiaoming@example.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming",
      status: "正常",
      adminId: superAdmin.id,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: "movie_fan",
      password: hashedUserPassword,
      email: "moviefan@example.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=movie",
      status: "正常",
      adminId: superAdmin.id,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      username: "banned_user",
      password: hashedUserPassword,
      email: "banned@example.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=game",
      status: "禁用",
      adminId: superAdmin.id,
    },
  });

  console.log("Users seeded.");

  // 4. Create Categories
  const catTravel = await prisma.category.create({
    data: { name: "旅行", description: "探索世界，游记分享", creatorId: superAdmin.id },
  });

  const catMovie = await prisma.category.create({
    data: { name: "电影", description: "大片解说，新片分析", creatorId: superAdmin.id },
  });

  const catTech = await prisma.category.create({
    data: { name: "科技", description: "人工智能，数码前沿", creatorId: superAdmin.id },
  });

  const catFood = await prisma.category.create({
    data: { name: "美食", description: "舌尖美味，深夜食堂", creatorId: superAdmin.id },
  });

  const catGame = await prisma.category.create({
    data: { name: "游戏", description: "实况攻略，精彩高能", creatorId: superAdmin.id },
  });

  const catMusic = await prisma.category.create({
    data: { name: "音乐", description: "视觉盛宴，听觉享受", creatorId: superAdmin.id },
  });

  const catAnime = await prisma.category.create({
    data: { name: "动漫", description: "神作盘点，动漫剪辑", creatorId: superAdmin.id },
  });

  const catVlog = await prisma.category.create({
    data: { name: "日常", description: "生活碎片，搞笑吃播", creatorId: superAdmin.id },
  });

  console.log("Categories seeded.");

  // 5. Create Videos
  // Free preview video files from mixkit
  const videosData = [
    {
      title: "京都红叶季旅行攻略",
      description: "探索京都最美的秋天，分享最佳赏枫路线与拍摄点位，极致治愈色彩。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      playCount: 12450,
      likeCount: 568,
      reviewStatus: "通过",
      categoryId: catTravel.id,
      uploaderId: user1.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "年度悬疑神剧全季解析",
      description: "层层反转，烧脑剧情一次看懂！深度解读每一个细节背后的隐喻，揭秘结局真相。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-curious-cat-watching-tv-42526-large.mp4",
      playCount: 34200,
      likeCount: 2150,
      reviewStatus: "通过",
      categoryId: catMovie.id,
      uploaderId: user2.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "深度解读人工智能最新进展",
      description: "AI时代已经来临，大型语言模型在2026年取得了哪些突破性技术？它们将如何改变程序员和各行各业的工作流？",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-keyboard-of-a-lap-top-computer-42527-large.mp4",
      playCount: 8900,
      likeCount: 320,
      reviewStatus: "通过",
      categoryId: catTech.id,
      uploaderId: user1.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "城市里的隐藏美食地图",
      description: "本地人带路！探寻老街深处最地道的市井味道，又搞笑又下饭，绝对不能错过！",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-42528-large.mp4",
      playCount: 15600,
      likeCount: 740,
      reviewStatus: "通过",
      categoryId: catFood.id,
      uploaderId: user2.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "荒野大作全流程实况第一期",
      description: "从零开始的史诗冒险之旅，全程高能实况，带你领略广阔的荒野奇观和硬核的动作解说。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-gaming-setup-neon-lights-42531-large.mp4",
      playCount: 5400,
      likeCount: 280,
      reviewStatus: "通过",
      categoryId: catGame.id,
      uploaderId: user3.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "海浪治愈钢琴曲：夜晚的安静旋律",
      description: "极致治愈的海浪声搭配轻柔钢琴独奏，精选今年最值得静心听的音乐，戴上耳机享受视觉盛宴。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-1527-large.mp4",
      playCount: 24100,
      likeCount: 1890,
      reviewStatus: "通过",
      categoryId: catMusic.id,
      uploaderId: user1.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "热血动漫年度良心巨作盘点",
      description: "盘点今年绝对不能错过的精彩国漫与日漫，超燃动作分镜与热血剧情，第一名那部真的超好看！",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-cartoon-astronaut-in-space-42646-large.mp4",
      playCount: 19800,
      likeCount: 1120,
      reviewStatus: "通过",
      categoryId: catAnime.id,
      uploaderId: user2.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "慵懒周末与小猫的惬意日常vlog",
      description: "记录我和猫咪的慵懒日常，分享一个有趣的周末，放松心情，从日常琐事中寻找幸福感。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-woman-smiling-with-her-cat-in-bed-42548-large.mp4",
      playCount: 6200,
      likeCount: 390,
      reviewStatus: "通过",
      categoryId: catVlog.id,
      uploaderId: user3.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "未来科技：全息显示器技术突破",
      description: "来自实验室的黑科技展示，带你领略未来世界的震撼视觉效果。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-keyboard-of-a-lap-top-computer-42527-large.mp4",
      playCount: 4200,
      likeCount: 156,
      reviewStatus: "通过",
      categoryId: catTech.id,
      uploaderId: user1.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
    },
    {
      title: "用户新提交的待审核视频示例",
      description: "这是一个新投递的视频，内容需要审核员在后台进行审核。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      playCount: 0,
      likeCount: 0,
      reviewStatus: "待审核",
      categoryId: catMovie.id,
      uploaderId: user1.id,
    },
    {
      title: "视频被驳回案例演示",
      description: "该视频由于涉及违规广告或版权问题已被驳回。",
      filePath: "https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-42528-large.mp4",
      playCount: 0,
      likeCount: 0,
      reviewStatus: "驳回",
      categoryId: catFood.id,
      uploaderId: user2.id,
      reviewerId: auditAdmin.id,
      reviewTime: new Date(),
      reviewOpinion: "视频第15秒包含恶意引流网站网址，违反平台投稿规范，请删除后重新上传。",
    },
  ];

  const dbVideos = [];
  for (const v of videosData) {
    const video = await prisma.video.create({
      data: v,
    });
    dbVideos.push(video);
  }

  console.log(`${dbVideos.length} Videos seeded.`);

  // Find some index shortcuts for videos
  const vTravel = dbVideos[0];
  const vMovie = dbVideos[1];
  const vTech = dbVideos[2];
  const vFood = dbVideos[3];
  const vMusic = dbVideos[5];
  const vAnime = dbVideos[6];

  // 6. Create Recommendations
  const carouselRec = await prisma.recommendation.create({
    data: {
      name: "首页焦点轮播",
      description: "首页最顶部的焦点大图推荐列表",
      position: "home_carousel",
      status: "启用",
      creatorId: superAdmin.id,
    },
  });

  const hotRec = await prisma.recommendation.create({
    data: {
      name: "热门视频推荐",
      description: "首页本周热门视频精选",
      position: "home_hot",
      status: "启用",
      creatorId: superAdmin.id,
    },
  });

  // Link recommendations to videos
  await prisma.recVideoRel.create({
    data: { recId: carouselRec.id, videoId: vTravel.id, sortOrder: 1 },
  });
  await prisma.recVideoRel.create({
    data: { recId: carouselRec.id, videoId: vMovie.id, sortOrder: 2 },
  });
  await prisma.recVideoRel.create({
    data: { recId: carouselRec.id, videoId: vMusic.id, sortOrder: 3 },
  });

  await prisma.recVideoRel.create({
    data: { recId: hotRec.id, videoId: vTech.id, sortOrder: 1 },
  });
  await prisma.recVideoRel.create({
    data: { recId: hotRec.id, videoId: vFood.id, sortOrder: 2 },
  });
  await prisma.recVideoRel.create({
    data: { recId: hotRec.id, videoId: vAnime.id, sortOrder: 3 },
  });

  console.log("Recommendations linked.");

  // 7. Create Comments
  const c1 = await prisma.comment.create({
    data: {
      content: "画质真的太棒了，每一帧都可以当壁纸，强烈支持up主！",
      userId: user2.id,
      videoId: vTravel.id,
      likeCount: 32,
    },
  });

  const c2 = await prisma.comment.create({
    data: {
      content: "感谢分享！国庆刚好计划去京都赏枫，这个攻略帮大忙了，路线很合理！",
      userId: user3.id,
      videoId: vTravel.id,
      likeCount: 15,
    },
  });

  // Reply to c2
  await prisma.comment.create({
    data: {
      content: "祝你旅途愉快！如果后期有什么具体的拍摄点位问题，可以随时在群里或者评论区问我哈。",
      userId: user1.id,
      videoId: vTravel.id,
      parentId: c2.id,
      likeCount: 4,
    },
  });

  const c3 = await prisma.comment.create({
    data: {
      content: "这期悬疑剧解说简直封神，把很多埋得极深的细节都串联起来了，看完恍然大悟！",
      userId: user1.id,
      videoId: vMovie.id,
      likeCount: 124,
    },
  });

  const c4 = await prisma.comment.create({
    data: {
      content: "大结局那个反转真的惊到我了，当时头皮发麻，感谢UP主的硬核分析！",
      userId: user3.id,
      videoId: vMovie.id,
      likeCount: 56,
    },
  });

  // Reply to c4
  await prisma.comment.create({
    data: {
      content: "确实，当时我在影院看到那里也是浑身起鸡皮疙瘩，编剧脑洞极其强大！",
      userId: user2.id,
      videoId: vMovie.id,
      parentId: c4.id,
      likeCount: 12,
    },
  });

  console.log("Comments seeded.");

  // 8. Create Favorites and Likes
  await prisma.favorite.create({ data: { userId: user1.id, videoId: vMovie.id } });
  await prisma.favorite.create({ data: { userId: user2.id, videoId: vTravel.id } });
  await prisma.favorite.create({ data: { userId: user3.id, videoId: vMusic.id } });

  await prisma.like.create({ data: { userId: user1.id, likeType: "视频", videoId: vMovie.id } });
  await prisma.like.create({ data: { userId: user2.id, likeType: "视频", videoId: vTravel.id } });
  await prisma.like.create({ data: { userId: user3.id, likeType: "视频", videoId: vMusic.id } });
  
  // Like comments
  await prisma.like.create({ data: { userId: user1.id, likeType: "评论", commentId: c1.id } });
  await prisma.like.create({ data: { userId: user2.id, likeType: "评论", commentId: c3.id } });

  console.log("Likes and Favorites seeded.");

  // 9. Create PlayRecords and UserActions (for admin dashboard dashboard overview)
  await prisma.playRecord.create({
    data: {
      startTime: new Date(Date.now() - 3600 * 1000 * 2),
      endTime: new Date(Date.now() - 3600 * 1000 * 1.5),
      progress: 85,
      deviceType: "PC",
      ipAddress: "127.0.0.1",
      userId: user1.id,
      videoId: vMovie.id,
    },
  });

  await prisma.playRecord.create({
    data: {
      startTime: new Date(Date.now() - 3600 * 1000 * 5),
      endTime: new Date(Date.now() - 3600 * 1000 * 4),
      progress: 100,
      deviceType: "手机",
      ipAddress: "192.168.1.10",
      userId: user2.id,
      videoId: vTravel.id,
    },
  });

  await prisma.userAction.create({
    data: {
      watchDuration: 1200,
      pauseCount: 3,
      seekCount: 5,
      userId: user1.id,
      videoId: vMovie.id,
    },
  });

  // 10. Create Transactions (for admin transactions demo)
  await prisma.transaction.create({
    data: {
      amount: 100.0,
      type: "充值",
      status: "成功",
      payMethod: "微信",
      userId: user1.id,
    },
  });

  await prisma.transaction.create({
    data: {
      amount: 10.0,
      type: "打赏",
      status: "成功",
      payMethod: "支付宝",
      userId: user2.id,
    },
  });

  await prisma.transaction.create({
    data: {
      amount: 50.0,
      type: "充值",
      status: "待支付",
      payMethod: "银行卡",
      userId: user3.id,
    },
  });

  console.log("Play records and Transactions seeded.");
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
