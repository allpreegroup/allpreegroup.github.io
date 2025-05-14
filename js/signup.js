function init_signup() {
  const inviteBtn = document.getElementById('validateBtn');
  const inviteInput = document.getElementById('inviteCodeInput');
  const errorText = document.getElementById('inviteError');
  const formSection = document.getElementById('signupFormSection');
  const welcomeDiv = document.getElementById("welcomeMessage");
  const welcomeText = document.getElementById("welcomeText");
  const loader = document.getElementById("loading-modal");
  const hiddenIframe = document.getElementById("hidden_iframe");

  let iframeInitialized = false;
  window.submitted = false;

  const savedUser = localStorage.getItem("signedUpUser");
  if (savedUser) {
    document.querySelector('.invite-section').classList.add('hidden');
    formSection.classList.add('hidden');
    welcomeText.textContent = `Welcome back, ${savedUser}!`;
    welcomeDiv.classList.remove('hidden');
    return;
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

  document.getElementById("submitSignupBtn").addEventListener("click", submitSignupForm);


hiddenIframe.onload = () => {
  console.log("iframe loaded");

  // First iframe load (page load), just mark it initialized
  if (!iframeInitialized) {
    iframeInitialized = true;
    console.log("First iframe load, init only");
    return;
  }

  // Only handle submit after first load is done
  if (window.submitted) {
    console.log("iframe onload: calling success handler");
    handleSuccessfulSignup(); // Handles UI only
    // Delay the reset
    setTimeout(() => {
      window.submitted = false;
    }, 5000); // Adjust timing if needed
    
  } else {
    console.log("iframe onload, but submitted = false. Skipping.");
  }
};

document.addEventListener('click', function (event) {
    if (event.target.closest('#seeHowItWorks')) {
      const realButton = document.querySelector('.menu-button[data-view="salesletter"]:not(#seeHowItWorks)');
      if (realButton) {
        realButton.click();
      } else {
        console.error('Target action button not found.');
      }
    }
  });

  const contactDetails = {
    fullName: "Allpree.com",
    organization: "Allpree.com",
    email: "allpreedotcom@gmail.com",
    website: "https://www.allpree.com",
    address: "Shop #4 Dunbar Mall;Sav-La-Mar;Westmoreland;00000;Jamaica",
    numbers: [
      { type: "whatsapp main", number: "+18762042132" },
      { type: "whatsapp bot", number: "+18762042107" },
      { type: "whatsapp billing", number: "+18764604563" }
    ],
    socialHandles: {
      twitter: "@allpreedotcom",
      facebook: "https://facebook.com/allpreedotcom",
      instagram: "https://instagram.com/allpreedotcom"
    }
  };

  function buildVCardString() {
    let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contactDetails.fullName}
ORG:${contactDetails.organization}
EMAIL:${contactDetails.email}
URL:${contactDetails.website}
ADR:;;${contactDetails.address}`;

    contactDetails.numbers.forEach(n => {
      vcard += `\nTEL;TYPE=${n.type}:${n.number}`;
    });

    const socials = contactDetails.socialHandles;
    if (socials.twitter) vcard += `\nX-SOCIALPROFILE;TYPE=twitter:${socials.twitter}`;
    if (socials.facebook) vcard += `\nX-SOCIALPROFILE;TYPE=facebook:${socials.facebook}`;
    if (socials.linkedin) vcard += `\nX-SOCIALPROFILE;TYPE=linkedin:${socials.linkedin}`;
    if (socials.instagram) vcard += `\nX-SOCIALPROFILE;TYPE=instagram:${socials.instagram}`;

    vcard += `\nEND:VCARD`;
    return vcard;
  }

  const vCard = buildVCardString();

  function generateVCF() {
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contact.vcf";
    a.click();
    URL.revokeObjectURL(url);
  }

  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const actionDiv = document.getElementById("action");
  const qrDiv = document.getElementById("qr");

  if (isAndroid) {
    const contactIntentURL =
      "intent://createContact#Intent;" +
      "scheme=content;" +
      "action=android.intent.action.INSERT;" +
      "type=vnd.android.cursor.dir/contact;" +
      `S.name=${encodeURIComponent(contactDetails.fullName)};` +
      `S.phone=${contactDetails.numbers[0].number};` +
      `S.email=${contactDetails.email};` +
      `S.organization=${encodeURIComponent(contactDetails.organization)};` +
      `S.postal=${encodeURIComponent(contactDetails.address)};` +
      "end;";

    const encodedVCardData = encodeURIComponent(vCard);
    const qrUrl = `https://quickchart.io/qr?text=${encodedVCardData}`;

    function tryIntentFallback() {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = contactIntentURL;
  document.body.appendChild(iframe);

  // Immediately show both download button and "fallback coming" message
  actionDiv.innerHTML = `
    <p>Scan the QR or use the button to download and import</p><br>
    <img id="fallbackQR" src="${qrUrl}" alt="QR Code" width="170" height="170" style="border:1px solid #ccc; padding:10px; opacity:0; transition:opacity 0.6s ease;">
   <br><br> <button onclick="generateVCF()">D/L & Imp</button>
  `;

  // Fade in the QR code after a short delay for smooth transition
  setTimeout(() => {
    document.getElementById("fallbackQR").style.opacity = 1;
  }, 500);
}

    actionDiv.innerHTML = `
      <button onclick="tryIntentFallback()">Click & Save</button>
      
    `;

    qrDiv.innerHTML = `<img src="${qrUrl}" alt="Preload QR" style="display:none;">`;
  } else if (isIOS) {
    actionDiv.innerHTML = `<button onclick="generateVCF()">Click To Save</button>`;
  } else {
    actionDiv.innerHTML = `<p>Use a mobile device to add contact</p>`;
  }
}

