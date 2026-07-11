const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const topicsRoot = path.join(root, "topics");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

function listHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listHtml(fullPath) : entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function updateIndex() {
  let html = read(indexPath);

  html = html.replace(
    "20 Weeks, 40 Sessions, Complete Presentation Deck Collection",
    "20 Weeks, 32 Session Decks + Exams"
  );
  html = html.replace("Sessions 25-32 Available", "Sessions 1-32 Available");
  html = html.replace(
    "topics/1-Prelim/week3_session6_generative_AI_responsible_use.html\" class=\"session-link\" target=\"_blank\"><span class=\"session-num\">07",
    "topics/1-Prelim/week4_session7_IoT_basics.html\" class=\"session-link\" target=\"_blank\"><span class=\"session-num\">07"
  );
  html = html.replace(
    '<a href="topics/3-Semi-final/week13_session22_5G_applications_digital_divide.html" class="session-link" target="_blank"><span class="session-num">22</span><div class="session-info"><span class="session-title">Green Computing & Sustainable IT</span><span class="session-topic">Network Slicing, PH Connectivity, Inclusion</span></div><span class="session-week">Week 13</span></a>',
    '<a href="topics/3-Semi-final/week13_session22_5G_applications_digital_divide.html" class="session-link" target="_blank"><span class="session-num">22</span><div class="session-info"><span class="session-title">5G Applications & Digital Divide</span><span class="session-topic">Network Slicing, PH Connectivity, Inclusion</span></div><span class="session-week">Week 13</span></a>'
  );
  html = html.replace(
    '<a href="topics/3-Semi-final/week14_session23_green_computing.html" class="session-link" target="_blank"><span class="session-num">22</span><div class="session-info"><span class="session-title">5G Applications & Digital Divide</span><span class="session-topic">E-waste, PUE, Energy, Carbon Footprint</span></div><span class="session-week">Week 14</span></a>',
    '<a href="topics/3-Semi-final/week14_session23_green_computing.html" class="session-link" target="_blank"><span class="session-num">23</span><div class="session-info"><span class="session-title">Green Computing & Sustainable IT</span><span class="session-topic">E-waste, PUE, Energy, Carbon Footprint</span></div><span class="session-week">Week 14</span></a>'
  );

  html = html.replace(/target="_blank"(?!\s+rel=)/g, 'target="_blank" rel="noopener noreferrer"');

  if (!html.includes('name="robots"')) {
    html = html.replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="robots" content="noindex, nofollow">'
    );
  }

  if (!html.includes("assets/js/access-control.js")) {
    html = html.replace(
      "</body>",
      '<script src="assets/js/access-config.js"></script>\n<script src="assets/js/access-control.js"></script>\n</body>'
    );
  }

  write(indexPath, html);
}

function updateTopicPage(file) {
  let html = read(file);
  const match = path.basename(file).match(/session(\d+)/i);
  const topic = match ? match[1].padStart(2, "0") : "";
  const locked = topic && topic !== "01";

  html = html.replace(/<link rel="icon"[^>]*cronasia-icon\.png"[^>]*>\s*/g, "");

  if (locked && !/<html[^>]*data-topic-lock=/.test(html)) {
    html = html.replace(/<html\b([^>]*)>/i, `<html$1 data-topic-lock="${topic}">`);
  }

  html = html.replace(
    /<head>\s*/i,
    '<head>\n<link rel="icon" type="image/png" href="../../cronasia-icon.png">\n'
  );

  if (!html.includes('name="robots"')) {
    html = html.replace(
      /<head>\s*/i,
      '<head>\n<meta name="robots" content="noindex, nofollow">\n'
    );
  }

  if (locked && !html.includes("access-checking")) {
    html = html.replace(
      /<head>\s*/i,
      "<head>\n<script>document.documentElement.classList.add('access-checking');</script>\n"
    );
  }

  if (!html.includes("../../assets/js/access-control.js")) {
    const scriptTags = [
      '<script src="../../assets/js/access-config.js"></script>',
      '<script src="../../assets/js/access-control.js"></script>'
    ].join("\n");

    html = html.replace(/<head>\s*/i, `<head>\n${scriptTags}\n`);
  }

  html = html.replace(
    /function openAnswerKey\(\)\{[\s\S]*?answerWindow\.document\.close\(\);\s*\}/g,
    "function openAnswerKey(){alert('Answer key is available only in the instructor copy.');}"
  );

  write(file, html);
}

updateIndex();
for (const file of listHtml(topicsRoot)) updateTopicPage(file);

console.log("Applied homepage fixes, topic-page favicon links, access gates, and answer-key guards.");
