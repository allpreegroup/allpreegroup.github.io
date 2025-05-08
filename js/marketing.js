function init_marketing() {
  console.log("✅ init_marketing() called");

  // Check for required elements before proceeding
  const elements = [
    "referralForm", "referralCode",
    "flyer1", "flyer2", "flyer3",
    "referralText", "referralTextLink", "referralBtn"
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

  function updateFlyersWithCode(code) {
    const formatted = formatReferralCode(code);

    localStorage.setItem('generatedReferralCode', formatted);
    const expiresIn7Days = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('referralCodeExpiration', expiresIn7Days);

    ["flyer1Code", "flyer2Code", "flyer3Code"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatted;
    });

    // Show flyers and buttons
    document.querySelectorAll(".download-btn").forEach(btn => btn.style.display = "inline-block");

    ["flyer1", "flyer2", "flyer3"].forEach(id => {
      const flyer = document.getElementById(id);
      if (flyer) flyer.style.display = "inline-block";
    });

    const form = document.getElementById("referralForm");
    if (form) form.style.display = "none";

    const text = document.getElementById("referralText");
    const link = document.getElementById("referralTextLink");
    const btn = document.getElementById("referralBtn");

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

  function downloadFlyer(flyerId) {
    const flyer = document.querySelector(`#${flyerId} .flyer-wrapper`);
    if (!flyer) return;
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

  window.addEventListener("DOMContentLoaded", () => {
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
  });

  // Optional: expose downloadFlyer globally if needed
  window.downloadFlyer = downloadFlyer;
}
