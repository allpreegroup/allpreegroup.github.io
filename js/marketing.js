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

  // Lazy load the html2canvas script
  function loadHtml2Canvas() {
    if (typeof html2canvas !== 'undefined') {
      return; // Skip if already loaded
    }

    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => {
      console.log('html2canvas loaded successfully');
    };
    document.body.appendChild(script);
  }

  function updateFlyersWithCode(code) {
    // Load html2canvas only when needed (when the user enters the code)
    loadHtml2Canvas();

    const formatted = formatReferralCode(code);
    localStorage.setItem('generatedReferralCode', formatted);
    const expiresIn7Days = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('referralCodeExpiration', expiresIn7Days);

    // Update flyer codes
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

    // Handle referralText, referralTextLink, referralBtn (original + 1-10 versions)
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


  function downloadFlyer(flyerId) {
    const flyer = document.querySelector(`#${flyerId} .flyer-wrapper`);
    if (!flyer) return;

    // Lazy load html2canvas when the download action occurs
    loadHtml2Canvas();

    html2canvas(flyer, { scale: 2 }).then(canvas => {
      const link = document.createElement("a");
      link.download = `${flyerId}-flyer.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  // Handle form submission
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

  // On page load, check if a referral code is saved and valid

    const saved = localStorage.getItem('generatedReferralCode');
    if (saved && !isCodeExpired()) {
      updateFlyersWithCode(saved); // Use saved code if valid
    } else {
      if (form) form.style.display = "block";
      ["flyer1", "flyer2", "flyer3"].forEach(id => {
        const flyer = document.getElementById(id);
        if (flyer) flyer.style.display = "none";
      });
    }
 

  // Optional: expose downloadFlyer globally if needed
  window.downloadFlyer = downloadFlyer;
}
