/* Hướng dẫn sử dụng tương tác: tooltip (hover + chạm) và guided tour theo nhóm.
 * Không đụng tới dữ liệu tài chính; chỉ lưu trạng thái xem hướng dẫn trong localStorage (khóa riêng). */
(function () {
  'use strict';

  var LS_KEY = 'tccn_tutorial_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; } },
    set: function (o) { try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) { /* bỏ qua */ } },
    patch: function (p) { var o = store.get(); for (var k in p) o[k] = p[k]; store.set(o); }
  };

  function headingBefore(id) {
    var n = document.getElementById(id);
    while (n && n !== document.body) {
      var p = n.parentElement;
      if (p) {
        var hs = p.querySelectorAll('h2,h3');
        for (var i = 0; i < hs.length; i++) {
          if (hs[i].compareDocumentPosition(n) & 4) return hs[i];
        }
      }
      n = p;
    }
    return null;
  }
  function closestOf(id, sel) { var e = document.getElementById(id); return e ? (e.closest(sel) || e) : null; }

  /* ------------------------------------------------------------------ */
  /* 1. Tooltip                                                          */
  /* ------------------------------------------------------------------ */
  var TIPS = [
    { sel: '#btn-tab-tukhoa', t: 'Khai báo năm bắt đầu, tuổi và các danh mục thu, chi, đầu tư. Nên làm bước này đầu tiên.' },
    { sel: '#btn-tab-dashboard', t: 'Xem tổng hợp số liệu và biểu đồ về dòng tiền, mục tiêu và đầu tư của bạn.' },
    { sel: '#btn-tab-muctieu-bt', t: 'Viết ra tầm nhìn dài hạn và nhập các mục tiêu cần đạt (số tiền, năm).' },
    { sel: '#btn-tab-muctieu-tc', t: 'Xem khoản cần để dành mỗi tháng cho từng mục tiêu và chọn sản phẩm đầu tư.' },
    { sel: '#btn-tab-candoi', t: 'So sánh thu nhập cần có để đáp ứng các khoản góp với thu nhập theo lộ trình nghề nghiệp.' },
    { sel: '#btn-tab-kehoach', t: 'Lập kế hoạch thu và chi dự kiến cho mỗi tháng.' },
    { sel: '#btn-month-collapsed', t: 'Ghi thu chi thực tế theo từng tháng trong năm.' },
    { sel: '#btn-tab-khaosat', t: 'Trả lời khảo sát để biết mức chấp nhận rủi ro và điều kiện phát triển của bạn.' },
    { sel: '#btn-cloud-save', t: 'Lưu dữ liệu hiện tại vào tài khoản của bạn. Ứng dụng chỉ lưu khi bạn bấm nút này.' },
    { sel: '#btn-cloud-load', t: 'Nhập dữ liệu từ tệp, xuất dữ liệu ra tệp hoặc khôi phục một bản sao lưu.' },
    { sel: '#u021-theme-switch', t: 'Đổi giao diện sáng hoặc tối.' },
    { sel: '#btn-topbar-login', t: 'Đăng nhập để lưu dữ liệu và xem lại ở thiết bị khác.' },
    { sel: '#topbar-user-chip', t: 'Mở menu tài khoản: thông tin, đổi mật khẩu, tham gia nhóm, nhập xuất dữ liệu.' },
    { sel: '#btn-tutorial', t: 'Mở hướng dẫn sử dụng: xem toàn bộ hoặc từng nhóm chức năng.' },

    { sel: '#input-year', t: 'Năm bắt đầu theo dõi (từ 1900 đến 2100). Nhập năm trước, rồi nhập tuổi của bạn tại năm đó.' },
    { sel: '#input-age', t: 'Tuổi của bạn tại năm đã nhập ở ô bên cạnh. Tuổi ở các năm sau được tính tăng dần theo từng năm.' },

    { sel: function () { return headingBefore('tbody-expenses'); }, t: 'Danh mục chi phí bạn dùng khi lập kế hoạch và ghi chi tiêu. Bấm "Thêm" để tạo danh mục mới.', icon: true },
    { sel: function () { return headingBefore('tbody-income'); }, t: 'Danh mục các nguồn thu nhập. Sau khi có danh mục, bạn mới ghi được thu nhập.', icon: true },
    { sel: function () { return headingBefore('tbody-learning'); }, t: 'Danh mục chi cho phát triển bản thân (học tập, đào tạo). Khoản này được theo dõi riêng.', icon: true },
    { sel: function () { return headingBefore('tbody-invest'); }, t: 'Các sản phẩm đầu tư bạn có thể phân bổ cho mục tiêu. Mỗi sản phẩm có lợi suất kỳ vọng mỗi năm.', icon: true },

    { sel: function () { return headingBefore('chartDashCombo12'); }, t: 'Cột thu nhập và chi phí từng tháng, đường là dòng tiền tích lũy sau 12 tháng.', icon: true },
    { sel: function () { return headingBefore('chartDashVariance'); }, t: 'So chi tiêu thực tế với kế hoạch theo từng tháng và cộng dồn chênh lệch qua các tháng.', icon: true },
    { sel: function () { return headingBefore('chart-dashboard-tc-goals-pie'); }, t: 'Tỷ trọng giá trị của từng mục tiêu tài chính trong tổng các mục tiêu.', icon: true },
    { sel: function () { return headingBefore('chartDashGoalsLine'); }, t: 'Số tiền tích lũy cho các mục tiêu qua từng năm.', icon: true },

    { sel: function () { return headingBefore('tbody-tc-form-goals'); }, t: 'Nhập tên mục tiêu, giá trị cần đạt, năm bắt đầu và năm hoàn tất. Số tiền tính theo triệu đồng.', icon: true },
    { sel: '#target-savings-rate-val', t: 'Tỷ lệ thu nhập bạn dự định dành để tiết kiệm đầu tư. Hệ thống dùng tỷ lệ này để tính thu nhập cần có.' },

    { sel: '#btn-tc-sec1', t: 'Phần 1: bảng chi tiết từng mục tiêu và sản phẩm đầu tư được phân bổ.' },
    { sel: '#btn-tc-sec2', t: 'Phần 2: ma trận số tiền cần tiết kiệm và thu nhập cần có theo từng năm.' },
    { sel: '#btn-career-sec1', t: 'Phần 1: phân bổ công cụ tài chính và kỹ năng theo tuổi.' },
    { sel: '#btn-career-sec2', t: 'Phần 2: đối chiếu thu nhập cần có với thu nhập thực tế theo lộ trình.' },

    { sel: '#btn-month-sec1', t: 'Ghi các khoản thu, chi thực tế trong tháng và đối chiếu với kế hoạch.' },
    { sel: '#btn-month-sec2', t: 'Nhật ký chi phí học tập và đào tạo của tháng.' },
    { sel: '#btn-month-sec3', t: 'Bảng cân đối tài sản và nợ cuối năm (chỉ có ở tháng 12).' },
    { sel: function () { return headingBefore('m-summary-income'); }, t: 'Tổng thu, tổng chi thực tế và phần tiết kiệm còn lại của tháng đang xem.', icon: true },
    { sel: function () { return headingBefore('tbody-m-recon-income'); }, t: 'Đối chiếu thu nhập thực tế với kế hoạch. Chênh lệch thu nhập = thực tế trừ kế hoạch; số dương nghĩa là thu nhiều hơn kế hoạch.', icon: true },
    { sel: function () { return headingBefore('tbody-m-recon-expense'); }, t: 'Đối chiếu chi tiêu thực tế với kế hoạch. Chênh lệch chi tiêu = kế hoạch trừ thực tế; số dương nghĩa là chi thấp hơn kế hoạch.', icon: true },

    { sel: '#survey-progress-lbl', t: 'Tiến độ trả lời khảo sát. Cần trả lời đủ các câu để thấy kết quả tổng hợp.' },
    { sel: '#survey-step-btn-1', t: 'Phần 1: mức chấp nhận rủi ro khi quản lý và đầu tư.' },
    { sel: '#survey-step-btn-2', t: 'Phần 2: hoàn cảnh gia đình, trách nhiệm và môi trường phát triển.' }
  ];

  var pop, popTimer, pinnedFor = null, hoverFor = null;

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.id = 'tip-pop';
    pop.setAttribute('role', 'tooltip');
    document.body.appendChild(pop);
    return pop;
  }

  function railCollapsedNow() {
    var b = document.body;
    return b.classList.contains('rail-collapsed') && !b.classList.contains('rail-hover-expanded');
  }

  function placePop(target) {
    var p = ensurePop();
    var r = target.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var pw = p.offsetWidth, ph = p.offsetHeight, gap = 10;
    var onRight = target.closest && target.closest('.sidebar') && vw > 768;
    var x, y, place;
    if (onRight && r.right + gap + pw < vw - 8) {
      x = r.right + gap; y = r.top + r.height / 2 - ph / 2; place = 'right';
    } else if (r.bottom + gap + ph < vh - 8) {
      x = r.left + r.width / 2 - pw / 2; y = r.bottom + gap; place = 'bottom';
    } else {
      x = r.left + r.width / 2 - pw / 2; y = r.top - gap - ph; place = 'top';
    }
    x = Math.max(8, Math.min(x, vw - pw - 8));
    y = Math.max(8, Math.min(y, vh - ph - 8));
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.setAttribute('data-place', place);
  }

  function showTip(target, pinned) {
    var text = target.getAttribute('data-tip');
    if (!text) return;
    var p = ensurePop();
    p.textContent = text;
    p.classList.remove('show');
    p.style.left = '0px'; p.style.top = '0px';
    p.classList.add('measure');
    placePop(target);
    p.classList.remove('measure');
    void p.offsetWidth;
    p.classList.add('show');
    if (target.id !== 'btn-tutorial') target.setAttribute('aria-describedby', 'tip-pop');
    hoverFor = target;
    pinnedFor = pinned ? target : null;
  }

  function hideTip() {
    clearTimeout(popTimer);
    if (pop) pop.classList.remove('show');
    if (hoverFor) hoverFor.removeAttribute('aria-describedby');
    hoverFor = null; pinnedFor = null;
  }

  function applyTips() {
    TIPS.forEach(function (d) {
      var el = typeof d.sel === 'function' ? d.sel() : $(d.sel);
      if (!el || el.getAttribute('data-tip-ready')) return;
      el.setAttribute('data-tip-ready', '1');
      if (d.icon) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'tip-i';
        b.setAttribute('data-tip', d.t);
        b.setAttribute('aria-label', 'Giải thích');
        b.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>';
        el.appendChild(b);
      } else {
        el.setAttribute('data-tip', d.t);
        if (el.hasAttribute('title')) el.removeAttribute('title');
      }
    });
  }

  function bindTips() {
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    document.addEventListener('mouseover', function (e) {
      if (!canHover || tourOn) return;
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t || t === hoverFor || pinnedFor) return;
      if (t.classList.contains('nav-item') && railCollapsedNow()) return;
      clearTimeout(popTimer);
      popTimer = setTimeout(function () { showTip(t, false); }, 220);
    });
    document.addEventListener('mouseout', function (e) {
      if (pinnedFor) return;
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      hideTip();
    });
    document.addEventListener('focusin', function (e) {
      if (tourOn || !e.target.matches || !e.target.matches('[data-tip]')) return;
      if (e.target.classList.contains('nav-item') && railCollapsedNow()) return;
      showTip(e.target, false);
    });
    document.addEventListener('focusout', function () { if (!pinnedFor) hideTip(); });
    document.addEventListener('click', function (e) {
      var icon = e.target.closest && e.target.closest('.tip-i');
      if (icon) {
        e.preventDefault(); e.stopPropagation();
        if (pinnedFor === icon) { hideTip(); } else { showTip(icon, true); }
        return;
      }
      if (pinnedFor) hideTip();
    }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop && pop.classList.contains('show')) hideTip(); });
    window.addEventListener('scroll', function () { if (hoverFor && !pinnedFor) hideTip(); }, true);
    window.addEventListener('resize', hideTip);
  }

  /* ------------------------------------------------------------------ */
  /* 2. Guided tour                                                      */
  /* ------------------------------------------------------------------ */
  function goTab(id) { return function () { if (typeof window.switchTab === 'function') window.switchTab(id); }; }
  function goTc(n) { return function () { goTab('tab-muctieu-tc')(); if (window.switchTcSection) window.switchTcSection(n); }; }
  function goCareer(n) { return function () { goTab('tab-candoi')(); if (window.switchCareerSection) window.switchCareerSection(n); }; }
  function goMonth(sec, month) {
    return function () {
      var m = month || (window.AppState && window.AppState.currentMonth) || (new Date().getMonth() + 1);
      if (typeof window.switchMonthTab === 'function') window.switchMonthTab(m);
      if (typeof window.switchMonthSection === 'function') window.switchMonthSection(sec);
    };
  }
  function goSurvey(n) { return function () { goTab('tab-khaosat')(); if (window.goToSurveyStep) window.goToSurveyStep(n); }; }

  // Mỗi nhóm chỉ giới thiệu nhanh "mục này dùng để làm gì"; chi tiết từng ô đã có tooltip và biểu tượng ⓘ.
  var GROUPS = [
    {
      key: 'A', name: 'Làm quen với giao diện', steps: [
        { pre: goTab('tab-tukhoa'), sel: '#rail-nav-menu', title: 'Menu bên trái', text: 'Chia thành các nhóm: Thiết lập, Mục tiêu và lộ trình, Theo dõi thu chi 12 tháng, Khảo sát. Bấm một mục để mở trang tương ứng.' },
        { sel: '.topbar-right', title: 'Thanh trên cùng', text: 'Hướng dẫn (xem lại bất cứ lúc nào), Nhập dữ liệu (nhập xuất tệp, sao lưu), Lưu, đổi giao diện sáng hoặc tối và tài khoản của bạn.' }
      ]
    },
    {
      key: 'B', name: 'Thiết lập thông tin', steps: [
        { pre: goTab('tab-tukhoa'), sel: '.top-info-row', title: 'Năm và tuổi', text: 'Nhập năm bắt đầu theo dõi (1900 đến 2100) trước, rồi nhập tuổi của bạn tại năm đó.' },
        { sel: '.sheet-tables-container', title: 'Danh mục', text: 'Khai báo danh mục chi phí, thu nhập, chi phát triển bản thân và sản phẩm đầu tư. Đây là nền để lập kế hoạch và ghi thu chi, nên làm trước.' }
      ]
    },
    {
      key: 'C', name: 'Quản lý mục tiêu', steps: [
        { pre: goTab('tab-muctieu-bt'), sel: function () { return closestOf('tbody-tc-form-goals', '.tc-import-container'); }, title: 'Mục tiêu bản thân', text: 'Nhập các mục tiêu: tên, giá trị (triệu đồng), năm bắt đầu và năm hoàn tất, cùng tỷ lệ tiết kiệm bạn dự định.' },
        { pre: goTc(1), sel: '#tc-section-1', title: 'Mục tiêu tài chính', text: 'Mỗi thẻ cho biết khoản cần để dành mỗi tháng. Chọn sản phẩm đầu tư để tính theo lợi suất của sản phẩm. Phần 2 là ma trận tiết kiệm và thu nhập cần có theo từng năm.' }
      ]
    },
    {
      key: 'D', name: 'Cân đối lộ trình', steps: [
        { pre: goCareer(2), sel: '#careerChart', title: 'Cân đối lộ trình', text: 'Phần 1 cho tỷ trọng danh mục theo tuổi. Phần 2 so thu nhập cần có để đáp ứng các khoản góp với thu nhập theo lộ trình; đường lộ trình thấp hơn nghĩa là còn thiếu.' }
      ]
    },
    {
      key: 'E', name: 'Theo dõi tài chính', steps: [
        { pre: goTab('tab-kehoach'), sel: '#tab-kehoach', title: 'Kế hoạch thu chi', text: 'Nhập số tiền dự tính thu và chi cho từng khoản trong tháng, làm cơ sở để so với thực tế.' },
        { pre: goMonth(1), sel: '#m-summary-income', title: 'Theo dõi từng tháng', text: 'Chọn tháng ở menu rồi ghi thu chi thực tế. Bảng đối chiếu cho biết chênh lệch: thu = thực tế trừ kế hoạch, chi = kế hoạch trừ thực tế, số dương là tốt. Tháng 12 có thêm bảng cân đối cuối năm.' },
        { pre: goTab('tab-dashboard'), sel: '#chartDashCombo12', title: 'Tổng quan tài chính', text: 'Xem dòng tiền 12 tháng, mục tiêu, đầu tư và chênh lệch lũy kế. Trang này chỉ để xem, bạn nhập số liệu ở các trang khác.' }
      ]
    },
    {
      key: 'F', name: 'Khảo sát', steps: [
        { pre: goSurvey(1), sel: '#survey-nav-three', title: 'Khảo sát', text: 'Trả lời 21 câu ở hai phần để biết khẩu vị rủi ro và điều kiện phát triển của bạn. Xong sẽ có điểm, nhóm kết quả và khuyến nghị.' }
      ]
    },
    {
      key: 'G', name: 'Lưu trữ và quản lý dữ liệu', steps: [
        { sel: '#btn-cloud-save', title: 'Lưu dữ liệu', text: 'Dữ liệu chỉ được lưu khi bạn bấm Lưu (cần đăng nhập). Nút Nhập dữ liệu để nhập xuất tệp và sao lưu. Muốn dùng ở thiết bị khác, đăng nhập cùng tài khoản và nhớ Lưu trước khi đăng xuất.' }
      ]
    }
  ];
  var tourOn = false, cur = null; // cur: {steps, i, dir, saved}
  var spot, card, menu, nudge;

  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  function ensureTourDom() {
    if (spot) return;
    spot = mk('div', 'tour-spot'); spot.id = 'tour-spot'; spot.setAttribute('aria-hidden', 'true');
    card = mk('div', 'tour-card'); card.id = 'tour-card';
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite'); card.setAttribute('aria-label', 'Hướng dẫn sử dụng');
    document.body.appendChild(spot);
    document.body.appendChild(card);
  }

  function isShown(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  function scrollParent(el) {
    var n = el.parentElement;
    while (n && n !== document.body) {
      var oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 4) return n;
      n = n.parentElement;
    }
    return null;
  }

  function bringIntoView(el) {
    if (el.closest('.sidebar')) return;
    if (el.closest('.app-topbar')) {
      // ≤900px thanh trên cuộn cùng trang: đưa về đầu trang để vùng sáng nhìn thấy được
      var spTop = scrollParent(el);
      if (spTop) spTop.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var small = window.innerWidth <= 640;
    var vh = window.innerHeight;
    var reserve = small ? ((card && card.offsetHeight ? card.offsetHeight : 230) + 24) : 40;
    var r = el.getBoundingClientRect();
    var top = 72, bottom = vh - reserve;
    var delta = 0;
    if (r.height > bottom - top) delta = r.top - top;
    else if (r.top < top) delta = r.top - top - 12;
    else if (r.bottom > bottom) delta = r.bottom - bottom + 12;
    if (!delta) return;
    var sp = scrollParent(el);
    if (sp) sp.scrollBy({ top: delta, behavior: 'smooth' });
    else window.scrollBy({ top: delta, behavior: 'smooth' });
  }

  function layout(el) {
    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var pad = 6;
    var x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
    var w = Math.min(vw - 8 - x, r.width + pad * 2), h = Math.min(vh - 8 - y, r.height + pad * 2);
    var docked = window.innerWidth <= 640;
    if (docked) { card.classList.add('dock'); var maxB = vh - card.offsetHeight - 16; if (y + h > maxB) h = Math.max(24, maxB - y); }
    spot.style.left = x + 'px'; spot.style.top = y + 'px';
    spot.style.width = Math.max(8, w) + 'px'; spot.style.height = Math.max(8, h) + 'px';
    spot.classList.add('on');

    if (docked) { card.style.left = ''; card.style.top = ''; return; }
    card.classList.remove('dock');
    var cw = card.offsetWidth, ch = card.offsetHeight, gap = 14, cx, cy;
    if (x + w + gap + cw < vw - 8) { cx = x + w + gap; cy = y + h / 2 - ch / 2; }
    else if (x - gap - cw > 8) { cx = x - gap - cw; cy = y + h / 2 - ch / 2; }
    else if (y + h + gap + ch < vh - 8) { cx = x + w / 2 - cw / 2; cy = y + h + gap; }
    else if (y - gap - ch > 8) { cx = x + w / 2 - cw / 2; cy = y - gap - ch; }
    else { cx = vw - cw - 16; cy = vh - ch - 16; }
    cx = Math.max(8, Math.min(cx, vw - cw - 8));
    cy = Math.max(8, Math.min(cy, vh - ch - 8));
    card.style.left = cx + 'px'; card.style.top = cy + 'px';
  }

  function resolve(step) {
    var el = typeof step.sel === 'function' ? step.sel() : $(step.sel);
    return el && isShown(el) ? el : null;
  }

  function renderCard(step, idx, total, el) {
    var last = idx === total - 1;
    var dots = '';
    if (total <= 8) { for (var k = 0; k < total; k++) dots += '<span class="tour-dot' + (k === idx ? ' on' : '') + '"></span>'; }
    else dots = '<span class="tour-bar"><span style="width:' + Math.round(((idx + 1) / total) * 100) + '%"></span></span>';
    card.innerHTML =
      '<div class="tour-head"><span class="tour-count">Nhóm ' + cur.group.key + ' · Bước ' + (idx + 1) + '/' + total + '</span>' +
      '<button type="button" class="tour-x" data-act="skip" aria-label="Bỏ qua hướng dẫn"><i class="fa-solid fa-xmark"></i></button></div>' +
      '<div class="tour-title"></div><div class="tour-text"></div>' +
      '<div class="tour-dots" aria-hidden="true">' + dots + '</div>' +
      '<div class="tour-actions">' +
      '<button type="button" class="tour-btn ghost" data-act="skip">Bỏ qua</button>' +
      '<span class="tour-spacer"></span>' +
      (idx > 0 ? '<button type="button" class="tour-btn" data-act="back">Quay lại</button>' : '') +
      '<button type="button" class="tour-btn primary" data-act="' + (last ? 'finish' : 'next') + '">' + (last ? 'Kết thúc hướng dẫn' : 'Tiếp theo') + '</button>' +
      '</div>';
    card.querySelector('.tour-title').textContent = step.title;
    card.querySelector('.tour-text').textContent = step.text;
    card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
  }

  function sidebarFor(step) {
    var sel = typeof step.sel === 'string' ? step.sel : '';
    var inSide = /^#(rail-nav-menu|btn-tab-|btn-month-collapsed)/.test(sel);
    if (window.innerWidth <= 900) document.body.classList.toggle('nav-open', inSide);
  }

  function show(i, dir) {
    var steps = cur.steps;
    if (i < 0) i = 0;
    if (i >= steps.length) { finish(true); return; }
    var step = steps[i];
    cur.i = i; cur.dir = dir || 1;
    try { if (step.pre) step.pre(); } catch (e) { /* bỏ qua */ }
    sidebarFor(step);
    var tries = 0;
    (function wait() {
      if (!tourOn || !cur || cur.steps !== steps || cur.i !== i) return;
      var el = resolve(step);
      var useAlt = false;
      if (!el && step.alt) { el = resolve({ sel: step.alt.sel }); useAlt = !!el; }
      if (!el && tries++ < 6) { setTimeout(wait, 80); return; }
      if (useAlt) { step = { sel: step.alt.sel, title: step.alt.title || step.title, text: step.alt.text, g: step.g }; }
      if (!el) {
        cur.skipped = (cur.skipped || 0) + 1;
        var nx = i + cur.dir;
        if (nx < 0 || nx >= steps.length) { if (cur.dir < 0) { show(i + 1, 1); } else { finish(true); } return; }
        show(nx, cur.dir); return;
      }
      cur.el = el;
      ensureTourDom();
      renderCard(step, i, steps.length, el);
      bringIntoView(el);
      setTimeout(function () { if (cur && cur.el === el) layout(el); }, 300);
      layout(el);
      var primary = card.querySelector('.tour-btn.primary'); if (primary) primary.focus({ preventScroll: true });
    })();
  }

  function end() {
    tourOn = false;
    if (spot) spot.classList.remove('on');
    if (card) card.classList.remove('show', 'dock');
    document.body.classList.remove('nav-open', 'tour-active');
    if (cur && cur.saved) {
      try {
        if (cur.saved.month && typeof window.switchMonthTab === 'function' && cur.saved.tab === 'tab-month') window.switchMonthTab(cur.saved.month);
        else if (cur.saved.tab && typeof window.switchTab === 'function') window.switchTab(cur.saved.tab);
      } catch (e) { /* bỏ qua */ }
    }
    cur = null;
  }

  function finish(completed) {
    var group = cur && cur.group, steps = cur && cur.steps;
    var allMode = cur && cur.all;
    var skipped = cur && cur.skipped;
    if (completed && group) {
      var st = store.get(); st.done = st.done || {}; st.done[allMode ? 'ALL' : group.key] = Date.now(); st.dismissed = true; store.set(st);
    }
    end();
    if (completed) notify(skipped && skipped >= (steps ? steps.length : 0) ? 'Hướng dẫn này dành cho giao diện Sổ tài chính. Hãy chuyển sang "Xem Sổ tài chính" rồi mở lại.' : 'Bạn đã hoàn thành hướng dẫn. Mở lại bất cứ lúc nào bằng nút Hướng dẫn.');
  }

  function currentLocation() {
    var m = window.AppState && window.AppState.currentMonth;
    var tab = $$('.tab-pane').filter(function (p) { return p.classList.contains('active'); })[0];
    return { tab: tab ? tab.id : null, month: m };
  }

  function startTour(keys) {
    closeMenu(); hideTip();
    if (nudge) { nudge.remove(); nudge = null; }
    if (tourOn) end();
    var groups = keys === 'ALL' ? GROUPS : GROUPS.filter(function (g) { return g.key === keys; });
    if (!groups.length) return;
    var steps = [];
    groups.forEach(function (g) { g.steps.forEach(function (s) { steps.push({ pre: s.pre, sel: s.sel, alt: s.alt, title: s.title, text: s.text, g: g }); }); });
    tourOn = true;
    document.body.classList.add('tour-active');
    ensureTourDom();
    cur = { group: groups[0], steps: steps, i: 0, dir: 1, all: keys === 'ALL', saved: currentLocation() };
    show(0, 1);
  }

  /* Gắn nhóm theo từng bước (để nhãn "Nhóm X" đúng khi chạy toàn bộ) */
  var _renderCard = renderCard;
  renderCard = function (step, idx, total, el) {
    if (cur && step.g) cur.group = step.g;
    _renderCard(step, idx, total, el);
  };

  /* ------------------------------------------------------------------ */
  /* 3. Menu hướng dẫn + thông báo                                       */
  /* ------------------------------------------------------------------ */
  function notify(msg) {
    var n = mk('div', 'tour-toast'); n.setAttribute('role', 'status'); n.textContent = msg;
    document.body.appendChild(n);
    requestAnimationFrame(function () { n.classList.add('show'); });
    setTimeout(function () { n.classList.remove('show'); setTimeout(function () { n.remove(); }, 300); }, 4200);
  }

  function closeMenu() { if (menu) { menu.classList.remove('open'); var b = $('#btn-tutorial'); if (b) b.setAttribute('aria-expanded', 'false'); } }
  function toggleMenu() {
    ensureMenu();
    var b = $('#btn-tutorial');
    var open = !menu.classList.contains('open');
    if (!open) { closeMenu(); return; }
    var done = (store.get().done) || {};
    $$('.tm-item', menu).forEach(function (it) { it.classList.toggle('done', !!(done[it.getAttribute('data-k')])); });
    var r = b.getBoundingClientRect();
    menu.classList.add('open');
    var w = menu.offsetWidth;
    menu.style.top = (r.bottom + 8) + 'px';
    menu.style.left = Math.max(8, Math.min(r.right - w, document.documentElement.clientWidth - w - 8)) + 'px';
    b.setAttribute('aria-expanded', 'true');
  }

  function ensureMenu() {
    if (menu) return;
    menu = mk('div', 'tour-menu'); menu.id = 'tour-menu'; menu.setAttribute('role', 'menu');
    var h = '<div class="tm-title">Hướng dẫn sử dụng</div>' +
      '<button type="button" class="tm-item all" role="menuitem" data-k="ALL"><i class="fa-solid fa-play"></i><span>Xem toàn bộ hướng dẫn</span></button><div class="tm-sep"></div>';
    GROUPS.forEach(function (g) {
      h += '<button type="button" class="tm-item" role="menuitem" data-k="' + g.key + '"><b>' + g.key + '</b><span>' + g.name + '</span><i class="fa-solid fa-check tm-check"></i></button>';
    });
    h += '<div class="tm-sep"></div><button type="button" class="tm-item" role="menuitem" data-k="TIPS"><i class="fa-solid fa-circle-info"></i><span>Cách xem các gợi ý ⓘ</span></button>';
    menu.innerHTML = h;
    document.body.appendChild(menu);
    menu.addEventListener('click', function (e) {
      var it = e.target.closest('.tm-item'); if (!it) return;
      var k = it.getAttribute('data-k');
      if (k === 'TIPS') { closeMenu(); notify('Di chuột vào nút, tab hoặc biểu tượng ⓘ để xem giải thích. Trên điện thoại, chạm vào biểu tượng ⓘ.'); return; }
      startTour(k);
    });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (menu.contains(e.target) || (e.target.closest && e.target.closest('#btn-tutorial'))) return;
      closeMenu();
    });
  }

  function showNudge() {
    var s = store.get();
    if (s.dismissed || s.nudged) return;
    store.patch({ nudged: Date.now() });
    var prevFocus = document.activeElement;
    nudge = mk('div', 'tour-nudge');
    nudge.innerHTML = '<div class="tn-box" role="dialog" aria-modal="true" aria-labelledby="tn-q">' +
      '<i class="fa-solid fa-hand tn-icon" aria-hidden="true"></i>' +
      '<div class="tn-q" id="tn-q">Bạn mới sử dụng web phải không?</div>' +
      '<div class="tn-sub">Nếu có, chúng tôi sẽ hướng dẫn nhanh để bạn biết bắt đầu từ đâu. Bạn có thể mở lại hướng dẫn bất cứ lúc nào bằng nút Hướng dẫn.</div>' +
      '<div class="tn-actions"><button type="button" class="tour-btn" data-n="no">Không</button><button type="button" class="tour-btn primary" data-n="yes">Có</button></div></div>';
    document.body.appendChild(nudge);
    requestAnimationFrame(function () { nudge.classList.add('show'); });
    var yes = nudge.querySelector('[data-n="yes"]'); if (yes) yes.focus({ preventScroll: true });
    function answer(go) {
      if (!nudge) return;
      document.removeEventListener('keydown', onKey, true);
      store.patch({ dismissed: true });
      var n = nudge; nudge = null;
      n.classList.remove('show'); setTimeout(function () { n.remove(); }, 250);
      if (go) startTour('ALL'); else if (prevFocus && prevFocus.focus) { try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ } }
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); answer(false); } }
    document.addEventListener('keydown', onKey, true);
    nudge.addEventListener('click', function (e) {
      var b = e.target.closest('[data-n]'); if (!b) return;
      answer(b.getAttribute('data-n') === 'yes');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Khởi tạo                                                            */
  /* ------------------------------------------------------------------ */
  function init() {
    var btn = $('#btn-tutorial');
    if (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
    }
    applyTips();
    bindTips();

    document.addEventListener('click', function (e) {
      if (!tourOn) return;
      var b = e.target.closest && e.target.closest('#tour-card [data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'next') show(cur.i + 1, 1);
      else if (a === 'back') show(cur.i - 1, -1);
      else if (a === 'finish') finish(true);
      else if (a === 'skip') { var st = store.get(); st.dismissed = true; store.set(st); end(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!tourOn) return;
      if (e.key === 'Escape') { end(); }
      else if (e.key === 'ArrowRight') { show(cur.i + 1, 1); }
      else if (e.key === 'ArrowLeft') { show(cur.i - 1, -1); }
    });
    var raf = null;
    function relayout() {
      if (!tourOn || !cur || !cur.el) return;
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; if (cur && cur.el && isShown(cur.el)) layout(cur.el); });
    }
    window.addEventListener('resize', relayout);
    window.addEventListener('scroll', relayout, true);

    // các bảng được vẽ lại sau khi nạp dữ liệu: gắn tooltip cho phần tử xuất hiện muộn
    setTimeout(applyTips, 1500);
    setTimeout(applyTips, 4000);
    setTimeout(showNudge, 3500);

    window.TCCNTutorial = { start: startTour, applyTips: applyTips, groups: GROUPS.map(function (g) { return { key: g.key, name: g.name, steps: g.steps.length }; }), _tips: TIPS.length };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
