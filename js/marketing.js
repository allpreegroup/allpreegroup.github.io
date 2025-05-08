			
function init_generategiftcard() {
  
src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
  
function formatReferralCode(code) {
  return code.replace(/\s+/g, ''); // Remove spaces without adding any dashes
}

// Function to check if the stored code has expired
function isCodeExpired() {
  const expirationDate = localStorage.getItem('referralCodeExpiration');
  if (expirationDate) {
    const currentTime = Date.now();
    return currentTime > parseInt(expirationDate);
  }
  return true; // If no expiration date is set, consider it expired
}

function updateFlyersWithCode(code) {
  const formattedCode = formatReferralCode(code);

  // Save the formatted code and set expiration time in localStorage
  localStorage.setItem('generatedReferralCode', formattedCode);
  
  // Set expiration date for 7 days from now
  const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
  localStorage.setItem('referralCodeExpiration', expirationTime);

  // Update the referral code for each flyer
  document.getElementById("flyer1Code").textContent = formattedCode;
  document.getElementById("flyer2Code").textContent = formattedCode;
  document.getElementById("flyer3Code").textContent = formattedCode;

  // Show the download button after code is generated
  document.querySelectorAll(".download-btn").forEach(btn => btn.style.display = "inline-block");

  // Show the flyers and hide the form
  document.getElementById("flyer1").style.display = "inline-block";
  document.getElementById("flyer2").style.display = "inline-block";
  document.getElementById("flyer3").style.display = "inline-block";
  document.getElementById("referralForm").style.display = "none";

  // Display the referral code and WhatsApp link
  document.getElementById("referralText").style.display = "block";  // Show referral text
  document.getElementById("referralTextLink").style.display = "block";  // Show WhatsApp link

  // Replace the referral code in the text and link with the formatted code
  const textElement = document.getElementById('referralText');
  const linkElement = document.getElementById('referralTextLink');
  
  // Replace in the visible text
  textElement.innerHTML = textElement.innerHTML.replace('${savedReferralCode}', formattedCode);
  
  // Replace in the link href
  linkElement.href = linkElement.href.replace('${savedReferralCode}', encodeURIComponent(formattedCode));

  // ✅ Handle referral button
  const btnElement = document.getElementById('referralBtn');
  if (btnElement) {
    btnElement.style.display = "inline-block";
    const rawUrl = btnElement.getAttribute('data-url');
    const finalUrl = rawUrl.replace('${encodeURIComponent(formattedCode)}', encodeURIComponent(formattedCode));
    btnElement.onclick = () => {
      window.open(finalUrl, '_blank');
    };
  }
}

function downloadFlyer(flyerId) {
  const flyer = document.querySelector(`#${flyerId} .flyer-wrapper`);
  html2canvas(flyer, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `${flyerId}-flyer.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

// Handle form submission
document.getElementById("referralForm").addEventListener("submit", function(event) {
  event.preventDefault();
  
  const referralCode = document.getElementById("referralCode").value.trim();
  
  if (referralCode) {
    updateFlyersWithCode(referralCode); // Update flyers with the code
  }
});

// On page load, check if a referral code is saved and if it has expired
window.addEventListener('DOMContentLoaded', () => {
  const savedReferralCode = localStorage.getItem('generatedReferralCode');
  
  if (savedReferralCode && !isCodeExpired()) {
    updateFlyersWithCode(savedReferralCode); // Show saved referral code and flyers

    // Replace the referral code in the text and link
    const textElement = document.getElementById('referralText');
    const linkElement = document.getElementById('referralTextLink');
    
    // Replace in the visible text
    textElement.innerHTML = textElement.innerHTML.replace('${savedReferralCode}', savedReferralCode);
    
    // Replace in the link href
    linkElement.href = linkElement.href.replace('${savedReferralCode}', encodeURIComponent(savedReferralCode));
    
    // Display the referral text and link immediately after replacement
    textElement.style.display = "block";
    linkElement.style.display = "block";

    // ✅ Handle referral button on page load
    const btnElement = document.getElementById('referralBtn');
    if (btnElement) {
      btnElement.style.display = "inline-block";
      const rawUrl = btnElement.getAttribute('data-url');
      const finalUrl = rawUrl.replace('${encodeURIComponent(formattedCode)}', encodeURIComponent(savedReferralCode));
      btnElement.onclick = () => {
        window.open(finalUrl, '_blank');
      };
    }
  } else {
    // Code has expired or doesn't exist, show the form
    document.getElementById("referralForm").style.display = "block";
    document.getElementById("flyer1").style.display = "none";
    document.getElementById("flyer2").style.display = "none";
    document.getElementById("flyer3").style.display = "none";
  }
});
}
