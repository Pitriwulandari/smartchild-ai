(function () {
  'use strict';

  function setupLucideIcons() {
    var icons = {
      dashboard: 'house', screening: 'clipboard-check', analytics: 'chart-no-axes-combined',
      'admin-users': 'users', 'admin-faskes': 'building-2', 'admin-settings': 'settings',
      education: 'book-open', progress: 'trending-up', guide: 'circle-help', history: 'history'
    };
    document.querySelectorAll('.nav-item[data-view]').forEach(function (item) {
      var icon = item.querySelector('.nav-icon');
      if (icon) {
        icon.textContent = '';
        icon.setAttribute('data-lucide', icons[item.getAttribute('data-view')] || 'circle');
      }
    });
    document.querySelectorAll('.mobile-tab[data-view]').forEach(function (item) {
      var icon = item.querySelector('span');
      var label = (item.querySelector('small') || {}).textContent || '';
      var iconName = icons[item.getAttribute('data-view')] || 'circle';
      if (label.indexOf('Profil') !== -1) iconName = 'user-round';
      if (label.indexOf('Data Balita') !== -1) iconName = 'baby';
      if (label.indexOf('Rujukan') !== -1) iconName = 'send';
      if (label.indexOf('Ekspor') !== -1) iconName = 'download';
      if (label.indexOf('Verifikasi') !== -1) iconName = 'badge-check';
      if (icon) {
        icon.textContent = '';
        icon.setAttribute('data-lucide', iconName);
      }
    });
    document.querySelectorAll('.mobile-fab').forEach(function (button) {
      button.textContent = '';
      button.setAttribute('data-lucide', button.classList.contains('mobile-fab-admin') ? 'download' : 'clipboard-check');
    });
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 2 } });
  }

  setupLucideIcons();
  window.addEventListener('load', setupLucideIcons);

  var launchScreen = document.getElementById('launchScreen');
  if (launchScreen) {
    window.setTimeout(function () {
      launchScreen.classList.add('hidden');
    }, 1800);
  }

  /* ============================================================
     SMARTCHILD AI — script.js
     Semua interaksi UI terwired di sini.
  ============================================================ */

  /* Statistik dataset klinis yang digunakan sebagai referensi analitik. */
  var datasetAnalytics = {
    totalSamples: 6075,
    classification: {
      normal: 4271,
      risk: 1804
    },
    gender: {
      male: 3508,
      female: 2567
    },
    clinicalFactors: {
      jaundice: 1045,
      familyASD: 1122
    }
  };

  /* ----------------------------------------------------------
     1. NAVIGASI SIDEBAR — view switching + active state
  ---------------------------------------------------------- */
  var allNavItems   = document.querySelectorAll('.nav-item[data-view]');
  var allViewPanels = document.querySelectorAll('.view-panel');
  var sidebar       = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  var mainWrapper   = document.getElementById('mainContent') ? document.getElementById('mainContent').closest('.main-wrapper') : document.querySelector('.main-wrapper');
  var activePageRole = document.body.getAttribute('data-page-role');

  function showView(viewId) {
    var permittedNav = document.querySelector('.nav-item[data-view="' + viewId + '"]');
    if (activePageRole && permittedNav) {
      var permittedRoles = permittedNav.getAttribute('data-roles').split(',');
      if (permittedRoles.indexOf(activePageRole) === -1) viewId = 'dashboard';
    }

    // Sembunyikan semua panel
    document.querySelectorAll('.view-panel').forEach(function (p) { p.classList.remove('active'); });
    // Tampilkan panel target
    var target = document.getElementById('view-' + viewId);
    if (target) { target.classList.add('active'); }

    // Update active state di nav
    allNavItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });
    document.querySelectorAll('.mobile-tab[data-view]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });
    closeMobileSheet();
    closeQuickMenu();

    // Scroll ke atas
    var ca = document.querySelector('.content-area');
    if (ca) ca.scrollTop = 0;

    // Tutup sidebar di mobile
    closeSidebar();

    // Inisialisasi chart saat analytics dibuka
    if (viewId === 'analytics') { initCharts(); }

    // Refresh riwayat saat dibuka
    if (viewId === 'history') { renderHistory(); }
  }

  // Wire semua tombol nav di sidebar
  allNavItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showView(btn.getAttribute('data-view'));
    });
  });

  // Wire tombol data-view di luar sidebar (hero, tabel, dll)
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-view]');
    if (el && !el.classList.contains('nav-item')) {
      showView(el.getAttribute('data-view'));
    }
  });

  /* ----------------------------------------------------------
     2. SIDEBAR MOBILE — toggle buka/tutup
  ---------------------------------------------------------- */
  var sidebarToggleBtn = document.getElementById('sidebarToggle');

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
    document.body.classList.add('sidebar-open');
    closeMobileSheet();
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function () {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  var mobileMoreBtn = document.getElementById('mobileMoreBtn');
  var mobileSheet = document.getElementById('mobileSheet');
  var mobileSheetBackdrop = document.getElementById('mobileSheetBackdrop');
  var closeMobileSheetBtn = document.getElementById('closeMobileSheet');
  var quickMenu = document.getElementById('quickMenu');
  var moreActionsBtn = document.getElementById('moreActionsBtn');
  var bellBtn = document.getElementById('bellBtn');
  var notificationMenu;

  function closeMobileSheet() {
    if (mobileSheet) mobileSheet.classList.remove('show');
    if (mobileSheetBackdrop) mobileSheetBackdrop.classList.remove('show');
  }
  function closeQuickMenu() {
    if (quickMenu) quickMenu.classList.remove('show');
  }
  function toggleNotifications() {
    if (!notificationMenu) {
      notificationMenu = document.createElement('div');
      notificationMenu.className = 'notification-menu';
      notificationMenu.innerHTML = '<strong>Notifikasi</strong><p>Belum ada notifikasi baru.</p>';
      var topbarActions = document.querySelector('.topbar-actions');
      if (topbarActions) topbarActions.appendChild(notificationMenu);
    }
    notificationMenu.classList.toggle('show');
    closeQuickMenu();
  }
  if (bellBtn) bellBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleNotifications();
  });
  if (mobileMoreBtn) mobileMoreBtn.addEventListener('click', function () {
    if (mobileSheet) mobileSheet.classList.add('show');
    if (mobileSheetBackdrop) mobileSheetBackdrop.classList.add('show');
  });
  if (closeMobileSheetBtn) closeMobileSheetBtn.addEventListener('click', closeMobileSheet);
  if (mobileSheetBackdrop) mobileSheetBackdrop.addEventListener('click', closeMobileSheet);
  if (moreActionsBtn) moreActionsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (quickMenu) quickMenu.classList.toggle('show');
  });
  document.addEventListener('click', function (e) {
    if (quickMenu && !e.target.closest('#quickMenu') && !e.target.closest('#moreActionsBtn')) closeQuickMenu();
    if (notificationMenu && !e.target.closest('.notification-menu') && !e.target.closest('#bellBtn')) notificationMenu.classList.remove('show');
  });
  var quickLogout = document.getElementById('quickLogout');
  if (quickLogout) quickLogout.addEventListener('click', function () { window.location.href = 'index.html'; });
  var profileLogout = document.getElementById('profileLogout');
  if (profileLogout) profileLogout.addEventListener('click', function () { window.location.href = 'index.html'; });
  var topbarAvatarButton = document.getElementById('topbarAvatar');
  if (topbarAvatarButton) topbarAvatarButton.addEventListener('click', function () { window.location.href = 'index.html'; });

  /* ----------------------------------------------------------
     3. DARK MODE TOGGLE
  ---------------------------------------------------------- */
  var themeBtn = document.getElementById('themeToggle');
  var savedTheme = localStorage.getItem('sc_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeBtn) themeBtn.textContent = 'Light';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var isDark = document.body.classList.toggle('dark');
      themeBtn.textContent = isDark ? 'Light' : 'Dark';
      localStorage.setItem('sc_theme', isDark ? 'dark' : 'light');
      var analyticsPanel = document.getElementById('view-analytics');
      if (analyticsPanel && analyticsPanel.classList.contains('active')) initCharts();
    });
  }

  /* ----------------------------------------------------------
     4. DATA PERTANYAAN Q-CHAT-10
  ---------------------------------------------------------- */
  var Q_PART1 = [
    {
      text: 'A1. Apakah anak Anda merespons saat namanya dipanggil dari jarak normal?',
      opts: ['Selalu', 'Sering', 'Kadang-kadang', 'Jarang', 'Tidak Pernah']
    },
    {
      text: 'A2. Apakah anak Anda melakukan kontak mata yang baik saat berinteraksi dengan Anda?',
      opts: ['Selalu', 'Sering', 'Kadang-kadang', 'Jarang', 'Tidak Pernah']
    },
    {
      text: 'A3. Apakah anak Anda menunjuk dengan jari telunjuk untuk menunjukkan ketertarikannya (Joint Attention)?',
      opts: ['Selalu', 'Sering', 'Kadang-kadang', 'Jarang', 'Tidak Pernah']
    }
  ];

  var Q_PART2 = [
    {
      text: 'A4. Apakah anak Anda melakukan gerakan berulang-ulang seperti mengepakkan tangan (hand-flapping) atau berputar?',
      opts: ['Tidak Pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']
    },
    {
      text: 'A5. Apakah anak Anda memiliki ketertarikan yang sangat kuat terhadap benda-benda yang berputar (seperti roda, kipas)?',
      opts: ['Tidak Pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']
    },
    {
      text: 'A6. Apakah anak Anda menunjukkan reaksi berlebih terhadap suara tajam sehari-hari (seperti suara blender atau vacuum)?',
      opts: ['Tidak Pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']
    }
  ];

  /* Bangun HTML kartu pertanyaan */
  function buildQuestionBlock(containerId, questions, prefix) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = questions.map(function (q, i) {
      var key = prefix + i;
      return '<div class="q-card" id="qcard-' + key + '">' +
        '<h4>' + q.text + '</h4>' +
        '<div class="q-opts">' +
          q.opts.map(function (o, j) {
            return '<div class="q-opt" data-key="' + key + '" data-val="' + j + '">' + o + '</div>';
          }).join('') +
        '</div>' +
        '<div class="q-err">Pilih salah satu jawaban.</div>' +
      '</div>';
    }).join('');

    /* Klik pilihan jawaban */
    container.querySelectorAll('.q-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var key = opt.getAttribute('data-key');
        /* Hapus selected dari sesama opsi */
        container.querySelectorAll('.q-opt[data-key="' + key + '"]').forEach(function (o) {
          o.classList.remove('selected');
        });
        opt.classList.add('selected');
        /* Hapus error state */
        var card = document.getElementById('qcard-' + key);
        if (card) card.classList.remove('has-error');
      });
    });
  }

  buildQuestionBlock('qBlock2', Q_PART1, 'q1_');
  buildQuestionBlock('qBlock3', Q_PART2, 'q2_');

  /* ----------------------------------------------------------
     5. PROGRESS BAR HELPER
  ---------------------------------------------------------- */
  function updateProgressBar(currentStep) {
    for (var s = 1; s <= 4; s++) {
      var stepEl = document.querySelector('.pb-step[data-s="' + s + '"]');
      if (!stepEl) continue;
      stepEl.classList.remove('active', 'done');
      if (s < currentStep)      stepEl.classList.add('done');
      else if (s === currentStep) stepEl.classList.add('active');

      var circle = stepEl.querySelector('.pb-circle');
      if (circle) {
        circle.textContent = s < currentStep ? '✓' : s;
      }
    }
    /* Connector lines */
    var lines = { 'line12': 1, 'line23': 2, 'line34': 3 };
    Object.keys(lines).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('done', currentStep > lines[id]);
    });
  }

  /* ----------------------------------------------------------
     6. MULTI-STEP FORM — navigasi antar step
  ---------------------------------------------------------- */
  var currentStep = 1;

  function goToStep(n) {
    /* Stop kamera jika keluar dari step 4 */
    if (currentStep === 4 && n !== 4) stopCamera();

    /* Sembunyikan step lama, tampilkan step baru */
    var old = document.getElementById('step' + currentStep);
    var next = document.getElementById('step' + n);
    if (old)  old.classList.add('hidden');
    if (next) next.classList.remove('hidden');

    currentStep = n;
    updateProgressBar(n);

    /* Scroll form ke atas */
    var fc = document.querySelector('.form-card');
    if (fc) fc.scrollTop = 0;
    var ca = document.querySelector('.content-area');
    if (ca) ca.scrollTop = 0;
  }

  /* Validasi Biodata (Step 1) */
  document.getElementById('toStep2').addEventListener('click', function () {
    var name = document.getElementById('cName').value.trim();
    var age  = document.getElementById('cAge').value;
    var err  = document.getElementById('step1Error');
    if (!name || !age) {
      err.classList.add('show');
      return;
    }
    err.classList.remove('show');
    goToStep(2);
  });

  /* Validasi Pertanyaan (Step 2 → 3) */
  document.getElementById('toStep3').addEventListener('click', function () {
    if (validateBlock('qBlock2', Q_PART1, 'q1_')) goToStep(3);
  });

  /* Validasi Pertanyaan (Step 3 → 4) */
  document.getElementById('toStep4').addEventListener('click', function () {
    if (validateBlock('qBlock3', Q_PART2, 'q2_')) goToStep(4);
  });

  /* Tombol Kembali */
  document.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToStep(parseInt(btn.getAttribute('data-back'), 10));
    });
  });

  function validateBlock(containerId, questions, prefix) {
    var container = document.getElementById(containerId);
    var valid = true;
    questions.forEach(function (_, i) {
      var key  = prefix + i;
      var card = document.getElementById('qcard-' + key);
      var selected = container.querySelector('.q-opt[data-key="' + key + '"].selected');
      if (!selected) {
        if (card) card.classList.add('has-error');
        valid = false;
      } else {
        if (card) card.classList.remove('has-error');
      }
    });
    if (!valid) {
      /* Scroll ke error pertama */
      var firstErr = container.querySelector('.q-card.has-error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  }

  /* GPS Button */
  document.getElementById('gpsBtn').addEventListener('click', function () {
    var result = document.getElementById('gpsResult');
    result.textContent = '⏳ Mendapatkan lokasi...';
    if (!navigator.geolocation) {
      result.textContent = '📍 Simulasi: Lat -6.2088, Lng 106.8456 (Jakarta)';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        result.textContent = '📍 Lat ' + pos.coords.latitude.toFixed(4) + ', Lng ' + pos.coords.longitude.toFixed(4);
      },
      function () {
        result.textContent = '📍 Simulasi: Lat -6.2088, Lng 106.8456 (Jakarta)';
      },
      { timeout: 5000 }
    );
  });

  /* ----------------------------------------------------------
     7. GAZE TRACKING SIMULATOR
  ---------------------------------------------------------- */
  var gazeScore    = null;
  var mediaStream  = null;
  var gazeInterval = null;
  var moveInterval = null;

  var camVideo      = document.getElementById('camVideo');
  var camFallback   = document.getElementById('camFallback');
  var camFallbackTxt = document.getElementById('camFallbackText');
  var camLabel      = document.getElementById('camLabel');
  var camDot        = document.getElementById('camDot');
  var calibText     = document.getElementById('calibText');
  var neonDot       = document.getElementById('neonDot');
  var meterFill     = document.getElementById('meterFill');
  var focusPct      = document.getElementById('focusPct');
  var gazeStatus    = document.getElementById('gazeStatus');
  var startGazeBtn  = document.getElementById('startGaze');
  var toResultsBtn  = document.getElementById('toResults');

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(function (t) { t.stop(); });
      mediaStream = null;
    }
    if (camVideo)   { camVideo.srcObject = null; }
    if (camFallback){ camFallback.style.display = 'flex'; }
    if (camLabel)   { camLabel.textContent = 'KAMERA NONAKTIF'; }
    if (camDot)     { camDot.classList.remove('active'); }
    if (calibText)  { calibText.style.display = 'none'; }
    if (neonDot)    { neonDot.style.display = 'none'; }
    clearInterval(gazeInterval);
    clearInterval(moveInterval);
  }

  function randomPos() {
    return { x: 10 + Math.random() * 76, y: 10 + Math.random() * 72 };
  }

  startGazeBtn.addEventListener('click', function () {
    startGazeBtn.disabled = true;
    gazeStatus.textContent = 'Meminta izin kamera...';

    /* Coba akses kamera nyata */
    var tryCamera = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      : Promise.reject(new Error('no media'));

    tryCamera.then(function (stream) {
      mediaStream = stream;
      camVideo.srcObject = stream;
      camFallback.style.display = 'none';
      camLabel.textContent = 'KAMERA AKTIF';
      camDot.classList.add('active');
    }).catch(function () {
      camFallbackTxt.textContent = 'Izin kamera tidak tersedia. Simulasi visual berjalan.';
      camFallback.style.display = 'flex';
      camLabel.textContent = 'SIMULASI VISUAL';
      camDot.classList.add('active');
    }).finally(function () {
      startSimulation();
    });
  });

  function startSimulation() {
    calibText.style.display = 'block';
    neonDot.style.display   = 'block';

    var tickCount    = 0;
    var focusSamples = [];

    /* Gerakkan neon dot */
    moveInterval = setInterval(function () {
      var p = randomPos();
      neonDot.style.left = p.x + '%';
      neonDot.style.top  = p.y + '%';
    }, 850);

    /* Posisi awal */
    var p0 = randomPos();
    neonDot.style.left = p0.x + '%';
    neonDot.style.top  = p0.y + '%';

    gazeStatus.textContent = 'Simulasi berjalan... amati respons anak terhadap titik cahaya.';

    gazeInterval = setInterval(function () {
      tickCount++;
      var val = Math.max(20, Math.min(98, 55 + (Math.random() * 38 - 19) + tickCount * 1.5));
      focusSamples.push(val);
      meterFill.style.width = Math.round(val) + '%';
      focusPct.textContent  = Math.round(val) + '%';

      if (tickCount >= 8) {
        clearInterval(gazeInterval);
        clearInterval(moveInterval);

        var avg = focusSamples.reduce(function (a, b) { return a + b; }, 0) / focusSamples.length;
        gazeScore = Math.round(avg);

        
        meterFill.style.width = gazeScore + '%';
        focusPct.textContent  = gazeScore + '%';
        gazeStatus.textContent = 'Selesai. Skor fokus visual rata-rata: ' + gazeScore + '%.';
        calibText.style.display = 'none';

        startGazeBtn.textContent = '🔁 Ulangi Simulasi';
        startGazeBtn.disabled    = false;
        toResultsBtn.disabled    = false;
      }
    }, 720);
  }

  toResultsBtn.addEventListener('click', function () {
    stopCamera();
    runProcessing();
  });

  /* ----------------------------------------------------------
     8. PROCESSING OVERLAY — animasi console log
  ---------------------------------------------------------- */
  var overlay    = document.getElementById('processingOverlay');
  var consoleBox = document.getElementById('consoleBox');

  var CONSOLE_LOGS = [
    'Initializing SmartChild AI Agent...',
    'Reading form parameters & biodata...',
    "Scanning 'dataset_autisme_kaggle.csv' via Pandas...",
    'Running Q-CHAT-10 scoring algorithm...',
    'Calculating composite risk index...',
    'Orchestrating IBM Bob & Langflow Agentic Workflow...',
    'Generating referral letter draft...',
    'Analysis complete. Preparing results...'
  ];

  function runProcessing() {
    overlay.classList.add('show');
    consoleBox.innerHTML = '';
    var i = 0;

    function nextLog() {
      if (i >= CONSOLE_LOGS.length) {
        setTimeout(function () {
          overlay.classList.remove('show');
          computeResults();
          showView('results');
        }, 500);
        return;
      }
      var line = document.createElement('div');
      line.className = 'console-line';
      line.textContent = CONSOLE_LOGS[i];
      consoleBox.appendChild(line);
      /* Force reflow untuk trigger transition */
      line.offsetHeight;
      line.classList.add('show');
      consoleBox.scrollTop = consoleBox.scrollHeight;
      i++;
      setTimeout(nextLog, 420);
    }
    nextLog();
  }

  /* ----------------------------------------------------------
     9. SCORING & HASIL
  ---------------------------------------------------------- */
  function getSelectedVal(containerId, questions, prefix) {
    var container = document.getElementById(containerId);
    var total = 0;
    questions.forEach(function (_, i) {
      var key = prefix + i;
      var sel = container ? container.querySelector('.q-opt[data-key="' + key + '"].selected') : null;
      total += sel ? parseInt(sel.getAttribute('data-val'), 10) : 0;
    });
    return total;
  }

  function computeResults() {
    var name   = (document.getElementById('cName').value.trim()) || '-';
    var age    = document.getElementById('cAge').value || '-';
    var gender = document.getElementById('cGender').value;
    var parent = (document.getElementById('pName').value.trim()) || '-';
    var filler = document.getElementById('cFiller').value;

    var score1 = getSelectedVal('qBlock2', Q_PART1, 'q1_');
    var score2 = getSelectedVal('qBlock3', Q_PART2, 'q2_');
    var totalQChat = score1 + score2;

    /* Fokus visual: skor tinggi = atensi baik = risiko rendah */
    var visualRisk = gazeScore !== null ? (100 - gazeScore) : 40;
    var qchatPct   = Math.min(100, Math.round((totalQChat / 20) * 100));
    var visualPct  = Math.round(visualRisk);
    var overall    = Math.round((qchatPct * 0.7) + (visualPct * 0.3));

    /* Tentukan tier risiko */
    var riskLevel, riskClass, riskLabel, riskTitle, riskDesc, riskRec;
    if (overall < 30) {
      riskLevel = 'low';  riskClass = 'risk-low';
      riskLabel = 'RISIKO RENDAH';
      riskTitle = 'Perkembangan sesuai standar klinis tipikal';
      riskDesc  = 'Berdasarkan instrumen Q-CHAT-10, indikator perilaku anak berada dalam rentang normal usia. Lanjutkan pemantauan rutin di Posyandu.';
      riskRec   = 'Pemantauan rutin bulanan di Posyandu';
    } else if (overall < 60) {
      riskLevel = 'mid';  riskClass = 'risk-mid';
      riskLabel = 'PERLU PERHATIAN';
      riskTitle = 'Ditemukan beberapa indikator atipikal';
      riskDesc  = 'Terdapat beberapa respons yang memerlukan pemantauan lebih lanjut. Disarankan konsultasi dengan petugas kesehatan Puskesmas.';
      riskRec   = 'Konsultasi lanjutan ke Puskesmas dalam 2 minggu';
    } else {
      riskLevel = 'high'; riskClass = 'risk-high';
      riskLabel = 'RISIKO TINGGI';
      riskTitle = 'Indikasi klinis memerlukan evaluasi profesional segera';
      riskDesc  = 'Hasil skrining menunjukkan pola risiko spektrum autisme. Rujukan ke dokter spesialis anak atau psikolog tumbuh kembang sangat disarankan.';
      riskRec   = 'Rujukan segera ke Dokter Spesialis Anak / Psikolog Tumbuh Kembang';
    }

    /* Risk Banner */
    var banner = document.getElementById('riskBanner');
    banner.className = 'risk-banner ' + riskClass;
    document.getElementById('riskNum').textContent   = overall + '%';
    document.getElementById('riskTag').textContent   = riskLabel;
    document.getElementById('riskTitle').textContent = riskTitle;
    document.getElementById('riskDesc').textContent  = riskDesc;

    /* Parameter klinis */
    var categories = [
      { label: 'Skor Q-CHAT-10 (Komunikasi & Sosial)', pct: Math.min(100, Math.round((score1 / 10) * 100)), note: 'Aspek interaksi sosial dan komunikasi.' },
      { label: 'Skor Q-CHAT-10 (Sensorik & Berulang)',  pct: Math.min(100, Math.round((score2 / 10) * 100)), note: 'Aspek perilaku berulang dan sensitivitas.' },
      { label: 'Simulasi Fokus Visual (Gaze Tracking)',  pct: visualPct, note: 'Estimasi atensi visual terhadap stimulus bergerak.' },
      { label: 'Indeks Risiko Komposit',                 pct: overall,   note: 'Nilai gabungan Q-CHAT-10 (70%) + Gaze (30%).' }
    ];
    function colorByPct(p) {
      return p >= 60 ? '#EF4444' : (p >= 35 ? '#F59E0B' : '#10B981');
    }
    document.getElementById('breakdown').innerHTML = categories.map(function (c) {
      var color = colorByPct(c.pct);
      return '<div class="bd-item">' +
        '<div class="bd-header">' +
          '<span class="bd-label">' + c.label + '</span>' +
          '<span style="font-size:12px;font-weight:700;color:' + color + '">' + c.pct + '%</span>' +
        '</div>' +
        '<div class="bd-bar"><div class="bd-fill" style="width:' + c.pct + '%;background:' + color + '"></div></div>' +
        '<div class="bd-note">' + c.note + '</div>' +
      '</div>';
    }).join('');

    /* Panduan stimulasi */
    var guides = [
      { t: 'Penguatan Kontak Mata & Respons Nama',  body: 'Panggil nama anak dari jarak dekat sambil mensejajarkan posisi mata. Beri jeda 3–5 detik sebelum mengulang. Gunakan ekspresi wajah yang ekspresif.', show: totalQChat > 3 },
      { t: 'Latihan Joint Attention & Menunjuk',    body: 'Tunjuk benda menarik di sekitar sambil menyebut namanya bersama anak. Bergantian menunjuk untuk melatih interaksi dua arah.', show: totalQChat > 4 },
      { t: 'Manajemen Sensitivitas Sensorik',        body: 'Kenalkan suara atau tekstur baru secara bertahap dalam suasana tenang. Hindari paparan berlebih pada stimulus yang memicu reaksi negatif.', show: score2 > 3 },
      { t: 'Pemantauan Berkala di Posyandu',         body: 'Lanjutkan kunjungan rutin setiap bulan untuk memantau tumbuh kembang fisik dan psikososial anak secara berkesinambungan.', show: true }
    ];
    document.getElementById('guideList').innerHTML = guides.map(function (g, i) {
      return '<div class="acc-item' + (i === 0 ? ' open' : '') + '">' +
        '<button class="acc-head">' + g.t + '<span class="acc-chev">▼</span></button>' +
        '<div class="acc-body"><div class="acc-body-inner">' + g.body + '</div></div>' +
      '</div>';
    }).join('');
    /* Wire accordion */
    document.querySelectorAll('#guideList .acc-head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.acc-item').classList.toggle('open');
      });
    });

    /* Isi surat rujukan */
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    document.getElementById('letterNo').textContent     = 'No: SC/' + dd + mm + '/' + yyyy;
    document.getElementById('letterDate').textContent   = 'Tanggal: ' + dd + '/' + mm + '/' + yyyy;
    document.getElementById('ltName').textContent       = name;
    document.getElementById('ltAge').textContent        = age + ' bulan';
    document.getElementById('ltGender').textContent     = gender;
    document.getElementById('ltParent').textContent     = parent;
    document.getElementById('ltFiller').textContent     = filler;
    document.getElementById('ltResult').textContent     = riskLabel + ' — Skor Q-CHAT: ' + totalQChat + '/20';
    document.getElementById('ltRec').textContent        = riskRec;

    if (riskLevel === 'low') {
      document.getElementById('letterPerihal').innerHTML = '<strong>Perihal:</strong> Catatan Hasil Skrining Q-CHAT-10 Anak';
      document.getElementById('letterOpening').textContent = 'Bersama surat ini kami sampaikan bahwa anak telah menjalani skrining dengan standar Q-CHAT-10 dengan hasil sebagai berikut:';
      document.getElementById('letterClosing').textContent = 'Hasil skrining menunjukkan perkembangan sesuai usia. Disarankan pemantauan rutin lanjutan di Posyandu setiap bulan.';
    } else {
      document.getElementById('letterPerihal').innerHTML = '<strong>Perihal:</strong> Rujukan Pemeriksaan Lanjutan Tumbuh Kembang Anak';
      document.getElementById('letterOpening').textContent = 'Bersama surat ini kami mengajukan rujukan pemeriksaan lanjutan bagi anak berdasarkan hasil skrining klinis terstandar:';
      document.getElementById('letterClosing').textContent = 'Sehubungan dengan hasil skor di atas, kami memohon kesediaan Sejawat untuk melakukan evaluasi klinis lanjutan guna menentukan intervensi dini yang tepat. Terima kasih atas kerja sama yang baik.';
    }

    /* Simpan ke riwayat */
    saveToHistory({
      name: name, age: age, gender: gender, filler: filler,
      qchat: totalQChat + '/20',
      gaze: gazeScore !== null ? gazeScore + '%' : '-',
      result: riskLabel,
      riskLevel: riskLevel,
      date: dd + '/' + mm + '/' + yyyy
    });

    /* Update stat dashboard */
    updateDashStats();

    sendDataToLangflow({
      nama_anak: name,
      usia_bulan: age,
      jenis_kelamin: gender,
      nama_orang_tua: parent,
      pengisi: filler,
      skor_qchat: totalQChat,
      skor_gaze: gazeScore,
      skor_risiko: overall,
      kategori_risiko: riskLabel
    });
  }

  /* ----------------------------------------------------------
     10. PRINT
  ---------------------------------------------------------- */
  document.getElementById('printBtn').addEventListener('click', function () {
    document.body.classList.add('printing-referral');
    window.print();
    window.setTimeout(function () { document.body.classList.remove('printing-referral'); }, 1000);
  });

  /* ----------------------------------------------------------
     11. RESTART
  ---------------------------------------------------------- */
  document.getElementById('restartBtn').addEventListener('click', function () {
    resetForm();
    showView('screening');
  });

  function resetForm() {
    /* Reset input biodata */
    ['cName','pName','cAge','cWa'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('gpsResult').textContent = '';
    document.getElementById('step1Error').classList.remove('show');

    /* Reset Q-cards */
    document.querySelectorAll('.q-opt').forEach(function (o) { o.classList.remove('selected'); });
    document.querySelectorAll('.q-card').forEach(function (c) { c.classList.remove('has-error'); });

    /* Reset gaze */
    gazeScore = null;
    stopCamera();
    meterFill.style.width = '0%';
    focusPct.textContent  = '0%';
    gazeStatus.textContent = 'Tekan "Aktifkan Kamera & Mulai" untuk memulai simulasi.';
    startGazeBtn.textContent = '🎥 Aktifkan Kamera & Mulai';
    startGazeBtn.disabled    = false;
    toResultsBtn.disabled    = true;

    /* Kembali ke step 1 */
    goToStep(1);
  }
/* ----------------------------------------------------------
     LANGFLOW API INTEGRATION
  ---------------------------------------------------------- */
  function sendDataToLangflow(payloadData) {
    var LANGFLOW_ENDPOINT = 'http://127.0.0.1:7860/api/v1/run/b528e1bb-c486-4f48-b130-94a5af4a2aa9';
    var LANGFLOW_API_KEY = localStorage.getItem('sc_langflow_api_key') || 'sk-FCN94zbe1AvPlhZ_gcocIA_mX0DMCgXRbWsinBopu3Q';
    var promptInput = 'Analisis hasil skrining anak berikut dan berikan rekomendasi yang mudah dipahami: ' + JSON.stringify(payloadData);
    var sessionId = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : 'smartchild-' + Date.now();
    var statusEl = document.getElementById('aiAnalysisResult');

    if (!LANGFLOW_API_KEY) {
      if (statusEl) statusEl.textContent = 'Gunakan widget chat Skrining Autisme AI untuk mendapatkan bantuan analisis Langflow.';
      return;
    }

    if (statusEl) statusEl.textContent = 'Menghubungkan ke Langflow AI...';

    fetch(LANGFLOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LANGFLOW_API_KEY
      },
      body: JSON.stringify({
        output_type: 'chat',
        input_type: 'chat',
        input_value: promptInput,
        session_id: sessionId
      })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      console.log('[SmartChild AI] Respon Langflow:', data);
      var aiText = data && data.outputs && data.outputs[0] && data.outputs[0].outputs && data.outputs[0].outputs[0] && data.outputs[0].outputs[0].results && data.outputs[0].outputs[0].results.message
        ? data.outputs[0].outputs[0].results.message.text
        : 'Langflow mengembalikan respons tanpa teks analisis.';
      if (statusEl) statusEl.textContent = aiText;
      return data;
    })
    .catch(function(err) {
      console.warn('[SmartChild AI] Langflow offline:', err);
      var errorText = err.message === 'Failed to fetch'
        ? 'Langflow tidak dapat dihubungi. Pastikan Langflow berjalan di http://127.0.0.1:7860 dan CORS mengizinkan halaman ini.'
        : 'Langflow menolak request (' + err.message + '). Periksa API key dan konfigurasi flow.';
      if (statusEl) statusEl.textContent = errorText + ' Hasil skrining lokal tetap dapat digunakan.';
    });
  }
  /* ----------------------------------------------------------
     12. RIWAYAT (localStorage)
  ---------------------------------------------------------- */
  var HISTORY_KEY = 'sc_history';

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveHistory(data) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
  }
  function saveToHistory(entry) {
    var hist = getHistory();
    hist.unshift(entry);
    if (hist.length > 50) hist = hist.slice(0, 50);
    saveHistory(hist);
  }

  function renderHistory() {
    var hist = getHistory();
    var empty  = document.getElementById('historyEmpty');
    var wrap   = document.getElementById('historyTableWrap');
    var tbody  = document.getElementById('historyBody');

    if (hist.length === 0) {
      empty.style.display = '';
      wrap.classList.add('hidden');
      return;
    }
    empty.style.display = 'none';
    wrap.classList.remove('hidden');
    tbody.innerHTML = hist.map(function (r, i) {
      var badgeCls = r.riskLevel === 'high' ? 'badge-high' : (r.riskLevel === 'mid' ? 'badge-mid' : 'badge-low');
      return '<tr>' +
        '<td class="muted">' + (i + 1) + '</td>' +
        '<td class="fw">' + r.name + '</td>' +
        '<td>' + r.age + ' bln</td>' +
        '<td>' + r.gender + '</td>' +
        '<td>' + r.filler + '</td>' +
        '<td>' + r.qchat + '</td>' +
        '<td>' + r.gaze + '</td>' +
        '<td><span class="badge ' + badgeCls + '">' + r.result + '</span></td>' +
        '<td class="muted">' + r.date + '</td>' +
      '</tr>';
    }).join('');
  }

  document.getElementById('clearHistory').addEventListener('click', function () {
    if (confirm('Hapus semua riwayat skrining? Tindakan ini tidak dapat dibatalkan.')) {
      saveHistory([]);
      renderHistory();
      updateDashStats();
    }
  });

  function updateDashStats() {
    var hist   = getHistory();
    var high   = hist.filter(function (r) { return r.riskLevel === 'high'; }).length;
    var base   = 1240;
    var highBase = 42;
    var refBase  = 38;

    var elTotal  = document.getElementById('dashTotal');
    var elHigh   = document.getElementById('dashHigh');
    var elRef    = document.getElementById('dashRef');
    if (elTotal) elTotal.textContent = (base + hist.length).toLocaleString('id');
    if (elHigh)  elHigh.textContent  = highBase + high;
    if (elRef)   elRef.textContent   = refBase + high;

    /* Update tabel aktivitas terbaru di dashboard */
    var recent = document.getElementById('recentActivity');
    if (recent && hist.length > 0) {
      var latest = hist.slice(0, 3);
      var seedRows = [
        { name: 'An. Rafi', age: '24', qchat: '18/20', result: 'RISIKO TINGGI',    riskLevel: 'high', date: '14/07/2025' },
        { name: 'An. Sari', age: '18', qchat: '9/20',  result: 'PERLU PERHATIAN', riskLevel: 'mid',  date: '13/07/2025' },
        { name: 'An. Budi', age: '30', qchat: '4/20',  result: 'RISIKO RENDAH',   riskLevel: 'low',  date: '12/07/2025' }
      ];
      var rows = latest.concat(seedRows).slice(0, 3);
      recent.innerHTML = rows.map(function (r) {
        var cls = r.riskLevel === 'high' ? 'badge-high' : (r.riskLevel === 'mid' ? 'badge-mid' : 'badge-low');
        return '<tr>' +
          '<td class="fw">' + r.name + '</td>' +
          '<td>' + r.age + ' bln</td>' +
          '<td>' + r.qchat + '</td>' +
          '<td><span class="badge ' + cls + '">' + r.result + '</span></td>' +
          '<td class="muted">' + r.date + '</td>' +
        '</tr>';
      }).join('');
    }
  }

  function updateDatasetAnalytics() {
    var totalDataEl = document.getElementById('total-dataset-count');
    if (totalDataEl) {
      totalDataEl.textContent = datasetAnalytics.totalSamples.toLocaleString('id-ID') + ' Data Skrining Klinis Terintegrasi';
    }

    var values = {
      'dataset-normal': datasetAnalytics.classification.normal,
      'dataset-risk': datasetAnalytics.classification.risk,
      'dataset-male': datasetAnalytics.gender.male,
      'dataset-female': datasetAnalytics.gender.female,
      'dataset-jaundice': datasetAnalytics.clinicalFactors.jaundice,
      'dataset-family-asd': datasetAnalytics.clinicalFactors.familyASD
    };
    Object.keys(values).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = values[id].toLocaleString('id-ID');
    });
  }

  /* ----------------------------------------------------------
     13. CHART.JS — Analitik & Tren
  ---------------------------------------------------------- */
  var trendChartInstance  = null;
  var donutChartInstance  = null;
  var chartsInitialized   = false;

  function initCharts() {
    if (trendChartInstance) {
      trendChartInstance.destroy();
      trendChartInstance = null;
    }
    if (donutChartInstance) {
      donutChartInstance.destroy();
      donutChartInstance = null;
    }
    chartsInitialized = true;

    var isDark = document.body.classList.contains('dark');
    var gridColor  = isDark ? 'rgba(167, 243, 208, 0.16)' : 'rgba(16, 185, 129, 0.12)';
    var labelColor = isDark ? '#B8EAD0' : '#42665A';

    /* Line Chart — Tren 6 Bulan */
    var trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
      trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: ['Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
          datasets: [
            {
              label: 'Total Skrining',
              data: [148, 175, 192, 210, 235, 280],
              borderColor: '#047857', backgroundColor: 'rgba(16,185,129,0.12)',
              tension: 0.4, fill: true, borderWidth: 3, pointBackgroundColor: '#047857',
              pointBorderColor: '#F4FFF9', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
            },
            {
              label: 'Risiko Tinggi',
              data: [5, 7, 4, 9, 8, 9],
              borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)',
              tension: 0.4, fill: true, borderWidth: 2.5, pointBackgroundColor: '#EF4444',
              pointBorderColor: '#F4FFF9', pointBorderWidth: 2, pointRadius: 4.5, pointHoverRadius: 7
            },
            {
              label: 'Perlu Perhatian',
              data: [22, 28, 30, 35, 40, 48],
              borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.08)',
              tension: 0.4, fill: true, borderWidth: 2.5, pointBackgroundColor: '#F59E0B',
              pointBorderColor: '#F4FFF9', pointBorderWidth: 2, pointRadius: 4.5, pointHoverRadius: 7
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'center',
              labels: { color: labelColor, boxWidth: 28, boxHeight: 4, usePointStyle: true, pointStyle: 'line', font: { size: 11, weight: '700' }, padding: 16 }
            },
            tooltip: {
              mode: 'index', intersect: false,
              backgroundColor: 'rgba(23,53,43,0.94)',
              titleColor: '#F4FFF9', bodyColor: '#D8F5E5',
              borderColor: 'rgba(110,231,183,0.35)', borderWidth: 1,
              padding: 12, cornerRadius: 8, displayColors: true
            }
          },
          scales: {
            x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: labelColor, font: { size: 11, weight: '600' }, padding: 8 } },
            y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: labelColor, font: { size: 11 }, padding: 8 }, beginAtZero: true }
          },
          interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
      });
    }

    /* Donut Chart — Distribusi Risiko */
    var hist = getHistory();
    var cntHigh = 42  + hist.filter(function (r) { return r.riskLevel === 'high'; }).length;
    var cntMid  = 186 + hist.filter(function (r) { return r.riskLevel === 'mid';  }).length;
    var cntLow  = 1012 + hist.filter(function (r) { return r.riskLevel === 'low'; }).length;

    var donutCtx = document.getElementById('donutChart');
    if (donutCtx) {
      donutChartInstance = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Risiko Tinggi', 'Perlu Perhatian', 'Risiko Rendah'],
          datasets: [{
            data: [cntHigh, cntMid, cntLow],
            backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
            borderWidth: 0, hoverOffset: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: labelColor, font: { size: 12 }, padding: 12 } },
            tooltip: { callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct   = Math.round((ctx.parsed / total) * 100);
                return ' ' + ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
              }
            }}
          },
          cutout: '65%'
        }
      });
    }
  }

  /* ----------------------------------------------------------
     15. INIT — jalankan saat halaman siap
  ---------------------------------------------------------- */
  updateDashStats();
  updateDatasetAnalytics();
  updateProgressBar(1);

  /* Pastikan sidebar tampil dan dashboard aktif saat load */
  showView('dashboard');

  /* ----------------------------------------------------------
     15. EDUKASI — filter kategori & expand artikel
  ---------------------------------------------------------- */
  // Filter tombol kategori
  document.querySelectorAll('.edu-filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-cat');
      // Update active button
      document.querySelectorAll('.edu-filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      // Filter video cards
      document.querySelectorAll('.video-card').forEach(function (card) {
        var cardCat = card.getAttribute('data-cat');
        card.style.display = (cat === 'all' || cardCat === cat) ? '' : 'none';
      });
      // Filter artikel
      document.querySelectorAll('.article-card').forEach(function (card) {
        var cardCat = card.getAttribute('data-cat');
        card.style.display = (cat === 'all' || cardCat === cat) ? '' : 'none';
      });
    });
  });

  // Expand / collapse artikel
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('article-toggle')) {
      var card   = e.target.closest('.article-card');
      var expand = card.querySelector('.article-expand');
      var isOpen = expand.classList.toggle('open');
      e.target.textContent = isOpen ? 'Tutup ▲' : 'Baca selengkapnya ▼';
    }
  });

  /* ----------------------------------------------------------
     16. PROGRES ANAK — data milestone per usia & logika
  ---------------------------------------------------------- */
  var MILESTONES = {
    motorik: {
      icon: '🏃',
      label: 'Motorik & Fisik',
      items: [
        { age: 6,  text: 'Tengkurap dan mengangkat kepala',     tip: 'Tummy time 3x sehari selama 5 menit' },
        { age: 9,  text: 'Duduk tanpa bantuan',                 tip: 'Letakkan mainan di depannya saat duduk' },
        { age: 12, text: 'Berdiri dengan pegangan',             tip: 'Bantu anak berdiri sambil pegang furniture' },
        { age: 15, text: 'Berjalan beberapa langkah mandiri',   tip: 'Dorong anak berjalan dengan menawarkan mainan' },
        { age: 18, text: 'Berlari meski sering jatuh',          tip: 'Sediakan ruang aman untuk bergerak' },
        { age: 24, text: 'Naik turun tangga dengan pegangan',   tip: 'Latih di tangga rendah dengan pengawasan' },
        { age: 30, text: 'Melompat dengan dua kaki',            tip: 'Ajak melompat di tempat atau dari ketinggian rendah' },
        { age: 36, text: 'Berdiri satu kaki 1–2 detik',        tip: 'Latihan keseimbangan dengan permainan engklek' }
      ]
    },
    bahasa: {
      icon: '💬',
      label: 'Bahasa & Komunikasi',
      items: [
        { age: 6,  text: 'Mengeluarkan suara ba-ba, ma-ma',     tip: 'Tirukan suara yang dibuat anak' },
        { age: 9,  text: 'Merespons namanya sendiri',           tip: 'Panggil nama dengan variasi intonasi' },
        { age: 12, text: 'Mengucapkan 1–2 kata bermakna',       tip: 'Beri label benda di sekitar setiap hari' },
        { age: 15, text: 'Kosakata 5–10 kata',                  tip: 'Bacakan buku bergambar setiap malam' },
        { age: 18, text: 'Menunjuk gambar saat disebutkan',     tip: 'Bermain "mana yang..." dengan buku bergambar' },
        { age: 24, text: 'Menggunakan kalimat 2 kata',          tip: 'Perluas kalimat anak: "bola" → "bola merah"' },
        { age: 30, text: 'Menggunakan kata tanya "apa/mana"',   tip: 'Jawab pertanyaan anak dengan antusias' },
        { age: 36, text: 'Bercerita dengan 3–4 kalimat',        tip: 'Minta anak ceritakan hari ini sebelum tidur' }
      ]
    },
    sosial: {
      icon: '🤝',
      label: 'Sosial & Emosi',
      items: [
        { age: 6,  text: 'Tersenyum saat melihat wajah dikenal', tip: 'Sering kontak mata dan senyum balik' },
        { age: 9,  text: 'Menunjukkan "stranger anxiety"',       tip: 'Normal — perkenalkan orang baru bertahap' },
        { age: 12, text: 'Melambai da-da saat perpisahan',       tip: 'Biasakan ritual perpisahan yang positif' },
        { age: 18, text: 'Bermain paralel (dekat anak lain)',    tip: 'Bawa ke playgroup atau taman bermain' },
        { age: 24, text: 'Menunjukkan empati dasar',             tip: 'Ajarkan nama emosi: senang, sedih, marah' },
        { age: 30, text: 'Bermain giliran dengan anak lain',     tip: 'Permainan board game sederhana bersama' },
        { age: 36, text: 'Punya teman favorit / sahabat',        tip: 'Fasilitasi playdates secara rutin' }
      ]
    },
    kognitif: {
      icon: '🧩',
      label: 'Kognitif & Belajar',
      items: [
        { age: 6,  text: 'Mencari mainan yang disembunyikan',    tip: 'Permainan cilukba dan benda tersembunyi' },
        { age: 9,  text: 'Memahami sebab-akibat sederhana',      tip: 'Biarkan anak eksplorasi mainan sendiri' },
        { age: 12, text: 'Meniru tindakan orang dewasa',         tip: 'Libatkan anak dalam aktivitas rumah tangga' },
        { age: 18, text: 'Mengelompokkan benda berdasarkan warna', tip: 'Bermain sortir dengan benda warna-warni' },
        { age: 24, text: 'Bermain pura-pura (pretend play)',     tip: 'Sediakan miniatur dapur, tools, dll' },
        { age: 30, text: 'Mengenal bentuk dasar (lingkaran, kotak)', tip: 'Puzzle bentuk sederhana' },
        { age: 36, text: 'Menghitung 1–5 dengan menunjuk',       tip: 'Hitung anak tangga, buah, mainan bersama' }
      ]
    }
  };

  var PROG_KEY = 'sc_progress';

  function loadProgData(childKey) {
    try { return JSON.parse(localStorage.getItem(PROG_KEY + '_' + childKey)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgData(childKey, data) {
    localStorage.setItem(PROG_KEY + '_' + childKey, JSON.stringify(data));
  }

  document.getElementById('loadMilestones').addEventListener('click', function () {
    var name = document.getElementById('progName').value.trim();
    var age  = parseInt(document.getElementById('progAge').value, 10);
    if (!name || !age || age < 1) { alert('Isi nama dan usia anak terlebih dahulu.'); return; }
    renderMilestones(name, age);
  });

  function renderMilestones(name, age) {
    var panel = document.getElementById('milestonePanel');
    var childKey = name.toLowerCase().replace(/\s+/g, '_') + '_' + age;
    var savedData = loadProgData(childKey);

    panel.style.display = 'block';
    document.getElementById('progAvatar').textContent     = name.charAt(0).toUpperCase();
    document.getElementById('progNameDisplay').textContent = name;
    document.getElementById('progAgeDisplay').textContent  = age + ' bulan';

    var content = document.getElementById('milestoneContent');
    content.innerHTML = '';

    var totalItems = 0;
    var doneCount  = 0;

    Object.keys(MILESTONES).forEach(function (domainKey) {
      var domain = MILESTONES[domainKey];
      // Filter item relevan: usia ≤ age + 6 (tampilkan sedikit ke depan)
      var items = domain.items.filter(function (item) { return item.age <= age + 6; });
      if (items.length === 0) return;

      totalItems += items.length;

      var domainEl = document.createElement('div');
      domainEl.className = 'milestone-domain';

      var domainDone = items.filter(function (item) {
        return savedData[domainKey + '_' + item.age] === 'done';
      }).length;
      doneCount += domainDone;

      var badgeColor = domainDone === items.length ? '#D1FAE5;color:#065F46'
        : domainDone > 0 ? '#D8F5E5;color:#047857' : '#E2E8F0;color:#475569';

      domainEl.innerHTML =
        '<button class="milestone-domain-head" data-domain="' + domainKey + '">' +
          '<div class="milestone-domain-title">' +
            '<span class="milestone-domain-icon">' + domain.icon + '</span>' +
            '<div>' +
              '<div class="milestone-domain-label">' + domain.label + '</div>' +
              '<div class="milestone-domain-meta">' + domainDone + '/' + items.length + ' tercapai</div>' +
            '</div>' +
          '</div>' +
          '<span class="milestone-domain-badge" style="background:' + badgeColor + '">' +
            (domainDone === items.length ? '✅ Selesai' : domainDone + '/' + items.length) +
          '</span>' +
        '</button>' +
        '<div class="milestone-body open" id="mbd-' + domainKey + '">' +
          items.map(function (item) {
            var itemKey  = domainKey + '_' + item.age;
            var state    = savedData[itemKey] || '';
            var isDue    = item.age <= age;
            var isDone   = state === 'done';
            var isAlert  = isDue && !isDone;
            var cls      = isDone ? 'done' : (isAlert ? 'alert' : '');
            var checkMark = isDone ? '✓' : (isAlert ? '!' : '');
            return '<div class="milestone-item ' + cls + '" data-key="' + itemKey + '" data-domain="' + domainKey + '">' +
              '<div class="milestone-check">' + checkMark + '</div>' +
              '<div class="milestone-text">' +
                '<strong>Usia ' + item.age + ' bln — ' + item.text + '</strong>' +
                '<span>' + item.tip + '</span>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';

      // Toggle domain accordion
      var headBtn = domainEl.querySelector('.milestone-domain-head');
      headBtn.addEventListener('click', function () {
        var body = domainEl.querySelector('.milestone-body');
        body.classList.toggle('open');
      });

      // Klik item untuk toggle done
      domainEl.querySelectorAll('.milestone-item').forEach(function (item) {
        item.addEventListener('click', function () {
          var k = item.getAttribute('data-key');
          var isDone = item.classList.contains('done');
          if (isDone) {
            item.classList.remove('done');
            item.querySelector('.milestone-check').textContent = '';
            savedData[k] = '';
          } else {
            item.classList.remove('alert');
            item.classList.add('done');
            item.querySelector('.milestone-check').textContent = '✓';
            savedData[k] = 'done';
          }
          updateProgSummary(name, age, savedData);
        });
      });

      content.appendChild(domainEl);
    });

    updateProgSummary(name, age, savedData);

    // Tombol simpan
    document.getElementById('saveProgress').onclick = function () {
      var childKey2 = name.toLowerCase().replace(/\s+/g, '_') + '_' + age;
      saveProgData(childKey2, savedData);
      var btn = document.getElementById('saveProgress');
      var orig = btn.textContent;
      btn.textContent = '✅ Tersimpan!';
      btn.disabled = true;
      setTimeout(function () { btn.textContent = orig; btn.disabled = false; }, 2000);
    };

    // Tombol bagikan
    document.getElementById('shareProgress').onclick = function () {
      var done  = parseInt(document.getElementById('sumDone').textContent, 10);
      var total = totalItems;
      var text  = 'Progres ' + name + ' (' + age + ' bulan): ' + done + '/' + total + ' milestone tercapai via SmartChild AI.';
      if (navigator.share) {
        navigator.share({ title: 'Progres ' + name, text: text });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        alert('Teks progres disalin ke clipboard!');
      }
    };

    document.querySelector('.content-area').scrollTop = 0;
  }

  function updateProgSummary(name, age, savedData) {
    // Hitung ulang dari DOM
    var allItems  = document.querySelectorAll('.milestone-item');
    var done      = 0;
    var alert_cnt = 0;
    var pending   = 0;
    allItems.forEach(function (el) {
      if      (el.classList.contains('done'))  done++;
      else if (el.classList.contains('alert')) alert_cnt++;
      else                                     pending++;
    });
    var total = allItems.length;
    var pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('sumDone').textContent    = done;
    document.getElementById('sumPending').textContent = pending;
    document.getElementById('sumAlert').textContent   = alert_cnt;
    document.getElementById('progPct').textContent    = pct + '%';
    document.getElementById('progBar').style.width    = pct + '%';
    document.getElementById('progNote').textContent   = pct >= 80
      ? '🌟 Luar biasa! Perkembangan anak sangat baik.'
      : pct >= 50
      ? '👍 Terus tingkatkan stimulasi untuk area yang belum tercapai.'
      : '💪 Yuk fokus pada area yang perlu perhatian lebih.';
  }

})();
/* ----------------------------------------------------------
    LOGIC LOGIN HANDLER
  ---------------------------------------------------------- */
  var loginForm = document.getElementById('loginForm');
  var loginScreen = document.getElementById('loginScreen');
  var pageRole = document.body.getAttribute('data-page-role');
  var roleConfig = {
    kader: { name: 'Posyandu', sub: 'Faskes Tingkat 1', avatar: 'KP', page: 'kader.html', username: 'kader', password: 'posyandu123', description: 'Masuk sebagai Posyandu untuk mengakses semua fitur skrining.' },
    ortu:  { name: 'Orang Tua', sub: 'Pemantauan Tumbuh Kembang', avatar: 'OT', page: 'orangtua.html', username: 'ortu', password: 'ortu123', description: 'Masuk sebagai Orang Tua untuk memantau progres anak dan edukasi.' },
    admin: { name: 'Administrator', sub: 'Manajemen Sistem', avatar: 'AD', page: 'admin.html', username: 'admin', password: 'admin123', description: 'Masuk sebagai Admin untuk manajemen sistem dan faskes.' }
  };

  function applyRoleAccess(role) {
    var config = roleConfig[role];
    if (!config) return;

    document.querySelectorAll('[data-roles]').forEach(function (el) {
      var roles = el.getAttribute('data-roles').split(',');
      el.style.display = roles.indexOf(role) !== -1 ? '' : 'none';
    });

    var topbarRole = document.getElementById('topbarRole');
    var sidebarName = document.getElementById('sidebarName');
    var sidebarRole = document.getElementById('sidebarRole');
    var sidebarAvatar = document.getElementById('sidebarAvatar');
    var topbarAvatar = document.querySelector('.topbar-avatar');
    if (topbarRole) topbarRole.innerHTML = config.name + ' <span>— ' + config.sub + '</span>';
    if (sidebarName) sidebarName.textContent = config.name;
    if (sidebarRole) sidebarRole.textContent = config.sub;
    if (sidebarAvatar) sidebarAvatar.textContent = config.avatar;
    if (topbarAvatar) topbarAvatar.textContent = config.avatar;
  }

  if (pageRole) {
    applyRoleAccess(pageRole);
    if (loginScreen) loginScreen.classList.add('hidden');
  }

  if (loginForm && loginScreen) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault(); // Mencegah reload halaman
      
      var userInp = document.getElementById('loginUser').value.trim();
      var passInp = document.getElementById('loginPass').value.trim();
      var errDiv  = document.getElementById('loginError');

      if (userInp === '' || passInp === '') {
        if (errDiv) {
          errDiv.textContent = 'Username dan password wajib diisi.';
          errDiv.classList.add('show');
        }
        return;
      }

      var activeTab = document.querySelector('.login-tab.active');
      var selectedRole = activeTab ? activeTab.getAttribute('data-role') : 'kader';
      var config = roleConfig[selectedRole];
      if (!config) return;

      if (userInp !== config.username || passInp !== config.password) {
        if (errDiv) {
          errDiv.textContent = 'Username atau password tidak sesuai dengan role yang dipilih.';
          errDiv.classList.add('show');
        }
        return;
      }

      if (errDiv) errDiv.classList.remove('show');
      localStorage.setItem('sc_logged_role', selectedRole);
      window.location.href = config.page;
    });
  }

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  }

  var loginEye = document.getElementById('loginEye');
  if (loginEye) {
    loginEye.addEventListener('click', function () {
      var passField = document.getElementById('loginPass');
      if (!passField) return;
      var visible = passField.type === 'text';
      passField.type = visible ? 'password' : 'text';
      loginEye.textContent = visible ? 'Lihat' : 'Sembunyikan';
      loginEye.setAttribute('aria-label', visible ? 'Tampilkan password' : 'Sembunyikan password');
    });
  }

  function updateLoginRoleDescription(role) {
    var descField = document.getElementById('loginRoleDesc');
    var config = roleConfig[role];
    if (!config) return;
    if (descField) descField.textContent = config.description;
  }

  document.querySelectorAll('.login-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.login-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      updateLoginRoleDescription(tab.getAttribute('data-role'));
    });
  });

  function addUtilityPanel(id, title, bodyHtml) {
    if (document.getElementById(id)) return;
    var panel = document.createElement('section');
    panel.id = id;
    panel.className = 'view-panel';
    panel.innerHTML = '<div class="page-header"><h2>' + title + '</h2><p>SmartChild AI</p></div><div class="card utility-panel-content">' + bodyHtml + '</div>';
    var content = document.querySelector('.content-area');
    if (content) content.appendChild(panel);
  }

  function setupAdminTools() {
    var userSearch = document.getElementById('userSearch');
    var userBody = document.getElementById('userTableBody');
    if (userSearch && userBody) {
      userSearch.addEventListener('input', function () {
        var query = userSearch.value.toLowerCase();
        userBody.querySelectorAll('tr').forEach(function (row) {
          row.style.display = row.textContent.toLowerCase().indexOf(query) !== -1 ? '' : 'none';
        });
      });
    }
    var addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn && userBody) addUserBtn.addEventListener('click', function () {
      var name = prompt('Nama lengkap pengguna:');
      var username = name && prompt('Username pengguna:');
      if (!name || !username) return;
      var row = document.createElement('tr');
      row.innerHTML = '<td>' + (userBody.rows.length + 1) + '</td><td class="fw">' + name + '</td><td>' + username + '</td><td><span class="role-badge rb-ortu">Orang Tua</span></td><td>Belum diatur</td><td><span class="badge badge-low">Aktif</span></td><td><button class="tbl-btn tbl-btn-del" type="button">Hapus</button></td>';
      userBody.appendChild(row);
    });

    var faskesPanel = document.getElementById('view-admin-faskes');
    if (faskesPanel) {
      var faskesSearch = faskesPanel.querySelector('.admin-search');
      var faskesGrid = faskesPanel.querySelector('.faskes-grid');
      if (faskesSearch && faskesGrid) faskesSearch.addEventListener('input', function () {
        var query = faskesSearch.value.toLowerCase();
        faskesGrid.querySelectorAll('.faskes-card').forEach(function (card) {
          card.style.display = card.textContent.toLowerCase().indexOf(query) !== -1 ? '' : 'none';
        });
      });
      var addFaskesBtn = faskesPanel.querySelector('.admin-toolbar .btn');
      if (addFaskesBtn && faskesGrid) addFaskesBtn.addEventListener('click', function () {
        var name = prompt('Nama fasilitas kesehatan:');
        var address = name && prompt('Alamat fasilitas kesehatan:');
        if (!name || !address) return;
        var card = document.createElement('div');
        card.className = 'faskes-card';
        card.innerHTML = '<div class="faskes-icon">🏥</div><div class="faskes-info"><h4>' + name + '</h4><p>' + address + '</p><div class="faskes-meta"><span class="badge badge-low">Aktif</span><span class="muted small">0 anak terdaftar</span></div></div>';
        faskesGrid.appendChild(card);
      });
    }
  }

  function setupUtilityPanels() {
    var config = roleConfig[pageRole || localStorage.getItem('sc_logged_role') || 'kader'];
    addUtilityPanel('view-profile', 'Profil Pengguna', '<div class="profile-summary"><strong>' + config.name + '</strong><span>' + config.sub + '</span><span>Username: ' + config.username + '</span></div><button class="btn btn-ghost-danger" id="profileLogoutDynamic" type="button">Keluar</button>');
    addUtilityPanel('view-verification', 'Verifikasi', '<p>Daftar pengajuan yang membutuhkan verifikasi admin.</p><div class="verification-row"><strong>Posyandu Mawar</strong><span class="badge badge-mid">Menunggu verifikasi</span></div><div class="verification-row"><strong>Kader baru</strong><span class="badge badge-mid">Menunggu verifikasi</span></div>');
    addUtilityPanel('view-export', 'Ekspor dan Backup Data', '<p>Unduh salinan data skrining dan riwayat aplikasi.</p><button class="btn btn-primary" id="exportDataBtn" type="button">Ekspor Data JSON</button><button class="btn btn-ghost" id="backupDataBtn" type="button">Backup ke Perangkat</button>');
    var profileLogoutDynamic = document.getElementById('profileLogoutDynamic');
    if (profileLogoutDynamic) profileLogoutDynamic.addEventListener('click', function () { window.location.href = 'index.html'; });
    var exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) exportDataBtn.addEventListener('click', function () {
      var history = JSON.parse(localStorage.getItem('sc_history') || '[]');
      var blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'smartchild-riwayat.json';
      link.click();
      URL.revokeObjectURL(link.href);
    });
    var backupDataBtn = document.getElementById('backupDataBtn');
    if (backupDataBtn) backupDataBtn.addEventListener('click', function () { localStorage.setItem('sc_backup', localStorage.getItem('sc_history') || '[]'); backupDataBtn.textContent = 'Backup Tersimpan'; });
    var langflowKeyInput = document.querySelector('#view-admin-settings input[type="password"]');
    if (langflowKeyInput) {
      langflowKeyInput.value = localStorage.getItem('sc_langflow_api_key') || '';
      var saveConfig = langflowKeyInput.closest('.card').querySelector('.btn-primary');
      if (saveConfig) saveConfig.addEventListener('click', function () { localStorage.setItem('sc_langflow_api_key', langflowKeyInput.value.trim()); saveConfig.textContent = 'Konfigurasi Tersimpan'; });
    }
    setupAdminTools();
  }

  setupUtilityPanels();