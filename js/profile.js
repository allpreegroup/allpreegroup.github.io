function init_profile() {
  const SHEET_URL = 'https://opensheet.elk.sh/169KgT37g1HPVkzH-NLmANR4wAByHtLy03y5bnjQA21o/appdata';

  let currentEntries = [];
  let currentSummary = null;
  let isDescending = true;

  function showLoader() {
    document.getElementById('loading-modal').style.display = 'flex';
  }

  function hideLoader() {
    document.getElementById('loading-modal').style.display = 'none';
  }

  function logoutUser() {
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

        const userEntries = data.filter(row =>
          row['Code'] === loginInfo.code && row['activation date']
        );

        currentEntries = userEntries;
        currentSummary = summaryRow;
        hideLoader();
        showProfile(userEntries, summaryRow);
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
    `;

    document.getElementById('user-summary').innerHTML = `
      <h3>Summary</h3>
      <p><strong>Total Top-Up:</strong> J$${Number(summary["Total Top"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Total Spend:</strong> J$${Number(summary["Total Spend"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p style="color: #34d399;"><strong>Total Cashback: J$${Number(summary["Total CashBack"]?.replace('+', '') || 0).toLocaleString()} </strong></p>
      <p><strong>Confirm Cashback:</strong> J$${Number(summary["Confirm CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Received Cashback:</strong> J$${Number(summary["Receive CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Pending Cashback:</strong> J$${Number(summary["Pending CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
      <p><strong>Available Cashback:</strong> J$${Number(summary["Available CashBack"]?.replace('+', '') || 0).toLocaleString()}</p>
    `;

    const entriesHTML = rows.map(user => `
      <div class="entry">
        <div class="entry-grid">
          <div class="entry-col">
            <p><strong>Top Up</strong></p>
            <p class="subtext">Top Up Date <br>${user["Top-Up Date"]}</p>
            <p class="amount">J$${user["Top-Up"]}</p>
          </div>
          <div class="entry-col">
            <p><strong>CashBack</strong></p>
            <p class="subtext">Activated Date<br>${user["activation date"]}</p>
            <p class="amount" style="color: #34d399;">J$${Number(user["Cashback"]?.replace('+', '') || 0).toLocaleString()}</p>
          </div>
          <div class="entry-col">
            <p><strong>(${user["% Reach"]})</strong></p>
            <p class="subtext">${user["Days Left"]} Days Left<br>${user["Release Date"]}</p>
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

  // Forgot password WhatsApp link
  document.getElementById('forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    const waNumber = '18761234567'; // Replace with your number
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
      });
  } else {
    hideLoader();
    document.getElementById('login-section').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init_profile);
