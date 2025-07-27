function init_salesletter() {
  console.log("✅ init_topup() called");

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

  function calculateTotals() {
    const total = selectedMembership.reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      summary.innerHTML = "";
      nextStepBtn.style.display = "none";
      return;
    }
    if (total > 8400) {
      summary.textContent = "Total cannot exceed JMD 8,400.";
      nextStepBtn.style.display = "none";
      return;
    }

    const tax = total * 15;
    const fee = total * 10;
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

  // Button Events
  topUpBtn.addEventListener("click", () => {
    topUpBtn.classList.add("hidden");
    membership1.classList.remove("hidden");
    saveStep("membership1");
  });

  select.addEventListener("click", (e) => {
    const option = e.target.closest(".topup-option");
    if (!option) return;

    const amount = parseInt(option.dataset.amount);
    if (selectedMembership.includes(amount)) {
      selectedMembership = selectedMembership.filter(val => val !== amount);
      option.classList.remove("selected");
    } else {
      selectedMembership.push(amount);
      option.classList.add("selected");
    }

    localStorage.setItem("selectedMembership", JSON.stringify(selectedMembership));
    calculateTotals();
  });

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

    const message = `I'd like to complete my gift card top-up.\n\nTop-up Combination: ${comboText}\n\nTotal Sent: ${formatCurrency(parseInt(grandTotalText))}\nID Code: ${idCode}\nTransaction ID: ${idtran}\nFull Name: ${fullName}\nBank Used: ${bankUsed}\nTransaction Date: ${dateSent}\n\n*Note:* Please find payment attached before sending msg \n\nHere is my payment screenshot.`;

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
}
