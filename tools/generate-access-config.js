const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const configPath = path.join(root, "assets", "js", "access-config.js");

const topics = [
  {
    topic: "02",
    title: "Information Systems & Digital Transformation",
    students: [
      ["SAN JUAN, RAPHAEL MASMELA", "raphael_sanjuan"],
      ["RABOR, RODELIO TANDUYAN", "rodelio_rabor"]
    ]
  },
  {
    topic: "03",
    title: "The Innovation Process",
    students: [
      ["BLASE, IAN RAFAEL CORATIBO", "ian_blase"],
      ["GARCIA, ANGELO", "angelo_garcia"]
    ]
  },
  {
    topic: "04",
    title: "Types of Innovation & Disruptive Technologies",
    students: [
      ["LACABA, MICOH JOSHUA ESPANOLA", "micoh_lacaba"],
      ["RODRIGUEZ, RAVEN BLUZA", "raven_rodriguez"]
    ]
  },
  {
    topic: "05",
    title: "Artificial Intelligence Fundamentals",
    students: [
      ["BERNARDO, JUVAN MEJORADA", "juvan_bernardo"],
      ["MANTALABA, KIDRIEL LAUREL", "kidriel_mantalaba"]
    ]
  },
  { topic: "06", title: "Generative AI & Responsible Use", students: [["HOYOHOY, JOHNBERT ROMBAWA", "johnbert_hoyohoy"]] },
  { topic: "07", title: "Internet of Things (IoT) Basics", students: [["ABELLAR, JERRY MAE UGHOC", "jerrymae_abellar"]] },
  { topic: "08", title: "IoT Risks, Privacy & Case Analysis", students: [["ARMASA, MA. HYAZENTH JHONNS TALAWI", "hyazenth_armasa"]] },
  { topic: "09", title: "Cloud Computing Fundamentals", students: [["AURELIO, FRANZ ISAIA MONLEJON", "franz_aurelio"]] },
  { topic: "10", title: "Cloud Services, Security & Migration", students: [["BURE, NASH DIN RULETE", "nash_bure"]] },
  { topic: "11", title: "Big Data Fundamentals", students: [["CAMLIAN, MOHAMMAD AL-MAYDEN TOBATO", "mohammad_camlian"]] },
  { topic: "12", title: "Big Data Analytics & Applications", students: [["CANAYON, FRANCIS LAWRENZ BUQUIS", "francis_canayon"]] },
  { topic: "13", title: "Cybersecurity Fundamentals", students: [["CARLON, JOSEPH PARDICO", "joseph_carlon"]] },
  { topic: "14", title: "Cybersecurity & Philippine Cyberlaw", students: [["CUENCA, MIKO CARBON", "miko_cuenca"]] },
  { topic: "15", title: "Blockchain Fundamentals", students: [["DAGOHOY, JUREDEN TUGADO", "jureden_dagohoy"]] },
  { topic: "16", title: "Blockchain Applications & Evaluation", students: [["DATIG, HANNAH LYN VALIENTE", "hannah_datig"]] },
  { topic: "17", title: "Extended Reality (XR) Fundamentals", students: [["DELA CRUZ, MARK JOSEPH CORDOVERO", "mark_delacruz"]] },
  { topic: "18", title: "XR Applications & Evaluation", students: [["FERNANDEZ, VINCENT OLIVA", "vincent_fernandez"]] },
  { topic: "19", title: "Robotics & Industrial Automation", students: [["GARCIA, RAVEN", "raven_garcia"]] },
  { topic: "20", title: "Robotics Impact & Future of Work", students: [["GARCIA, JOMARI REAL", "jomari_garcia"]] },
  { topic: "21", title: "5G Networks & Edge Computing", students: [["KUGUIA, NORHAIDIN SAGUIATLA", "norhaidin_kuguia"]] },
  { topic: "22", title: "5G Applications & Digital Divide", students: [["LAURENTE, ALBERTO ABERGONZADO", "alberto_laurente"]] },
  { topic: "23", title: "Green Computing & Sustainable IT", students: [["LUNA, JEANNY JEAN SUPANG", "jeanny_luna"]] },
  { topic: "24", title: "Sustainable Technology & Circular Economy", students: [["MACEDA, FRANK TEANIE GORRA", "frank_maceda"]] },
  { topic: "25", title: "Ethical Issues in Emerging Technologies", students: [["MANGUBAT, MJAY GAIRANOD", "mjay_mangubat"]] },
  { topic: "26", title: "Data Privacy & Intellectual Property", students: [["NAVARRO, ANGELIE JOY BRIGOLE", "angelie_navarro"]] },
  { topic: "27", title: "Design Thinking Process", students: [["ORIAS, ALEXANDRA KATE GALO", "alexandra_orias"]] },
  { topic: "28", title: "Prototyping & Testing", students: [["PINO, JACE CONN ARANAS", "jace_pino"]] },
  { topic: "29", title: "Digital Entrepreneurship & Startups", students: [["RADEN, REYVEN SUMAGAYSAY", "reyven_raden"]] },
  { topic: "30", title: "Digital Business Models", students: [["SEVILLETA, ALLANA AGUILAR", "allana_sevilleta"]] },
  { topic: "31", title: "Smart Applications & Industry 4.0", students: [["SUAN, AIRVEN GLENN CALDO", "airven_suan"]] },
  { topic: "32", title: "Course Synthesis & Final Review", students: [["TUYOR, REYZEL JOHN DALOGDOG", "reyzel_tuyor"]] }
];

