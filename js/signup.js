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
  function handleSuccessfulSignup() {
  if (!window.submitted) return;
  window.submitted = false;

  
  signupForm.querySelector('button[type="submit"]').disabled = false;
  document.getElementById("loading-modal").style.display = "none"; // hide spinner
  const firstName = signupForm.querySelector('input[name="entry.1502543154"]')?.value || "there";
  localStorage.setItem("signedUpUser", firstName);

  document.querySelector('.invite-section').classList.add('hidden');
  formSection.classList.add('hidden');

  welcomeDiv.classList.remove('hidden');

  // Show a custom message instead of default welcome
  welcomeDiv.innerHTML = `
    <div style="text-align:left; padding: 20px;">
      <h3>✅ You’re In</h3>
      <h2><strong>BE SMART. SHOP CLEVER. GET PAID.</strong><br>
      It’s time to make money while shopping in Jamaica!</h2><br>

      <p><strong>Dear ${firstName}</strong>, I know you are a savvy shopper<br>
      Tired of going shopping and walking away with nothing but your receipts?<br><br>
      What if you could earn <strong>up to 49% cashback</strong>, sent straight to your bank account, just for buying what you already need?<br><br>
      Now you can.</p>

      <p>Our Cashback Program connects you to <strong>300+ merchants across Jamaica</strong>, and it all starts with your <strong>Digital Card</strong>.</p>

      <p><strong>Unlock Lifetime Income</strong><br>
      Love the program? You’ll get the chance to <strong>become a partner</strong> and earn <strong>recurring commissions for life</strong>, simply by sharing it.</p>

      <p>One-time setup. Lifetime earnings.<br>
      No gimmicks, just real cashback and real opportunity.</p>

      <button style="margin-top:20px;" class="menu-button" data-view="salesletter">👉 Show Me How It Works</button>
    </div>
  `;
}


  // Form submit behavior
  signupForm.addEventListener("submit", (e) => {
  document.getElementById("loading-modal").style.display = "flex"; // reuse invite spinner
  if (window.submitted) return; // prevent double submit
  window.submitted = true;

 
  signupForm.querySelector('button[type="submit"]').disabled = true;

  console.log("Form submitted - loader shown");
});
  // Detect successful submission via iframe load
hiddenIframe.onload = function () {
  if (!iframeHasLoadedOnce) {
      iframeHasLoadedOnce = true;
      return; // skip initial iframe load
console.log("Iframe loaded, calling handleSuccessfulSignup");
  handleSuccessfulSignup();
};

}
