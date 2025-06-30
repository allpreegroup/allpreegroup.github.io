function init_balance() {
  const form = document.getElementById("redirectForm");
  if (!form) return;

  form.addEventListener("submit", function(event) {
    event.preventDefault();

    const code = document.getElementById("code").value;
    const pin = document.getElementById("pin").value;

    if (code && pin) {
      localStorage.setItem('savedCode', code);
      localStorage.setItem('savedPin', pin);

      const url = `https://billpayment.getgiftme.com/?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}&context=modal`;
      window.location.href = url;
    }
  });
}

// Still define this globally so another script can call it
window.autofillSavedCodeAndPin = function () {
  const codeField = document.getElementById('code');
  const pinField = document.getElementById('pin');

  setTimeout(() => {
    const savedCode = localStorage.getItem('savedCode');
    const savedPin = localStorage.getItem('savedPin');

    if (savedCode && codeField) codeField.value = savedCode;
    if (savedPin && pinField) pinField.value = savedPin;
  }, 100);
};
