import { PDFDocument } from 'https://cdn.pika.dev/pdf-lib@^1.7.0';

export async function createBooklet(inputBytes: Uint8Array): Promise<Uint8Array> {
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

	return await bookletDoc.save();
}