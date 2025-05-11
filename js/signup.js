function init_signup() {
  const inviteBtn = document.getElementById('validateBtn');
  const inviteInput = document.getElementById('inviteCodeInput');
  const errorText = document.getElementById('inviteError');
  const formSection = document.getElementById('signupFormSection');
  const signupForm = document.getElementById("signupForm");
  const hiddenIframe = document.getElementById("hidden_iframe");
  const welcomeDiv = document.getElementById("welcomeMessage");
  const welcomeText = document.getElementById("welcomeText");
  const loader = document.getElementById("loading-modal");

  let iframeHasLoadedOnce = false;
  window.submitted = false;

  // Show welcome if already signed up
  const savedUser = localStorage.getItem("signedUpUser");
  if (savedUser) {
    document.querySelector('.invite-section').classList.add('hidden');
    formSection.classList.add('hidden');
    welcomeText.textContent = `Welcome back, ${savedUser}!`;
    welcomeDiv.classList.remove('hidden');
    return;
  }

  // Validate Invite Code
  inviteBtn.onclick = async () => {
    const code = inviteInput.value.trim().toUpperCase();
    if (!code) return;

    const loader = document.getElementById("loading-modal");
    loader.style.display = "flex"; // Show invite spinner

    try {
      const res = await fetch("https://opensheet.elk.sh/169KgT37g1HPVkzH-NLmANR4wAByHtLy03y5bnjQA21o/appdata");
      const data = await res.json();
      const match = data.find(row => row["ID CODE"]?.toUpperCase() === code);

      if (match) {
        document.getElementById('field_ID').value = `ID ${code}`;
        document.getElementById('field_Code').value = code;
        formSection.classList.remove('hidden');
        document.querySelector('.invite-section').classList.add('hidden');
        errorText.style.display = "none";
      } else {
        errorText.style.display = "block";
      }
    } catch (e) {
      console.error("Error checking code:", e);
      errorText.style.display = "block";
    } finally {
      loader.style.display = "none";
    }
  };

  // Auto-generate birth years
  const birthYearSelect = document.getElementById("birthYearSelect");
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 50; y <= currentYear - 10; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    birthYearSelect.appendChild(option);
  }

  // Parish dropdown
  const parishes = [
    "Kingston", "St. Andrew", "St. Thomas", "Portland", "St. Mary", "St. Ann", "Trelawny",
    "St. James", "Hanover", "Westmoreland", "St. Elizabeth", "Manchester", "Clarendon", "St. Catherine"
  ];
  const parishSelect = document.getElementById("parishSelect");
  parishes.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    parishSelect.appendChild(option);
  });

  // Auto-format WhatsApp numbers
  const phoneInput = document.getElementById("whatsappNumber");
  phoneInput.addEventListener("input", () => {
    const value = phoneInput.value;
    const expectedPrefix = "+1876";
    let actualPrefix = value.slice(0, expectedPrefix.length);
    let rest = value.slice(expectedPrefix.length);
    let fixedPrefix = "";

    for (let i = 0; i < expectedPrefix.length; i++) {
      if (actualPrefix[i] !== expectedPrefix[i]) {
        fixedPrefix += expectedPrefix[i];
      } else {
        fixedPrefix += actualPrefix[i];
      }
    }

    if (fixedPrefix !== actualPrefix) {
      phoneInput.value = fixedPrefix + rest;
    }
  });

  // Show spinner on form submit
  // Unified handler for successful signup
  function handleSuccessfulSignup() {
    if (!window.submitted) return;
    window.submitted = false;

    loader.style.display = "none";
    signupForm.querySelector('button[type="submit"]').disabled = false;

    const firstName = signupForm.querySelector('input[name="entry.1502543154"]')?.value || "there";
    localStorage.setItem("signedUpUser", firstName);

    document.querySelector('.invite-section').classList.add('hidden');
    formSection.classList.add('hidden');
    welcomeText.textContent = `Welcome, ${firstName}! Thanks for signing up.`;
    welcomeDiv.classList.remove('hidden');

    const targetBtn = document.querySelector('.menu-button[data-view="salesletter"]');
    if (targetBtn) targetBtn.click();
  }

  // Form submit behavior
  signupForm.addEventListener("submit", () => {
    if (window.submitted) return; // prevent double submit
    window.submitted = true;

    loader.style.display = "flex";
    signupForm.querySelector('button[type="submit"]').disabled = true;

    // Fallback if iframe load never triggers
    setTimeout(() => {
      if (window.submitted) handleSuccessfulSignup();
    }, 4000);
  });

  // Detect successful submission via iframe load
  hiddenIframe.onload = function () {
    if (!iframeHasLoadedOnce) {
      iframeHasLoadedOnce = true;
      return;
    }
    handleSuccessfulSignup();
  };
}
