import { PDFDocument } from "pdf-lib";

export async function createBooklet(inputBytes: Uint8Array): Promise<Uint8Array> {
  const inputPDF = await PDFDocument.load(inputBytes);
  const inputPageCount = inputPDF.getPageCount();

  // A booklet must have a multiple of 4 pages.
  const paddedPageCount = Math.ceil(inputPageCount / 4) * 4;

  /**
   * Returns the source page index for each booklet position.
   * null means "blank page".
   */
  function getBookletPageOrder(totalPages: number): (number | null)[] {
    const order: (number | null)[] = [];

    let left = 0;
    let right = totalPages - 1;

    while (left < right) {
      // Back of sheet
      order.push(right >= inputPageCount ? null : right);
      order.push(left < inputPageCount ? left : null);

      right--;
      left++;

      // Front of sheet
      order.push(left < inputPageCount ? left : null);
      order.push(right >= inputPageCount ? null : right);

      left++;
      right--;
    }

    return order;
  }

  const pageOrder = getBookletPageOrder(paddedPageCount);
  const bookletDoc = await PDFDocument.create();

  // Use the first page's dimensions for blank pages.
  const referencePage = inputPDF.getPage(0);
  const defaultWidth = referencePage.getWidth();
  const defaultHeight = referencePage.getHeight();

  for (let i = 0; i < pageOrder.length; i += 2) {
    const leftPageIndex = pageOrder[i];
    const rightPageIndex = pageOrder[i + 1];

    const leftPage =
      leftPageIndex === null
        ? null
        : inputPDF.getPage(leftPageIndex);

    const rightPage =
      rightPageIndex === null
        ? null
        : inputPDF.getPage(rightPageIndex);

    const leftWidth = leftPage?.getWidth() ?? defaultWidth;
    const leftHeight = leftPage?.getHeight() ?? defaultHeight;

    const rightWidth = rightPage?.getWidth() ?? defaultWidth;
    const rightHeight = rightPage?.getHeight() ?? defaultHeight;

    const width = leftWidth + rightWidth;
    const height = Math.max(leftHeight, rightHeight);

    const newPage = bookletDoc.addPage([width, height]);

    // Only embed actual PDF pages.
    // Blank/padded pages are simply left empty.
    if (leftPage) {
      const leftImage = await bookletDoc.embedPage(leftPage);

      newPage.drawPage(leftImage, {
        x: 0,
        y: 0,
        width: leftWidth,
        height: leftHeight,
      });
    }

    if (rightPage) {
      const rightImage = await bookletDoc.embedPage(rightPage);

      newPage.drawPage(rightImage, {
        x: leftWidth,
        y: 0,
        width: rightWidth,
        height: rightHeight,
      });
    }
  }

  return await bookletDoc.save();
}
