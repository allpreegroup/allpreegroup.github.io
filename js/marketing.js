function init_marketing() {
  console.log("✅ init_marketing() called");

  const flyerIds = ["flyer1", "flyer2", "flyer3"];
  const elements = [
    "referralForm", "referralCode",
    ...flyerIds,
    "flyer1Code", "flyer2Code", "flyer3Code"
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
    localStorage.setItem('referralCodeExpiration', Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update flyer codes
    ["flyer1Code", "flyer2Code", "flyer3Code"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatted;
    });

    // Show flyers and buttons
    document.querySelectorAll(".download-btn").forEach(btn => btn.style.display = "inline-block");

    flyerIds.forEach(id => {
      const flyer = document.getElementById(id);
      if (flyer) flyer.style.display = "inline-block";
    });

    const form = document.getElementById("referralForm");
    if (form) form.style.display = "none";

    // Dynamically update referral text/link/button up to 10
    for (let i = 1; i <= 10; i++) {
      const text = document.getElementById(`referralText${i}`);
      const link = document.getElementById(`referralTextLink${i}`);
      const btn = document.getElementById(`referralBtn${i}`);

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
        const finalUrl = rawUrl.replace('${encodeURIComponent(formattedCode)}', encodeURIComponent(formatted));
        btn.onclick = () => window.open(finalUrl, '_blank');
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

  const form = document.getElementById("referralForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const codeInput = document.getElementById("referralCode");
      if (codeInput && codeInput.value.trim()) {
        updateFlyersWithCode(codeInput.value.trim());
      }
    });
  }

  const saved = localStorage.getItem('generatedReferralCode');
  if (saved && !isCodeExpired()) {
    updateFlyersWithCode(saved);
  } else {
    if (form) form.style.display = "block";
    flyerIds.forEach(id => {
      const flyer = document.getElementById(id);
      if (flyer) flyer.style.display = "none";
    });
  }

  window.downloadFlyer = downloadFlyer;
}