function parseEnv(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function envKey(topic, index, suffix) {
  return `TOPIC_${topic}_STUDENT_${index}_${suffix}`;
}

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let i = 0; i < 10; i += 1) {
    output += alphabet[crypto.randomInt(alphabet.length)];
  }
  return output;
}

function quote(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function hash(topic, username, accessCode) {
  return crypto
    .createHash("sha256")
    .update(`${topic}:${username.trim().toLowerCase()}:${accessCode.trim()}`)
    .digest("hex");
}

const existing = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, "utf8")) : {};
const config = {
  generatedAt: new Date().toISOString(),
  topicTitles: {},
  credentialHashes: {}
};

const envLines = [
  "# COGNATES 6 local credential record",
  "# Do not upload this file to GitHub Pages. The public site uses assets/js/access-config.js hashes only.",
  "# If you edit any username or access code here, run: node tools/generate-access-config.js",
  "",
  "COGNATES_ACCESS_MODE=static_hash_gate",
  ""
];

for (const topic of topics) {
  config.topicTitles[topic.topic] = topic.title;
  config.credentialHashes[topic.topic] = [];
  envLines.push(`# Topic ${Number(topic.topic)} - ${topic.title}`);
  envLines.push(`TOPIC_${topic.topic}_TITLE=${quote(topic.title)}`);

  topic.students.forEach(([name, username], zeroIndex) => {
    const number = String(zeroIndex + 1);
    const usernameKey = envKey(topic.topic, number, "USERNAME");
    const codeKey = envKey(topic.topic, number, "ACCESS_CODE");
    const selectedUsername = existing[usernameKey] || username;
    const selectedCode = existing[codeKey] || code();

    envLines.push(`${envKey(topic.topic, number, "NAME")}=${quote(name)}`);
    envLines.push(`${usernameKey}=${selectedUsername}`);
    envLines.push(`${codeKey}=${selectedCode}`);
    config.credentialHashes[topic.topic].push(hash(topic.topic, selectedUsername, selectedCode));
  });

  envLines.push("");
}

fs.writeFileSync(envPath, envLines.join("\n"), "utf8");
fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(
  configPath,
  `window.COGNATES_ACCESS_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});\n`,
  "utf8"
);

console.log(`Wrote ${path.relative(root, envPath)} and ${path.relative(root, configPath)}.`);
