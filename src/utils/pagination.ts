/**
 * Generate page numbers array for pagination with ellipsis gaps.
 */
export const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible = 7
): (number | "ellipsis")[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const sidePages = Math.floor((maxVisible - 3) / 2);

  if (currentPage <= sidePages + 2) {
    for (let i = 1; i <= sidePages + 2; i++) {
      pages.push(i);
    }
    if (sidePages + 3 < totalPages) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
  } else if (currentPage >= totalPages - sidePages - 1) {
    pages.push(1);
    if (totalPages - sidePages - 2 > 1) {
      pages.push("ellipsis");
    }
    for (let i = totalPages - sidePages - 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage - sidePages > 2) {
      pages.push("ellipsis");
    }
    for (let i = currentPage - sidePages; i <= currentPage + sidePages; i++) {
      pages.push(i);
    }
    if (currentPage + sidePages < totalPages - 1) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
  }

  return pages;
};