function submitSignupForm() {
  const requiredFields = [
    { name: 'entry.1502543154', label: 'First Name' },
    { name: 'entry.166208811', label: 'Last Name' },
    { name: 'emailAddress', label: 'Email' },
    { id: 'whatsappNumber', label: 'WhatsApp Number' },
    { name: 'entry.208508536', label: 'Gender' },
    { id: 'birthYearSelect', label: 'Birth Year' },
    { id: 'countrySelect', label: 'Country' },
    { id: 'parishSelect', label: 'Parish' }
  ];

  let missingFields = [];

  // Reset previous highlights
  const allFields = document.querySelectorAll('input, select');
  allFields.forEach(field => {
    field.style.border = ''; // Reset the border color
    field.style.backgroundColor = ''; // Reset the background color
  });

  requiredFields.forEach(field => {
    let value;
    let element;
    if (field.id) {
      element = document.getElementById(field.id);
      value = element?.value.trim();
    } else if (field.name) {
      element = document.querySelector(`[name="${field.name}"]`);
      value = element?.value.trim();
    }
    if (!value) {
      missingFields.push(field.label);
      // Highlight the empty field
      if (element) {
        element.style.border = '2px solid red';
        element.style.backgroundColor = '#f8d7da'; // Light red background
      }
    }
  });

  if (missingFields.length > 0) {
    alert(`Please complete the following fields:\n\n- ${missingFields.join('\n- ')}`);
    return;
  }
  
  document.getElementById("submitError").style.display = "block";
   
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  window.submitted = true;

 // document.getElementById("loading-modal").style.display = "flex";
  
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
    console.log(`Submitting ${name}: ${value}`);
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
 
   console.log("Form appended to body, now submitting...");
  form.submit();
}

function handleSuccessfulSignup() {
  if (!window.submitted) return;

  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = false;

  document.getElementById("loading-modal").style.display = "none";

  const firstName = document.querySelector('[name="entry.1502543154"]').value || "there";
  localStorage.setItem("signedUpUser", firstName);

  document.querySelector('.invite-section').classList.add('hidden');
  document.getElementById('signupFormSection').classList.add('hidden');
  const welcomeDiv = document.getElementById("welcomeMessage");
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
">${firstName} 🎉 Congratulations On Signing Up! 🎉</h3>
      <center> <h2><strong>BE SMART.<br> SHOP CLEVER.<br> GET PAID.</strong></h2>
      <h3>It’s Time To Make Money While Shopping In Jamaica!</h3><br> </center>

      <p><strong>${firstName}</strong>, I know you are a savvy shopper<br><br>
     
Tired of going shopping and walking away with just your receipts and <strong>no real discounts</strong> from big or small retailers?<br><br>

What if you could stop worrying about discounts and start <strong>earning cash back</strong> instead? 💸 With our system, you can get back <strong>up to 49%</strong> of what you spend, sent straight to your <strong>bank account</strong>. All it takes is <strong>121 days</strong> to settle. No stress, no strings.<br><br>

Sounds too good to miss, right?<br>
</p>

<p>
It all starts with our <strong>➕ Deal Plus⁺ Program</strong>, giving you exclusive access to over <strong>300+ merchants</strong> across Jamaica.<br><br>

But here’s the real magic: <strong>You don’t need to wait for any special deals.</strong> Deal Plus⁺ works on <strong>every purchase</strong>, from <strong>any merchant</strong>, automatically turning your everyday spending into real money back.<br><br>

So far, our members have saved <strong id='savedAmount'>loading...</strong>, that’s real cash returned from a total spend of <strong id='spentAmount'>loading...</strong>! <strong>${firstName}</strong>, imagine what you could be saving just by shopping like you already do.<br><br>

And yes, we work quietly behind the scenes to turn your everyday shopping into smart shopping that <strong>pays you back</strong>. Join the movement and make every dollar count.
</p>
      <h4><center>Plus Unlock Lifetime Income</center></h4>
      <p>By <strong>inviting</strong> your <strong>friends</strong>, <strong>family</strong>, or even your <strong>enemy</strong>, You can start earning <strong>recurring commissions for life</strong>, on every thing they purchase, for as long as they are using the ➕ Deal Plus⁺ Program.</p>

      <p>No gimmicks, just real money sent <strong>straight to your bank account</strong> with the right opportunity to earn a little extra.</p><br>

<center>
     <button id="seeHowItWorks" class="menu-button" data-view="salesletter-dummy">
  👉 See How It Works
</button>
</center>

    </div>
  `; 
  fetchStatsAndUpdateUI();  // Run stats fetch separately AFTER success
}

async function fetchStatsAndUpdateUI() {
  try {
    const response = await fetch("https://opensheet.elk.sh/169KgT37g1HPVkzH-NLmANR4wAByHtLy03y5bnjQA21o/appdata");
    const data = await response.json();

    let totalSaved = 0;
    let totalSpent = 0;

    data.forEach(row => {
      const saved = parseFloat((row["Saved"] || "0").replace(/[^0-9.-]+/g, ""));
      const spent = parseFloat((row["Spent"] || "0").replace(/[^0-9.-]+/g, ""));
      totalSaved += isNaN(saved) ? 0 : saved;
      totalSpent += isNaN(spent) ? 0 : spent;
    });

    const savedEl = document.getElementById("savedAmount");
    const spentEl = document.getElementById("spentAmount");

    if (savedEl) savedEl.textContent = totalSaved.toLocaleString("en-JM", { style: "currency", currency: "JMD" });
    if (spentEl) spentEl.textContent = totalSpent.toLocaleString("en-JM", { style: "currency", currency: "JMD" });

  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

