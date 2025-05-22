function init_profile() {
  const SHEET_URL = 'https://opensheet.elk.sh/169KgT37g1HPVkzH-NLmANR4wAByHtLy03y5bnjQA21o/appdata';

  // 👇 Move these here to make them accessible
  async function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  function getInstallNote() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return 'standalone';
    }
    return 'browser';
  }
  
 // ✅ Move it here, near the top of init_profile()
  async function linkInstallToUser() {
    const profile = JSON.parse(localStorage.getItem('profileLogin'));
    if (!profile || !profile.idcode) return;

    const linkKey = `installLinked_${profile.idcode}`;
    if (localStorage.getItem(linkKey)) {
      console.log(`Install already linked for user: ${profile.idcode}`);
      return;
    }

    const deviceId = await getDeviceId();
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    const note = getInstallNote();

    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbxl-2XeXXvcOE4VTHVp-7fFnzvpoj8qqI_O2ZfjgVAm0e1sC9NQxRYJTlCFM2LrXLH3/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'install',
          idcode: profile.idcode,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          deviceId,
          userAgent,
          timestamp: timestamp.toString(),
          note
        }),
      });
      const text = await res.text();
      console.log('Install linked to user:', text);
      localStorage.setItem(linkKey, 'true');
    } catch (e) {
      console.error('Error linking install to user:', e);
    }
  }

  function clearInstallLinkedOnLogout() {
  const profile = JSON.parse(localStorage.getItem('profileLogin'));
  if (profile && profile.idcode) {
    const linkKey = `installLinked_${profile.idcode}`;
    localStorage.removeItem(linkKey);
    console.log(`Cleared ${linkKey} on logout`);
  }
  localStorage.removeItem('profileLogin');
}
  // ... rest of init_profile continues below

  
  let currentEntries = [];
  let currentSummary = null;
  let isDescending = false;

  function showLoader() {
    document.getElementById('loading-modal').style.display = 'flex';
  }

  function hideLoader() {
    document.getElementById('loading-modal').style.display = 'none';
  }

  function logoutUser() {
     clearInstallLinkedOnLogout();
    localStorage.removeItem('profileLogin');
    currentEntries = [];
    currentSummary = null;
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('profile-section').classList.add('hidden');
  }

  function loginUser(password) {
  showLoader();

  fetch(SHEET_URL)
    .then(res => res.json())
    .then(data => {
      const summaryRow = data.find(row =>
        row['Password'] === password
      );

      if (summaryRow) {
        const loginInfo = {
          firstName: summaryRow['First Name'],
          lastName: summaryRow['Last Name'],
          idcode: summaryRow['ID CODE'],
          phone: summaryRow['Phone Number'],
          code: summaryRow['ID CODE']
        };
        localStorage.setItem('profileLogin', JSON.stringify(loginInfo));

        // Link install to logged in user
        linkInstallToUser();
        
        const userEntries = data.filter(row =>
          row['Code'] === loginInfo.code && row['activation date']
        );

        currentEntries = userEntries;
        currentSummary = summaryRow;
        hideLoader();
        showProfile(userEntries, summaryRow);
        sortByLatest();
      } else {
        hideLoader();
        alert('Invalid password. Please try again.');
      }
    });
}


  function showProfile(userRows, summaryRow) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('profile-section').classList.remove('hidden');
    renderProfile(userRows, summaryRow);
  }

  function renderProfile(rows, summary) {
    const loginInfo = JSON.parse(localStorage.getItem('profileLogin'));

    document.getElementById('user-profile-header').innerHTML = `
      <h2>${loginInfo.firstName} ${loginInfo.lastName}</h2>
      <p><strong>ID Code:</strong> ${loginInfo.idcode}</p>
      <p><strong>Sponsor:</strong> ${summary["Sponsor"] || "Not Available"}</p>
       <p><strong>Membership:</strong> ${summary["Level"]} ${summary["Days"]} </p>
    `;

    document.getElementById('user-summary').innerHTML = `
      <h3>Summary</h3>
      <p><strong>Total Top-Up:</strong> J$${Number(summary["Total Top"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Total Spend:</strong> J$${Number(summary["Total Spend"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p style="color: #34d399;"><strong>Total Cashback: J$${Number(summary["Total CashBack"]?.replace('+', '') || 0).toLocaleString()} </strong></p>
      <p><strong>Confirm Cashback:</strong> J$${Number(summary["Confirm CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Received Cashback:</strong> J$${Number(summary["Receive CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Pending Cashback:</strong> J$${Number(summary["Pending CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Available To Cash Out:</strong> J$${Number(summary["Available CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
    `;

    const entriesHTML = rows.map(user => `
      <div class="entry">
        <div class="entry-grid">
          <div class="entry-col">
            <p><strong>Top Up</strong></p>
            <p class="subtext">Top Up On<br>${user["Top-Up Date"]}</p>
            <p class="amount">J$${user["Top-Up"]}</p>
          </div>
          <div class="entry-col">
            <p><strong>CashBack</strong></p>
            <p class="subtext">Activated On<br>${user["activation date"]}</p>
            <p class="amount" style="color: #34d399;">J$${Number(user["Cashback"]?.replace('+', '') || 0).toLocaleString()}</p>
          </div>
          <div class="entry-col">
            <p><strong>(${user["% Reach"]})</strong></p>
            <p class="subtext">${user["Days Left"]} Dys Left<br>${user["Release Date"]}</p>
            <p class="amount">J$${Number(user["Amount Reached"]?.replace('+', '') || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    `).join('');

    document.getElementById('user-profile').innerHTML = entriesHTML;
  }

  function sortByLatest() {
    isDescending = !isDescending;
    const sorted = [...currentEntries].sort((a, b) => {
      const dateA = new Date(a["Top-Up Date"]);
      const dateB = new Date(b["Top-Up Date"]);
      return isDescending ? dateB - dateA : dateA - dateB;
    });
    renderProfile(sorted, currentSummary);
  }

  function sortByClosestToNegativeOne() {
    const filtered = currentEntries.filter(entry => {
      const days = parseInt(entry["Days Left"]);
      return days < 0;
    });

    const sorted = filtered.sort((a, b) => {
      const daysA = parseInt(a["Days Left"]);
      const daysB = parseInt(b["Days Left"]);
      return Math.abs(daysA + 1) - Math.abs(daysB + 1);
    });

    renderProfile(sorted, currentSummary);
  }


  document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });
    document.getElementById(target).classList.remove('hidden');
  });
});

