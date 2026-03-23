import PptxGenJS from 'pptxgenjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Terminal-style color palette
const C = {
  bg: '1a1a2e',
  bgDark: '0d1117',
  bgMid: '16213e',
  green: '4ade80',
  amber: 'fbbf24',
  cyan: '22d3ee',
  purple: 'a78bfa',
  orange: 'f97316',
  gray: '9ca3af',
  grayDim: '4b5563',
  white: 'e0e0e0',
  red: 'f87171',
};

const FONT = 'Courier New';
const FONT_SANS = 'Arial';

function headerBar(slide: PptxGenJS.Slide, label: string) {
  slide.addShape('rect', {
    x: 0, y: 0, w: 13.33, h: 0.55,
    fill: { color: C.bgDark },
    line: { color: C.bgDark, width: 0 },
  });
  slide.addText(label, {
    x: 0.3, y: 0, w: 12, h: 0.55,
    fontSize: 10, color: C.grayDim, fontFace: FONT, valign: 'middle',
  });
  slide.addText('terminal.social', {
    x: 0.3, y: 0, w: 12.7, h: 0.55,
    fontSize: 10, color: C.grayDim, fontFace: FONT, valign: 'middle', align: 'right',
  });
}

function footerBar(slide: PptxGenJS.Slide, pageNum: number, total: number) {
  slide.addShape('rect', {
    x: 0, y: 7.1, w: 13.33, h: 0.4,
    fill: { color: C.bgDark },
    line: { color: C.bgDark, width: 0 },
  });
  slide.addText(`Forkverse · ${pageNum}/${total}`, {
    x: 0.3, y: 7.1, w: 12.7, h: 0.4,
    fontSize: 9, color: C.grayDim, fontFace: FONT, valign: 'middle', align: 'right',
  });
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export interface PptxData {
  repoOwner: string;
  repoName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  size: number;
  openIssues: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  llmModel: string;
  lang: string;
}

export async function generatePptx(data: PptxData, outputDir: string, filename: string): Promise<string> {
  mkdirSync(outputDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
  pptx.author = 'Forkverse';
  pptx.title = `${data.repoOwner}/${data.repoName} Analysis`;

  // Split summary into paragraphs (max 3 chars per slide)
  const paragraphs = data.summary
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const TOTAL_SLIDES = 5;

  // ── Slide 1: Title ──────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.bg };
    headerBar(slide, `$ analyze --repo=${data.repoOwner}/${data.repoName}`);

    // Prompt prefix
    slide.addText('$ analyze --repo=', {
      x: 0.6, y: 0.9, w: 12, h: 0.4,
      fontSize: 14, color: C.grayDim, fontFace: FONT,
    });

    // Repo name (large, amber)
    slide.addText(`${data.repoOwner}/`, {
      x: 0.6, y: 1.25, w: 6, h: 0.8,
      fontSize: 32, color: C.gray, fontFace: FONT, bold: false,
    });
    slide.addText(data.repoName, {
      x: 0.6, y: 1.25, w: 12, h: 0.8,
      fontSize: 32, color: C.amber, fontFace: FONT, bold: true,
      // Rough offset — indent for the "owner/" part
    });

    // Description
    if (data.description) {
      slide.addText(`// ${data.description}`, {
        x: 0.6, y: 2.2, w: 12, h: 0.7,
        fontSize: 14, color: C.gray, fontFace: FONT_SANS, wrap: true,
      });
    }

    // Divider
    slide.addShape('rect', {
      x: 0.6, y: 3.05, w: 12.1, h: 0.02,
      fill: { color: C.grayDim },
      line: { color: C.grayDim, width: 0 },
    });

    // Stats row
    const stats = [
      { label: '★', value: formatNum(data.stars), color: C.amber },
      { label: '◇', value: formatNum(data.forks), color: C.cyan },
      { label: '⚠', value: String(data.openIssues), color: C.orange },
    ];
    stats.forEach((s, i) => {
      slide.addText(`${s.label} ${s.value}`, {
        x: 0.6 + i * 3, y: 3.2, w: 2.8, h: 0.5,
        fontSize: 18, color: s.color, fontFace: FONT, bold: true,
      });
    });
    if (data.language) {
      slide.addText(data.language, {
        x: 9.6, y: 3.2, w: 3, h: 0.5,
        fontSize: 16, color: C.purple, fontFace: FONT, align: 'right',
      });
    }

    // Topics
    if (data.topics.length > 0) {
      slide.addText(data.topics.slice(0, 6).map((t) => `#${t}`).join('  '), {
        x: 0.6, y: 3.85, w: 12, h: 0.45,
        fontSize: 12, color: C.cyan, fontFace: FONT,
      });
    }

    // Footer tag
    slide.addText(`--output=pptx  --model=${data.llmModel}`, {
      x: 0.6, y: 6.4, w: 12, h: 0.4,
      fontSize: 11, color: C.grayDim, fontFace: FONT,
    });

    footerBar(slide, 1, TOTAL_SLIDES);
  }

  // ── Slide 2: Metrics ───────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.bg };
    headerBar(slide, '// repository metrics');

    slide.addText('> metrics --format=table', {
      x: 0.6, y: 0.75, w: 12, h: 0.4,
      fontSize: 12, color: C.green, fontFace: FONT,
    });

    const metrics = [
      { key: 'stars', value: formatNum(data.stars), color: C.amber },
      { key: 'forks', value: formatNum(data.forks), color: C.cyan },
      { key: 'open_issues', value: String(data.openIssues), color: C.orange },
      { key: 'size', value: `${data.size}kb`, color: C.gray },
      { key: 'default_branch', value: data.defaultBranch, color: C.green },
      { key: 'language', value: data.language ?? 'unknown', color: C.purple },
    ];

    metrics.forEach((m, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 0.6 + col * 6.3;
      const y = 1.4 + row * 1.4;

      slide.addShape('rect', {
        x, y, w: 5.8, h: 1.1,
        fill: { color: C.bgMid },
        line: { color: C.grayDim, width: 1 },
      });
      slide.addText(m.key, {
        x: x + 0.2, y: y + 0.1, w: 5.4, h: 0.35,
        fontSize: 10, color: C.grayDim, fontFace: FONT,
      });
      slide.addText(m.value, {
        x: x + 0.2, y: y + 0.45, w: 5.4, h: 0.5,
        fontSize: 22, color: m.color, fontFace: FONT, bold: true,
      });
    });

    if (data.topics.length > 0) {
      slide.addText('// topics', {
        x: 0.6, y: 5.9, w: 12, h: 0.3,
        fontSize: 10, color: C.grayDim, fontFace: FONT,
      });
      slide.addText(data.topics.map((t) => `#${t}`).join('  '), {
        x: 0.6, y: 6.25, w: 12, h: 0.4,
        fontSize: 12, color: C.cyan, fontFace: FONT,
      });
    }

    footerBar(slide, 2, TOTAL_SLIDES);
  }

  // ── Slide 3: Architecture ─────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.bg };
    headerBar(slide, '// architecture & analysis');

    slide.addText('> summary --section=architecture', {
      x: 0.6, y: 0.75, w: 12, h: 0.4,
      fontSize: 12, color: C.green, fontFace: FONT,
    });

    const para1 = paragraphs[0] ?? '';
    const para2 = paragraphs[1] ?? '';
    const combined = [para1, para2].filter(Boolean).join('\n\n');

    slide.addText(combined.slice(0, 900), {
      x: 0.6, y: 1.35, w: 12, h: 5.4,
      fontSize: 13, color: C.white, fontFace: FONT_SANS,
      wrap: true, valign: 'top',
      lineSpacingMultiple: 1.3,
    });

    footerBar(slide, 3, TOTAL_SLIDES);
  }

  // ── Slide 4: Detailed Analysis ────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.bg };
    headerBar(slide, '// detailed analysis');

    slide.addText('> summary --section=details', {
      x: 0.6, y: 0.75, w: 12, h: 0.4,
      fontSize: 12, color: C.green, fontFace: FONT,
    });

    const remaining = paragraphs.slice(2).join('\n\n');
    const fallback = paragraphs.slice(1, 3).join('\n\n');
    const content = remaining || fallback;

    slide.addText((content || data.summary).slice(0, 900), {
      x: 0.6, y: 1.35, w: 12, h: 5.4,
      fontSize: 13, color: C.white, fontFace: FONT_SANS,
      wrap: true, valign: 'top',
      lineSpacingMultiple: 1.3,
    });

    footerBar(slide, 4, TOTAL_SLIDES);
  }

  // ── Slide 5: Generated By ─────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.bg };
    headerBar(slide, '$ analyze --done');

    slide.addText('✓ analysis complete', {
      x: 0.6, y: 1.1, w: 12, h: 0.7,
      fontSize: 28, color: C.green, fontFace: FONT, bold: true,
    });

    const lines = [
      { key: 'repo', value: `${data.repoOwner}/${data.repoName}`, color: C.amber },
      { key: 'model', value: data.llmModel, color: C.cyan },
      { key: 'language', value: data.language ?? 'unknown', color: C.purple },
      { key: 'stars', value: formatNum(data.stars), color: C.amber },
      { key: 'generated', value: new Date().toISOString().slice(0, 10), color: C.gray },
      { key: 'platform', value: 'terminal.social / Forkverse', color: C.grayDim },
    ];

    lines.forEach((l, i) => {
      slide.addText(`  ${l.key.padEnd(12)}`, {
        x: 0.6, y: 2.05 + i * 0.65, w: 3.5, h: 0.55,
        fontSize: 14, color: C.grayDim, fontFace: FONT,
      });
      slide.addText(l.value, {
        x: 4.0, y: 2.05 + i * 0.65, w: 8.8, h: 0.55,
        fontSize: 14, color: l.color, fontFace: FONT, bold: true,
      });
    });

    slide.addText('$ _', {
      x: 0.6, y: 6.3, w: 12, h: 0.4,
      fontSize: 14, color: C.green, fontFace: FONT,
    });

    footerBar(slide, 5, TOTAL_SLIDES);
  }

  // Write to file
  const buf = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  const filePath = path.join(outputDir, filename);
  writeFileSync(filePath, buf);
  return filePath;
}
