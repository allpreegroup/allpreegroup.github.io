function init_topup() {
  console.log("✅ init_topup() called");

  const topUpBtn = document.getElementById("topup-btn");
  const select = document.getElementById("topup-grid");
  const summary = document.getElementById("summary");
  const nextStepBtn = document.getElementById("next-step");
  const toggleBtn = document.getElementById("toggle-form-btn");
  const sendWhatsappBtn = document.getElementById("send-whatsapp");
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");

  // Check elements
  if (!topUpBtn || !select || !summary || !nextStepBtn || !toggleBtn || !sendWhatsappBtn || !step1 || !step2 || !step3) {
    console.error("❌ One or more elements missing. Check if the form is fully loaded.");
    return;
  }

  let selectedTopups = [];

  function formatCurrency(amount) {
    return `JMD ${amount.toLocaleString()}`;
  }

  function calculateTotals() {
    const total = selectedTopups.reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      summary.innerHTML = "";
      nextStepBtn.style.display = "none";
      return;
    }
    if (total > 45000) {
      summary.textContent = "Total cannot exceed JMD 45,000.";
      nextStepBtn.style.display = "none";
      return;
    }

    const tax = total * 0.15;
    const fee = total * 0.10;
    const grandTotal = Math.round(total + tax + fee);

    summary.innerHTML = `
      <h4 class="text-lg font-semibold mb-2">Summary:</h4>
      <div style="display: flex; justify-content: space-between;"><span>GCT:</span><span>JMD ${tax.toLocaleString()}</span></div>
      <div style="display: flex; justify-content: space-between;"><span>Fee:</span><span>JMD ${fee.toLocaleString()}</span></div>
      <div style="display: flex; justify-content: space-between;"><span>Total:</span><span>JMD ${total.toLocaleString()}</span></div>
      <div style="display: flex; justify-content: space-between;"><span><b>Grand Total:</b></span><span>JMD ${grandTotal.toLocaleString()}</span></div>
    `;
    document.getElementById("grand-total").textContent = grandTotal.toLocaleString();
    nextStepBtn.style.display = "block";
  }

  function saveStep(step) {
    localStorage.setItem("currentStep", step);
    console.log("✅ Saved step:", step);
  }

  function restoreStep() {
    const step = localStorage.getItem("currentStep");
    console.log("🔁 Restoring step:", step);

    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    topUpBtn.classList.remove("hidden");

    if (step === "step1") {
      topUpBtn.classList.add("hidden");
      step1.classList.remove("hidden");
    } else if (step === "step2") {
      topUpBtn.classList.add("hidden");
      step2.classList.remove("hidden");
    } else if (step === "step3") {
      topUpBtn.classList.add("hidden");
      step3.classList.remove("hidden");
    }
  }

  function restoreTopups() {
    const savedTopups = JSON.parse(localStorage.getItem("selectedTopups") || "[]");
    if (Array.isArray(savedTopups)) {
      selectedTopups = savedTopups;

      document.querySelectorAll(".topup-option").forEach((el) => {
        const amount = parseInt(el.dataset.amount);
        if (selectedTopups.includes(amount)) {
          el.classList.add("selected");
        } else {
          el.classList.remove("selected");
        }
      });

      calculateTotals();
    }
  }

  // Load step + topups on DOM load
  restoreStep();
  restoreTopups();

  // Button Events
  // --- NEW LOGIC: Check Membership Before Top Up ---
  topUpBtn.addEventListener("click", async () => {
    
    // 1. Get the current User ID stored in the browser
    const userId = localStorage.getItem("savedIdCode") || "";
    
    // 2. Show loading state on the button so user knows something is happening
    const originalText = topUpBtn.textContent;
    topUpBtn.textContent = "Checking Membership...";
    topUpBtn.disabled = true;

    try {
      // 3. Fetch the App Data (OpenSheet)
      const response = await fetch('https://opensheet.elk.sh/169KgT37g1HPVkzH-NLmANR4wAByHtLy03y5bnjQA21o/appdata?t=' + new Date().getTime());
      const data = await response.json();

      // 4. Find the user in the sheet (Assumes Column Name is 'ID Code')
      const user = data.find(row => String(row['ID Code']).trim() === String(userId).trim());
      
      // 5. Check Level. 
      // We convert it to string, trim spaces, and make it lowercase to ensure it matches perfectly.
      const rawLevel = user && user['Level'] ? String(user['Level']) : '';
      const userLevel = rawLevel.trim().toLowerCase(); 
      
      // CHECK: Does the level contain one of the valid keywords?
      const isValidMember = userLevel.includes('basic') || userLevel.includes('standard') || userLevel.includes('premium');

      // 6. BLOCK if: User not found OR they are NOT a valid member
      if (!user || !isValidMember) {
        
        // --- BLOCKED: Show Info Popup ---
        
        // Remove existing alert if it's already there (cleanup)
        const existingAlert = document.getElementById('membership-alert');
        if(existingAlert) existingAlert.remove();

        // Create the popup box elements
        const alertBox = document.createElement('div');
        alertBox.id = 'membership-alert';
        
        // Style the popup (centered, white box, shadow)
        alertBox.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 25px; border-radius: 10px; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 9999;
          text-align: center; max-width: 320px; width: 90%; border: 1px solid #ccc;
          font-family: inherit;
        `;
        
        // Add content to the popup
        alertBox.innerHTML = `
          <h3 style="margin-top:0; color:#d32f2f; font-size: 1.25rem; font-weight:bold;">Access Denied</h3>
          <p style="margin:15px 0; color:#555; font-size: 0.95rem;">
            You need an active membership to purchase vouchers. Please join or renew to continue.
          </p>
          <button id="popup-see-how" style="
            background-color: #2563eb; color: white; border: none; padding: 10px 20px; 
            border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; font-size: 1rem;">
            👉 See How It Works
          </button>
          <button id="popup-close" style="
            background: transparent; border: none; color: #777; 
            margin-top: 15px; cursor: pointer; text-decoration: underline; font-size: 0.85rem;">
            Close
          </button>
        `;

        document.body.appendChild(alertBox);

        // Action: When they click "See How It Works"
        document.getElementById('popup-see-how').addEventListener('click', () => {
           // Finds the REAL sales letter button in your menu (ignoring this popup button)
           const realButton = document.querySelector('.menu-button[data-view="salesletter"]');
           if (realButton) {
             alertBox.remove();
             realButton.click(); // Simulates a click on the menu button
           } else {
             console.error("Sales letter menu button not found.");
             alert("Could not find the sales letter page.");
           }
        });

        // Action: Close popup button
        document.getElementById('popup-close').addEventListener('click', () => {
          alertBox.remove();
        });

      } else {
        // --- ALLOWED: Proceed to Top Up Form (Original Logic) ---
        topUpBtn.classList.add("hidden");
        step1.classList.remove("hidden");
        saveStep("step1");
      }

    } catch (error) {
      console.error("Error verifying membership:", error);
      alert("Unable to verify membership status. Please check your internet connection.");
    } finally {
      // Always restore the main button text/state when done
      topUpBtn.textContent = originalText;
      topUpBtn.disabled = false;
    }
  });

  select.addEventListener("click", (e) => {
    const option = e.target.closest(".topup-option");
    if (!option) return;

    const amount = parseInt(option.dataset.amount);
    if (selectedTopups.includes(amount)) {
      selectedTopups = selectedTopups.filter(val => val !== amount);
      option.classList.remove("selected");
    } else {
      selectedTopups.push(amount);
      option.classList.add("selected");
    }

    localStorage.setItem("selectedTopups", JSON.stringify(selectedTopups));
    calculateTotals();
  });

  nextStepBtn.addEventListener("click", () => {
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    saveStep("step2");
  });

  toggleBtn.addEventListener("click", () => {
    step2.classList.add("hidden");
    step3.classList.remove("hidden");
    saveStep("step3");
  });

  // Restore input values and auto-save
  document.getElementById("fullname").value = localStorage.getItem("savedFullName") || "";
  document.getElementById("idcode").value = localStorage.getItem("savedIdCode") || "";
  document.getElementById("bankused").value = localStorage.getItem("savedBankUsed") || "";

  // ✅ Auto-set today's date (YYYY-MM-DD) if empty
  const dateInput = document.getElementById("datesent");
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

  document.getElementById("fullname").addEventListener("input", e => {
    localStorage.setItem("savedFullName", e.target.value.trim());
  });
  document.getElementById("idcode").addEventListener("input", e => {
    localStorage.setItem("savedIdCode", e.target.value.trim());
  });
  document.getElementById("bankused").addEventListener("input", e => {
    localStorage.setItem("savedBankUsed", e.target.value.trim());
  });

  sendWhatsappBtn.addEventListener("click", () => {
    const fullName = document.getElementById("fullname").value.trim();
    const idCode = document.getElementById("idcode").value.trim();
    const idtran = document.getElementById("idtran").value.trim();
    const bankUsed = document.getElementById("bankused").value.trim();
    const dateSent = document.getElementById("datesent").value.trim();

    localStorage.setItem("savedFullName", fullName);
    localStorage.setItem("savedIdCode", idCode);
    localStorage.setItem("savedBankUsed", bankUsed);

    const comboText = selectedTopups.map(v => `JMD ${v.toLocaleString()}`).join(" + ");
    const grandTotalText = document.getElementById("grand-total").textContent.replace(/,/g, "");

    const message = `I'd like to complete my gift card top-up.\n\nTop-up Combination: ${comboText}\n\nTotal Sent: ${formatCurrency(parseInt(grandTotalText))}\nID Code: ${idCode}\nTransaction ID: ${idtran}\nFull Name: ${fullName}\nBank Used: ${bankUsed}\nTransaction Date: ${dateSent}\n\n*Note:* Please find payment attached before sending msg \n\nHere is my payment screenshot.`;

    sendWhatsappBtn.href = `https://api.whatsapp.com/send?phone=18764604563&text=${encodeURIComponent(message)}`;

    selectedTopups = [];
    localStorage.removeItem("selectedTopups");
    localStorage.removeItem("currentStep");

    document.querySelectorAll(".topup-option").forEach((el) => {
      el.classList.remove("selected");
    });

    summary.innerHTML = "";
    document.getElementById("grand-total").textContent = "";
    nextStepBtn.style.display = "none";

    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    topUpBtn.classList.remove("hidden");

    console.log("✅ WhatsApp link prepared and state reset");
  });
}
