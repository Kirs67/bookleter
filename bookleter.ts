#!/usr/bin/env -S deno run --allow-import --allow-read --allow-write

import { PDFDocument } from 'https://cdn.pika.dev/pdf-lib@^1.7.0';
import { basename, extname } from 'https://deno.land/std@0.203.0/path/mod.ts';

// --- Get input path from command line ---
if (Deno.args.length === 0) {
  console.error("❌ Please provide the path to a PDF file.");
  Deno.exit(1);
}

const inputPath = Deno.args[0];

// Validate file existence
try {
  await Deno.stat(inputPath);
} catch (_) {
  console.error(`❌ File not found: ${inputPath}`);
  Deno.exit(1);
}

// --- Generate output file name ---
const base = basename(inputPath, extname(inputPath));
const outputPath = `${base} booklet.pdf`;


const inputBytes: Uint8Array = await Deno.readFile(inputPath);

const inputPDF = await PDFDocument.load(inputBytes);
const inputPageCount = inputPDF.getPageCount();

const bookletDoc = await PDFDocument.create();

// TODO handle totalPages not divisible by 4
function getBookletPageOrder(totalPages: number) {
  const order: number[] = [];
  let left = 0;
  let right = totalPages - 1;

  while (left < right) {
    order.push(right);
    right--;
    order.push(left);
    left++;
    order.push(left);
    left++;
    order.push(right);
    right--;
  }

  if (left === right) order.push(left);

  return order;
}

const pageOrder = getBookletPageOrder(inputPageCount);

for (let i = 0; i < pageOrder.length; i += 2) {
  const leftPageIndex = pageOrder[i];  // Left page
  const rightPageIndex = pageOrder[i + 1];  // Right page

  const leftPage = inputPDF.getPage(leftPageIndex);
  const rightPage = inputPDF.getPage(rightPageIndex);

  // Create a new page for the booklet with double the width (for left + right)
  const width = leftPage.getWidth() + rightPage.getWidth();
  const height = Math.max(leftPage.getHeight(), rightPage.getHeight());
  const newPage = bookletDoc.addPage([width, height]);

  // Embed the left page (on the left side)
  const leftImage = await bookletDoc.embedPage(leftPage);
  const leftWidth = leftPage.getWidth();
  const leftHeight = leftPage.getHeight();
  newPage.drawPage(leftImage, {
    x: 0,
    y: 0,
    width: leftWidth,
    height: leftHeight,
  });

  // Embed the right page (on the right side)
  const rightImage = await bookletDoc.embedPage(rightPage);
  const rightWidth = rightPage.getWidth();
  const rightHeight = rightPage.getHeight();
  newPage.drawPage(rightImage, {
    x: leftWidth,
    y: 0,
    width: rightWidth,
    height: rightHeight,
  });
}


console.log(`Outputting to "${outputPath}"`)

const bookletBytes = await bookletDoc.save();
await Deno.writeFile(outputPath, bookletBytes);

console.log('Booklet PDF created successfully!');
