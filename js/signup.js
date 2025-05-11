function init_signup() {
const inviteBtn = document.getElementById('validateBtn');
  const inviteInput = document.getElementById('inviteCodeInput');
  const errorText = document.getElementById('inviteError');
  const formSection = document.getElementById('signupFormSection');
 
  const signupForm = document.getElementById("signupForm");
  const hiddenIframe = document.getElementById("hidden_iframe");

  window.submitted = false;

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
 signupForm.addEventListener("submit", () => {
  document.getElementById("loading-modal").style.display = "flex"; // reuse invite spinner
  window.submitted = true;
});


 let iframeHasLoadedOnce = false;

hiddenIframe.onload = function () {
  if (!iframeHasLoadedOnce) {
    iframeHasLoadedOnce = true;
    return; // skip initial iframe load
  }

  if (window.submitted) {
    document.getElementById("loading-modal").style.display = "none"; // hide spinner

    const targetBtn = document.querySelector('.menu-button[data-view="salesletter"]');
    if (targetBtn) targetBtn.click(); // simulate user click
  }
};
}
