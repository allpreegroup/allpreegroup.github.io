function init_marketing() {
  console.log("✅ init_marketing() called");

  const form = document.getElementById("referralForm");
  const codeInput = document.getElementById("referralCode");

  // ✅ Always show the form on load
  if (form) form.style.display = "block";

  // Check for all required elements
  const elements = [
    "referralForm", "referralCode",
    "flyer1", "flyer2", "flyer3",
    "referralText", "referralTextLink", "referralBtn",
    ...Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      return [`referralText${n}`, `referralTextLink${n}`, `referralBtn${n}`];
    }).flat()
  ];

  for (const id of elements) {
    if (!document.getElementById(id)) {
      console.warn(`⚠️ Missing element with ID: ${id}`);
    }
  }

  function formatReferralCode(code) {
    return code.replace(/\s+/g, '');
  }

  function isCodeExpired() {
    const expiration = localStorage.getItem('referralCodeExpiration');
    return !expiration || Date.now() > parseInt(expiration);
  }

  function loadHtml2Canvas() {
    if (typeof html2canvas !== 'undefined') return;
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => console.log('html2canvas loaded');
    document.body.appendChild(script);
  }

  function updateFlyersWithCode(code) {
    loadHtml2Canvas();

    const formatted = formatReferralCode(code);
    localStorage.setItem('generatedReferralCode', formatted);
    const expiresIn7Days = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('referralCodeExpiration', expiresIn7Days);

    // ✅ Update flyer codes
    ["flyer1Code", "flyer2Code", "flyer3Code"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatted;
    });

    // ✅ Show download buttons
    document.querySelectorAll(".download-btn").forEach(btn => {
      btn.style.display = "inline-block";
    });

    // ✅ Show flyer containers
    ["flyer1", "flyer2", "flyer3"].forEach(id => {
      const flyer = document.getElementById(id);
      if (flyer) flyer.style.display = "inline-block";
    });

    // ✅ Hide form
    if (form) form.style.display = "none";

    // ✅ Update all referral texts, links, buttons (0 to 10)
    for (let i = 0; i <= 10; i++) {
      const suffix = i === 0 ? "" : i.toString();

      const text = document.getElementById(`referralText${suffix}`);
      const link = document.getElementById(`referralTextLink${suffix}`);
      const btn = document.getElementById(`referralBtn${suffix}`);

      if (text) {
        text.innerHTML = text.innerHTML.replace('${savedReferralCode}', formatted);
        text.style.display = "block";
      }

      if (link) {
        link.href = link.href.replace('${savedReferralCode}', encodeURIComponent(formatted));
        link.style.display = "block";
      }

      if (btn) {
        const rawUrl = btn.getAttribute('data-url');
        if (rawUrl) {
          const finalUrl = rawUrl.replace('${encodeURIComponent(formattedCode)}', encodeURIComponent(formatted));
          btn.onclick = () => window.open(finalUrl, '_blank');
        }
        btn.style.display = "inline-block";
      }
    }
  }

  function downloadFlyer(flyerId) {
    const flyer = document.querySelector(`#${flyerId} .flyer-wrapper`);
    if (!flyer) return;
    loadHtml2Canvas();
    html2canvas(flyer, { scale: 2 }).then(canvas => {
      const link = document.createElement("a");
      link.download = `${flyerId}-flyer.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  // ✅ Form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (codeInput && codeInput.value.trim()) {
        updateFlyersWithCode(codeInput.value.trim());
      }
    });
  }

  // ✅ Load saved code if still valid
  const saved = localStorage.getItem('generatedReferralCode');
  if (saved && !isCodeExpired()) {
    updateFlyersWithCode(saved);
  } else {
    if (form) form.style.display = "block";
    ["flyer1", "flyer2", "flyer3"].forEach(id => {
      const flyer = document.getElementById(id);
      if (flyer) flyer.style.display = "none";
    });
  }

  // Optional: expose globally
  window.downloadFlyer = downloadFlyer;
}
