function init_salesletter() {
  console.log("✅ init_topup() called");
  

  const addonGrid = document.getElementById("addon-grid");
  const topUpBtn = document.getElementById("topup-btn");
  const select = document.getElementById("topup-grid");
  const summary = document.getElementById("summary");
  const nextStepBtn = document.getElementById("next-step");
  const toggleBtn = document.getElementById("toggle-form-btn");
  const sendWhatsappBtn = document.getElementById("send-whatsapp");
  const membership1 = document.getElementById("membership1");
  const membership2 = document.getElementById("membership2");
  const membership3 = document.getElementById("membership3");

  // Check elements
  if (!topUpBtn || !select || !summary || !nextStepBtn || !toggleBtn || !sendWhatsappBtn || !membership1 || !membership2 || !membership3) {
    console.error("❌ One or more elements missing. Check if the form is fully loaded.");
    return;
  }

  let selectedMembership = [];

  function formatCurrency(amount) {
    return `JMD ${amount.toLocaleString()}`;
  }

  function updateAddonState() {
  const addonOptions = document.querySelectorAll('.addon-option');
  // const standardSelected = selectedMembership.includes(3360);
  const premiumSelected = selectedMembership.includes(6720);

  addonOptions.forEach(option => {
    const amount = parseInt(option.dataset.amount);
    // if (!standardSelected && !premiumSelected) {
    if (!premiumSelected) {
      option.classList.add('disabled');
      // If this addon is selected but premium is not, deselect it
      if (selectedMembership.includes(amount)) {
        selectedMembership = selectedMembership.filter(val => val !== amount);
        option.classList.remove('selected');
      }
    } else {
      option.classList.remove('disabled');
    }
  });

  // After any potential changes, update totals and save
  localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership));
  calculateTotals();
}
  
 function calculateTotals() {
  // Define the amounts for main memberships that are taxable
  const membershipAmounts = [3360, 6720];

  let taxableTotal = 0;
  let addOnTotal = 0;

  // Loop through all selected items and sort them into taxable and non-taxable totals
  selectedMembership.forEach(amount => {
    if (membershipAmounts.includes(amount)) {
      taxableTotal += amount;
    } else {
      // Any other amount is considered a non-taxable add-on
      addOnTotal += amount;
    }
  });

  const subtotal = taxableTotal + addOnTotal;

  if (subtotal === 0) {
    summary.innerHTML = "";
    nextStepBtn.style.display = "none";
    return;
  }
  
  // The old limit check is removed to allow for multiple add-ons

  const tax = taxableTotal * 0.15;
  const fee = taxableTotal * 0.10;
  const grandTotal = Math.round(taxableTotal + tax + fee + addOnTotal);

  summary.innerHTML = `
    <h4 class="text-lg font-semibold mb-2">Summary:</h4>
    <div style="display: flex; justify-content: space-between;"><span>GCT (on memberships):</span><span>JMD ${tax.toLocaleString()}</span></div>
    <div style="display: flex; justify-content: space-between;"><span>Fee (on memberships):</span><span>JMD ${fee.toLocaleString()}</span></div>
    <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>JMD ${subtotal.toLocaleString()}</span></div>
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

    membership1.classList.add("hidden");
    membership2.classList.add("hidden");
    membership3.classList.add("hidden");
    topUpBtn.classList.remove("hidden");

    if (step === "membership1") {
      topUpBtn.classList.add("hidden");
      membership1.classList.remove("hidden");
    } else if (step === "membership2") {
      topUpBtn.classList.add("hidden");
      membership2.classList.remove("hidden");
    } else if (step === "membership3") {
      topUpBtn.classList.add("hidden");
      membership3.classList.remove("hidden");
    }
  }

  function restoreMembership() {
    const savedMembership = JSON.parse(localStorage.getItem("selectedMembership") || "[]");
    if (Array.isArray(savedMembership)) {
      selectedMembership = savedMembership;

      document.querySelectorAll(".topup-option").forEach((el) => {
        const amount = parseInt(el.dataset.amount);
        if (selectedMembership.includes(amount)) {
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
  restoreMembership();
  updateAddonState();

  // Button Events
  topUpBtn.addEventListener("click", () => {
    topUpBtn.classList.add("hidden");
    membership1.classList.remove("hidden");
    saveStep("membership1");
  });

  
  select.addEventListener("click", (e) => {
    const option = e.target.closest(".topup-option");
    if (!option || option.classList.contains('addon-option')) return;

    const amount = parseInt(option.dataset.amount);
    const standardAmount = 3360;
    const premiumAmount = 6720;

    // Handle membership exclusivity: If a membership is clicked, deselect the other.
    if (amount === standardAmount) {
      // If premium is selected, remove it from the array and the UI
      const premiumIndex = selectedMembership.indexOf(premiumAmount);
      if (premiumIndex > -1) {
        selectedMembership.splice(premiumIndex, 1);
        document.querySelector(`.topup-option[data-amount="${premiumAmount}"]`).classList.remove("selected");
      }
    } else if (amount === premiumAmount) {
      // If standard is selected, remove it from the array and the UI
      const standardIndex = selectedMembership.indexOf(standardAmount);
      if (standardIndex > -1) {
        selectedMembership.splice(standardIndex, 1);
        document.querySelector(`.topup-option[data-amount="${standardAmount}"]`).classList.remove("selected");
      }
    }

    // Now, toggle the currently clicked option
    const currentIndex = selectedMembership.indexOf(amount);
    if (currentIndex > -1) {
      // It was already selected, so unselect it
      selectedMembership.splice(currentIndex, 1);
      option.classList.remove("selected");
    } else {
      // It was not selected, so select it
      selectedMembership.push(amount);
      option.classList.add("selected");
    }
    updateAddonState();
  });

// START: Add this new event listener
addonGrid.addEventListener("click", (e) => {
    const option = e.target.closest(".addon-option");
    // Do nothing if the click is not on an option or if it's disabled
    if (!option || option.classList.contains('disabled')) return;

    const amount = parseInt(option.dataset.amount);

    // Toggle the selection
    const currentIndex = selectedMembership.indexOf(amount);
    if (currentIndex > -1) {
        selectedMembership.splice(currentIndex, 1);
        option.classList.remove("selected");
    } else {
        selectedMembership.push(amount);
        option.classList.add("selected");
    }

    localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership));
    calculateTotals();
});
// END: New event listener


  nextStepBtn.addEventListener("click", () => {
    membership1.classList.add("hidden");
    membership2.classList.remove("hidden");
    saveStep("membership2");
  });

  toggleBtn.addEventListener("click", () => {
    membership2.classList.add("hidden");
    membership3.classList.remove("hidden");
    saveStep("membership3");
  });

  // Restore input values and auto-save
  document.getElementById("fullname").value = localStorage.getItem("savedFullName") || "";
  document.getElementById("idcode").value = localStorage.getItem("savedIdCode") || "";
  document.getElementById("bankused").value = localStorage.getItem("savedBankUsed") || "";

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

    const comboText = selectedMembership.map(v => `JMD ${v.toLocaleString()}`).join(" + ");
    const grandTotalText = document.getElementById("grand-total").textContent.replace(/,/g, "");

    const message = `I'd like to complete my 365-days membership.\n\nCombination: ${comboText}\n\nTotal Sent: ${formatCurrency(parseInt(grandTotalText))}\nID Code: ${idCode}\nTransaction ID: ${idtran}\nFull Name: ${fullName}\nBank Used: ${bankUsed}\nTransaction Date: ${dateSent}\n\n*Note:* Please find payment attached before sending msg \n\nHere is my payment screenshot.`;

    sendWhatsappBtn.href = `https://api.whatsapp.com/send?phone=18764604563&text=${encodeURIComponent(message)}`;

    selectedMembership = [];
    localStorage.removeItem("selectedMembership");
    localStorage.removeItem("currentStep");

    document.querySelectorAll(".topup-option").forEach((el) => {
      el.classList.remove("selected");
    });

    summary.innerHTML = "";
    document.getElementById("grand-total").textContent = "";
    nextStepBtn.style.display = "none";

    membership1.classList.add("hidden");
    membership2.classList.add("hidden");
    membership3.classList.add("hidden");
    topUpBtn.classList.remove("hidden");

    console.log("✅ WhatsApp link prepared and state reset");

  });

   const dateInput = document.getElementById("datesent");
  if (dateInput) {
  const today = new Date();
  // Format the date to YYYY-MM-DD which is required for date inputs
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // JS months are 0-11
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  dateInput.value = formattedDate;
}
}
