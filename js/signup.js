function init_signup() {
  const inviteBtn = document.getElementById('validateBtn');
  const inviteInput = document.getElementById('inviteCodeInput');
  const errorText = document.getElementById('inviteError');
  const formSection = document.getElementById('signupFormSection');
  const welcomeDiv = document.getElementById("welcomeMessage");
  const welcomeText = document.getElementById("welcomeText");
  const loader = document.getElementById("loading-modal");
  const hiddenIframe = document.getElementById("hidden_iframe");

  window.submitted = false;

  const savedUser = localStorage.getItem("signedUpUser");
  if (savedUser) {
    document.querySelector('.invite-section').classList.add('hidden');
    formSection.classList.add('hidden');
    welcomeText.textContent = `Welcome back, ${savedUser}!`;
    welcomeDiv.classList.remove('hidden');
    return;
  }

  if (hiddenIframe) {
    hiddenIframe.onload = () => {
      if (window.submitted) {
        console.log("iframe load detected, calling handleSuccessfulSignup...");
        handleSuccessfulSignup();
        window.submitted = false;
      }
    };
  }

  inviteBtn.onclick = async () => {
    const code = inviteInput.value.trim().toUpperCase();
    if (!code) return;

    loader.style.display = "flex";

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

  const birthYearSelect = document.getElementById("birthYearSelect");
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 50; y <= currentYear - 10; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    birthYearSelect.appendChild(option);
  }

  const countries = ["Jamaica"];
  const countrySelect = document.getElementById("countrySelect");
  countries.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    countrySelect.appendChild(option);
  });

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

  const phoneInput = document.getElementById("whatsappNumber");
  phoneInput.addEventListener("input", () => {
    const expectedPrefix = "+1876";
    const actualPrefix = phoneInput.value.slice(0, expectedPrefix.length);
    const rest = phoneInput.value.slice(expectedPrefix.length);

    let fixedPrefix = "";
    for (let i = 0; i < expectedPrefix.length; i++) {
      fixedPrefix += actualPrefix[i] !== expectedPrefix[i] ? expectedPrefix[i] : actualPrefix[i];
    }

    if (fixedPrefix !== actualPrefix) {
      phoneInput.value = fixedPrefix + rest;
    }
  });

  // Main button that triggers actual submit click twice
  document.getElementById("submitSignupBtn").addEventListener("click", () => {
    const realSubmitBtn = document.querySelector('button[type="submit"]');
    if (!realSubmitBtn) return;

    // First click
    realSubmitBtn.click();

    // Second click after a short delay
    setTimeout(() => {
      console.log("Triggering second HARD click...");
      realSubmitBtn.click();
    }, 1000);
  });

  // Hidden button's event actually builds and submits the form
  const actualBtn = document.querySelector('button[type="submit"]');
  if (actualBtn) {
    actualBtn.addEventListener("click", (e) => {
      e.preventDefault();
      submitSignupForm();
    });
  }
}


function submitSignupForm() {
  const iframe = document.getElementById('hidden_iframe');
  iframe.src = 'about:blank';

  const form = document.createElement('form');
  form.action = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfw0Sts9wFjaExeOLWxUGAhdrEbfMEE2n6kh430bFqb0xKO2w/formResponse';
  form.method = 'POST';
  form.target = 'hidden_iframe';

  const fields = [
    { name: 'entry.1092645840', value: document.getElementById('field_ID').value },
    { name: 'entry.2034350499', value: document.getElementById('field_Code').value },
    { name: 'entry.297851038', value: '' },
    { name: 'entry.663913627', value: 'Digital Free' },
    { name: 'entry.218867361', value: 'Basic Free' },
    { name: 'entry.1502543154', value: document.querySelector('[name="entry.1502543154"]').value },
    { name: 'entry.166208811', value: document.querySelector('[name="entry.166208811"]').value },
    { name: 'emailAddress', value: document.querySelector('[name="emailAddress"]').value },
    { name: 'entry.1897494140', value: document.getElementById('whatsappNumber').value },
    { name: 'entry.208508536', value: document.querySelector('[name="entry.208508536"]').value },
    { name: 'entry.577240945', value: document.getElementById('birthYearSelect').value },
    { name: 'entry.1890405601', value: document.getElementById('countrySelect').value },
    { name: 'entry.341957417', value: document.getElementById('parishSelect').value }
  ];

  fields.forEach(({ name, value }) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);

  setTimeout(() => {
    form.submit();
    window.submitted = true;
  }, 100);
}


function handleSuccessfulSignup() {
  if (!window.submitted) return;
  window.submitted = false;

  const firstName = document.querySelector('[name="entry.1502543154"]').value || "there";
  localStorage.setItem("signedUpUser", firstName);

  document.getElementById("loading-modal").style.display = "none";
  document.querySelector('.invite-section')?.classList.add('hidden');
  document.getElementById('signupFormSection')?.classList.add('hidden');

  const welcomeDiv = document.getElementById("welcomeMessage");
  if (welcomeDiv) {
    welcomeDiv.classList.remove('hidden');
    welcomeDiv.innerHTML = `
      <div style="text-align:left; padding: 20px;">
        <h3 style="
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #ff6ec4, #7873f5, #4ade80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-top: 30px;
  animation: pop 0.6s ease-in-out;
">
 ${firstName} 🎉 Congratulations On Signing Up! 🎉
</h3>
        <center> <h2><strong>  <br>BE SMART.<br> SHOP CLEVER. <br>GET PAID.</strong><br><br>
        It’s Time To Make Money While Shopping In Jamaica!</h2><br> </center>

        <p><strong>${firstName}</strong>, I know you are a savvy shopper<br>
        Tired of going shopping and walking away with nothing but your receipts?<br><br>
        What if you could earn <strong>up to 49% cashback</strong>, sent straight to your bank account, just for buying what you already need?<br><br>
        Now you can.</p>

        <p>Our Cashback Program connects you to <strong>300+ merchants across Jamaica</strong>, and it all starts with our <strong>➕ Deal Plus⁺ Program</strong>.</p>

       <p>No gimmicks, just real money sent straight to your bank account.</p>

    
      </div>
    `;

  }
}
