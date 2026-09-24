(function () {
  "use strict";

  var lists = document.querySelectorAll(".js-paginated-list");

  Array.prototype.forEach.call(lists, function (list, listIndex) {
    var items = Array.prototype.slice.call(list.children);
    var pageSize = parseInt(list.getAttribute("data-page-size"), 10) || 12;
    var totalPages = Math.ceil(items.length / pageSize);
    var nav = list.nextElementSibling;

    if (!nav || totalPages < 2) return;

    function requestedPage() {
      var value = parseInt(new URLSearchParams(window.location.search).get("page"), 10);
      return Math.min(Math.max(value || 1, 1), totalPages);
    }

    function button(label, page, options) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "collection-pagination__button";
      el.textContent = label;
      el.setAttribute("aria-label", options.label || label);
      el.disabled = Boolean(options.disabled);
      if (options.current) el.setAttribute("aria-current", "page");
      el.addEventListener("click", function () { showPage(page, true); });
      return el;
    }

    function visiblePages(current) {
      var pages = [];
      var start = Math.max(1, current - 2);
      var end = Math.min(totalPages, start + 4);
      start = Math.max(1, end - 4);
      for (var i = start; i <= end; i += 1) pages.push(i);
      return pages;
    }

    function showPage(page, updateUrl) {
      page = Math.min(Math.max(page, 1), totalPages);
      items.forEach(function (item, index) {
        item.hidden = index < (page - 1) * pageSize || index >= page * pageSize;
      });

      nav.innerHTML = "";
      nav.appendChild(button("이전", page - 1, { label: "이전 페이지", disabled: page === 1 }));
      visiblePages(page).forEach(function (number) {
        nav.appendChild(button(String(number), number, {
          label: number + " 페이지",
          current: number === page
        }));
      });
      nav.appendChild(button("다음", page + 1, { label: "다음 페이지", disabled: page === totalPages }));
      nav.hidden = false;

      if (updateUrl) {
        var url = new URL(window.location.href);
        if (page === 1) url.searchParams.delete("page");
        else url.searchParams.set("page", page);
        window.history.pushState({ collectionPage: page }, "", url);
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    if (listIndex === 0) {
      window.addEventListener("popstate", function () { showPage(requestedPage(), false); });
    }
    showPage(requestedPage(), false);
  });
}());