document.addEventListener('click', function (event) {
  if (event.target.closest('#topupcard')) {
    const realButton = document.querySelector('.menu-button[data-view="topup"]:not(#topupcard)');
    if (realButton) realButton.click();
    else console.error('Target action button not found.');
  }
});

document.addEventListener('click', function (event) {
  if (event.target.closest('#giftcard')) {
    const realButton = document.querySelector('.menu-button[data-view="generategiftcard"]:not(#giftcard)');
    if (realButton) realButton.click();
    else console.error('Target action button not found.');
  }
});


  
document.addEventListener('click', function (event) {
    // Check if the click was on the #account link or within it
    const accountLink = event.target.closest('#account');
    if (accountLink) {
      event.preventDefault(); // Prevent the default anchor behavior
      const realButton = document.querySelector('.menu-button[data-view="signup"]:not(#account)');
      if (realButton) {
        realButton.click();
      } else {
        console.error('Target action button not found.');
      }
    }
  });
  
  // Forgot password WhatsApp link
  document.getElementById('forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    const waNumber = '18762042107'; // Replace with your number
    const message = encodeURIComponent("Hi, I forgot my cashback login password. Can you help me retrieve it?");
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  });

  // Event listeners
  document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const passwordInput = document.getElementById('password');
  const password = passwordInput.value.trim();

  if (!password) {
    passwordInput.focus();
    alert('Password is required.');
    return;
  }

  loginUser(password); // pass it to your login function
});

  document.getElementById('sort-latest-button').addEventListener('click', sortByLatest);
  document.getElementById('sort-negative-one-button').addEventListener('click', sortByClosestToNegativeOne);
  window.logoutUser = logoutUser;

  // Auto-login
  showLoader();
  const loginInfo = JSON.parse(localStorage.getItem('profileLogin'));
  if (loginInfo) {
    fetch(SHEET_URL)
      .then(res => res.json())
      .then(data => {
        const summaryRow = data.find(row => row['ID CODE'] === loginInfo.idcode);
        const userEntries = data.filter(row =>
          row['Code'] === loginInfo.code && row['activation date']
        );
        currentEntries = userEntries;
        currentSummary = summaryRow;
        hideLoader();
        document.getElementById('profile-section').classList.remove('hidden');
        renderProfile(userEntries, summaryRow);
        sortByLatest();
      });
  } else {
    hideLoader();
    document.getElementById('login-section').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init_profile);
