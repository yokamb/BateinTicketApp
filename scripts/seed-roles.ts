import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES_DATA = [
  {
    roleName: "IT Support Engineer",
    issueLabel: "Incident (INC)",
    requestLabel: "RITM",
    changeLabel: "Change Request (CR)",
    issueIcon: "🚨",
    requestIcon: "📋",
    changeIcon: "🔄",
    colorScheme: "#FF6B6B,#4ECDC4,#45B7D1"
  },
  {
    roleName: "Software Developer",
    issueLabel: "Bug Report",
    requestLabel: "Feature Request",
    changeLabel: "Code Change / PR",
    issueIcon: "🐛",
    requestIcon: "✨",
    changeIcon: "💻",
    colorScheme: "#FF6B6B,#4ECDC4,#45B7D1"
  },
  {
    roleName: "UX/UI Designer",
    issueLabel: "Design Bug",
    requestLabel: "Design Request",
    changeLabel: "Revision Request",
    issueIcon: "🎨",
    requestIcon: "✏️",
    changeIcon: "🔄",
    colorScheme: "#F39C12,#E67E22,#D68910"
  },
  {
    roleName: "Graphic Designer",
    issueLabel: "Asset Error",
    requestLabel: "Design Brief",
    changeLabel: "Revision Order",
    issueIcon: "🖼️",
    requestIcon: "📄",
    changeIcon: "✏️",
    colorScheme: "#F39C12,#E67E22,#D68910"
  },
  {
    roleName: "Web Developer",
    issueLabel: "Site Issue",
    requestLabel: "Build Request",
    changeLabel: "Scope Change",
    issueIcon: "🌐",
    requestIcon: "🔨",
    changeIcon: "📏",
    colorScheme: "#FF6B6B,#4ECDC4,#45B7D1"
  },
  {
    roleName: "DevOps / Cloud Engineer",
    issueLabel: "Outage Alert",
    requestLabel: "Infra Request",
    changeLabel: "Config Change",
    issueIcon: "⚠️",
    requestIcon: "☁️",
    changeIcon: "⚙️",
    colorScheme: "#3498DB,#2980B9,#1F618D"
  },
  {
    roleName: "Cybersecurity Analyst",
    issueLabel: "Security Alert",
    requestLabel: "Audit Request",
    changeLabel: "Policy Change",
    issueIcon: "🔒",
    requestIcon: "🔍",
    changeIcon: "📜",
    colorScheme: "#E74C3C,#C0392B,#A93226"
  },
  {
    roleName: "Data Scientist / Analyst",
    issueLabel: "Data Anomaly",
    requestLabel: "Analysis Request",
    changeLabel: "Model Update",
    issueIcon: "📊",
    requestIcon: "📈",
    changeIcon: "🔄",
    colorScheme: "#9B59B6,#8E44AD,#7D3C98"
  },
  {
    roleName: "AI/ML Engineer",
    issueLabel: "Model Error",
    requestLabel: "Training Request",
    changeLabel: "Pipeline Change",
    issueIcon: "🤖",
    requestIcon: "🎯",
    changeIcon: "🔧",
    colorScheme: "#9B59B6,#8E44AD,#7D3C98"
  },
  {
    roleName: "Mobile App Developer",
    issueLabel: "App Crash",
    requestLabel: "Feature Request",
    changeLabel: "Build Update",
    issueIcon: "📱",
    requestIcon: "✨",
    changeIcon: "🔄",
    colorScheme: "#FF6B6B,#4ECDC4,#45B7D1"
  },
  {
    roleName: "Content Writer / Copywriter",
    issueLabel: "Content Error",
    requestLabel: "Writing Brief",
    changeLabel: "Copy Revision",
    issueIcon: "✍️",
    requestIcon: "📝",
    changeIcon: "🔄",
    colorScheme: "#2ECC71,#27AE60,#1E8449"
  },
  {
    roleName: "SEO Specialist",
    issueLabel: "Ranking Drop",
    requestLabel: "Optimization Request",
    changeLabel: "Strategy Change",
    issueIcon: "📉",
    requestIcon: "🚀",
    changeIcon: "📈",
    colorScheme: "#3498DB,#2980B9,#1F618D"
  },
  {
    roleName: "Social Media Manager",
    issueLabel: "Post Issue",
    requestLabel: "Campaign Request",
    changeLabel: "Content Revision",
    issueIcon: "💬",
    requestIcon: "📢",
    changeIcon: "🔄",
    colorScheme: "#E1306C,#C13584,#833AB4"
  },
  {
    roleName: "Digital Marketing Specialist",
    issueLabel: "Ad Issue",
    requestLabel: "Campaign Brief",
    changeLabel: "Campaign Change",
    issueIcon: "💰",
    requestIcon: "📊",
    changeIcon: "⚙️",
    colorScheme: "#1ABC9C,#16A085,#117A65"
  },
  {
    roleName: "Video Editor",
    issueLabel: "Edit Error",
    requestLabel: "Edit Request",
    changeLabel: "Revision Cut",
    issueIcon: "🎬",
    requestIcon: "📽️",
    changeIcon: "✂️",
    colorScheme: "#E74C3C,#C0392B,#A93226"
  },
  {
    roleName: "Photographer / Videographer",
    issueLabel: "Shoot Issue",
    requestLabel: "Shoot Request",
    changeLabel: "Retake / Reshoot",
    issueIcon: "📸",
    requestIcon: "🎥",
    changeIcon: "🔄",
    colorScheme: "#34495E,#2C3E50,#1B2631"
  },
  {
    roleName: "Illustrator / Artist",
    issueLabel: "Artwork Error",
    requestLabel: "Commission Request",
    changeLabel: "Artwork Revision",
    issueIcon: "🎨",
    requestIcon: "🖌️",
    changeIcon: "✏️",
    colorScheme: "#D35400,#E67E22,#BA4A00"
  },
  {
    roleName: "3D Artist / Animator",
    issueLabel: "Render Error",
    requestLabel: "Animation Brief",
    changeLabel: "Scene Change",
    issueIcon: "🧊",
    requestIcon: "🎞️",
    changeIcon: "🔧",
    colorScheme: "#8E44AD,#9B59B6,#7D3C98"
  },
  {
    roleName: "Music Producer / Audio Engineer",
    issueLabel: "Audio Issue",
    requestLabel: "Track Request",
    changeLabel: "Mix Revision",
    issueIcon: "🎵",
    requestIcon: "🎧",
    changeIcon: "🎹",
    colorScheme: "#273746,#2C3E50,#1C2833"
  },
  {
    roleName: "Teacher / Tutor",
    issueLabel: "Session Issue",
    requestLabel: "Class Request",
    changeLabel: "Curriculum Change",
    issueIcon: "🍎",
    requestIcon: "📚",
    changeIcon: "🔄",
    colorScheme: "#F1C40F,#D4AC0D,#B7950B"
  },
  {
    roleName: "eLearning Developer",
    issueLabel: "Course Bug",
    requestLabel: "Module Request",
    changeLabel: "Content Update",
    issueIcon: "💻",
    requestIcon: "🎓",
    changeIcon: "🔄",
    colorScheme: "#3498DB,#2980B9,#1F618D"
  },
  {
    roleName: "Translator / Interpreter",
    issueLabel: "Translation Error",
    requestLabel: "Translation Brief",
    changeLabel: "Terminology Change",
    issueIcon: "🗣️",
    requestIcon: "📖",
    changeIcon: "↔️",
    colorScheme: "#1ABC9C,#16A085,#117A65"
  },
  {
    roleName: "Virtual Assistant",
    issueLabel: "Task Blocker",
    requestLabel: "Task Request",
    changeLabel: "Priority Change",
    issueIcon: "📂",
    requestIcon: "✅",
    changeIcon: "⚡",
    colorScheme: "#BDC3C7,#7F8C8D,#34495E"
  },
  {
    roleName: "Project Manager",
    issueLabel: "Risk / Issue Log",
    requestLabel: "Deliverable Request",
    changeLabel: "Scope Change",
    issueIcon: "📉",
    requestIcon: "🏁",
    changeIcon: "📏",
    colorScheme: "#2C3E50,#34495E,#1C2833"
  },
  {
    roleName: "Business Consultant",
    issueLabel: "Engagement Issue",
    requestLabel: "Advisory Request",
    changeLabel: "Strategy Revision",
    issueIcon: "🤝",
    requestIcon: "💡",
    changeIcon: "🔄",
    colorScheme: "#34495E,#2C3E50,#1B2631"
  },
  {
    roleName: "Financial Advisor / Accountant",
    issueLabel: "Report Error",
    requestLabel: "Report Request",
    changeLabel: "Amendment",
    issueIcon: "💵",
    requestIcon: "📄",
    changeIcon: "✏️",
    colorScheme: "#27AE60,#2ECC71,#1E8449"
  },
  {
    roleName: "Legal / Contract Writer",
    issueLabel: "Clause Dispute",
    requestLabel: "Draft Request",
    changeLabel: "Contract Revision",
    issueIcon: "⚖️",
    requestIcon: "📜",
    changeIcon: "🖋️",
    colorScheme: "#2980B9,#3498DB,#21618C"
  },
  {
    roleName: "HR Consultant",
    issueLabel: "Policy Issue",
    requestLabel: "HR Request",
    changeLabel: "Policy Revision",
    issueIcon: "👥",
    requestIcon: "📝",
    changeIcon: "📜",
    colorScheme: "#7D3C98,#8E44AD,#6C3483"
  },
  {
    roleName: "Architect / CAD Designer",
    issueLabel: "Drawing Error",
    requestLabel: "Design Brief",
    changeLabel: "Plan Revision",
    issueIcon: "📐",
    requestIcon: "🏗️",
    changeIcon: "📏",
    colorScheme: "#34495E,#2C3E50,#1B2631"
  },
  {
    roleName: "Interior Designer",
    issueLabel: "Design Conflict",
    requestLabel: "Concept Request",
    changeLabel: "Layout Change",
    issueIcon: "🛋️",
    requestIcon: "🏡",
    changeIcon: "🔄",
    colorScheme: "#D35400,#E67E22,#BA4A00"
  },
  {
    roleName: "Event Planner",
    issueLabel: "Event Issue",
    requestLabel: "Event Brief",
    changeLabel: "Plan Amendment",
    issueIcon: "🎈",
    requestIcon: "📅",
    changeIcon: "📝",
    colorScheme: "#E67E22,#D35400,#A04000"
  },
  {
    roleName: "PR / Communications Specialist",
    issueLabel: "Crisis Alert",
    requestLabel: "PR Brief",
    changeLabel: "Messaging Change",
    issueIcon: "📣",
    requestIcon: "🗞️",
    changeIcon: "✏️",
    colorScheme: "#3498DB,#2980B9,#1F618D"
  },
  {
    roleName: "Customer Support Agent",
    issueLabel: "Support Ticket",
    requestLabel: "New Query",
    changeLabel: "Escalation Update",
    issueIcon: "🎧",
    requestIcon: "📬",
    changeIcon: "⤴️",
    colorScheme: "#1ABC9C,#16A085,#117A65"
  },
  {
    roleName: "Life / Business Coach",
    issueLabel: "Session Issue",
    requestLabel: "Coaching Request",
    changeLabel: "Goal Revision",
    issueIcon: "🧘",
    requestIcon: "🎯",
    changeIcon: "🔄",
    colorScheme: "#9B59B6,#8E44AD,#7D3C98"
  },
  {
    roleName: "Fitness / Wellness Trainer",
    issueLabel: "Health Concern",
    requestLabel: "Program Request",
    changeLabel: "Plan Adjustment",
    issueIcon: "🏋️",
    requestIcon: "🥗",
    changeIcon: "📏",
    colorScheme: "#E74C3C,#C0392B,#A93226"
  }
];

async function main() {
  console.log('Seeding RoleConfig...');
  for (const role of ROLES_DATA) {
    await (prisma as any).roleConfig.upsert({
      where: { roleName: role.roleName },
      update: role,
      create: role,
    });
  }
  console.log('RoleConfig seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
